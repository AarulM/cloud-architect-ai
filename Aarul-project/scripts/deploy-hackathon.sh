#!/bin/bash

# AI Solutions Architect for Hackathon - Deployment Script
# For External Root User: 4657-3392-1455

set -e

echo "🚀 AI Solutions Architect for Hackathon - Deployment Script"
echo "👤 Target User: 4657-3392-1455 (External Root User)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

print_status "Prerequisites check passed"

# Check AWS credentials
print_info "Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

# Get current AWS identity
CURRENT_USER=$(aws sts get-caller-identity --query 'UserId' --output text 2>/dev/null || echo "unknown")
ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text 2>/dev/null || echo "unknown")

print_info "Current AWS User: $CURRENT_USER"
print_info "Account ID: $ACCOUNT_ID"

if [[ "$CURRENT_USER" == "4657-3392-1455" ]]; then
    print_status "✅ Correct root user detected: 4657-3392-1455"
else
    print_warning "⚠️  Current user ($CURRENT_USER) is not the expected root user (4657-3392-1455)"
    print_info "Continuing with current credentials..."
fi

# Check Bedrock access
print_info "Checking Amazon Bedrock access..."
if aws bedrock list-foundation-models --region us-east-1 &> /dev/null; then
    print_status "Amazon Bedrock access confirmed"
else
    print_error "Cannot access Amazon Bedrock. Please check:"
    echo "  1. You're in the correct region (us-east-1)"
    echo "  2. Bedrock model access is enabled in AWS Console"
    echo "  3. Your IAM permissions include Bedrock access"
    exit 1
fi

# Install backend dependencies
print_info "Installing backend dependencies..."
cd backend
if pip3 install -r requirements.txt; then
    print_status "Backend dependencies installed"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi

# Install frontend dependencies
print_info "Installing frontend dependencies..."
cd ../frontend
if npm install; then
    print_status "Frontend dependencies installed"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

cd ..

print_status "🎉 Deployment completed successfully!"
echo ""
print_info "To start the application:"
echo "  1. Backend:  cd backend/api && python3 direct_bedrock_backend.py"
echo "  2. Frontend: cd frontend && npm start"
echo ""
print_info "Application URLs:"
echo "  • Frontend: http://localhost:3000"
echo "  • Backend:  http://localhost:3030"
echo ""
print_info "Features enabled:"
echo "  • ✅ AWS Bedrock Claude 3.5 Sonnet v2"
echo "  • ✅ Architecture diagram generation with AWS styling"
echo "  • ✅ Professional AWS color palette and icons"
echo "  • ✅ Direct Bedrock API integration"
echo ""
print_warning "Remember to enable Bedrock model access in AWS Console if not already done!"
echo ""
print_status "🚀 Ready for your hackathon project!"