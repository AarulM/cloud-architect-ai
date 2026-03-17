#!/usr/bin/env python3
"""
Direct AWS Bedrock backend - No agents, just direct Claude API calls.
Simplest AWS Bedrock integration.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import uuid
import logging
import boto3
from botocore.exceptions import ClientError
import os
from dotenv import load_dotenv

# Load .env from project root (3 levels up from this file)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Initialize Bedrock Runtime client
bedrock_runtime = None
REGION = "us-east-1"
MODEL_ID = "us.anthropic.claude-3-5-haiku-20241022-v1:0"

try:
    bedrock_runtime = boto3.client('bedrock-runtime', region_name=REGION)
    logger.info(f"✅ Bedrock Runtime client initialized")
except Exception as e:
    logger.error(f"❌ Failed to initialize Bedrock client: {e}")

SYSTEM_PROMPT = """You are an experienced AWS Solutions Architect with deep expertise in cloud architecture and AWS services. 
Your role is to analyze customer requirements and produce professional AWS architecture design documents.

Key Responsibilities:
1. Analyze customer requirements, constraints, and business objectives
2. Identify appropriate AWS services and design patterns
3. Apply the AWS Well-Architected Framework pillars

When responding:
- Use clear, professional language
- Be specific with AWS service names and features
- Include rationale for architectural decisions
- Address both technical and business perspectives
- Provide actionable recommendations

CRITICAL REQUIREMENT - ARCHITECTURE DIAGRAMS:
For ANY response that involves architecture design, solution proposals, or system design:
1. MUST include a Mermaid diagram showing the complete architecture
2. This is MANDATORY for all architecture-related responses
3. Place the diagram early in your response, right after the overview
4. Use this format and customize based on requirements:

```mermaid
graph TB
    subgraph "Client Layer"
        User[👥 Users/Clients]:::client
        Mobile[📱 Mobile Apps]:::client
        Web[🌐 Web Applications]:::client
    end
    
    subgraph "AWS Cloud" 
        subgraph "Edge & CDN"
            CF[☁️ CloudFront CDN]:::networking
            R53[🌍 Route 53]:::networking
        end
        
        subgraph "Frontend Hosting"
            S3Web[🪣 S3 Static Hosting]:::storage
            Amplify[⚡ AWS Amplify]:::frontend
        end
        
        subgraph "API Gateway & Load Balancing"
            APIGW[🚪 API Gateway]:::networking
            ALB[⚖️ Application Load Balancer]:::networking
            NLB[⚖️ Network Load Balancer]:::networking
        end
        
        subgraph "Compute Layer"
            ECS[🐳 ECS Fargate]:::compute
            Lambda[⚡ Lambda Functions]:::compute
            EC2[🖥️ EC2 Instances]:::compute
            EKS[☸️ EKS Cluster]:::compute
        end
        
        subgraph "Data & Storage"
            RDS[🗄️ RDS Database]:::database
            DynamoDB[⚡ DynamoDB]:::database
            S3[🪣 S3 Storage]:::storage
            ElastiCache[⚡ ElastiCache]:::database
            Redshift[📊 Redshift]:::analytics
        end
        
        subgraph "AI/ML Services"
            Bedrock[🤖 Amazon Bedrock]:::ai
            SageMaker[🧠 SageMaker]:::ai
            Comprehend[📝 Comprehend]:::ai
        end
        
        subgraph "Security & Monitoring"
            WAF[🛡️ AWS WAF]:::security
            CloudWatch[📊 CloudWatch]:::monitoring
            IAM[🔐 IAM]:::security
            Secrets[🔑 Secrets Manager]:::security
            KMS[🔐 AWS KMS]:::security
        end
        
        subgraph "Integration & Messaging"
            SQS[📬 SQS Queues]:::messaging
            SNS[📢 SNS Topics]:::messaging
            EventBridge[🌉 EventBridge]:::messaging
        end
    end
    
    %% Data Flow Connections
    User --> CF
    Mobile --> APIGW
    Web --> CF
    CF --> S3Web
    CF --> ALB
    R53 --> CF
    APIGW --> Lambda
    ALB --> ECS
    ECS --> RDS
    ECS --> DynamoDB
    Lambda --> DynamoDB
    Lambda --> Bedrock
    ECS --> ElastiCache
    ECS --> S3
    Lambda --> SQS
    SQS --> Lambda
    SNS --> Lambda
    WAF --> ALB
    CloudWatch -.Monitor.-> ECS
    CloudWatch -.Monitor.-> Lambda
    IAM -.Secure.-> ECS
    IAM -.Secure.-> Lambda

    %% AWS Color Styling
    classDef client fill:#E8F4FD,stroke:#1B660F,stroke-width:2px,color:#000
    classDef compute fill:#FF9900,stroke:#FF6600,stroke-width:2px,color:#fff
    classDef storage fill:#3F8FBF,stroke:#2E6B8F,stroke-width:2px,color:#fff
    classDef database fill:#3F8FBF,stroke:#2E6B8F,stroke-width:2px,color:#fff
    classDef networking fill:#FF9900,stroke:#FF6600,stroke-width:2px,color:#fff
    classDef security fill:#DD344C,stroke:#B02A3A,stroke-width:2px,color:#fff
    classDef monitoring fill:#759C3E,stroke:#5D7A31,stroke-width:2px,color:#fff
    classDef ai fill:#8C4FFF,stroke:#7A3FE6,stroke-width:2px,color:#fff
    classDef messaging fill:#FF9900,stroke:#FF6600,stroke-width:2px,color:#fff
    classDef analytics fill:#8C4FFF,stroke:#7A3FE6,stroke-width:2px,color:#fff
    classDef frontend fill:#FF9900,stroke:#FF6600,stroke-width:2px,color:#fff
```

