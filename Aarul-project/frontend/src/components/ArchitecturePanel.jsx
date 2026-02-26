import React, { useState } from 'react';

/**
 * Architecture visualization and management panel
 */
const ArchitecturePanel = ({ architectureData, onGenerateCode, onOptimize }) => {
  const [activeTab, setActiveTab] = useState('diagram');
  const [showCostAnalysis, setShowCostAnalysis] = useState(false);

  const mockArchitecture = {
    services: [
      { name: 'API Gateway', type: 'api', status: 'configured' },
      { name: 'Lambda Functions', type: 'compute', status: 'optimizing' },
      { name: 'DynamoDB', type: 'database', status: 'configured' },
      { name: 'S3 Buckets', type: 'storage', status: 'configured' },
      { name: 'CloudFront', type: 'cdn', status: 'pending' }
    ],
    estimatedCost: '$247/month',
    optimizationSavings: '$89/month'
  };

  const data = architectureData || mockArchitecture;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'configured': return 'fas fa-check-circle text-green-500';
      case 'optimizing': return 'fas fa-sync fa-spin text-blue-500';
      case 'pending': return 'fas fa-clock text-yellow-500';
      default: return 'fas fa-circle text-gray-400';
    }
  };

  const getServiceIcon = (type) => {
    switch (type) {
      case 'api': return 'fas fa-plug text-purple-500';
      case 'compute': return 'fas fa-server text-blue-500';
      case 'database': return 'fas fa-database text-green-500';
      case 'storage': return 'fas fa-hdd text-orange-500';
      case 'cdn': return 'fas fa-globe text-indigo-500';
      case 'cache': return 'fas fa-memory text-red-500';
      case 'auth': return 'fas fa-shield-alt text-yellow-500';
      case 'messaging': return 'fas fa-envelope text-pink-500';
      case 'security': return 'fas fa-lock text-red-600';
      case 'dns': return 'fas fa-network-wired text-gray-600';
      default: return 'fas fa-cube text-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          <i className="fas fa-sitemap mr-2 text-blue-600"></i>
          Architecture Overview
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowCostAnalysis(!showCostAnalysis)}
            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
          >
            <i className="fas fa-dollar-sign mr-1"></i>
            Cost Analysis
          </button>
          <button
            onClick={onOptimize}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
          >
            <i className="fas fa-magic mr-1"></i>
            Optimize
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-4 border-b">
        {['diagram', 'services', 'code'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-1 capitalize ${
              activeTab === tab
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab === 'diagram' && <i className="fas fa-project-diagram mr-1"></i>}
            {tab === 'services' && <i className="fas fa-list mr-1"></i>}
            {tab === 'code' && <i className="fas fa-code mr-1"></i>}
            {tab}
          </button>
        ))}
      </div>

      {/* Cost Analysis Banner */}
      {showCostAnalysis && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-800">Cost Optimization</h3>
              <p className="text-sm text-green-700">
                Estimated monthly cost: <span className="font-bold">{data.estimatedCost}</span>
              </p>
              <p className="text-sm text-green-700">
                Potential savings: <span className="font-bold text-green-600">{data.optimizationSavings}</span>
              </p>
            </div>
            <button
              onClick={() => setShowCostAnalysis(false)}
              className="text-green-600 hover:text-green-800"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'diagram' && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <i className="fas fa-project-diagram text-6xl text-gray-400 mb-4"></i>
          <p className="text-gray-600 mb-4">Architecture diagram will be generated here</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <i className="fas fa-magic mr-2"></i>
            Generate Diagram
          </button>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="space-y-3">
          {data.services.map((service, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-3">
                <i className={getServiceIcon(service.type)}></i>
                <div>
                  <span className="font-medium">{service.name}</span>
                  <div className="text-xs text-gray-500">
                    <span className="capitalize">{service.type}</span>
                    {service.region && <span> • {service.region}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <i className={getStatusIcon(service.status)}></i>
                <span className="text-sm capitalize">{service.status}</span>
              </div>
            </div>
          ))}
          
          {/* Architecture Summary */}
          {data.regions && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Architecture Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-600 font-medium">Regions:</span>
                  <div className="text-gray-700">{data.regions?.join(', ')}</div>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Compliance:</span>
                  <div className="text-gray-700">{data.compliance?.join(', ')}</div>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Performance:</span>
                  <div className="text-gray-700">
                    {data.performance?.expectedLatency} • {data.performance?.availability}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'code' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Infrastructure as Code</h3>
            <button
              onClick={onGenerateCode}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <i className="fas fa-download mr-2"></i>
              Generate Terraform
            </button>
          </div>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
            <div className="mb-2"># Terraform Configuration Preview</div>
            <div className="text-gray-500"># Generated infrastructure code will appear here</div>
            <div className="mt-4">
              <div>resource "aws_api_gateway_rest_api" "main" {'{'}</div>
              <div className="ml-4">name = "cloud-architect-api"</div>
              <div>{'}'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchitecturePanel;