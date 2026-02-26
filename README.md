# AI Solution Architect - WINFO Hackathon Project

An intelligent AI-powered solution architect that helps design, validate, and implement AWS cloud architectures using advanced AI agents and AWS documentation integration.

## 🚀 Features

- **Interactive Chat Interface** - Natural language conversations with AI architects
- **AWS Documentation Integration** - Real-time access to AWS best practices and documentation
- **Architecture Design & Validation** - Automated architecture design with Well-Architected Framework validation
- **Multi-Phase Workflow** - Structured approach from requirements to implementation
- **Real-time Collaboration** - Session-based conversations with memory management
- **Deployment Ready** - Full CI/CD pipeline with AWS deployment

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  Python Backend │    │   AWS Services  │
│                 │    │                 │    │                 │
│ • Chat Interface│◄──►│ • FastAPI       │◄──►│ • Bedrock       │
│ • File Upload   │    │ • MCP Server    │    │ • Lambda        │
│ • Workflow UI   │    │ • Session Mgmt  │    │ • API Gateway   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

### Required Software
- **Node.js** (v18 or higher)
- **Python** (v3.9 or higher)
- **AWS CLI** (configured with credentials)
- **Git**

### AWS Requirements
- AWS Account with appropriate permissions
- AWS CLI configured with access keys
- IAM user with necessary permissions (see `hackathon-iam-policy.json`)

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd <repository-name>
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd Kunal-project/backend/api

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Set up environment variables
cp ../../../.env.example .env
# Edit .env file with your AWS credentials and configuration
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd Kunal-project/frontend

# Install Node.js dependencies
npm install

# Create production environment file
cp .env.production.example .env.production
# Edit .env.production with your backend URL
```

### 4. AWS Configuration

#### Option A: Using Provided Scripts (Windows)
```bash
# Run the setup script
./deploy-setup.bat

# Check if everything is configured correctly
./check-setup.bat
```

#### Option B: Manual Setup
1. Configure AWS CLI:
   ```bash
   aws configure
   ```

2. Create IAM user with the policy from `hackathon-iam-policy.json`

3. Set up environment variables in `.env`:
   ```
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=us-east-1
   BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
   ```

## 🚀 Running the Application

### Development Mode

#### Start Backend Server
```bash
cd Kunal-project/backend/api
python start.py
# Backend will run on http://localhost:3030
```

#### Start Frontend Server
```bash
cd Kunal-project/frontend
npm start
# Frontend will run on http://localhost:3000
```

### Production Build

#### Build Frontend
```bash
cd Kunal-project/frontend
npm run build
```

#### Deploy to AWS
```bash
# Deploy backend using SAM
./deploy-backend.bat

# Deploy frontend to Amplify
./deploy-frontend.bat
```

## 📖 Usage Guide

### 1. Starting a New Session

1. Open the application in your browser
2. Click "New Session" to start a fresh conversation
3. The AI architect will greet you and ask about your project requirements

### 2. Workflow Phases

The application supports multiple workflow phases:

- **Requirements Gathering** - Define project needs and constraints
- **Architecture Design** - Generate AWS architecture recommendations
- **Validation** - Validate against AWS Well-Architected Framework
- **Implementation** - Get implementation guidance and code examples

### 3. Key Features

#### Chat Interface
- Natural language conversations with AI architects
- File upload support for requirements documents
- Real-time responses with AWS documentation integration

#### Architecture Design
- Automatic architecture diagram generation
- AWS service recommendations based on requirements
- Cost optimization suggestions

#### Validation
- Well-Architected Framework compliance checking
- Security best practices validation
- Performance optimization recommendations

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
CORS_ORIGINS=http://localhost:3000,https://your-domain.com
```

#### Frontend (.env.production)
```
REACT_APP_BACKEND_URL=https://your-api-gateway-url
REACT_APP_AWS_REGION=us-east-1
```

### Customization

#### Adding New AI Agents
1. Edit `Kunal-project/frontend/src/utils/aiAgents.js`
2. Add new agent configurations
3. Update the backend phase handlers in `enhanced_bedrock_backend.py`

#### Modifying Workflow Phases
1. Update phase definitions in `aiAgents.js`
2. Modify backend phase logic in the API handlers
3. Update UI components in `src/components/`

## 🚀 Deployment

### Automated Deployment (GitHub Actions)

The project includes a complete CI/CD pipeline:

1. **Push to main branch** triggers automatic deployment
2. **Backend deployment** using AWS SAM
3. **Frontend deployment** to AWS Amplify
4. **Environment configuration** handled automatically

### Manual Deployment

#### Backend to AWS Lambda
```bash
# Build and deploy using SAM
sam build --template-file backend-template.yaml
sam deploy --guided
```

#### Frontend to AWS Amplify
```bash
# Build production bundle
cd Kunal-project/frontend
npm run build

# Deploy to Amplify (configure in AWS Console)
# Or use Amplify CLI:
amplify init
amplify add hosting
amplify publish
```

## 🧪 Testing

### Backend Tests
```bash
cd Kunal-project/backend/api
python -m pytest tests/
```

### Frontend Tests
```bash
cd Kunal-project/frontend
npm test
```

### Integration Tests
```bash
# Test the complete workflow
./scripts/test-hackathon-setup.sh
```

## 📚 API Documentation

### Core Endpoints

#### Health Check
```
GET /health
```

#### Chat
```
POST /chat
{
  "session_id": "string",
  "message": "string",
  "phase": "requirements|architecture|validation|implementation|general"
}
```

#### Create Session
```
POST /sessions
{
  "session_name": "string"
}
```

#### Workflow Phase
```
POST /workflow/phase
{
  "session_id": "string",
  "phase": "string",
  "message": "string"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

#### PostCSS Build Errors
```bash
cd Kunal-project/frontend
rm -rf node_modules package-lock.json
npm install
```

#### AWS Credentials Issues
```bash
aws configure list
aws sts get-caller-identity
```

#### Backend Connection Issues
- Check if backend is running on correct port (3030)
- Verify CORS configuration in backend
- Check AWS credentials and permissions

### Getting Help

1. Check the [Issues](../../issues) page for known problems
2. Review the deployment guides in the `docs/` folder
3. Check AWS CloudWatch logs for backend issues
4. Use browser developer tools for frontend debugging

## 📞 Support

For support and questions:
- Create an issue in this repository
- Check the documentation in the `docs/` folder
- Review the setup guides for your platform

---

**Built with ❤️ for the WINFO Hackathon**
