@echo off
echo 🚀 AI Solutions Architect - Deployment Setup
echo.

echo 📋 This script will prepare your project for deployment
echo.

echo 🔧 Step 1: Adding production dependencies...
cd Kunal-project\backend
pip install gunicorn
echo ✅ Backend dependencies updated

echo.
echo 📝 Step 2: Files created for deployment:
echo    ✅ backend/api/start.py (Railway startup script)
echo    ✅ backend/Procfile (Railway process file)
echo    ✅ Updated requirements.txt with gunicorn
echo.

echo 🌐 Step 3: Next steps for deployment:
echo.
echo    1. Push your code to GitHub:
echo       git init
echo       git add .
echo       git commit -m "Initial commit"
echo       git branch -M main
echo       git remote add origin https://github.com/yourusername/your-repo.git
echo       git push -u origin main
echo.
echo    2. Deploy Backend (Railway):
echo       - Go to railway.app
echo       - Sign up with GitHub
echo       - Create new project from GitHub repo
echo       - Set root directory: Kunal-project/backend
echo       - Add environment variables:
echo         * AWS_ACCESS_KEY_ID
echo         * AWS_SECRET_ACCESS_KEY  
echo         * AWS_DEFAULT_REGION=us-east-1
echo.
echo    3. Deploy Frontend (Vercel):
echo       - Go to vercel.com
echo       - Import GitHub repository
echo       - Set root directory: Kunal-project/frontend
echo       - Add environment variable:
echo         * REACT_APP_BACKEND_URL=https://your-railway-app.railway.app
echo.
echo    4. Test your live application!
echo.

echo 💰 Estimated monthly cost: $0-10 (mostly AWS Bedrock usage)
echo.
echo 📚 For detailed instructions, see: DEPLOYMENT_GUIDE.md
echo.
pause