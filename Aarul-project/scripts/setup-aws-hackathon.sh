#!/bin/bash

# AWS Setup Script for Hackathon - External Root User 4657-3392-1455

set -e

echo "🔧 AWS Setup for AI Solutions Architect Hackathon"
echo "👤 Target Root User: 4657-3392-1455"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}📋 Step $1: $2${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Configure AWS CLI
print_step "1" "Configure AWS CLI for External Root User"
echo ""
echo "You'll need to configure AWS CLI with your external root user credentials."
echo "Root User ID: 4657-3392-1455"
echo ""

read -p "Do you want to configure AWS CLI now? (y/n): " configure_aws

if [[ $configure_aws == "y" || $configure_aws == "Y" ]]; then
    echo ""
    echo "Configuring AWS CLI profile 'hackathon-root'..."
    aws configure --profile hackathon-root
    
    # Set the profile as default
    export AWS_PROFILE=hackathon-root
    echo "export AWS_PROFILE=hackathon-root" >> ~/.bashrc
    echo "export AWS_PROFILE=hackathon-root" >> ~/.zshrc
    
    print_success "AWS CLI configured with hackathon-root profile"
else
    print_warning "Skipping AWS CLI configuration. Make sure you have valid credentials."
fi

# Step 2: Verify AWS Identity
print_step "2" "Verify AWS Identity"
echo ""

if aws sts get-caller-identity --profile hackathon-root 2>/dev/null; then
    USER_ID=$(aws sts get-caller-identity --query 'UserId' --output text --profile hackathon-root)
    ACCOUNT=$(aws sts get-caller-identity --query 'Account' --output text --profile hackathon-root)
    
    echo ""
    if [[ "$USER_ID" == "4657-3392-1455" ]]; then
        print_success "✅ Correct root user verified: $USER_ID"
    else
        print_warning "⚠️  Current user ($USER_ID) differs from expected (4657-3392-1455)"
        print_warning "Continuing with current user..."
    fi
    
    echo "Account ID: $ACCOUNT"
else
    print_error "Failed to verify AWS identity. Please check your credentials."
    exit 1
fi

# Step 3: Check Bedrock Access
print_step "3" "Check Amazon Bedrock Access"
echo ""

if aws bedrock list-foundation-models --region us-east-1 --profile hackathon-root &>/dev/null; then
    print_success "Amazon Bedrock access confirmed"
    
    # Check specific models
    echo ""
    echo "Checking required models..."
    
    CLAUDE_35_SONNET=$(aws bedrock list-foundation-models --region us-east-1 --profile hackathon-root --query 'modelSummaries[?contains(modelId, `claude-3-5-sonnet`)].modelId' --output text)
    
    if [[ -n "$CLAUDE_35_SONNET" ]]; then
        print_success "Claude 3.5 Sonnet available: $CLAUDE_35_SONNET"
    else
        print_warning "Claude 3.5 Sonnet not found. You may need to enable model access."
    fi
    
else
    print_error "Cannot access Amazon Bedrock. Please:"
    echo "  1. Go to AWS Console → Amazon Bedrock → Model access"
    echo "  2. Click 'Manage model access'"
    echo "  3. Enable Claude 3.5 Sonnet v2 and other Anthropic models"
    echo "  4. Save changes and wait for 'Access granted' status"
    echo ""
    read -p "Press Enter after enabling Bedrock model access..."
fi

# Step 4: Create IAM User (Optional)
print_step "4" "Create Dedicated IAM User (Recommended)"
echo ""

read -p "Do you want to create a dedicated IAM user for the application? (y/n): " create_user

if [[ $create_user == "y" || $create_user == "Y" ]]; then
    echo ""
    echo "Creating IAM user 'hackathon-bedrock-user'..."
    
    # Create user
    if aws iam create-user --user-name hackathon-bedrock-user --profile hackathon-root 2>/dev/null; then
        print_success "IAM user created: hackathon-bedrock-user"
    else
        print_warning "User may already exist or creation failed"
    fi
    
    # Create policy
    if aws iam create-policy --policy-name HackathonBedrockPolicy --policy-document file://hackathon-iam-policy.json --profile hackathon-root 2>/dev/null; then
        print_success "IAM policy created: HackathonBedrockPolicy"
    else
        print_warning "Policy may already exist or creation failed"
    fi
    
    # Attach policy
    ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text --profile hackathon-root)
    if aws iam attach-user-policy --user-name hackathon-bedrock-user --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/HackathonBedrockPolicy" --profile hackathon-root 2>/dev/null; then
        print_success "Policy attached to user"
    else
        print_warning "Policy attachment may have failed"
    fi
    
    # Create access key
    echo ""
    echo "Creating access key for hackathon-bedrock-user..."
    ACCESS_KEY_OUTPUT=$(aws iam create-access-key --user-name hackathon-bedrock-user --profile hackathon-root 2>/dev/null)
    
    if [[ $? -eq 0 ]]; then
        echo ""
        print_success "Access key created! Save these credentials:"
        echo "$ACCESS_KEY_OUTPUT" | jq -r '"Access Key ID: " + .AccessKey.AccessKeyId'
        echo "$ACCESS_KEY_OUTPUT" | jq -r '"Secret Access Key: " + .AccessKey.SecretAccessKey'
        echo ""
        print_warning "⚠️  Save these credentials securely! They won't be shown again."
        echo ""
        
        read -p "Configure AWS CLI with the new IAM user credentials? (y/n): " configure_iam
        if [[ $configure_iam == "y" || $configure_iam == "Y" ]]; then
            echo ""
            echo "Configuring AWS CLI profile 'hackathon-app'..."
            aws configure --profile hackathon-app
            echo ""
            print_success "IAM user profile configured as 'hackathon-app'"
            echo "To use this profile: export AWS_PROFILE=hackathon-app"
        fi
    else
        print_error "Failed to create access key"
    fi
else
    print_warning "Skipping IAM user creation. Using root user credentials."
fi

# Step 5: Final Verification
print_step "5" "Final Verification"
echo ""

echo "Testing Bedrock connectivity..."
if aws bedrock invoke-model --region us-east-1 --model-id "anthropic.claude-3-haiku-20240307-v1:0" --body '{"anthropic_version":"bedrock-2023-05-31","max_tokens":10,"messages":[{"role":"user","content":"Hi"}]}' --cli-binary-format raw-in-base64-out /tmp/bedrock-test.json --profile hackathon-root &>/dev/null; then
    print_success "✅ Bedrock connectivity test passed"
    rm -f /tmp/bedrock-test.json
else
    print_error "❌ Bedrock connectivity test failed"
    echo "Please check model access in AWS Console"
fi

echo ""
print_success "🎉 AWS setup completed!"
echo ""
echo "Next steps:"
echo "  1. Run: ./scripts/deploy-hackathon.sh"
echo "  2. Start backend: cd backend/api && python3 direct_bedrock_backend.py"
echo "  3. Start frontend: cd frontend && npm start"
echo ""
echo "Application will be available at:"
echo "  • Frontend: http://localhost:3000"
echo "  • Backend:  http://localhost:3030"