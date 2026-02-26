# AWS Amplify Frontend Deployment Guide

## 🚀 Quick Setup Instructions

### 1. **AWS Amplify Console Setup**

1. **Go to AWS Amplify Console**: https://console.aws.amazon.com/amplify/
2. **Click "New app" → "Host web app"**
3. **Connect your GitHub repository**
4. **Select your repository and branch**

### 2. **Build Settings Configuration**

Use these **exact settings** in Amplify:

```yaml
Framework: React
Base directory: Kunal-project/frontend
Frontend build command: npm run build
Build output directory: build
```

### 3. **Environment Variables**

Add these in Amplify Console → App Settings → Environment Variables:

```
REACT_APP_BACKEND_URL=https://your-backend-api-url.com
GENERATE_SOURCEMAP=false
CI=false
```

### 4. **Advanced Build Settings**

If you need custom build settings, the `amplify.yml` file is already configured:

```yaml
version: 1
applications:
  - frontend:
      phases:
        preBuild:
          commands:
            - cd Kunal-project/frontend
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: Kunal-project/frontend/build
        files:
          - '**/*'
      cache:
        paths:
          - Kunal-project/frontend/node_modules/**/*
    appRoot: Kunal-project/frontend
```

## 🔧 **Step-by-Step Deployment**

### **Step 1: Prepare Repository**
- ✅ `amplify.yml` created
- ✅ `.env.production` created
- ✅ Build scripts verified
- ✅ Dependencies up to date

### **Step 2: AWS Amplify Console**
1. **Login to AWS Console**
2. **Navigate to AWS Amplify**
3. **Click "New app" → "Host web app"**
4. **Choose GitHub as source**

### **Step 3: Repository Configuration**
1. **Select your repository**
2. **Choose main/master branch**
3. **Set base directory**: `Kunal-project/frontend`
4. **Verify build settings**:
   - Build command: `npm run build`
   - Output directory: `build`

### **Step 4: Environment Variables**
1. **Go to App Settings → Environment variables**
2. **Add**:
   ```
   REACT_APP_BACKEND_URL = https://your-backend-url.com
   GENERATE_SOURCEMAP = false
   CI = false
   ```

### **Step 5: Deploy**
1. **Click "Save and deploy"**
2. **Wait for build to complete** (5-10 minutes)
3. **Access your app** at the provided Amplify URL

## 🔗 **Backend Integration**

### **Important Notes:**
- **Frontend deploys to Amplify** (static hosting)
- **Backend needs separate deployment** (Lambda, App Runner, or EC2)
- **Update REACT_APP_BACKEND_URL** with your actual backend URL
- **Configure CORS** in backend to allow Amplify domain

### **Backend Deployment Options:**
1. **AWS Lambda + API Gateway** (Recommended)
2. **AWS App Runner** (Easy container deployment)
3. **EC2 Instance** (Full control)
4. **Other cloud providers** (Heroku, Railway, etc.)

## 🚨 **Common Issues & Solutions**

### **Build Fails:**
- Check Node.js version (use Node 16 or 18)
- Verify all dependencies are in package.json
- Check for syntax errors in code

### **App Loads but Backend Errors:**
- Verify REACT_APP_BACKEND_URL is correct
- Check backend CORS configuration
- Ensure backend is deployed and accessible

### **Environment Variables Not Working:**
- Environment variables must start with `REACT_APP_`
- Restart build after adding environment variables
- Check spelling and case sensitivity

## ✅ **Verification Checklist**

- [ ] Repository connected to Amplify
- [ ] Build settings configured correctly
- [ ] Environment variables added
- [ ] Build completes successfully
- [ ] App loads at Amplify URL
- [ ] Backend URL configured (when ready)
- [ ] CORS configured in backend

## 🎯 **Next Steps**

1. **Deploy frontend to Amplify** ✅
2. **Deploy backend separately** (Lambda recommended)
3. **Update environment variables** with real backend URL
4. **Test full application** functionality
5. **Configure custom domain** (optional)

Your frontend is now ready for AWS Amplify deployment!