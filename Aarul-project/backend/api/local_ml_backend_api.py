#!/usr/bin/env python3
"""
Local ML-powered Flask backend API using Ollama for AWS Solutions Architect consulting.
This uses local LLM models instead of cloud APIs for privacy and cost control.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import uuid
import os
import logging
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Ollama configuration
OLLAMA_URL = "http://localhost:11434"
MODEL_NAME = "llama2"  # You can change this to other models like "codellama", "mistral", etc.

def check_ollama_connection():
    """Check if Ollama is running and accessible."""
    try:
        response = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        return response.status_code == 200
    except:
        return False

def generate_with_ollama(prompt, model=MODEL_NAME):
    """Generate response using Ollama local LLM."""
    try:
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.7,
                "top_p": 0.9,
                "max_tokens": 2000
            }
        }
        
        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json=payload,
            timeout=60
        )
        
        if response.status_code == 200:
            return response.json().get('response', '')
        else:
            return f"Error: Ollama returned status {response.status_code}"
            
    except Exception as e:
        return f"Error connecting to Ollama: {str(e)}"

# System prompt for AWS Solutions Architect
SYSTEM_PROMPT = """
You are an experienced AWS Solutions Architect with deep expertise in cloud architecture and AWS services. Your role is to analyze customer requirements and produce professional AWS architecture design documents.

Key Responsibilities:
1. Analyze customer requirements, constraints, and business objectives
2. Identify appropriate AWS services and design patterns
3. Consider the AWS Well-Architected Framework pillars:
   - Operational Excellence
   - Security  
   - Reliability
   - Performance Efficiency
   - Cost Optimization
   - Sustainability

When responding:
- Use clear, professional language
- Be specific with AWS service names and features
- Include rationale for architectural decisions
- Address both technical and business perspectives
- Highlight cost-optimization opportunities
- Consider operational aspects
- Provide actionable recommendations

Style Guidelines:
- Professional consulting tone
- Use bullet points and structured formatting
- Include specific AWS services and features
- Provide cost estimates when relevant
- Address security and compliance considerations
"""

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    ollama_status = check_ollama_connection()
    return jsonify({
        "status": "healthy" if ollama_status else "unhealthy",
        "mode": "local_ml",
        "ollama_connected": ollama_status,
        "model": MODEL_NAME,
        "ollama_url": OLLAMA_URL
    })

@app.route('/chat', methods=['POST'])
def chat():
    """Chat endpoint using local Ollama LLM."""
    if not check_ollama_connection():
        return jsonify({
            "error": f"Ollama not accessible at {OLLAMA_URL}. Please install and start Ollama.",
            "status": "error",
            "setup_instructions": [
                "1. Install Ollama from https://ollama.ai/",
                "2. Run: ollama pull llama2",
                "3. Start Ollama service",
                "4. Verify with: curl http://localhost:11434/api/tags"
            ]
        }), 500
    
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({"error": "Message is required"}), 400
        
        message = data['message']
        session_id = data.get('session_id', f"local-session-{str(uuid.uuid4())}")
        
        logger.info(f"Processing local ML message: {message[:50]}...")
        
        # Create full prompt
        full_prompt = f"{SYSTEM_PROMPT}\n\nUser Question: {message}\n\nResponse:"
        
        # Generate response using Ollama
        response_text = generate_with_ollama(full_prompt)
        
        return jsonify({
            "response": response_text,
            "session_id": session_id,
            "status": "success",
            "mode": "local_ml",
            "model": MODEL_NAME
        })
        
    except Exception as e:
        logger.error(f"Error in local ML chat endpoint: {e}")
        return jsonify({
            "error": str(e),
            "status": "error"
        }), 500

@app.route('/workflow/phase', methods=['POST'])
def workflow_phase():
    """Workflow phase endpoint using local Ollama LLM."""
    if not check_ollama_connection():
        return jsonify({
            "error": f"Ollama not accessible at {OLLAMA_URL}. Please install and start Ollama.",
            "status": "error"
        }), 500
    
    try:
        data = request.get_json()
        
        if not data or 'message' not in data or 'phase' not in data:
            return jsonify({"error": "Message and phase are required"}), 400
        
        message = data['message']
        phase = data['phase']
        session_id = data.get('session_id', f"local-session-{str(uuid.uuid4())}")
        
        logger.info(f"Processing local ML {phase} phase request")
        
        # Phase-specific guidance
        phase_guidance = {
            "discovery": "Focus on business discovery and requirements gathering.",
            "executive-summary": "Create a compelling executive summary for C-level stakeholders.",
            "current-state": "Analyze the existing technical environment thoroughly.",
            "requirements-analysis": "Provide detailed, measurable requirements analysis.",
            "proposed-architecture": "Design comprehensive AWS architecture with service justifications.",
            "implementation-approach": "Develop detailed, actionable implementation strategy.",
            "recommendations": "Provide strategic, measurable recommendations."
        }
        
        guidance = phase_guidance.get(phase, "Provide professional consulting response.")
        
        # Create full prompt with phase context
        full_prompt = f"""{SYSTEM_PROMPT}

Phase: {phase.upper()}
Guidance: {guidance}

User Input: {message}

Please provide a comprehensive, professional response for the {phase} phase of an AWS consulting engagement:"""
        
        # Generate response using Ollama
        response_text = generate_with_ollama(full_prompt)
        
        return jsonify({
            "response": response_text,
            "session_id": session_id,
            "phase": phase,
            "status": "success",
            "mode": "local_ml",
            "model": MODEL_NAME
        })
        
    except Exception as e:
        logger.error(f"Error in local ML workflow phase endpoint: {e}")
        return jsonify({
            "error": str(e),
            "status": "error"
        }), 500

@app.route('/sessions', methods=['POST'])
def create_session():
    """Create a new session."""
    session_id = f"local-session-{str(uuid.uuid4())}"
    return jsonify({
        "session_id": session_id,
        "status": "created",
        "mode": "local_ml"
    })

@app.route('/models', methods=['GET'])
def list_models():
    """List available Ollama models."""
    try:
        response = requests.get(f"{OLLAMA_URL}/api/tags")
        if response.status_code == 200:
            models = response.json().get('models', [])
            return jsonify({
                "models": [model['name'] for model in models],
                "current_model": MODEL_NAME,
                "status": "success"
            })
        else:
            return jsonify({"error": "Failed to fetch models"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Local ML-Powered Backend API Server")
    print(f"Ollama URL: {OLLAMA_URL}")
    print(f"Model: {MODEL_NAME}")
    print(f"Ollama Status: {'✅ Connected' if check_ollama_connection() else '❌ Not connected'}")
    print("Server will be available at: http://localhost:3030")
    print("\nTo use local ML integration:")
    print("1. Install Ollama from https://ollama.ai/")
    print("2. Run: ollama pull llama2")
    print("3. Start Ollama service")
    print("4. Restart this server")
    print("\nAvailable models to try:")
    print("- llama2 (general purpose)")
    print("- codellama (code-focused)")
    print("- mistral (fast and efficient)")
    print("- llama2:13b (larger, more capable)")
    
    app.run(debug=True, host='0.0.0.0', port=3030)