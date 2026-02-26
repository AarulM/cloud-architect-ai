import React, { useState, useEffect, useRef } from 'react';
import Message, { TypingIndicator } from './Message';
import ChatInput from './ChatInput';
import { getApiUrl, getDefaultRequestConfig } from '../utils/config';
import MarkdownRenderer from './MarkdownRenderer';

/**
 * Architecture Design Component
 * Generates AWS architecture designs based on captured requirements
 * Provides interactive diagram, services list, and code generation
 */
const ArchitectureDesign = ({
  sessionId,
  requirements,
  onComplete,
  onUpdate,
  isActive = false
}) => {
  const [currentStep, setCurrentStep] = useState('generate');
  const [activeTab, setActiveTab] = useState('diagram');
  const [architectureData, setArchitectureData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Chat states for questions and revisions
  const [messages, setMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [revisionMode, setRevisionMode] = useState(false);

  // Diagram states
  const [diagramUrl, setDiagramUrl] = useState(null);
  const [diagramDescription, setDiagramDescription] = useState('');

  // Services states
  const [awsServices, setAwsServices] = useState([]);
  const [serviceDetails, setServiceDetails] = useState({});

  // Code states
  const [codeArtifacts, setCodeArtifacts] = useState({});
  const [selectedCodeType, setSelectedCodeType] = useState('cloudformation');

  const messagesEndRef = useRef(null);

  const tabs = [
    {
      id: 'diagram',
      name: 'Architecture Diagram',
      icon: 'fas fa-project-diagram',
      description: 'Visual representation of the architecture'
    },
    {
      id: 'services',
      name: 'AWS Services',
      icon: 'fas fa-cloud',
      description: 'List of AWS services and configurations'
    },
    {
      id: 'code',
      name: 'Implementation Code',
      icon: 'fas fa-code',
      description: 'Infrastructure as Code templates'
    }
  ];

  const codeTypes = [
    { id: 'cloudformation', name: 'CloudFormation', icon: 'fas fa-layer-group' },
    { id: 'terraform', name: 'Terraform', icon: 'fas fa-cube' },
    { id: 'cdk', name: 'AWS CDK', icon: 'fas fa-code-branch' },
    { id: 'sam', name: 'SAM Template', icon: 'fas fa-lambda' }
  ];

  // Generate initial architecture
  const generateArchitecture = async () => {
    if (!requirements) {
      setError('No requirements provided for architecture generation');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(getApiUrl('architectureGenerate'), {
        method: 'POST',
        ...getDefaultRequestConfig(),
        body: JSON.stringify({
          session_id: sessionId,
          requirements: requirements
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status === 'success') {
        setArchitectureData(data.architecture);
        setDiagramUrl(data.architecture.diagram_url);
        setDiagramDescription(data.architecture.diagram_description);
        setAwsServices(data.architecture.aws_services || []);
        setServiceDetails(data.architecture.service_details || {});
        setCodeArtifacts(data.architecture.code_artifacts || {});
        setCurrentStep('review');

        onUpdate && onUpdate({
          phase: 'architecture',
          status: 'generated',
          data: data.architecture
        });
      } else {
        throw new Error(data.error || 'Failed to generate architecture');
      }
    } catch (error) {
      console.error('Error generating architecture:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle chat messages for questions and revisions
  const handleChatMessage = async (content) => {
    if (!content.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      content,
      type: 'user',
      timestamp: new Date(),
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setIsLoading(true);

    try {
      const endpointKey = revisionMode ? 'architectureRevise' : 'architectureQuestion';
      const response = await fetch(getApiUrl(endpointKey), {
        method: 'POST',
        ...getDefaultRequestConfig(),
        body: JSON.stringify({
          session_id: sessionId,
          message: content,
          current_architecture: architectureData
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status === 'success') {
        const agentMessage = {
          id: Date.now().toString() + '-response',
          content: data.response,
          type: 'agent',
          timestamp: new Date(),
        };

        setMessages(prevMessages => [...prevMessages, agentMessage]);

        // If this was a revision, update the architecture data
        if (revisionMode && data.updated_architecture) {
          setArchitectureData(data.updated_architecture);
          setDiagramUrl(data.updated_architecture.diagram_url);
          setDiagramDescription(data.updated_architecture.diagram_description);
          setAwsServices(data.updated_architecture.aws_services || []);
          setServiceDetails(data.updated_architecture.service_details || {});
          setCodeArtifacts(data.updated_architecture.code_artifacts || {});

          onUpdate && onUpdate({
            phase: 'architecture',
            status: 'revised',
            data: data.updated_architecture
          });
        }
      } else {
        throw new Error(data.error || 'Failed to process message');
      }
    } catch (error) {
      console.error('Error processing chat message:', error);

      const errorMessage = {
        id: Date.now().toString() + '-error',
        content: `Error: ${error.message}. Please try again.`,
        type: 'agent',
        timestamp: new Date(),
      };

      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate specific code type
  const generateCode = async (codeType) => {
    if (!architectureData) return;

    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl('architectureGenerateCode'), {
        method: 'POST',
        ...getDefaultRequestConfig(),
        body: JSON.stringify({
          session_id: sessionId,
          architecture: architectureData,
          code_type: codeType
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status === 'success') {
        setCodeArtifacts(prev => ({
          ...prev,
          [codeType]: data.code
        }));
      } else {
        throw new Error(data.error || 'Failed to generate code');
      }
    } catch (error) {
      console.error('Error generating code:', error);
      alert(`Failed to generate ${codeType} code: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-generate architecture when component becomes active
  useEffect(() => {
    if (isActive && requirements && !architectureData && currentStep === 'generate') {
      generateArchitecture();
    }
  }, [isActive, requirements, architectureData, currentStep]);

  if (!isActive) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <i className="fas fa-drafting-compass text-4xl text-gray-400 mb-4"></i>
        <h3 className="text-lg font-medium text-gray-600 mb-2">Architecture Design</h3>
        <p className="text-sm text-gray-500">
          This phase will be available after requirements capture
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <i className="fas fa-drafting-compass text-2xl text-green-600"></i>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Architecture Design</h3>
              <p className="text-sm text-gray-600">
                {currentStep === 'generate' ? 'Generating AWS architecture from requirements...' :
                  'Review and refine your AWS architecture design'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {architectureData && (
              <>
                <button
                  onClick={() => setShowChat(!showChat)}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${showChat
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  <i className="fas fa-comments mr-2"></i>
                  {showChat ? 'Hide Chat' : 'Ask Questions'}
                </button>

                <button
                  onClick={() => {
                    setRevisionMode(!revisionMode);
                    setShowChat(true);
                  }}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${revisionMode
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  <i className="fas fa-edit mr-2"></i>
                  {revisionMode ? 'Exit Revision' : 'Request Changes'}
                </button>

                <button
                  onClick={() => onComplete && onComplete(architectureData)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  <i className="fas fa-check mr-2"></i>
                  Approve Architecture
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <i className="fas fa-exclamation-triangle text-red-600 mr-2"></i>
            <div>
              <h4 className="font-medium text-red-800">Error</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
          <button
            onClick={generateArchitecture}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            <i className="fas fa-redo mr-2"></i>
            Retry Generation
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && currentStep === 'generate' && (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h4 className="text-lg font-medium text-gray-800 mb-2">Generating Architecture</h4>
          <p className="text-sm text-gray-600">
            Analyzing requirements and designing optimal AWS architecture...
          </p>
        </div>
      )}

      {/* Main Content */}
      {architectureData && currentStep === 'review' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Content Area */}
          <div className={`${showChat ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-4`}>
            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                      <i className={`${tab.icon} mr-2`}></i>
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Diagram Tab */}
                {activeTab === 'diagram' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-800">Architecture Diagram</h4>
                      <button
                        onClick={() => generateArchitecture()}
                        disabled={isLoading}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm font-medium hover:bg-green-200 transition-colors disabled:opacity-50"
                      >
                        <i className="fas fa-sync-alt mr-1"></i>
                        Regenerate
                      </button>
                    </div>

                    {diagramDescription && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h5 className="font-medium text-blue-800 mb-2">Architecture Overview</h5>
                        <MarkdownRenderer className="markdown-content text-sm text-blue-700">
                          {diagramDescription}
                        </MarkdownRenderer>
                      </div>
                    )}

                    {diagramUrl ? (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={diagramUrl}
                          alt="Architecture Diagram"
                          className="w-full h-auto"
                          onError={() => setError('Failed to load architecture diagram')}
                        />
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                        <i className="fas fa-image text-4xl text-gray-400 mb-4"></i>
                        <p className="text-gray-600">Architecture diagram will appear here</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Services Tab */}
                {activeTab === 'services' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">AWS Services</h4>

                    {awsServices.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {awsServices.map((service, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                <i className="fas fa-cloud text-orange-600"></i>
                              </div>
                              <div>
                                <h5 className="font-medium text-gray-800">{service.name}</h5>
                                <p className="text-sm text-gray-600">{service.category}</p>
                              </div>
                            </div>

                            <MarkdownRenderer className="markdown-content text-sm text-gray-700 mb-3">
                              {service.description}
                            </MarkdownRenderer>

                            {service.configuration && (
                              <div className="bg-gray-50 rounded p-3">
                                <h6 className="text-xs font-medium text-gray-600 mb-2">Configuration</h6>
                                <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                                  {JSON.stringify(service.configuration, null, 2)}
                                </pre>
                              </div>
                            )}

                            {service.estimated_cost && (
                              <div className="mt-3 text-sm">
                                <span className="text-gray-600">Estimated Cost: </span>
                                <span className="font-medium text-green-600">{service.estimated_cost}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <i className="fas fa-cloud text-4xl text-gray-400 mb-4"></i>
                        <p className="text-gray-600">No AWS services configured yet</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Code Tab */}
                {activeTab === 'code' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-800">Implementation Code</h4>

                      <div className="flex items-center space-x-2">
                        <select
                          value={selectedCodeType}
                          onChange={(e) => setSelectedCodeType(e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded text-sm"
                        >
                          {codeTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.name}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => generateCode(selectedCodeType)}
                          disabled={isLoading}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200 transition-colors disabled:opacity-50"
                        >
                          <i className="fas fa-code mr-1"></i>
                          Generate
                        </button>
                      </div>
                    </div>

                    {codeArtifacts[selectedCodeType] ? (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            {codeTypes.find(t => t.id === selectedCodeType)?.name} Template
                          </span>
                          <button
                            onClick={() => navigator.clipboard.writeText(codeArtifacts[selectedCodeType])}
                            className="text-xs text-gray-600 hover:text-gray-800"
                          >
                            <i className="fas fa-copy mr-1"></i>
                            Copy
                          </button>
                        </div>
                        <pre className="p-4 text-sm text-gray-800 overflow-x-auto max-h-96">
                          {codeArtifacts[selectedCodeType]}
                        </pre>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                        <i className="fas fa-code text-4xl text-gray-400 mb-4"></i>
                        <p className="text-gray-600 mb-4">
                          {selectedCodeType.charAt(0).toUpperCase() + selectedCodeType.slice(1)} code will appear here
                        </p>
                        <button
                          onClick={() => generateCode(selectedCodeType)}
                          disabled={isLoading}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          <i className="fas fa-code mr-2"></i>
                          Generate {codeTypes.find(t => t.id === selectedCodeType)?.name}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat Sidebar */}
          {showChat && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border h-[600px] flex flex-col sticky top-4">
                <div className="p-3 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-800">
                      <i className="fas fa-comments mr-2 text-blue-600"></i>
                      {revisionMode ? 'Request Changes' : 'Ask Questions'}
                    </h4>
                    <button
                      onClick={() => setShowChat(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>

                  {revisionMode && (
                    <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
                      <i className="fas fa-edit mr-1"></i>
                      Revision mode: Describe changes you'd like to make
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {messages.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <i className="fas fa-question-circle text-3xl mb-3 text-blue-400"></i>
                      <p className="text-sm mb-2">
                        {revisionMode
                          ? 'Describe what you\'d like to change about the architecture'
                          : 'Ask questions about the architecture design'
                        }
                      </p>
                      <div className="text-xs text-gray-400 space-y-1">
                        <p>• "Why was this service chosen?"</p>
                        <p>• "How does data flow work?"</p>
                        <p>• "What about security?"</p>
                      </div>
                    </div>
                  )}

                  {messages.map((message) => (
                    <Message key={message.id} message={message} />
                  ))}

                  {isLoading && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t border-gray-200 p-3">
                  <ChatInput
                    onSendMessage={handleChatMessage}
                    disabled={isLoading}
                    placeholder={revisionMode
                      ? "Describe the changes you'd like..."
                      : "Ask a question about the architecture..."
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ArchitectureDesign;