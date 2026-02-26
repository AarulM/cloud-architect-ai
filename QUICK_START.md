# 🚀 Quick Start Guide

Get the AI Solution Architect up and running in 5 minutes!

## Prerequisites Check

Make sure you have:
- [ ] Node.js 18+ installed
- [ ] Python 3.9+ installed  
- [ ] AWS CLI configured
- [ ] Git installed

## 1-Minute Setup

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd <repo-name>

# Backend setup
cd Kunal-project/backend/api
pip install -r requirements.txt

# Frontend setup  
cd ../../frontend
npm install
```

### 2. Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your AWS credentials:
# AWS_ACCESS_KEY_ID=your_key
# AWS_SECRET_ACCESS_KEY=your_secret
# AWS_REGION=us-east-1
```

### 3. Start Development Servers
```bash
# Terminal 1 - Backend
cd Kunal-project/backend/api
python start.py

# Terminal 2 - Frontend  
cd Kunal-project/frontend
npm start
```

### 4. Open & Test
- Open http://localhost:3000
- Click "New Session"
- Ask: "Design a simple web application architecture on AWS"

## Windows Users

Use the provided batch files:
```bash
./check-setup.bat      # Verify prerequisites
./start-servers.bat    # Start both servers
```

## Troubleshooting

**Build fails?**
```bash
cd Kunal-project/frontend
rm -rf node_modules package-lock.json
npm install
```

**AWS errors?**
```bash
aws configure list
aws sts get-caller-identity
```

**Still stuck?** Check the full [README.md](README.md) for detailed instructions.

---
🎉 **You're ready to build with AI!**