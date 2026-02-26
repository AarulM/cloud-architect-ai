#!/usr/bin/env python3
"""
Simplified Flask backend API that directly invokes the deployed AgentCore agent using boto3.
This bypasses the need for strands-agents and other proprietary packages.
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

# Read agent ARN from deployment info file
AGENT_ARN = None
AGENT_REGION = "us-west-2"  # Default region

try:
    deployment_info_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
                                        "app", "deployment_info.txt")
    with open(deployment_info_path, 'r') as f:
        lines = f.readlines()
        for line in lines:
            if line.startswith("Agent ARN:"):
                AGENT_ARN = line.split(': ')[1].strip()
            elif line.startswith("Region:"):
                AGENT_REGION = line.split(': ')[1].strip()
    
    if AGENT_ARN:
        logger.info(f"✅ Successfully loaded agent ARN: {AGENT_ARN}")
    else:
        logger.error("❌ Failed to find Agent ARN in deployment_info.txt")
except Exception as e:
    logger.error(f"❌ Failed to load deployment info: {e}")

# Initialize AWS client
aws_client = None
try:
    aws_client = boto3.client('bedrock-agentcore', region_name=AGENT_REGION)
    logger.info(f"✅ AWS client initialized for region: {AGENT_REGION}")
except NoCredentialsError:
    logger.error("❌ AWS credentials not configured. Run 'aws configure' first.")
except Exception as e:
    logger.error(f"❌ Failed to initialize AWS client: {e}")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    status = "healthy" if aws_client and AGENT_ARN else "unhealthy"
    return jsonify({
        "status": status,
        "agent_arn": AGENT_ARN,
        "region": AGENT_REGION,
        "aws_client_initialized": aws_client is not None
    })

@app.route('/agent/status', methods=['GET'])
def agent_status():
    """Check agent status."""
    if not aws_client or not AGENT_ARN:
        return jsonify({
            "error": "AWS client or Agent ARN not initialized",
            "status": "error"
        }), 500
    
    try:
        # This is a placeholder - actual status check would depend on AgentCore API
        return jsonify({
            "agent_arn": AGENT_ARN,
            "status": "ready",
            "region": AGENT_REGION
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
    Chat endpoint to send messages to the agent using boto3.
    """
    if not aws_client or not AGENT_ARN:
        return jsonify({
            "error": "AWS client or Agent ARN not initialized. Check AWS credentials and deployment info.",
            "status": "error"
        }), 500
    
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({"error": "Message is required"}), 400
        
        message = data['message']
        session_id = data.get('session_id', f"session-{str(uuid.uuid4())}")
        
        logger.info(f"Processing message: {message[:50]}...")
        
        # Invoke the agent using boto3
        import json
        payload = json.dumps({'inputText': message}).encode('utf-8')
        response = aws_client.invoke_agent_runtime(
            agentRuntimeArn=AGENT_ARN,
            runtimeSessionId=session_id,
            payload=payload
        )
        
        # Process the response
        response_text = ""
        if 'completion' in response:
            for event in response['completion']:
                if 'chunk' in event:
                    chunk = event['chunk']
                    if 'bytes' in chunk:
                        response_text += chunk['bytes'].decode('utf-8')
        
        logger.info("Agent response received")
        
        return jsonify({
            "response": response_text,
            "session_id": session_id,
            "status": "success"
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
        "status": "created"
    })

@app.route('/workflow/phase', methods=['POST'])
def workflow_phase():
    """
    Unified workflow phase endpoint that handles all phases.
    """
    if not aws_client or not AGENT_ARN:
        return jsonify({
            "error": "AWS client or Agent ARN not initialized. Check AWS credentials and deployment info.",
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
        enhanced_message = f"Phase: {phase}\n\n{message}"
        
        # Invoke the agent using boto3
        import json
        payload = json.dumps({'inputText': enhanced_message}).encode('utf-8')
        response = aws_client.invoke_agent_runtime(
            agentRuntimeArn=AGENT_ARN,
            runtimeSessionId=session_id,
            payload=payload
        )
        
        # Process the response
        response_text = ""
        if 'completion' in response:
            for event in response['completion']:
                if 'chunk' in event:
                    chunk = event['chunk']
                    if 'bytes' in chunk:
                        response_text += chunk['bytes'].decode('utf-8')
        
        return jsonify({
            "response": response_text,
            "session_id": session_id,
            "phase": phase,
            "status": "success"
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
    print("🚀 Starting Simplified Backend API Server")
    print(f"Agent ARN: {AGENT_ARN}")
    print(f"Region: {AGENT_REGION}")
    print(f"AWS Client: {'✅ Initialized' if aws_client else '❌ Not initialized'}")
    print("Server will be available at: http://localhost:3030")
    print("\nCore Endpoints:")
    print("  GET  /health - Health check and agent status")
    print("  GET  /agent/status - Agent status check")
    print("  POST /chat - Send message to agent")
    print("  POST /sessions - Create new session")
    print("  POST /workflow/phase - Unified workflow phase endpoint")
    print("\nExample usage:")
    print("curl -X POST http://localhost:3030/chat \\")
    print("  -H 'Content-Type: application/json' \\")
    print("  -d '{\"message\": \"What is AWS Lambda?\"}'")
    
    app.run(debug=True, host='0.0.0.0', port=3030)