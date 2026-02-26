#!/usr/bin/env python3
"""
OpenAI-powered Flask backend API for AWS Solutions Architect consulting.
This uses OpenAI's GPT models instead of AWS Bedrock for ML-powered responses.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import uuid
import os
import logging
import openai
from openai import OpenAI

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Initialize OpenAI client
client = None
try:
    # You'll need to set your OpenAI API key as an environment variable
    # export OPENAI_API_KEY="your-api-key-here"
    api_key = os.getenv('OPENAI_API_KEY')
    if api_key:
        client = OpenAI(api_key=api_key)
        logger.info("✅ OpenAI client initialized")
    else:
        logger.error("❌ OPENAI_API_KEY environment variable not set")
except Exception as e:
    logger.error(f"❌ Failed to initialize OpenAI client: {e}")

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

# Phase-specific prompts
PHASE_PROMPTS = {
    "discovery": """
Focus on business discovery and requirements gathering. Provide a structured summary covering:
- Business Problem & Objectives
- Current Environment Overview  
- Key Requirements Identified
- Next Steps & Priorities
Keep it concise and business-focused.
""",
    
    "executive-summary": """
Create a compelling executive summary for C-level stakeholders covering:
- Business Challenge & Opportunity
- AWS Solution & Value Proposition
- Expected Outcomes & Investment
Use executive language focused on business value and ROI.
""",
    
    "current-state": """
Analyze the existing technical environment covering:
- Current Architecture Overview
- Operational Challenges & Pain Points
- Technical Debt & Legacy Systems
- Resource & Cost Analysis
- Capability Gaps & Limitations
Be thorough and technical while remaining accessible.
""",
    
    "requirements-analysis": """
Provide detailed requirements analysis covering:
- Functional Requirements Deep Dive
- Non-Functional Requirements Specification
- Integration & Interoperability Requirements
- Compliance & Governance Requirements
- Acceptance Criteria & Success Metrics
Be specific and measurable in all requirements.
""",
    
    "proposed-architecture": """
Design comprehensive AWS architecture covering:
- Solution Architecture Overview
- AWS Service Selection & Rationale
- Security Architecture & Controls
- Scalability & Performance Design
- Operational Excellence & Reliability
- Cost Optimization Strategy
Include specific AWS services and justify all decisions.
""",
    
    "implementation-approach": """
Develop detailed implementation strategy covering:
- Implementation Methodology & Phases
- Migration & Deployment Strategy
- Team Structure & Resource Planning
- Timeline, Milestones & Dependencies
- Risk Management & Mitigation
Be practical and actionable with clear timelines.
""",
    
    "recommendations": """
Provide strategic recommendations covering:
- Strategic Recommendations
- Technical Excellence Recommendations
- Implementation Success Factors
- Operational Readiness Requirements
- Immediate Action Items & Next Steps
- Success Metrics & Measurement
Focus on actionable guidance and measurable outcomes.
"""
}

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy" if client else "unhealthy",
        "mode": "openai",
        "model": "gpt-4" if client else "unavailable"
    })

@app.route('/chat', methods=['POST'])
def chat():
    """Chat endpoint using OpenAI GPT."""
    if not client:
        return jsonify({
            "error": "OpenAI client not initialized. Set OPENAI_API_KEY environment variable.",
            "status": "error"
        }), 500
    
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({"error": "Message is required"}), 400
        
        message = data['message']
        session_id = data.get('session_id', f"openai-session-{str(uuid.uuid4())}")
        
        logger.info(f"Processing OpenAI message: {message[:50]}...")
        
        # Generate response using OpenAI
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": message}
            ],
            max_tokens=2000,
            temperature=0.7
        )
        
        response_text = response.choices[0].message.content
        
        return jsonify({
            "response": response_text,
            "session_id": session_id,
            "status": "success",
            "mode": "openai"
        })
        
    except Exception as e:
        logger.error(f"Error in OpenAI chat endpoint: {e}")
        return jsonify({
            "error": str(e),
            "status": "error"
        }), 500

@app.route('/workflow/phase', methods=['POST'])
def workflow_phase():
    """Workflow phase endpoint using OpenAI GPT."""
    if not client:
        return jsonify({
            "error": "OpenAI client not initialized. Set OPENAI_API_KEY environment variable.",
            "status": "error"
        }), 500
    
    try:
        data = request.get_json()
        
        if not data or 'message' not in data or 'phase' not in data:
            return jsonify({"error": "Message and phase are required"}), 400
        
        message = data['message']
        phase = data['phase']
        session_id = data.get('session_id', f"openai-session-{str(uuid.uuid4())}")
        
        logger.info(f"Processing OpenAI {phase} phase request")
        
        # Get phase-specific prompt
        phase_guidance = PHASE_PROMPTS.get(phase, "")
        enhanced_prompt = f"{SYSTEM_PROMPT}\n\nPHASE GUIDANCE: {phase_guidance}"
        
        # Generate response using OpenAI
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": enhanced_prompt},
                {"role": "user", "content": message}
            ],
            max_tokens=3000,
            temperature=0.7
        )
        
        response_text = response.choices[0].message.content
        
        return jsonify({
            "response": response_text,
            "session_id": session_id,
            "phase": phase,
            "status": "success",
            "mode": "openai"
        })
        
    except Exception as e:
        logger.error(f"Error in OpenAI workflow phase endpoint: {e}")
        return jsonify({
            "error": str(e),
            "status": "error"
        }), 500

@app.route('/sessions', methods=['POST'])
def create_session():
    """Create a new session."""
    session_id = f"openai-session-{str(uuid.uuid4())}"
    return jsonify({
        "session_id": session_id,
        "status": "created",
        "mode": "openai"
    })

if __name__ == '__main__':
    print("🚀 Starting OpenAI-Powered Backend API Server")
    print(f"OpenAI Client: {'✅ Initialized' if client else '❌ Not initialized'}")
    print("Server will be available at: http://localhost:3030")
    print("\nTo use OpenAI integration:")
    print("1. Get an OpenAI API key from https://platform.openai.com/")
    print("2. Set environment variable: export OPENAI_API_KEY='your-key-here'")
    print("3. Restart this server")
    
    app.run(debug=True, host='0.0.0.0', port=3030)