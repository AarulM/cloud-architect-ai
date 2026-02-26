# 🚀 Free Deployment Guide - AI Solutions Architect

## Overview
Deploy your React frontend to **Vercel** (free) and Python backend to **Railway** (free tier).

## 📋 Prerequisites
- GitHub account
- Vercel account (free)
- Railway account (free)
- Your AWS credentials

## 🔧 Step 1: Prepare Your Code for Deployment

### Backend Preparation

1. **Create a startup script** for Railway:

Create `Kunal-project/backend/api/start.py`:
```python
#!/usr/bin/env python3
import os
from direct_bedrock_backend import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3030))
    app.run(host="0.0.0.0", port=port, debug=False)
```

2. **Create Procfile** for Railway:

Create `Kunal-project/backend/Procfile`:
```
web: python api/start.py
```

3. **Update requirements.txt** to include gunicorn:

Add to `Kunal-project/backend/requirements.txt`:
```
gunicorn>=21.2.0
```

### Frontend Preparation

1. **Update API endpoint** in frontend config:

Edit `Kunal-project/frontend/src/utils/config.js`:
```javascript
const config = {
  // Use environment variable for production, localhost for development
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3030',
  // ... other config
};

export default config;
```

2. **Update backend client** to use config:

Edit `Kunal-project/frontend/src/utils/backendClient.js` to use the config URL.

## 🚀 Step 2: Deploy Backend to Railway

### 2.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Verify your account

### 2.2 Deploy Backend
1. **Create new project** in Railway
2. **Connect GitHub repository** (you'll need to push your code to GitHub first)
3. **Select the backend folder** as root directory: `Kunal-project/backend`
4. **Add environment variables:**
   - `AWS_ACCESS_KEY_ID`: Your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
   - `AWS_DEFAULT_REGION`: us-east-1
   - `PORT`: 3030

5. **Deploy** - Railway will automatically detect Python and install dependencies

### 2.3 Get Backend URL
- Railway will give you a URL like: `https://your-app-name.railway.app`
- Test it: `https://your-app-name.railway.app/health`

## 🌐 Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Import your repository

### 3.2 Configure Frontend
1. **Set build settings:**
   - Framework: Create React App
   - Root Directory: `Kunal-project/frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`

2. **Add environment variables:**
   - `REACT_APP_API_URL`: Your Railway backend URL (e.g., `https://your-app-name.railway.app`)

3. **Deploy** - Vercel will build and deploy automatically

## 🔧 Step 4: Enable CORS for Production

Update your backend CORS settings in `direct_bedrock_backend.py`:

```python
from flask_cors import CORS

app = Flask(__name__)
# Allow your Vercel domain
CORS(app, origins=[
    "http://localhost:3000",  # Development
    "http://localhost:3001",  # Development alt port
    "https://your-vercel-app.vercel.app",  # Production
    "https://your-custom-domain.com"  # If you have a custom domain
])
```

## 💰 Cost Breakdown (FREE!)

### Vercel (Frontend)
- ✅ **Free tier**: 100GB bandwidth/month
- ✅ **Unlimited** static sites
- ✅ **Custom domains** included
- ✅ **Global CDN**

### Railway (Backend)
- ✅ **Free tier**: $5 credit/month
- ✅ **Usage-based**: ~$0.10/hour when active
- ✅ **Sleeps when idle** (saves money)
- ✅ **Environment variables**

### AWS Bedrock (AI)
- 💰 **Pay per use**: ~$0.003 per 1K input tokens
- 💰 **Typical cost**: $1-5/month for moderate use
- 💰 **Free tier**: Some models have free quotas

**Total monthly cost: $0-10** (mostly AWS usage)

## 🔒 Security Best Practices

### Environment Variables
- ✅ Never commit AWS keys to GitHub
- ✅ Use Railway/Vercel environment variables
- ✅ Rotate keys regularly

### CORS Configuration
- ✅ Only allow your frontend domain
- ✅ Don't use wildcard (*) in production

### AWS IAM
- ✅ Use minimal permissions (only Bedrock access)
- ✅ Create dedicated IAM user for production

## 🚨 Alternative Free Options

### If Railway free tier runs out:

1. **Render.com** (Free tier with sleep)
2. **Fly.io** (Free allowances)
3. **Heroku alternatives**: Koyeb, Cyclic
4. **Self-hosted**: DigitalOcean ($4/month), Linode

### If you want 100% free:

1. **GitHub Pages** (frontend only)
2. **Netlify Functions** (for simple backend)
3. **Vercel Functions** (serverless backend)

## 📝 Quick Deployment Checklist

- [ ] Push code to GitHub
- [ ] Create Railway account
- [ ] Deploy backend to Railway
- [ ] Get backend URL
- [ ] Create Vercel account  
- [ ] Deploy frontend to Vercel
- [ ] Set environment variables
- [ ] Test the live application
- [ ] Enable Bedrock models in AWS Console
- [ ] Update CORS settings

## 🎯 Expected Timeline
- **Setup**: 30 minutes
- **First deployment**: 1 hour
- **Testing & fixes**: 30 minutes
- **Total**: ~2 hours

## 🆘 Troubleshooting

### Common Issues:
1. **CORS errors**: Update backend CORS settings
2. **API not found**: Check environment variables
3. **Build failures**: Check Node.js version compatibility
4. **AWS errors**: Verify credentials and Bedrock access

### Debug Steps:
1. Check Railway logs for backend errors
2. Check Vercel function logs
3. Test API endpoints directly
4. Verify environment variables

---

**Ready to deploy?** Start with pushing your code to GitHub, then follow the Railway and Vercel steps above!