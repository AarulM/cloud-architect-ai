@echo off
echo Creating Lambda deployment package with dependencies...

REM Create temporary directory
if exist lambda-package rmdir /s /q lambda-package
mkdir lambda-package

echo Installing dependencies...
cd lambda-package

REM Install dependencies to current directory
pip install -r ..\Kunal-project\backend\api\requirements.txt -t .

if %errorlevel% neq 0 (
    echo Failed to install dependencies!
    pause
    exit /b 1
)

echo Copying Python files...
copy ..\Kunal-project\backend\api\*.py .

echo Creating deployment package...
powershell -command "Compress-Archive -Path * -DestinationPath ..\lambda-deployment-with-deps.zip -Force"

cd ..

if exist lambda-deployment-with-deps.zip (
    echo.
    echo ========================================
    echo Deployment package created successfully!
    echo File: lambda-deployment-with-deps.zip
    echo Size: 
    dir lambda-deployment-with-deps.zip
    echo ========================================
    echo.
    echo Next steps:
    echo 1. Upload lambda-deployment-with-deps.zip to Lambda
    echo 2. Set Handler to: lambda_handler.lambda_handler
    echo 3. Test the function
    echo.
) else (
    echo Failed to create deployment package!
)

REM Cleanup
rmdir /s /q lambda-package

pause