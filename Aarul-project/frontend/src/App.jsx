import React, { useState, useEffect, useRef } from 'react';
import Message, { TypingIndicator } from './components/Message';
import ChatInput from './components/ChatInput';
import ArchitecturePanel from './components/ArchitecturePanel';
import BackendSetupGuide from './components/BackendSetupGuide';

import RequirementsCapture from './components/RequirementsCapture';
import EnhancedWorkflow from './components/EnhancedWorkflow';
// import { loadDemoData } from './components/DemoData'; // Unused for now
import BackendClient from './utils/backendClient';
import { getBackendUrl, setBackendUrl } from './utils/config';
import memoryManager from './utils/memoryManager';
import aiAgentManager from './utils/aiAgents';

/**
 * Helper function to read file content as text
 * 
 * @param {File} file - The file to read
 * @returns {Promise<string>} - Promise resolving to file content as string
 */
const readFileContent = (file) => {
  return new Promise((resolve, reject) => {
    // Only process text files, PDFs and Word docs require extra handling
    if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    } else {
      // For non-text files, we'll just provide a placeholder message
      // In a real implementation, you'd want to handle PDFs and DOCs with appropriate libraries
      resolve(`[File content for ${file.name} (${file.type}) would be processed here. This is a ${file.type} file.]`);
    }
  });
};

/**
 * Main application component for Cloud Architect AI
 */
