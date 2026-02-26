@echo off
echo 🔍 AI Solutions Architect - Setup Verification
echo.

echo 📋 Checking Prerequisites...
echo.

echo Node.js:
node --version 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js not installed
) else (
    echo ✅ Node.js installed
)

echo.
echo Python:
python --version 2>nul
if %errorlevel% neq 0 (
    echo ❌ Python not installed
) else (
    echo ✅ Python installed
)

echo.
echo AWS CLI:
aws --version 2>nul
if %errorlevel% neq 0 (
    echo ❌ AWS CLI not installed
) else (
    echo ✅ AWS CLI installed
)

echo.
echo 🔐 Checking AWS Configuration...
aws sts get-caller-identity 2>nul
if %errorlevel% neq 0 (
    echo ❌ AWS credentials not configured
    echo    Run: aws configure --profile hackathon-root
) else (
    echo ✅ AWS credentials configured
)

echo.
echo 📦 Checking Dependencies...

if exist "Kunal-project\backend\api\direct_bedrock_backend.py" (
    echo ✅ Backend files found
) else (
    echo ❌ Backend files missing
)

if exist "Kunal-project\frontend\package.json" (
    echo ✅ Frontend files found
) else (
    echo ❌ Frontend files missing
)

if exist "Kunal-project\frontend\node_modules" (
    echo ✅ Frontend dependencies installed
) else (
    echo ❌ Frontend dependencies missing - run: npm install
)

echo.
echo 🌐 Testing Server Connectivity...
echo.

echo Testing Backend Health (if running):
curl -s http://localhost:3030/health 2>nul
if %errorlevel% neq 0 (
    echo ❌ Backend not responding (may not be running)
) else (
    echo ✅ Backend responding
)

echo.
echo Testing Frontend (if running):
curl -s -I http://localhost:3000 2>nul | find "200" >nul
if %errorlevel% neq 0 (
    echo ❌ Frontend not responding (may not be running)
) else (
    echo ✅ Frontend responding
)

echo.
echo 📋 Setup Summary:
echo    1. If AWS credentials are not configured, run: aws configure
echo    2. Enable Bedrock models in AWS Console
echo    3. Run start-servers.bat to start the application
echo    4. Open http://localhost:3000 in your browser
echo.
pause