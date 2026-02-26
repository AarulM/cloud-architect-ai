#!/bin/bash

# Test Script for AI Solutions Architect Hackathon Setup
# Verifies all components are working correctly

set -e

echo "🧪 Testing AI Solutions Architect Hackathon Setup"
echo "👤 Target User: 4657-3392-1455"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

test_pass() {
    echo -e "${GREEN}✅ $1${NC}"
}

test_fail() {
    echo -e "${RED}❌ $1${NC}"
}

test_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

test_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

TESTS_PASSED=0
TESTS_FAILED=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -n "Testing $test_name... "
    
    if eval "$test_command" &>/dev/null; then
        test_pass "$test_name"
        ((TESTS_PASSED++))
    else
        test_fail "$test_name"
        ((TESTS_FAILED++))
    fi
}

echo "🔍 Running System Tests..."
echo ""

# Test 1: AWS CLI
run_test "AWS CLI Installation" "command -v aws"

# Test 2: Node.js
run_test "Node.js Installation" "command -v node"

# Test 3: Python
run_test "Python 3 Installation" "command -v python3"

# Test 4: AWS Credentials
run_test "AWS Credentials" "aws sts get-caller-identity"

# Test 5: AWS Region
REGION=$(aws configure get region 2>/dev/null || echo "")
if [[ "$REGION" == "us-east-1" ]]; then
    test_pass "AWS Region (us-east-1)"
    ((TESTS_PASSED++))
else
    test_warn "AWS Region ($REGION) - should be us-east-1"
    ((TESTS_FAILED++))
fi

# Test 6: Bedrock Access
run_test "Amazon Bedrock Access" "aws bedrock list-foundation-models --region us-east-1"

# Test 7: Required Files
echo ""
echo "🔍 Checking Required Files..."

required_files=(
    "hackathon-iam-policy.json"
    "hackathon-config.json"
    "HACKATHON_SETUP_GUIDE.md"
    "README-HACKATHON.md"
    "scripts/setup-aws-hackathon.sh"
    "scripts/deploy-hackathon.sh"
    "backend/api/direct_bedrock_backend.py"
    "frontend/package.json"
    "backend/requirements.txt"
)

for file in "${required_files[@]}"; do
    if [[ -f "$file" ]]; then
        test_pass "File exists: $file"
        ((TESTS_PASSED++))
    else
        test_fail "File missing: $file"
        ((TESTS_FAILED++))
    fi
done

# Test 8: Backend Dependencies
echo ""
echo "🔍 Checking Backend Dependencies..."
if [[ -f "backend/requirements.txt" ]]; then
    while IFS= read -r package; do
        package_name=$(echo "$package" | cut -d'=' -f1 | cut -d'>' -f1 | cut -d'<' -f1)
        if python3 -c "import $package_name" 2>/dev/null; then
            test_pass "Python package: $package_name"
            ((TESTS_PASSED++))
        else
            test_warn "Python package missing: $package_name"
            ((TESTS_FAILED++))
        fi
    done < backend/requirements.txt
fi

# Test 9: Frontend Dependencies
echo ""
echo "🔍 Checking Frontend Dependencies..."
if [[ -f "frontend/package.json" ]] && [[ -d "frontend/node_modules" ]]; then
    test_pass "Frontend dependencies installed"
    ((TESTS_PASSED++))
else
    test_warn "Frontend dependencies not installed (run: cd frontend && npm install)"
    ((TESTS_FAILED++))
fi

# Test 10: Application Connectivity
echo ""
echo "🔍 Testing Application Connectivity..."

# Check if backend is running
if curl -s http://localhost:3030/health &>/dev/null; then
    test_pass "Backend server (http://localhost:3030)"
    ((TESTS_PASSED++))
    
    # Test Bedrock connectivity through backend
    HEALTH_RESPONSE=$(curl -s http://localhost:3030/health)
    if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
        test_pass "Backend health check"
        ((TESTS_PASSED++))
    else
        test_fail "Backend health check"
        ((TESTS_FAILED++))
    fi
else
    test_warn "Backend server not running (start with: cd backend/api && python3 direct_bedrock_backend.py)"
    ((TESTS_FAILED++))
fi

# Check if frontend is running
if curl -s http://localhost:3000 &>/dev/null; then
    test_pass "Frontend server (http://localhost:3000)"
    ((TESTS_PASSED++))
else
    test_warn "Frontend server not running (start with: cd frontend && npm start)"
    ((TESTS_FAILED++))
fi

# Test 11: AWS User Identity
echo ""
echo "🔍 Verifying AWS User Identity..."
CURRENT_USER=$(aws sts get-caller-identity --query 'UserId' --output text 2>/dev/null || echo "unknown")
ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text 2>/dev/null || echo "unknown")

test_info "Current AWS User: $CURRENT_USER"
test_info "Account ID: $ACCOUNT_ID"

if [[ "$CURRENT_USER" == "4657-3392-1455" ]]; then
    test_pass "Correct root user: 4657-3392-1455"
    ((TESTS_PASSED++))
else
    test_warn "Different user detected: $CURRENT_USER (expected: 4657-3392-1455)"
    ((TESTS_FAILED++))
fi

# Test 12: Bedrock Model Access
echo ""
echo "🔍 Testing Specific Bedrock Models..."

models=(
    "anthropic.claude-3-5-sonnet-20241022-v2:0"
    "anthropic.claude-3-sonnet-20240229-v1:0"
    "anthropic.claude-3-haiku-20240307-v1:0"
)

for model in "${models[@]}"; do
    if aws bedrock list-foundation-models --region us-east-1 --query "modelSummaries[?modelId=='$model'].modelId" --output text | grep -q "$model"; then
        test_pass "Model available: $model"
        ((TESTS_PASSED++))
    else
        test_warn "Model not found: $model"
        ((TESTS_FAILED++))
    fi
done

# Summary
echo ""
echo "📊 Test Summary"
echo "==============="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed/Warnings: ${YELLOW}$TESTS_FAILED${NC}"
echo ""

if [[ $TESTS_FAILED -eq 0 ]]; then
    echo -e "${GREEN}🎉 All tests passed! Your hackathon setup is ready!${NC}"
    echo ""
    echo "🚀 To start the application:"
    echo "  1. Backend:  cd backend/api && python3 direct_bedrock_backend.py"
    echo "  2. Frontend: cd frontend && npm start"
    echo ""
    echo "📱 Application URLs:"
    echo "  • Frontend: http://localhost:3000"
    echo "  • Backend:  http://localhost:3030"
else
    echo -e "${YELLOW}⚠️  Some tests failed or have warnings. Please review the output above.${NC}"
    echo ""
    echo "🔧 Common fixes:"
    echo "  • Install missing dependencies: ./scripts/deploy-hackathon.sh"
    echo "  • Configure AWS: ./scripts/setup-aws-hackathon.sh"
    echo "  • Enable Bedrock models in AWS Console"
    echo "  • Start applications if not running"
fi

echo ""
echo "📚 For detailed setup instructions, see:"
echo "  • HACKATHON_SETUP_GUIDE.md"
echo "  • README-HACKATHON.md"