function App() {
  // State management
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [backendUrl, setBackendUrl] = useState(
    localStorage.getItem('backendUrl') ||
    getBackendUrl()
  );
  const [showConfig, setShowConfig] = useState(false);
  const [error, setError] = useState('');
  const [backendStatus, setBackendStatus] = useState('unknown');
  const [successMessage, setSuccessMessage] = useState('');

  // Cloud Architect AI specific state
  const [activeView, setActiveView] = useState('workflow');
  const [currentPhase, setCurrentPhase] = useState('discovery');
  const [architectureData, setArchitectureData] = useState(null);
  const [requirements, setRequirements] = useState(null);
  const [demoMode, setDemoMode] = useState(false);

  const [workflowData, setWorkflowData] = useState({});

  // References
  const messagesEndRef = useRef(null);
  const backendClientRef = useRef(null);

  // Initialize Backend client
  useEffect(() => {
    // Update the global config with the current backend URL
    setBackendUrl(backendUrl);

    backendClientRef.current = new BackendClient({
      baseUrl: backendUrl
    });

    // Load session ID from local storage
    const savedSessionId = localStorage.getItem('chatSessionId');
    if (savedSessionId) {
      backendClientRef.current.setSessionId(savedSessionId);
    } else {
      // Store new session ID
      localStorage.setItem('chatSessionId', backendClientRef.current.getSessionId());
    }

    // Check backend health immediately
    checkBackendHealth();

    // Set up periodic health checks (every 30 seconds)
    const healthCheckInterval = setInterval(() => {
      checkBackendHealth();
    }, 30000);

    // Cleanup interval on unmount or URL change
    return () => {
      clearInterval(healthCheckInterval);
    };
  }, [backendUrl]);

  // Check backend health
  const checkBackendHealth = async () => {
    try {
      await backendClientRef.current.checkHealth();
      const wasUnhealthy = backendStatus === 'unhealthy';
      setBackendStatus('healthy');
      setError('');

      // Show success message if backend was previously unhealthy
      if (wasUnhealthy) {
        setSuccessMessage('Backend connection restored successfully!');
        setTimeout(() => setSuccessMessage(''), 5000); // Clear after 5 seconds
      }

      // Close config panel if it was auto-opened due to backend issues
      if (showConfig && wasUnhealthy) {
        setShowConfig(false);
      }
    } catch (err) {
      setBackendStatus('unhealthy');
      setError(`Backend not available: ${err.message}`);
      setSuccessMessage(''); // Clear any success message

      // Auto-open configuration window when backend is not available
      if (!showConfig) {
        setShowConfig(true);
      }
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle workflow phase generation (separate from chat messages)
  const handleWorkflowPhase = async (content, attachedFile = null, phase = null) => {
    console.log('handleWorkflowPhase called:', { phase, backendStatus });

    // Check if backend is healthy
    if (backendStatus !== 'healthy') {
      throw new Error('Backend server is not available. Please make sure the backend is running.');
    }

    try {
      // Send message to the agent via backend for workflow phase
      console.log('Sending message to backend for phase:', phase);
      const response = await backendClientRef.current.sendMessage(content, phase);
      console.log('Backend response for phase:', phase, response);

      // Store phase-specific content
      if (phase && phase !== 'general') {
        console.log('Updating workflow data for phase:', phase);
        setWorkflowData(prevData => ({
          ...prevData,
          [phase]: {
            content: response.text,
            timestamp: new Date().toISOString(),
            completed: true
          }
        }));
      }

      return response;
    } catch (err) {
      console.error('Error in workflow phase:', err);
      throw err; // Re-throw for workflow component to handle
    }
  };

  // Handle sending a message to the agent
  const handleSendMessage = async (content, attachedFile = null, phase = null) => {
    // Require at least a message or a file
    if (!content.trim() && !attachedFile) return;

    // Check if backend is healthy
    if (backendStatus !== 'healthy') {
      setError('Backend server is not available. Please make sure the backend is running.');
      return;
    }

    let fullContent = content;
    let fileAttachmentInfo = '';
    let fileContent = '';

    // Process attached file if present
    if (attachedFile) {
      try {
        // Upload the file to the backend
        await backendClientRef.current.uploadContextFile(attachedFile);
        fileAttachmentInfo = `[Attached: ${attachedFile.name}]`;

        // Read the file content for sending with the message
        fileContent = await readFileContent(attachedFile);

        // Add file reference to the displayed message content
        fullContent = fullContent.trim() ?
          `${fullContent} ${fileAttachmentInfo}` :
          fileAttachmentInfo;

      } catch (err) {
        console.error('Error processing file:', err);
        setError(`Failed to process file: ${err.message}`);
        return;
      }
    }

    // Get appropriate AI agent for this phase or general chat
    const agent = phase ? aiAgentManager.getAgentForPhase(phase) : aiAgentManager.getCurrentAgent();
    if (agent && phase) {
      aiAgentManager.setCurrentAgent(aiAgentManager.getAgentIdByName(agent.name));
    }

    // Add message to memory manager with context
    const contextualMessage = phase ? 
      memoryManager.generateContextualPrompt(content, phase) : 
      memoryManager.generateContextualPrompt(content, 'general');
    
    // Add to conversation history
    memoryManager.addMessage({
      type: 'user',
      content: fullContent,
      phase: phase || 'general',
      agent: agent ? agent.name : 'General'
    });

    // Add user message to the chat (including file attachment info)
    const userMessage = {
      id: Date.now().toString(),
      content: fullContent,
      type: 'user',
      timestamp: new Date(),
      hasAttachment: !!attachedFile,
      attachmentName: attachedFile ? attachedFile.name : null
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setIsLoading(true);
    setError('');

    try {
      // Send message to the agent via backend
      // Include the file content with the message if a file was attached
      const messageWithFileContent = attachedFile ?
        `${contextualMessage}\n\n--- TRANSCRIPT CONTENT START ---\n${fileContent}\n--- TRANSCRIPT CONTENT END ---` :
        contextualMessage;

      const response = await backendClientRef.current.sendMessage(messageWithFileContent, phase);

      // Add agent response to the chat
      const agentMessage = {
        id: Date.now().toString() + '-response',
        content: response.text,
        type: 'agent',
        timestamp: new Date(),
        mcpSources: response.mcp_sources || [],
        agent: response.agent || (agent ? agent.name : 'General')
      };

      setMessages(prevMessages => [...prevMessages, agentMessage]);

      // Add response to memory and extract context
      memoryManager.addMessage({
        type: 'assistant',
        content: response.text,
        phase: phase || 'general',
        agent: agent ? agent.name : 'General'
      });

      // Extract context from AI response
      memoryManager.extractContextFromResponse(response.text, phase || 'general');

      // Store phase-specific content if phase is specified
      if (phase && phase !== 'general') {
        // Update phase data in memory
        memoryManager.updatePhaseData(phase, {
          content: response.text,
          completed: true,
          agent: agent ? agent.name : 'General'
        });

        setWorkflowData(prevData => ({
          ...prevData,
          [phase]: {
            content: response.text,
            timestamp: new Date().toISOString(),
            completed: true
          }
        }));
      }

      // Return the response for the workflow component to handle
      return response;
    } catch (err) {
      console.error('Error sending message:', err);

      // Provide helpful error messages
      if (err.message.includes('Cannot connect to backend')) {
        setError(`Cannot connect to backend server at ${backendUrl}. 
        
Make sure the backend is running:
1. Run: python3 backend_api.py
2. Check that it's accessible at ${backendUrl}
3. Verify your AWS credentials are configured on the server`);
      } else if (err.message.includes('client session is currently running') || err.type === 'MCP_SESSION_CONFLICT') {
        // Don't show MCP session conflict errors to users - these are handled by retry logic
        console.log('MCP session conflict - backend will retry automatically');
        throw err; // Re-throw so workflow component can handle it
      } else {
        setError(`Failed to get response: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Save configuration to local storage
  const saveConfig = async (e) => {
    e.preventDefault();

    if (!backendUrl.trim()) {
      setError('Please enter a valid Backend URL');
      return;
    }

    // Save backend URL to local storage
    localStorage.setItem('backendUrl', backendUrl);

    // Update the global config with the new backend URL
    setBackendUrl(backendUrl);

    // Reinitialize backend client with new URL
    backendClientRef.current = new BackendClient({
      baseUrl: backendUrl
    });

    setError('');

    // Check backend health with new URL
    try {
      await checkBackendHealth();
      // Only close config panel if backend is now healthy
      if (backendStatus === 'healthy') {
        setShowConfig(false);
      }
    } catch (err) {
      // Keep config panel open if backend is still unhealthy
      console.log('Backend still unhealthy after config save');
    }

    console.log("Configuration saved successfully");
  };

  // Clear chat history
  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      setMessages([]);
    }
  };

  // Start new session
  const startNewSession = async () => {
    if (window.confirm('Are you sure you want to start a new session? This will clear chat history.')) {
      try {
        // Create new session via backend
        await backendClientRef.current.createNewSession();
        const newSessionId = backendClientRef.current.getSessionId();
        localStorage.setItem('chatSessionId', newSessionId);

        // Clear chat history
        setMessages([]);
        setArchitectureData(null);
        setRequirements(null);
        setCurrentPhase('discovery');
        setWorkflowData({});
      } catch (err) {
        console.error('Error creating new session:', err);
        // Fallback to local session generation
        const newSessionId = backendClientRef.current.generateSessionId();
        backendClientRef.current.setSessionId(newSessionId);
        localStorage.setItem('chatSessionId', newSessionId);

        setMessages([]);
        setArchitectureData(null);
        setRequirements(null);
        setCurrentPhase('discovery');
        setWorkflowData({});
      }
    }
  };

  // Load demo data (currently unused but kept for future functionality)
  // const loadDemo = () => {
  //   const demo = loadDemoData();
  //   setMessages(demo.messages);
  //   setRequirements(demo.requirements);
  //   setArchitectureData(demo.architecture);
  //   setCurrentPhase(demo.currentPhase);
  //   setWorkflowData(demo.workflowData || {});
  //   setDemoMode(true);
  // };

  // Clear demo data
  const clearDemo = () => {
    setMessages([]);
    setRequirements(null);
    setArchitectureData(null);
    setCurrentPhase('discovery');
    setWorkflowData({});
    setDemoMode(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Compact Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <i className="fas fa-cloud text-lg text-white"></i>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-white"></div>
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">Cloud Architect AI</h1>
                <p className="text-xs text-blue-100 font-medium hidden sm:block">AWS Architecture Design & Optimization</p>
              </div>
            </div>

            {/* Navigation and Controls */}
            <div className="flex items-center space-x-4">
              {/* Status Indicator */}
              <div className="hidden md:flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-white/10 rounded-full px-2 py-1">
                  <div className={`w-2 h-2 rounded-full ${backendStatus === 'healthy' ? 'bg-green-400' : 'bg-red-400'} ${backendStatus === 'unhealthy' ? 'animate-pulse' : ''}`}></div>
                  <span className="text-xs font-medium">
                    {backendStatus === 'healthy' ? 'Connected' : 'Disconnected'}
                  </span>
                  {backendStatus === 'unhealthy' && (
                    <button
                      onClick={() => setShowConfig(true)}
                      className="text-xs text-white/90 hover:text-white underline"
                    >
                      Fix
                    </button>
                  )}
                </div>
                
                {/* MCP Status Indicator */}
                {backendStatus === 'healthy' && (
                  <div className="flex items-center space-x-2 bg-blue-500/20 rounded-full px-2 py-1">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                    <span className="text-xs font-medium">MCP Active</span>
                  </div>
                )}
              </div>

              {/* View Toggle */}
              <div className="flex bg-white/15 rounded-lg p-1 backdrop-blur-sm">
                {[
                  { id: 'workflow', icon: 'fas fa-route', label: 'Workflow' },
                  { id: 'chat', icon: 'fas fa-comments', label: 'Chat' }
                ].map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setActiveView(view.id)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${activeView === view.id
                      ? 'bg-white text-blue-600 shadow-md'
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                      }`}
                  >
                    <i className={`${view.icon} mr-1.5`}></i>
                    <span className="hidden sm:inline">{view.label}</span>
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className="p-2 rounded-lg hover:bg-white/15 transition-all duration-200 group"
                  title="Configuration"
                >
                  <i className="fas fa-cog text-sm group-hover:rotate-90 transition-transform duration-200"></i>
                </button>

                <button
                  onClick={clearChat}
                  className="p-2 rounded-lg hover:bg-white/15 transition-all duration-200"
                  title="Clear chat"
                >
                  <i className="fas fa-trash-alt text-sm"></i>
                </button>

                <button
                  onClick={startNewSession}
                  className="p-2 rounded-lg hover:bg-white/15 transition-all duration-200 group"
                  title="New session"
                >
                  <i className="fas fa-sync text-sm group-hover:rotate-180 transition-transform duration-200"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Header Spacer */}
      <div className="h-16"></div>

      {/* Configuration panel */}
      {showConfig && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className={`bg-white rounded-lg shadow-lg p-6 ${backendStatus === 'unhealthy' ? 'border-2 border-red-300 bg-red-50' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg flex items-center">
                {backendStatus === 'unhealthy' && (
                  <i className="fas fa-exclamation-triangle text-red-500 mr-2"></i>
                )}
                Backend Configuration
                {backendStatus === 'unhealthy' && (
                  <span className="ml-2 text-sm font-normal text-red-600">(Connection Required)</span>
                )}
              </h2>
              {backendStatus !== 'unhealthy' && (
                <button
                  onClick={() => setShowConfig(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>

            {backendStatus === 'unhealthy' && (
              <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4">
                <div className="flex items-center">
                  <i className="fas fa-wifi text-red-500 mr-2"></i>
                  <div>
                    <p className="font-medium">Backend Connection Required</p>
                    <p className="text-sm">Please configure and start your backend server to continue.</p>
                    {backendUrl.startsWith('http://') && window.location.protocol === 'https:' && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-xs">
                        <p className="font-medium">⚠️ Mixed Content Issue</p>
                        <p>HTTPS frontend cannot connect to HTTP backend.</p>
                        <p className="mt-1">Use an HTTPS backend URL or access frontend via HTTP.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={saveConfig} className="space-y-4">
              <div>
                <label htmlFor="backendUrl" className="block text-sm font-medium mb-2">
                  Backend API URL <span className="text-red-500">*</span>
                </label>
                <input
                  id="backendUrl"
                  type="text"
                  value={backendUrl}
                  onChange={(e) => setBackendUrl(e.target.value)}
                  placeholder="http://localhost:3030"
                  className="w-full border border-gray-300 rounded-lg p-3"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL of your backend API server (default: http://localhost:3030)
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-medium text-green-800 mb-2">
                  <i className="fas fa-shield-alt mr-1"></i>
                  Secure Configuration
                </h3>
                <p className="text-sm text-green-700 mb-2">
                  This setup uses a secure backend API that handles AWS credentials server-side.
                  No AWS credentials are stored in your browser.
                </p>
                <div className="text-xs text-green-600">
                  <p>✅ AWS credentials handled securely on the server</p>
                  <p>✅ No sensitive data in browser storage</p>
                  <p>✅ Backend handles all AWS API calls</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <span>Backend Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${backendStatus === 'healthy'
                    ? 'bg-green-100 text-green-800'
                    : backendStatus === 'unhealthy'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                    }`}>
                    {backendStatus === 'healthy' && <i className="fas fa-check-circle mr-1"></i>}
                    {backendStatus === 'unhealthy' && <i className="fas fa-exclamation-triangle mr-1"></i>}
                    {backendStatus === 'unknown' && <i className="fas fa-question-circle mr-1"></i>}
                    {backendStatus}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={checkBackendHealth}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-xs font-medium inline-flex items-center"
                >
                  <i className="fas fa-sync mr-1"></i>
                  Test Connection
                </button>
              </div>

              <div className="flex space-x-3 mt-4">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Save Configuration
                </button>

                {backendStatus !== 'unhealthy' && (
                  <button
                    type="button"
                    onClick={() => setShowConfig(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Show setup guide when backend is unhealthy */}
            {backendStatus === 'unhealthy' && (
              <BackendSetupGuide backendUrl={backendUrl} />
            )}

            <p className="text-xs text-gray-500 mt-4 pt-4 border-t">
              <i className="fas fa-info-circle mr-1"></i>
              Session ID: {backendClientRef.current?.getSessionId() || 'Not initialized'}
            </p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`${activeView === 'chat' ? 'w-full px-0 py-0' : 'max-w-7xl mx-auto px-4 py-6'}`}>
        {/* Demo Mode Banner */}
        {demoMode && (
          <div className="bg-gradient-to-r from-green-100 to-blue-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <i className="fas fa-info-circle mr-2"></i>
                <span className="font-medium">Demo Mode Active</span>
                <span className="ml-2 text-sm">Showing sample e-commerce architecture project</span>
              </div>
              <button
                onClick={clearDemo}
                className="text-green-600 hover:text-green-800 font-medium text-sm"
              >
                Exit Demo
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && backendStatus === 'unhealthy' && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                <div>
                  <p className="font-medium">Backend Server Not Available</p>
                  <p className="text-sm">Please configure your backend connection to continue.</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfig(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Configure Backend
              </button>
            </div>
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <i className="fas fa-check-circle mr-2"></i>
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        {/* Other errors */}
        {error && backendStatus !== 'unhealthy' && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            <i className="fas fa-exclamation-triangle mr-2"></i> {error}
          </div>
        )}

        {/* Content based on active view */}
        {activeView === 'workflow' && (
          <EnhancedWorkflow
            currentPhase={currentPhase}
            onPhaseChange={setCurrentPhase}
            onSendMessage={handleWorkflowPhase}
            workflowData={workflowData}
            onWorkflowUpdate={setWorkflowData}
          />
        )}

        {activeView === 'chat' && (
          <div className="h-screen flex flex-col">
            {/* Chat Interface - Full Height with better proportions */}
            <div className="flex-1 bg-white shadow-xl border border-gray-200 flex flex-col mx-4 my-4 rounded-xl overflow-hidden">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <i className="fas fa-robot text-white text-lg"></i>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">Cloud Architect AI Assistant</h3>
                      <p className="text-sm text-gray-600">Ready to help with your AWS architecture</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-500">Online</span>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto bg-gray-50 px-6 py-4">
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* Backend connection required message */}
                  {backendStatus === 'unhealthy' && (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-gradient-to-r from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className="fas fa-exclamation-triangle text-3xl text-red-500"></i>
                      </div>
                      <h4 className="text-xl font-semibold text-gray-800 mb-3">Backend Connection Required</h4>
                      <p className="text-gray-600 mb-2 text-lg">Please configure and start your backend server</p>
                      <p className="text-gray-500 max-w-md mx-auto mb-6">The AI assistant requires a backend connection to function properly</p>

                      <button
                        onClick={() => setShowConfig(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center"
                      >
                        <i className="fas fa-cog mr-2"></i>
                        Configure Backend
                      </button>
                    </div>
                  )}

                  {/* Normal welcome message when backend is healthy */}
                  {messages.length === 0 && backendStatus === 'healthy' && (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className="fas fa-cloud text-3xl text-blue-500"></i>
                      </div>
                      <h4 className="text-xl font-semibold text-gray-800 mb-3">Welcome to Cloud Architect AI</h4>
                      <p className="text-gray-600 mb-2 text-lg">I'm your autonomous AWS architecture design assistant</p>
                      <p className="text-gray-500 max-w-md mx-auto">Start by describing your project requirements or ask about AWS best practices</p>

                      {/* Quick Start Suggestions */}
                      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                          <i className="fas fa-lightbulb text-yellow-500 mb-2"></i>
                          <p className="text-sm text-gray-700 font-medium">Ask about AWS best practices</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                          <i className="fas fa-project-diagram text-blue-500 mb-2"></i>
                          <p className="text-sm text-gray-700 font-medium">Describe your project requirements</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {messages.map((message) => (
                    <Message
                      key={message.id}
                      type={message.type}
                      content={message.content}
                      timestamp={message.timestamp}
                      hasAttachment={message.hasAttachment}
                      attachmentName={message.attachmentName}
                      mcpSources={message.mcpSources}
                      agent={message.agent}
                    />
                  ))}

                  {isLoading && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 bg-white px-6 py-4">
                <div className="max-w-4xl mx-auto">
                  {backendStatus === 'healthy' ? (
                    <ChatInput
                      onSendMessage={handleSendMessage}
                      isLoading={isLoading}
                    />
                  ) : (
                    <div className="bg-gray-100 rounded-lg p-4 text-center">
                      <p className="text-gray-600 mb-2">
                        <i className="fas fa-plug mr-2"></i>
                        Backend connection required to send messages
                      </p>
                      <button
                        onClick={() => setShowConfig(true)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Configure Backend Connection
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'requirements' && (
          <RequirementsCapture
            requirements={requirements}
            onRequirementUpdate={(section, key, value) => {
              console.log('Requirement updated:', section, key, value);
              // Update requirements state
              setRequirements(prev => ({
                ...prev,
                [section]: {
                  ...prev?.[section],
                  [key]: value
                }
              }));
            }}
          />
        )}



        {activeView === 'architecture' && (
          <ArchitecturePanel
            architectureData={architectureData}
            onGenerateCode={() => {
              console.log('Generate code clicked');
              // In a real implementation, this would trigger the code generation agent
              alert('Code generation would be triggered here. The agent would generate Terraform/CloudFormation templates.');
            }}
            onOptimize={() => {
              console.log('Optimize clicked');
              // In a real implementation, this would trigger the optimization agent
              alert('Architecture optimization would be triggered here. The agent would analyze and suggest improvements.');
            }}
          />
        )}
      </div>

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-r from-gray-800 via-gray-900 to-black text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-cloud text-white"></i>
                </div>
                <div>
                  <h3 className="text-lg font-bold">Cloud Architect AI</h3>
                  <p className="text-sm text-gray-400">Powered by AWS & AI</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                Autonomous AWS architecture design and optimization platform that leverages AI to create
                well-architected, scalable, and cost-effective cloud solutions.
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <i className="fas fa-shield-alt text-green-400"></i>
                  <span>Secure & Private</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <i className="fas fa-bolt text-yellow-400"></i>
                  <span>AI-Powered</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <i className="fas fa-aws text-orange-400"></i>
                  <span>AWS Native</span>
                </div>
              </div>
            </div>

            {/* Features */}
            <div>
              <h4 className="text-sm font-semibold text-gray-200 mb-3 uppercase tracking-wide">Features</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center space-x-2">
                  <i className="fas fa-check text-green-400 text-xs"></i>
                  <span>Requirements Analysis</span>
                </li>
                <li className="flex items-center space-x-2">
                  <i className="fas fa-check text-green-400 text-xs"></i>
                  <span>Architecture Design</span>
                </li>
                <li className="flex items-center space-x-2">
                  <i className="fas fa-check text-green-400 text-xs"></i>
                  <span>Cost Optimization</span>
                </li>
                <li className="flex items-center space-x-2">
                  <i className="fas fa-check text-green-400 text-xs"></i>
                  <span>Security Best Practices</span>
                </li>
                <li className="flex items-center space-x-2">
                  <i className="fas fa-check text-green-400 text-xs"></i>
                  <span>Implementation Guidance</span>
                </li>
              </ul>
            </div>

            {/* Support & Resources */}
            <div>
              <h4 className="text-sm font-semibold text-gray-200 mb-3 uppercase tracking-wide">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors flex items-center space-x-2">
                    <i className="fas fa-book text-xs"></i>
                    <span>Documentation</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors flex items-center space-x-2">
                    <i className="fas fa-question-circle text-xs"></i>
                    <span>Help & Support</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors flex items-center space-x-2">
                    <i className="fas fa-code text-xs"></i>
                    <span>API Reference</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors flex items-center space-x-2">
                    <i className="fas fa-graduation-cap text-xs"></i>
                    <span>Best Practices</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors flex items-center space-x-2">
                    <i className="fas fa-comments text-xs"></i>
                    <span>Community</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-700 mt-8 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-6 text-xs text-gray-400">
                <span>© 2024 Cloud Architect AI. All rights reserved.</span>
                <span className="hidden md:inline">•</span>
                <span className="flex items-center space-x-1">
                  <i className="fas fa-server"></i>
                  <span>Backend: {backendStatus === 'healthy' ? 'Online' : 'Offline'}</span>
                </span>
                <span className="hidden md:inline">•</span>
                <span className="flex items-center space-x-1">
                  <i className="fas fa-clock"></i>
                  <span>Session: {backendClientRef.current?.getSessionId()?.slice(-8) || 'N/A'}</span>
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-xs text-gray-400">
                  Built with ❤️ for AWS Solutions Architects
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-400">Live</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
