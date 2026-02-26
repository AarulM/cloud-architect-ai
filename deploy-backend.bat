@echo off
echo Deploying Backend to AWS Lambda...

REM Check if SAM CLI is installed
sam --version >nul 2>&1
if %errorlevel% neq 0 (
    echo SAM CLI is not installed. Please install it first.
    echo Visit: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html
    pause
    exit /b 1
)

REM Check if AWS CLI is configured
aws sts get-caller-identity >nul 2>&1
if %errorlevel% neq 0 (
    echo AWS CLI is not configured. Please run 'aws configure' first.
    pause
    exit /b 1
)

echo Building SAM application...
sam build --template-file backend-template.yaml

if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo Deploying to AWS...
sam deploy ^
    --template-file backend-template.yaml ^
    --stack-name ai-solutions-architect ^
    --capabilities CAPABILITY_IAM ^
    --region us-east-1 ^
    --no-confirm-changeset ^
    --no-fail-on-empty-changeset ^
    --parameter-overrides Environment=prod

if %errorlevel% neq 0 (
    echo Deployment failed!
    pause
    exit /b 1
)

echo Getting API Gateway URL...
for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name ai-solutions-architect --query "Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue" --output text') do set API_URL=%%i

echo.
echo ========================================
echo Backend deployed successfully!
echo API Gateway URL: %API_URL%
echo ========================================
echo.
echo Update your Amplify environment variables:
echo REACT_APP_BACKEND_URL = %API_URL%
echo.

pause