IMPLEMENTATION PLANNING - GANTT CHARTS:
For implementation planning, project timelines, or deployment schedules, ALWAYS include a Gantt chart using Mermaid:

```mermaid
gantt
    title AWS Implementation Timeline
    dateFormat  YYYY-MM-DD
    section Infrastructure Setup
    AWS Account Setup           :done,    setup, 2024-01-01, 2024-01-03
    IAM Configuration          :done,    iam, 2024-01-02, 2024-01-05
    VPC & Networking           :active,  vpc, 2024-01-04, 2024-01-10
    
    section Core Services
    Database Setup             :db, 2024-01-08, 2024-01-15
    Application Deployment     :app, 2024-01-12, 2024-01-20
    Load Balancer Config       :lb, 2024-01-18, 2024-01-22
    
    section Security & Monitoring
    Security Implementation    :sec, 2024-01-20, 2024-01-28
    Monitoring Setup           :mon, 2024-01-25, 2024-02-02
    
    section Testing & Launch
    Integration Testing        :test, 2024-01-30, 2024-02-08
    Performance Testing        :perf, 2024-02-05, 2024-02-12
    Production Launch          :launch, 2024-02-10, 2024-02-15
    
    section Post-Launch
    Optimization               :opt, 2024-02-15, 2024-02-25
    Documentation              :docs, 2024-02-20, 2024-02-28
```

DIAGRAM REQUIREMENTS:
- Always customize the diagram for the specific use case
- Include only relevant AWS services for the requirements
- Show clear data flow with arrows (-->)
- Use dotted lines for monitoring/security (-.->)
- Group related services in subgraphs
- Use appropriate emojis for AWS services:
  * 🪣 S3, 📁 EFS, 💾 EBS (Storage)
  * ⚡ Lambda, 🐳 ECS, 🖥️ EC2, ☸️ EKS (Compute)
  * 🗄️ RDS, ⚡ DynamoDB, 🔄 ElastiCache, 📊 Redshift (Database)
  * 🚪 API Gateway, ⚖️ ALB/NLB, ☁️ CloudFront, 🌍 Route 53 (Networking)
  * 🛡️ WAF, 🔐 IAM, 🔑 Secrets Manager, 🔐 KMS (Security)
  * 📊 CloudWatch, 📋 CloudTrail, 🔍 X-Ray (Monitoring)
  * 🤖 Bedrock, 🧠 SageMaker, 📝 Comprehend, 👁️ Rekognition (AI/ML)
  * 📬 SQS, 📢 SNS, 🌉 EventBridge, 🔄 Step Functions (Integration)
  * ⚡ Amplify, 🌐 Cognito, 📱 AppSync (Frontend/Mobile)
