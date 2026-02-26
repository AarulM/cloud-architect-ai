#!/usr/bin/env python3
"""
AWS Bedrock Agent backend API using standard Bedrock Agents (not AgentCore).
This uses publicly available AWS Bedrock Agent Runtime API.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import uuid
import os
import logging
import boto3
from botocore.exceptions import ClientError, NoCredentialsError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Read agent info from deployment info file
AGENT_ID = None
AGENT_ALIAS_ID = None
AGENT_REGION = "us-west-2"  # Default region

try:
    deployment_info_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
                                        "app", "deployment_info.txt")
    with open(deployment_info_path, 'r') as f:
        lines = f.readlines()
        for line in lines:
            if line.startswith("Agent ID:"):
                AGENT_ID = line.split(': ')[1].strip()
            elif line.startswith("Alias ID:"):
                AGENT_ALIAS_ID = line.split(': ')[1].strip()
            elif line.startswith("Region:"):
                AGENT_REGION = line.split(': ')[1].strip()
    
    if AGENT_ID and AGENT_ALIAS_ID:
        logger.info(f"✅ Successfully loaded agent ID: {AGENT_ID}")
        logger.info(f"✅ Successfully loaded alias ID: {AGENT_ALIAS_ID}")
    else:
        logger.error("❌ Failed to find Agent ID or Alias ID in deployment_info.txt")
except Exception as e:
    logger.error(f"❌ Failed to load deployment info: {e}")

# Initialize AWS client
bedrock_agent_runtime = None
try:
    bedrock_agent_runtime = boto3.client('bedrock-agent-runtime', region_name=AGENT_REGION)
    logger.info(f"✅ AWS Bedrock Agent Runtime client initialized for region: {AGENT_REGION}")
except NoCredentialsError:
    logger.error("❌ AWS credentials not configured. Run 'aws configure' first.")
except Exception as e:
    logger.error(f"❌ Failed to initialize AWS client: {e}")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy" if bedrock_agent_runtime and AGENT_ID else "unhealthy",
        "agent_id": AGENT_ID,
        "alias_id": AGENT_ALIAS_ID,
        "region": AGENT_REGION,
        "aws_client_initialized": bedrock_agent_runtime is not None,
        "mode": "bedrock_agent"
    })

@app.route('/agent/status', methods=['GET'])
def agent_status():
    """Check agent status."""
    if not bedrock_agent_runtime or not AGENT_ID:
        return jsonify({
            "error": "AWS client or Agent ID not initialized",
            "status": "error"
        }), 500
    
    try:
        return jsonify({
            "agent_id": AGENT_ID,
            "alias_id": AGENT_ALIAS_ID,
            "status": "ready",
            "region": AGENT_REGION,
            "mode": "bedrock_agent"
        })
    except Exception as e:
        logger.error(f"Error checking agent status: {e}")
        return jsonify({
            "error": str(e),
            "status": "error"
        }), 500

@app.route('/chat', methods=['POST'])
def chat():
    """
    Chat endpoint using AWS Bedrock Agent Runtime.
    """
    if not bedrock_agent_runtime or not AGENT_ID or not AGENT_ALIAS_ID:
        return jsonify({
            "error": "AWS client, Agent ID, or Alias ID not initialized. Check deployment info.",
            "status": "error"
        }), 500
    
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({"error": "Message is required"}), 400
        
        message = data['message']
        session_id = data.get('session_id', f"session-{str(uuid.uuid4())}")
        
        logger.info(f"Processing message: {message[:50]}...")
        
        # Invoke the Bedrock Agent
        response = bedrock_agent_runtime.invoke_agent(
            agentId=AGENT_ID,
            agentAliasId=AGENT_ALIAS_ID,
            sessionId=session_id,
            inputText=message
        )
        
        # Process the streaming response
        response_text = ""
        event_stream = response['completion']
        
        for event in event_stream:
            if 'chunk' in event:
                chunk = event['chunk']
                if 'bytes' in chunk:
                    response_text += chunk['bytes'].decode('utf-8')
        
        logger.info("Agent response received")
        
        return jsonify({
            "response": response_text,
            "session_id": session_id,
            "status": "success",
            "mode": "bedrock_agent"
        })
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        logger.error(f"AWS ClientError: {error_code} - {error_message}")
        return jsonify({
            "error": f"AWS Error: {error_message}",
            "error_code": error_code,
            "status": "error"
        }), 500
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        return jsonify({
            "error": str(e),
            "status": "error"
        }), 500

@app.route('/sessions', methods=['POST'])
def create_session():
    """Create a new session."""
    session_id = f"session-{str(uuid.uuid4())}"
    return jsonify({
        "session_id": session_id,
        "status": "created",
        "mode": "bedrock_agent"
    })

@app.route('/workflow/phase', methods=['POST'])
def workflow_phase():
    """
    Unified workflow phase endpoint using Bedrock Agent.
    """
    if not bedrock_agent_runtime or not AGENT_ID or not AGENT_ALIAS_ID:
        return jsonify({
            "error": "AWS client, Agent ID, or Alias ID not initialized. Check deployment info.",
            "status": "error"
        }), 500
    
    try:
        data = request.get_json()
        
        if not data or 'message' not in data or 'phase' not in data:
            return jsonify({"error": "Message and phase are required"}), 400
        
        message = data['message']
        phase = data['phase']
        session_id = data.get('session_id', f"session-{str(uuid.uuid4())}")
        
        logger.info(f"Processing {phase} phase request")
        
        # Add phase context to the message
        enhanced_message = f"Phase: {phase.upper()}\n\n{message}"
        
        # Invoke the Bedrock Agent
        response = bedrock_agent_runtime.invoke_agent(
            agentId=AGENT_ID,
            agentAliasId=AGENT_ALIAS_ID,
            sessionId=session_id,
            inputText=enhanced_message
        )
        
        # Process the streaming response
        response_text = ""
        event_stream = response['completion']
        
        for event in event_stream:
            if 'chunk' in event:
                chunk = event['chunk']
                if 'bytes' in chunk:
                    response_text += chunk['bytes'].decode('utf-8')
        
        return jsonify({
            "response": response_text,
            "session_id": session_id,
            "phase": phase,
            "status": "success",
            "mode": "bedrock_agent"
        })
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        logger.error(f"AWS ClientError: {error_code} - {error_message}")
        return jsonify({
            "error": f"AWS Error: {error_message}",
            "error_code": error_code,
            "status": "error"
        }), 500
    except Exception as e:
        logger.error(f"Error in workflow phase endpoint: {e}")
        return jsonify({
            "error": str(e),
            "status": "error"
        }), 500

if __name__ == '__main__':
    print("🚀 Starting AWS Bedrock Agent Backend API Server")
    print(f"Agent ID: {AGENT_ID}")
    print(f"Alias ID: {AGENT_ALIAS_ID}")
    print(f"Region: {AGENT_REGION}")
    print(f"AWS Client: {'✅ Initialized' if bedrock_agent_runtime else '❌ Not initialized'}")
    print("Server will be available at: http://localhost:3030")
    print("\nCore Endpoints:")
    print("  GET  /health - Health check and agent status")
    print("  GET  /agent/status - Agent status check")
    print("  POST /chat - Send message to Bedrock agent")
    print("  POST /sessions - Create new session")
    print("  POST /workflow/phase - Unified workflow phase endpoint")
    print("\nExample usage:")
    print("curl -X POST http://localhost:3030/chat \\")
    print("  -H 'Content-Type: application/json' \\")
    print("  -d '{\"message\": \"What is AWS Lambda?\"}'")
    print("\n🤖 Using AWS Bedrock Agent with Claude 3.5 Sonnet")
    
    app.run(debug=True, host='0.0.0.0', port=3030)
