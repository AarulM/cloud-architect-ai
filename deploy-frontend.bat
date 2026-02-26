@echo off
echo Deploying Frontend to AWS Amplify...

REM Check if Amplify CLI is installed
amplify --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Amplify CLI is not installed. Please install it first.
    echo Run: npm install -g @aws-amplify/cli
    pause
    exit /b 1
)

echo Building frontend...
cd Kunal-project\frontend
call npm run build

if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

cd ..\..

echo.
echo ========================================
echo Frontend built successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Go to AWS Amplify Console: https://console.aws.amazon.com/amplify/
echo 2. Click "New app" - "Host web app"
echo 3. Connect your GitHub repository
echo 4. Use these settings:
echo    - Base directory: Kunal-project/frontend
echo    - Build command: npm run build
echo    - Build output directory: build
echo 5. Add environment variables in Amplify Console
echo.

pause