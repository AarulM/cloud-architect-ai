#!/usr/bin/env python3
"""
Simplified Flask backend API for the frontend to communicate with the agent.
This provides a REST API wrapper that utilizes the strands_entry.py MCP server
for AWS documentation capabilities.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import uuid
import os
import logging
import sys
import importlib.util

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


# Phase-specific output control prompts
PHASE_PROMPTS = {
    "discovery": """
Provide a concise summary of the key findings from the discovery session:

## Business Problem & Objectives
- What is the core business challenge or opportunity?
- What are the primary goals and success criteria?

## Current Environment Overview
- What is the existing technology landscape?
- What are the main pain points and limitations?

## Key Requirements Identified
- What are the essential capabilities needed?
- What are the critical constraints and dependencies?

## Next Steps & Priorities
- What are the immediate priorities for the next phases?
- What areas need further investigation?

Keep the summary concise and focused on the most critical information that will guide the subsequent analysis phases.""",

    "executive-summary": """
Create a compelling executive summary in 2-3 paragraphs covering:

## Business Challenge & Opportunity
- State the core business problem and strategic opportunity
- Quantify impact using discovery findings (costs, risks, growth potential)
- Connect to organizational objectives

## AWS Solution & Value
- Present AWS cloud solution as strategic response
- Highlight key capabilities addressing challenges
- Emphasize business transformation benefits

## Expected Outcomes & Investment
- Quantify expected ROI and business outcomes
- Present timeline and investment summary
- Address key success factors

Use executive language focused on business value. Target 300-400 words.""",

    "current-state": """
Analyze the existing environment based on discovery findings:

## Current Architecture Overview
- Document existing infrastructure components and relationships
- Map current data flows and system integrations
- Identify technology stack, platforms, and key dependencies
- Assess current capacity, utilization, and performance metrics

## Operational Challenges & Pain Points
- Analyze performance bottlenecks and reliability issues
- Document scalability limitations and capacity constraints
- Identify security vulnerabilities and compliance gaps
- Assess operational overhead and manual processes

## Technical Debt & Legacy Systems
- Evaluate aging infrastructure and end-of-life systems
- Document outdated technologies and unsupported platforms
- Assess code quality, documentation, and maintainability issues
- Identify architectural inconsistencies and design flaws

## Resource & Cost Analysis
- Analyze current infrastructure and operational costs
- Assess team skills, capacity, and organizational readiness
- Document licensing, support, and maintenance expenses
- Evaluate resource utilization and optimization opportunities

## Capability Gaps & Limitations
- Identify missing capabilities required for business objectives
- Document integration challenges and data silos
- Assess disaster recovery and business continuity gaps
- Analyze monitoring, observability, and operational visibility issues

Use specific metrics and quantifiable impacts where possible.""",

    "requirements-analysis": """
Analyze requirements based on discovery findings and use AWS documentation to identify relevant services:

## Functional Requirements Deep Dive
- Define core business processes and user journeys that must be supported
- Specify system capabilities, features, and functional behaviors
- Document data processing, transformation, and business logic requirements
- Define user interface, API, and integration functional specifications

## Non-Functional Requirements Specification
- Performance requirements: throughput, latency, response times, and load capacity
- Availability and reliability targets: uptime SLAs, RTO/RPO, and fault tolerance
- Security requirements: authentication, authorization, encryption, and compliance standards
- Scalability requirements: growth projections, elasticity needs, and capacity planning

## Integration & Interoperability Requirements
- Define required integrations with existing systems and third-party services
- Specify data exchange formats, protocols, and synchronization requirements
- Document API requirements, service contracts, and interface specifications
- Identify real-time vs. batch processing and data consistency requirements

## Compliance & Governance Requirements
- Document regulatory compliance requirements (SOX, HIPAA, GDPR, etc.)
- Define data governance, retention, and privacy requirements
- Specify audit, logging, and reporting requirements
- Document change management and approval processes

## Acceptance Criteria & Success Metrics
- Define measurable success criteria for each functional requirement
- Specify performance benchmarks and quality gates
- Document testing requirements and validation approaches
- Define business metrics and KPIs for measuring solution success

Ensure all requirements are specific, measurable, and testable. Use AWS documentation to validate technical feasibility.
Note: Please keep this section concsise and brief.""",

    "proposed-architecture": """
Design AWS cloud architecture based on requirements using AWS Well-Architected Framework principles:

## Solution Architecture Overview
- Present the high-level architecture pattern and design principles
- Describe the overall system topology and component relationships
- Explain data flow, processing patterns, and integration approaches
- Justify architectural decisions and trade-offs made
- Present architecture diagram

