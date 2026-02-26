@echo off
echo Deploying Backend to AWS Lambda (Simple Method)...

REM Check if AWS CLI is configured
aws sts get-caller-identity >nul 2>&1
if %errorlevel% neq 0 (
    echo AWS CLI is not configured. Please run 'aws configure' first.
    pause
    exit /b 1
)

echo Creating deployment package...
cd Kunal-project\backend\api

REM Create a zip file with all Python files
if exist deployment.zip del deployment.zip
powershell -command "Compress-Archive -Path *.py,requirements.txt -DestinationPath deployment.zip -Force"

if not exist deployment.zip (
    echo Failed to create deployment package!
    pause
    exit /b 1
)

echo Creating Lambda function...
aws lambda create-function ^
    --function-name ai-solutions-architect ^
    --runtime python3.9 ^
    --role arn:aws:iam::%AWS_ACCOUNT_ID%:role/lambda-execution-role ^
    --handler lambda_handler.lambda_handler ^
    --zip-file fileb://deployment.zip ^
    --timeout 30 ^
    --memory-size 512 ^
    --environment Variables="{ENVIRONMENT=prod}" 2>nul

if %errorlevel% neq 0 (
    echo Function might already exist, updating...
    aws lambda update-function-code ^
        --function-name ai-solutions-architect ^
        --zip-file fileb://deployment.zip
)

echo Creating API Gateway...
REM This is a simplified version - for full deployment, use SAM CLI

cd ..\..\..

echo.
echo ========================================
echo Backend deployment initiated!
echo ========================================
echo.
echo For complete deployment, please:
echo 1. Install SAM CLI: run install-sam-cli.bat
echo 2. Run: deploy-backend.bat
echo.
echo Or use AWS Console to complete the setup:
echo 1. Go to Lambda Console
echo 2. Create API Gateway trigger
echo 3. Configure CORS settings
echo.

pause