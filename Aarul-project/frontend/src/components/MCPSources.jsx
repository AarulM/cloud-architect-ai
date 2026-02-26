import React from 'react';

/**
 * MCP Sources Component
 * Displays AWS documentation sources used via Model Context Protocol
 */
const MCPSources = ({ sources = [] }) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  const getSourceIcon = (type) => {
    switch (type) {
      case 'service_docs':
        return '📚';
      case 'framework':
        return '🏛️';
      case 'architecture_guide':
        return '🏗️';
      default:
        return '📖';
    }
  };

  const getSourceColor = (type) => {
    switch (type) {
      case 'service_docs':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'framework':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'architecture_guide':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">📡</span>
        </div>
        <h4 className="text-sm font-semibold text-blue-900">
          Live AWS Documentation Sources
        </h4>
        <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
          MCP Active
        </div>
      </div>
      
      <div className="space-y-2">
        {sources.map((source, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-3 rounded-lg border ${getSourceColor(source.type)}`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{getSourceIcon(source.type)}</span>
              <div>
                <div className="font-medium text-sm">{source.title}</div>
                <div className="text-xs opacity-75">
                  Real-time documentation via MCP
                </div>
              </div>
            </div>
            
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 px-3 py-1 bg-white bg-opacity-50 rounded-md hover:bg-opacity-75 transition-all text-xs font-medium"
            >
              <span>View Docs</span>
              <i className="fas fa-external-link-alt text-xs"></i>
            </a>
          </div>
        ))}
      </div>
      
      <div className="mt-3 pt-3 border-t border-blue-200">
        <div className="flex items-center justify-between text-xs text-blue-600">
          <div className="flex items-center space-x-2">
            <i className="fas fa-check-circle"></i>
            <span>Live documentation integrated into AI response</span>
          </div>
          <div className="flex items-center space-x-1">
            <i className="fas fa-clock"></i>
            <span>Updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MCPSources;