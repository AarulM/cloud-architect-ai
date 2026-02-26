# Manual Backend Deployment Guide

## 🚀 Deploy Backend via AWS Console (Easiest Method)

### **Step 1: Create Lambda Function**

1. **Go to AWS Lambda Console**: https://console.aws.amazon.com/lambda/
2. **Click "Create function"**
3. **Configure function**:
   ```
   Function name: ai-solutions-architect
   Runtime: Python 3.9
   Architecture: x86_64
   ```
4. **Click "Create function"**

### **Step 2: Upload Code**

1. **In the Lambda function page, scroll to "Code source"**
2. **Click "Upload from" → ".zip file"**
3. **Create a zip file with these files**:
   - `enhanced_bedrock_backend.py`
   - `lambda_handler.py`
   - `aws_documentation_mcp.py`
   - `requirements.txt`
   - All other `.py` files from `Kunal-project/backend/api/`

4. **Upload the zip file**
5. **Click "Save"**

### **Step 3: Configure Lambda Settings**

1. **Go to "Configuration" tab**
2. **Click "General configuration" → "Edit"**:
   ```
   Timeout: 30 seconds
   Memory: 512 MB
   ```
3. **Click "Environment variables" → "Edit"**:
   ```
   ENVIRONMENT = prod
   ```
4. **Click "Save"**

### **Step 4: Add IAM Permissions**

1. **Go to "Configuration" → "Permissions"**
2. **Click on the execution role name**
3. **In IAM console, click "Add permissions" → "Attach policies"**
4. **Search and attach**:
   - `AmazonBedrockFullAccess` (or create custom policy)
   - `CloudWatchLogsFullAccess`

### **Step 5: Create API Gateway**

1. **Go to API Gateway Console**: https://console.aws.amazon.com/apigateway/
2. **Click "Create API" → "REST API" → "Build"**
3. **Configure**:
   ```
   API name: ai-solutions-architect-api
   Description: AI Solutions Architect Backend API
   ```
4. **Click "Create API"**

### **Step 6: Configure API Gateway**

1. **Click "Actions" → "Create Resource"**:
   ```
   Resource Name: chat
   Resource Path: /chat
   ✓ Enable API Gateway CORS
   ```

2. **Select `/chat` resource → "Actions" → "Create Method" → "POST"**
3. **Configure POST method**:
   ```
   Integration type: Lambda Function
   ✓ Use Lambda Proxy integration
   Lambda Function: ai-solutions-architect
   ```

4. **Click "Actions" → "Enable CORS"**:
   ```
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Headers: Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token
   Access-Control-Allow-Methods: GET,POST,OPTIONS
   ```

5. **Click "Actions" → "Deploy API"**:
   ```
   Deployment stage: prod
   ```

### **Step 7: Get API URL**

1. **After deployment, note the "Invoke URL"**
2. **It will look like**: `https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod`
3. **Your backend URL is**: `https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod`

### **Step 8: Update Frontend Environment Variables**

1. **Go to AWS Amplify Console**
2. **Select your app → "App settings" → "Environment variables"**
3. **Add/Update**:
   ```
   REACT_APP_BACKEND_URL = https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod
   ```
4. **Redeploy your frontend**

## ✅ **Verification**

Test your backend:
```bash
curl -X POST https://your-api-url/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "phase": "requirements"}'
```

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **CORS Errors**: Make sure CORS is enabled on API Gateway
2. **Timeout Errors**: Increase Lambda timeout to 30 seconds
3. **Permission Errors**: Ensure Lambda has Bedrock access
4. **Import Errors**: Make sure all Python files are in the zip

### **Lambda Logs:**
- Go to CloudWatch → Log groups → `/aws/lambda/ai-solutions-architect`
- Check for error messages

## 📋 **Quick Checklist:**

- [ ] Lambda function created with Python 3.9
- [ ] Code uploaded (all .py files + requirements.txt)
- [ ] Timeout set to 30 seconds, Memory to 512 MB
- [ ] IAM role has Bedrock permissions
- [ ] API Gateway created with CORS enabled
- [ ] API deployed to 'prod' stage
- [ ] Frontend environment variable updated
- [ ] Frontend redeployed

Your backend should now be live and accessible!