## AWS Service Selection & Rationale
- Compute services: EC2, Lambda, ECS/EKS, Batch - with specific justifications
- Storage services: S3, EBS, EFS, FSx - aligned to data requirements
- Database services: RDS, DynamoDB, ElastiCache, Redshift - based on data patterns
- Networking services: VPC, ALB/NLB, CloudFront, API Gateway - for connectivity needs
- Security services: IAM, KMS, Secrets Manager, WAF - addressing security requirements

## Security Architecture & Controls
- Network security: VPC design, security groups, NACLs, and network segmentation
- Identity and access management: IAM roles, policies, and least privilege principles
- Data protection: encryption at rest and in transit, key management strategies
- Application security: WAF rules, DDoS protection, and vulnerability management
- Compliance controls: audit logging, monitoring, and regulatory compliance measures

## Scalability & Performance Design
- Auto-scaling strategies for compute, storage, and database tiers
- Performance optimization: caching strategies, CDN usage, and database tuning
- Load balancing and traffic distribution patterns
- Capacity planning and resource right-sizing approaches
- Monitoring and alerting for performance metrics

## Operational Excellence & Reliability
- High availability design: multi-AZ deployment and failover strategies
- Disaster recovery: backup strategies, cross-region replication, and recovery procedures
- Monitoring and observability: CloudWatch, X-Ray, and custom metrics
- Infrastructure as Code: CloudFormation/CDK templates and deployment automation
- Change management and deployment pipelines

## Cost Optimization Strategy
- Resource optimization: right-sizing, reserved instances, and spot instances
- Storage optimization: lifecycle policies, intelligent tiering, and archival strategies
- Network cost optimization: data transfer minimization and endpoint strategies
- Operational cost reduction: automation, serverless adoption, and managed services
- Cost monitoring and governance: budgets, alerts, and cost allocation tags

Use AWS documentation and reference architectures to validate service selections and design patterns.""",

    "implementation-approach": """
Develop implementation strategy based on architecture design and organizational capabilities:

## Implementation Methodology & Phases
- Phase 1 - Foundation: Core infrastructure, networking, and security baseline
- Phase 2 - Core Services: Primary application components and data services
- Phase 3 - Integration: System integrations, data migration, and testing
- Phase 4 - Optimization: Performance tuning, cost optimization, and scaling
- Phase 5 - Go-Live: Production deployment, monitoring, and knowledge transfer

## Migration & Deployment Strategy
- Migration approach: lift-and-shift, re-platforming, or re-architecting strategies
- Data migration strategy: tools, methods, and validation approaches
- Application deployment patterns: blue-green, canary, or rolling deployments
- Rollback procedures and contingency planning
- Production cutover strategy and timing considerations

## Team Structure & Resource Planning
- Required roles: cloud architects, DevOps engineers, developers, and specialists
- Skill development and training requirements for existing team members
- External resource needs: consultants, contractors, or AWS professional services
- Team organization and communication structures
- Knowledge transfer and documentation requirements

## Timeline, Milestones & Dependencies
- Detailed project timeline with critical path analysis
- Key milestones and deliverables for each implementation phase
- External dependencies: vendor deliveries, approvals, and third-party integrations
- Risk buffer and contingency time allocation
- Go/no-go decision points and success criteria

## Risk Management & Mitigation
- Technical risks: complexity, integration challenges, and performance issues
- Operational risks: resource availability, skill gaps, and timeline pressures
- Business risks: budget overruns, scope creep, and stakeholder alignment
- Mitigation strategies and contingency plans for each identified risk
- Risk monitoring and escalation procedures

## Quality Assurance & Testing Strategy
- Testing approach: unit, integration, performance, and security testing
- Environment strategy: development, staging, and production environments
- Test data management and data privacy considerations
- Performance testing and load testing strategies
- User acceptance testing and business validation approaches

Use AWS migration best practices and reference implementation guides.
Note: Please keep this section concsise and brief.""",

    "recommendations": """
Provide strategic guidance and actionable next steps based on the analysis:

## Strategic Recommendations
- Cloud-first strategy adoption and organizational transformation guidance
- Technology modernization priorities aligned with business objectives
- Investment recommendations for maximum ROI and competitive advantage
- Organizational change management and cultural transformation needs
- Long-term technology roadmap and evolution strategy

## Technical Excellence Recommendations
- Architecture best practices and design pattern adoption
- DevOps and automation strategy for operational efficiency
- Security posture improvements and compliance strengthening
- Performance optimization and cost management strategies
- Monitoring, observability, and operational excellence practices

## Implementation Success Factors
- Critical success factors and key performance indicators
- Stakeholder engagement and communication strategies
- Change management and user adoption approaches
- Training and skill development priorities
- Vendor and partner relationship management