- Apply AWS official color coding with classDef:
  * Orange (#FF9900): Compute, Networking, Frontend (compute, networking, frontend)
  * Blue (#3F8FBF): Storage, Database (storage, database)  
  * Red (#DD344C): Security services (security)
  * Green (#759C3E): Monitoring, Management (monitoring)
  * Purple (#8C4FFF): AI/ML, Analytics (ai, analytics)
  * Light Blue (#E8F4FD): Client/User interfaces (client)
- Always include the complete classDef styling at the end
- Make the diagram comprehensive but not cluttered
- Use consistent naming and grouping

GANTT CHART REQUIREMENTS:
- Use for implementation planning, project timelines, deployment schedules
- Include realistic timeframes and dependencies
- Group related tasks into sections
- Use appropriate status indicators (done, active, future)
- Include critical milestones and deliverables
- Consider AWS-specific implementation phases

WHEN TO INCLUDE DIAGRAMS:
- Architecture proposals or recommendations
- Solution designs
- System overviews
- Technology stack discussions
- Infrastructure planning
- Implementation timelines (use Gantt charts)
- Any response mentioning multiple AWS services working together

Remember: Every architecture response MUST have a diagram. Implementation responses MUST have Gantt charts. No exceptions."""

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy" if bedrock_runtime else "unhealthy",
        "mode": "direct_bedrock",
        "model": MODEL_ID,
        "region": REGION
    })

@app.route('/chat', methods=['POST'])
def chat():
    if not bedrock_runtime:
        return jsonify({"error": "Bedrock client not initialized"}), 500
    
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({"error": "Message is required"}), 400
        
        message = data['message']
        session_id = data.get('session_id', f"session-{str(uuid.uuid4())}")
        
        logger.info(f"Processing message: {message[:50]}...")
        
        # Call Bedrock directly
        response = bedrock_runtime.invoke_model(
            modelId=MODEL_ID,
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 4096,
                "system": SYSTEM_PROMPT,
                "messages": [
                    {
                        "role": "user",
                        "content": message
                    }
                ]
            })
        )
        
        response_body = json.loads(response['body'].read())
        response_text = response_body['content'][0]['text']
        
        return jsonify({
            "response": response_text,
            "session_id": session_id,
            "status": "success",
            "mode": "direct_bedrock"
        })
        
    except ClientError as e:
        logger.error(f"AWS Error: {e}")
        return jsonify({"error": str(e), "status": "error"}), 500
    except Exception as e:
        logger.error(f"Error: {e}")
        return jsonify({"error": str(e), "status": "error"}), 500

@app.route('/workflow/phase', methods=['POST'])
def workflow_phase():
    if not bedrock_runtime:
        return jsonify({"error": "Bedrock client not initialized"}), 500
    
    try:
        data = request.get_json()
        if not data or 'message' not in data or 'phase' not in data:
            return jsonify({"error": "Message and phase required"}), 400
        
        message = data['message']
        phase = data['phase']
        session_id = data.get('session_id', f"session-{str(uuid.uuid4())}")
        
        # Add specific diagram requirements for architecture phases
        diagram_reminder = ""
        if phase.lower() in ['proposed-architecture', 'architecture-design', 'solution-design', 'technical-design']:
            diagram_reminder = "\n\nIMPORTANT: This response MUST include a comprehensive Mermaid architecture diagram showing all AWS services and their connections. Place the diagram early in your response after the overview."
        
        enhanced_message = f"Phase: {phase.upper()}\n\n{message}{diagram_reminder}"
        
        response = bedrock_runtime.invoke_model(
            modelId=MODEL_ID,
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 4096,
                "system": SYSTEM_PROMPT,
                "messages": [{"role": "user", "content": enhanced_message}]
            })
        )
        
        response_body = json.loads(response['body'].read())
        response_text = response_body['content'][0]['text']
        
        return jsonify({
            "response": response_text,
            "session_id": session_id,
            "phase": phase,
            "status": "success",
            "mode": "direct_bedrock"
        })
        
    except Exception as e:
        logger.error(f"Error: {e}")
        return jsonify({"error": str(e), "status": "error"}), 500

@app.route('/sessions', methods=['POST'])
def create_session():
    return jsonify({
        "session_id": f"session-{str(uuid.uuid4())}",
        "status": "created"
    })

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400

        content = file.read().decode('utf-8', errors='ignore')

        return jsonify({
            "status": "success",
            "filename": file.filename,
            "size": len(content),
            "content_type": file.content_type,
            "message": f"File '{file.filename}' uploaded successfully",
            "content": content
        })
    except Exception as e:
        logger.error(f"Upload error: {e}")
        return jsonify({"error": str(e), "status": "error"}), 500

if __name__ == '__main__':
    print("🚀 Starting Direct Bedrock Backend")
    print(f"Model: {MODEL_ID}")
    print(f"Region: {REGION}")
    print(f"Status: {'✅ Ready' if bedrock_runtime else '❌ Not ready'}")
    print("Server: http://localhost:3030")
    print("\n✨ Using AWS Bedrock Claude 3.5 Sonnet directly (no agents)")
    
    app.run(debug=True, host='0.0.0.0', port=3030)
