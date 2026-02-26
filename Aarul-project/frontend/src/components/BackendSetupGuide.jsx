import React from 'react';

/**
 * Backend Setup Guide Component
 * Provides instructions for setting up the backend server
 */
const BackendSetupGuide = ({ backendUrl }) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-4">
      <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
        <i className="fas fa-info-circle mr-2"></i>
        Backend Setup Instructions
      </h3>
      
      <div className="space-y-4 text-sm text-blue-700">
        <div>
          <p className="font-medium mb-2">To start your backend server:</p>
          <div className="bg-blue-100 rounded-md p-3 font-mono text-xs">
            <p># Navigate to the backend directory</p>
            <p>cd backend</p>
            <p></p>
            <p># Install dependencies (if not already done)</p>
            <p>pip install -r requirements.txt</p>
            <p></p>
            <p># Start the backend API server</p>
            <p>python3 backend_api.py</p>
          </div>
        </div>

        <div>
          <p className="font-medium mb-2">Alternative: Use the deployment script</p>
          <div className="bg-blue-100 rounded-md p-3 font-mono text-xs">
            <p># From the project root</p>
            <p>./infrastructure/deploy-backend.sh</p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <p className="text-yellow-800 text-xs">
            <i className="fas fa-exclamation-triangle mr-1"></i>
            <strong>Note:</strong> Make sure your AWS credentials are configured on the server before starting the backend.
          </p>
        </div>

        <div>
          <p className="font-medium">Expected backend URL:</p>
          <code className="bg-blue-100 px-2 py-1 rounded text-xs">{backendUrl}</code>
        </div>
      </div>
    </div>
  );
};

export default BackendSetupGuide;