@echo off
echo 🚀 Starting AI Solutions Architect Application
echo.

echo 📋 Checking prerequisites...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python not found. Please install Python first.
    pause
    exit /b 1
)

where aws >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ AWS CLI not found. Please install AWS CLI first.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed
echo.

echo 🔧 Starting Enhanced Backend Server (Port 3030)...
start "Enhanced Backend Server" cmd /k "cd /d %~dp0Kunal-project\backend\api && python enhanced_bedrock_backend.py"

echo ⏳ Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak >nul

echo 🌐 Starting Frontend Server (Port 3000)...
start "Frontend Server" cmd /k "cd /d %~dp0Kunal-project\frontend && npm start"

echo.
echo ✅ Both servers are starting!
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend:  http://localhost:3030
echo 💚 Health:   http://localhost:3030/health
echo.
echo 📝 Note: Two command windows will open for the servers.
echo    Close those windows to stop the servers.
echo.
pause