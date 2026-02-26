# AI Solutions Architect for Hackathon - External Root User Setup

## Overview
This guide sets up the AI Solutions Architect application for external root user `4657-3392-1455` instead of the Isengard account.

## Prerequisites
- AWS CLI installed and configured
- Node.js 18+ and Python 3.8+
- External AWS account access with root user `4657-3392-1455`

## Step-by-Step Setup for External Root User

### Step 1: Configure AWS CLI for External Account

```bash
# Configure AWS CLI with external root user credentials
aws configure --profile hackathon-root
# Enter the following when prompted:
# AWS Access Key ID: [Your root user access key]
# AWS Secret Access Key: [Your root user secret key]
# Default region name: us-east-1
# Default output format: json

# Set the profile as default for this session
export AWS_PROFILE=hackathon-root

# Verify configuration
aws sts get-caller-identity
```

Expected output should show:
```json
{
    "UserId": "4657-3392-1455",
    "Account": "[Your-Account-ID]",
    "Arn": "arn:aws:iam::[Your-Account-ID]:root"
}
```

### Step 2: Enable Amazon Bedrock Model Access

Since you're using a root user, you have full permissions, but you still need to enable model access:

1. **Go to AWS Console** → **Amazon Bedrock** → **Model access**
2. **Click "Manage model access"**
3. **Enable the following models:**
   - ✅ Claude 3.5 Sonnet v2 (Anthropic)
   - ✅ Claude 3 Haiku (Anthropic) 
   - ✅ Claude 3 Sonnet (Anthropic)

4. **Click "Save changes"**
5. **Wait for status to show "Access granted"**

### Step 3: Create IAM User for Application (Recommended)

While you can use root credentials, it's better practice to create a dedicated IAM user:

```bash
# Create IAM user for the application
aws iam create-user --user-name hackathon-bedrock-user --profile hackathon-root

# Create access key for the user
aws iam create-access-key --user-name hackathon-bedrock-user --profile hackathon-root
```

Save the returned Access Key ID and Secret Access Key.

### Step 4: Create and Attach IAM Policy

Create the required IAM policy:

```bash
# Create the policy
aws iam create-policy \
    --policy-name HackathonBedrockPolicy \
    --policy-document file://hackathon-iam-policy.json \
    --profile hackathon-root

# Attach policy to user
aws iam attach-user-policy \
    --user-name hackathon-bedrock-user \
    --policy-arn arn:aws:iam::[Your-Account-ID]:policy/HackathonBedrockPolicy \
    --profile hackathon-root
```

### Step 5: Configure Application Credentials

Option A: Use IAM User (Recommended)
```bash
# Configure AWS CLI with IAM user credentials
aws configure --profile hackathon-app
# Enter the IAM user access key and secret key
```

Option B: Use Root User (Not Recommended for Production)
```bash
# Use existing root user profile
export AWS_PROFILE=hackathon-root
```

### Step 6: Install and Run Application

```bash
# Install backend dependencies
cd backend
pip3 install -r requirements.txt

# Install frontend dependencies  
cd ../frontend
npm install

# Start backend (in one terminal)
cd ../backend/api
python3 direct_bedrock_backend.py

# Start frontend (in another terminal)
cd ../../frontend
npm start
```

### Step 7: Verify Setup

1. **Backend Health Check:**
   ```bash
   curl http://localhost:3030/health
   ```

2. **Frontend Access:**
   Open http://localhost:3000

3. **Test Bedrock Connection:**
   Send a test message through the UI to verify AWS Bedrock connectivity.

## Troubleshooting

### Common Issues:

1. **"Access Denied" Error:**
   - Verify AWS credentials: `aws sts get-caller-identity`
   - Check Bedrock model access in AWS Console
   - Ensure IAM policy is correctly attached

2. **"Model Not Found" Error:**
   - Verify you're in the correct region (us-east-1)
   - Check model access is granted in Bedrock console

3. **"Invalid Credentials" Error:**
   - Regenerate access keys
   - Verify AWS_PROFILE is set correctly

## Security Notes

- **Root User Access:** Only use root user for initial setup
- **IAM User:** Create dedicated IAM user for application
- **Least Privilege:** Use minimal required permissions
- **Key Rotation:** Regularly rotate access keys
- **Environment Variables:** Store credentials securely

## Architecture Differences from Isengard Setup

| Component | Isengard Setup | External Root Setup |
|-----------|----------------|-------------------|
| Authentication | Isengard SSO | AWS Access Keys |
| Permissions | Isengard Policies | Custom IAM Policies |
| Account Type | Corporate Account | Personal/External Account |
| Model Access | Pre-configured | Manual Configuration |
| Billing | Corporate Billing | Direct Billing |

## Next Steps

1. ✅ Complete AWS setup and model access
2. ✅ Install and configure application
3. ✅ Test architecture diagram generation
4. 🚀 Start building your hackathon project!

## Support

For issues specific to this setup:
- Check AWS CloudTrail for API call errors
- Review IAM policy permissions
- Verify Bedrock model access status
- Test with AWS CLI commands first