# 🚀 Windows Setup Guide - AI Solutions Architect Project

## ✅ Prerequisites Installed
- ✅ Node.js v22.20.0 (Required: 18+)
- ✅ Python 3.12.10 (Required: 3.8+)
- ✅ AWS CLI (Just installed)
- ✅ Backend dependencies (Flask, Boto3, etc.)
- ✅ Frontend dependencies (React, AWS SDK, etc.)

## 🔧 Next Steps to Complete Setup

### Step 1: Configure AWS Credentials

⚠️ **IAM User Deleted?** No problem! You have 3 options:

**Option A: Use Root User (Quickest)**
```cmd
# Configure AWS CLI with your root credentials
aws configure --profile hackathon-root

# When prompted, enter:
# AWS Access Key ID: [Your root access key]
# AWS Secret Access Key: [Your root secret key]
# Default region name: us-east-1
# Default output format: json

# Set as default profile
set AWS_PROFILE=hackathon-root
```

**Option B: Create New IAM User**
```cmd
# First configure admin access
aws configure --profile admin

# Then run the recreation script
recreate-iam-user.bat
```

**Option C: Environment Variables (Temporary)**
```cmd
set AWS_ACCESS_KEY_ID=your_access_key_here
set AWS_SECRET_ACCESS_KEY=your_secret_key_here
set AWS_DEFAULT_REGION=us-east-1
```

### Step 2: Enable Amazon Bedrock Model Access

**CRITICAL:** You must enable Bedrock models in AWS Console:

1. Go to [AWS Console](https://console.aws.amazon.com) → **Amazon Bedrock** → **Model access**
2. Click **"Manage model access"**
3. Enable these models:
   - ✅ **Claude 3.5 Sonnet v2** (Anthropic)
   - ✅ **Claude 3 Sonnet** (Anthropic)
   - ✅ **Claude 3 Haiku** (Anthropic)
4. Click **"Save changes"**
5. Wait for status to show **"Access granted"**

### Step 3: Verify AWS Setup

```cmd
# Test AWS credentials (adjust profile name based on your choice)
aws sts get-caller-identity --profile hackathon-root
# OR if using environment variables:
aws sts get-caller-identity

# Should return something like:
# {
#     "UserId": "4657-3392-1455" (or your user ID),
#     "Account": "your-account-id",
#     "Arn": "arn:aws:iam::your-account-id:root" (or user)
# }
```

### Step 4: Start the Application

**Open TWO command prompt windows:**

**Terminal 1 - Backend Server:**
```cmd
cd Kunal-project\backend\api
python direct_bedrock_backend.py
```

**Terminal 2 - Frontend Server:**
```cmd
cd Kunal-project\frontend
npm start
```

### Step 5: Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3030
- **Health Check:** http://localhost:3030/health

## 🔍 Verification Steps

### Test Backend Health
```cmd
curl http://localhost:3030/health
```
Should return: `{"status": "healthy"}`

### Test Frontend
1. Open http://localhost:3000 in your browser
2. You should see the AI Solutions Architect interface
3. Try sending a test message to verify AWS Bedrock connectivity

## 🛠️ Project Structure

```
Kunal-project/
├── backend/
│   ├── api/
│   │   ├── direct_bedrock_backend.py  ← Main backend server
│   │   └── requirements.txt
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx                    ← Main React app
│   │   └── components/                ← UI components
│   ├── package.json
│   └── public/
└── hackathon-config.json              ← Project configuration
```

## 🚨 Troubleshooting

### Common Issues:

**1. "Access Denied" Error:**
- Verify AWS credentials: `aws sts get-caller-identity`
- Check Bedrock model access in AWS Console
- Ensure you're in us-east-1 region

**2. "Model Not Found" Error:**
- Verify you're in the correct region (us-east-1)
- Check model access is granted in Bedrock console
- Wait a few minutes after enabling models

**3. Backend Won't Start:**
- Check if port 3030 is available
- Verify Python dependencies are installed
- Check AWS credentials are configured

**4. Frontend Won't Start:**
- Check if port 3000 is available
- Run `npm install` again if needed
- Clear npm cache: `npm cache clean --force`

### Port Conflicts:
If ports are in use, you can change them:
- Backend: Edit `direct_bedrock_backend.py` (line with `app.run()`)
- Frontend: Set `PORT=3001` environment variable

## 🔐 Security Notes

- **Root User:** Only use for initial setup
- **IAM User:** Consider creating dedicated IAM user for production
- **Credentials:** Never commit AWS credentials to code
- **Environment:** Use environment variables for sensitive data

## 📋 What This Application Does

This is an **AI Solutions Architect** tool that:
- 🏗️ Generates AWS architecture diagrams
- 📊 Creates professional documentation
- 🤖 Uses Claude AI for intelligent responses
- 📈 Provides architecture recommendations
- 📄 Exports to PDF, Word, and HTML formats

## 🎯 Ready to Use!

Once both servers are running:
1. Open http://localhost:3000
2. Start chatting with the AI architect
3. Ask for architecture diagrams
4. Export your designs

**Example prompts to try:**
- "Design a serverless web application architecture"
- "Create a microservices architecture for e-commerce"
- "Show me a data pipeline for analytics"

---

**Need help?** Check the original documentation in `HACKATHON_SETUP_GUIDE.md` for more details.