## Operational Readiness Requirements
- Production support model and operational procedures
- Incident response and disaster recovery capabilities
- Capacity management and performance monitoring
- Security operations and compliance management
- Continuous improvement and optimization processes

## Immediate Action Items & Next Steps
- Week 1-2: Initial setup tasks, team formation, and stakeholder alignment
- Month 1: Foundation phase kickoff, infrastructure provisioning, and baseline establishment
- Month 2-3: Core implementation milestones and integration activities
- Month 4-6: Testing, optimization, and production readiness activities
- Post Go-Live: Operational handover, optimization, and continuous improvement

## Success Metrics & Measurement
- Business value metrics: cost savings, performance improvements, and efficiency gains
- Technical metrics: availability, performance, security, and operational excellence
- User satisfaction and adoption metrics
- Project delivery metrics: timeline, budget, and scope adherence
- Long-term value realization and ROI measurement approaches

Prioritize recommendations by business impact, feasibility, and strategic importance. Use AWS best practices and reference architectures to support recommendations."""
}

# Dynamically import the strands_entry module
try:
    # Add the parent directory to the path so we can import from backend.app
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from app.strands_entry import strands_agent_bedrock
    logger.info("✅ Successfully imported strands_agent_bedrock")
except ImportError as e:
    logger.error(f"❌ Failed to import strands_agent_bedrock: {e}")
    strands_agent_bedrock = None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "mcp_enabled": strands_agent_bedrock is not None
    })

@app.route('/chat', methods=['POST'])
def chat():
    """
    Chat endpoint to send messages to the agent.
    Uses the strands_entry.py MCP server for AWS documentation capabilities.
    """
    if not strands_agent_bedrock:
        return jsonify({
            "error": "strands_agent_bedrock not initialized. Check server configuration.",
            "status": "error"
        }), 500
    
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({"error": "Message is required"}), 400
        
        message = data['message']
        session_id = data.get('session_id', f"session-{str(uuid.uuid4())}")
        phase = data.get('phase', 'general')  # Support phase context
        
        logger.info(f"Processing message: {message[:50]}... (Phase: {phase})")
        
        # Enhance message with phase-specific output control
        enhanced_message = message
        if phase in PHASE_PROMPTS:
            enhanced_message = f"{message}\n\nPHASE GUIDANCE: {PHASE_PROMPTS[phase]}"
        
        # Create payload for strands_agent_bedrock
        payload = {
            "prompt": enhanced_message,
            "phase": phase
        }
        
        # Invoke the agent via strands_entry.py
        response_text = strands_agent_bedrock(payload)
        
        logger.info("Agent response received")
        
        return jsonify({
            "response": response_text,
            "session_id": session_id,
            "status": "success"
        })
        
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
    This replaces the multiple phase-specific endpoints in the original API.
    """
    if not strands_agent_bedrock:
        return jsonify({
            "error": "strands_agent_bedrock not initialized. Check server configuration.",
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
        
        # Enhance message with phase-specific output control
        enhanced_message = message
        if phase in PHASE_PROMPTS:
            enhanced_message = f"{message}\n\nPHASE GUIDANCE: {PHASE_PROMPTS[phase]}"
        
        # Create payload for strands_agent_bedrock
        payload = {
            "prompt": enhanced_message,
            "phase": phase
        }
        
        # Invoke the agent via strands_entry.py (no automatic retries)
        response_text = strands_agent_bedrock(payload)
        
        return jsonify({
            "response": response_text,
            "session_id": session_id,
            "phase": phase,
            "status": "success"
        })
        
    except Exception as e:
        logger.error(f"Error in workflow phase endpoint: {e}")
        return jsonify({
            "error": str(e),
            "status": "error"
        }), 500

if __name__ == '__main__':
    print("🚀 Starting Simplified Backend API Server with MCP Integration")
    print(f"MCP Integration Status: {'✅ Enabled' if strands_agent_bedrock else '❌ Disabled'}")
    print("Server will be available at: http://localhost:3030")
    print("\nCore Endpoints:")
    print("  GET  /health - Health check and MCP status")
    print("  POST /chat - Send message to agent with MCP capabilities")
    print("  POST /sessions - Create new session")
    print("  POST /workflow/phase - Unified workflow phase endpoint")
    print("\nExample usage:")
    print("curl -X POST http://localhost:3030/workflow/phase \\")
    print("  -H 'Content-Type: application/json' \\")
    print("  -d '{\"session_id\": \"test-session\", \"phase\": \"requirements\", \"message\": \"Start requirements gathering for an e-commerce platform\"}'")
    
    app.run(debug=True, host='0.0.0.0', port=3030)
