#!/bin/bash

echo "🚀 AI Solutions Architect - Quick Installer for Aarul Motiani"
echo "👤 AWS Root User: 4657-3392-1455"
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install from: https://nodejs.org/"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install from: https://python.org/"
    exit 1
fi

if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Install with: pip install awscli"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."

echo "Installing backend dependencies..."
cd backend
pip3 install -r requirements.txt

echo "Installing frontend dependencies..."
cd ../frontend
npm install

cd ..

echo ""
echo "✅ Installation completed!"
echo ""
echo "🔧 Next steps:"
echo "1. Configure AWS credentials:"
echo "   aws configure --profile aarul-hackathon"
echo ""
echo "2. Enable Bedrock models in AWS Console:"
echo "   - Go to Amazon Bedrock → Model access"
echo "   - Enable Claude 3.5 Sonnet v2"
echo ""
echo "3. Start the application:"
echo "   Terminal 1: cd backend/api && python3 direct_bedrock_backend.py"
echo "   Terminal 2: cd frontend && npm start"
echo ""
echo "4. Open in browser: http://localhost:3000"
echo ""
echo "📚 For detailed instructions, see:"
echo "   - INSTALLATION_GUIDE_AARUL.md"
echo "   - HACKATHON_SETUP_GUIDE.md"
