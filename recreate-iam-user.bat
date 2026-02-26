@echo off
echo 🔧 Recreating IAM User for AI Solutions Architect
echo.

echo ⚠️  Make sure you have AWS CLI configured with root/admin credentials first!
echo    Run: aws configure --profile admin
echo.
pause

echo 📝 Creating IAM user: hackathon-bedrock-user
aws iam create-user --user-name hackathon-bedrock-user --profile admin
if %errorlevel% neq 0 (
    echo ❌ Failed to create user. Check your admin credentials.
    pause
    exit /b 1
)

echo 📋 Creating IAM policy: HackathonBedrockPolicy
aws iam create-policy --policy-name HackathonBedrockPolicy --policy-document file://Kunal-project/hackathon-iam-policy.json --profile admin
if %errorlevel% neq 0 (
    echo ⚠️  Policy might already exist, continuing...
)

echo 🔗 Attaching policy to user
for /f "tokens=*" %%i in ('aws sts get-caller-identity --query Account --output text --profile admin') do set ACCOUNT_ID=%%i
aws iam attach-user-policy --user-name hackathon-bedrock-user --policy-arn arn:aws:iam::%ACCOUNT_ID%:policy/HackathonBedrockPolicy --profile admin

echo 🔑 Creating access key for user
aws iam create-access-key --user-name hackathon-bedrock-user --profile admin > temp-credentials.json

echo.
echo ✅ IAM User Created Successfully!
echo.
echo 📋 Your new credentials are in temp-credentials.json
echo    Please save them securely and delete the file.
echo.
type temp-credentials.json
echo.
echo 🔧 Next steps:
echo    1. Copy the AccessKeyId and SecretAccessKey from above
echo    2. Run: aws configure --profile hackathon-app
echo    3. Enter the credentials when prompted
echo    4. Delete temp-credentials.json for security
echo.
pause