#!/usr/bin/env python3
"""
Production startup script for Railway deployment
"""
import os
from direct_bedrock_backend import app

if __name__ == "__main__":
    # Railway provides PORT environment variable
    port = int(os.environ.get("PORT", 3030))
    
    # Bind to all interfaces for Railway
    app.run(
        host="0.0.0.0", 
        port=port, 
        debug=False  # Disable debug in production
    )