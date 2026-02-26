@echo off
echo Installing AWS SAM CLI...

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed. Please install Python first.
    echo Visit: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check if pip is available
pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo pip is not available. Please install pip first.
    pause
    exit /b 1
)

echo Installing SAM CLI via pip...
pip install aws-sam-cli

if %errorlevel% neq 0 (
    echo SAM CLI installation failed!
    echo.
    echo Alternative installation methods:
    echo 1. Download MSI installer from: https://github.com/aws/aws-sam-cli/releases/latest
    echo 2. Use Chocolatey: choco install aws-sam-cli
    echo 3. Use Scoop: scoop install aws-sam-cli
    pause
    exit /b 1
)

echo.
echo SAM CLI installed successfully!
sam --version

echo.
echo Next steps:
echo 1. Make sure AWS CLI is configured: aws configure
echo 2. Run: deploy-backend.bat
echo.

pause