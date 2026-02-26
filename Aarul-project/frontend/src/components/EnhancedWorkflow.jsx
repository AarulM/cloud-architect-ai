import React, { useState, useEffect, useCallback, useMemo } from 'react';
import RequirementsCapture from './RequirementsCapture';
import DocumentReview from './DocumentReview';
import MarkdownRenderer from './MarkdownRenderer';
import WellArchitectedValidation from './WellArchitectedValidation';
import memoryManager from '../utils/memoryManager';
import aiAgentManager from '../utils/aiAgents';

/**
 * Enhanced workflow component that serves as the main interface
 * with structured phases, review points, and revision capabilities
 */
const EnhancedWorkflow = ({
  currentPhase,
  onPhaseChange,
  onSendMessage,
  workflowData = {},
  onWorkflowUpdate
}) => {
  const [activePhase, setActivePhase] = useState(currentPhase || 'discovery');
  const [phaseData, setPhaseData] = useState(workflowData);
  const [reviewMode, setReviewMode] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [viewMode, setViewMode] = useState('preview'); // 'preview' or 'raw'
  const [phaseLoading, setPhaseLoading] = useState(false);
  const [phaseError, setPhaseError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const phases = useMemo(() => [
    {
      id: 'discovery',
      name: 'Discovery',
      icon: 'fas fa-search',
      description: 'Discover business context and initial requirements',
      color: 'blue',
      agent: 'Business Discovery Analyst',
      tasks: [
        'Understand business context',
        'Identify current challenges',
        'Map key stakeholders',
        'Gather initial requirements'
      ]
    },
    {
      id: 'executive-summary',
      name: 'Executive Summary',
      icon: 'fas fa-chart-line',
      description: 'Create high-level project overview',
      color: 'indigo',
      agent: 'Business Analyst',
      tasks: [
        'Summarize business objectives',
        'Highlight key benefits',
        'Define success metrics',
        'Present cost-benefit analysis'
      ]
    },
    {
      id: 'current-state',
      name: 'Current State Analysis',
      icon: 'fas fa-search',
      description: 'Analyze existing infrastructure and processes',
      color: 'gray',
      agent: 'Infrastructure Analyst',
      tasks: [
        'Document current architecture',
        'Identify pain points',
        'Assess technical debt',
        'Evaluate existing resources'
      ]
    },
    {
      id: 'requirements-analysis',
      name: 'Requirements Analysis',
      icon: 'fas fa-microscope',
      description: 'Deep dive into detailed requirements',
      color: 'cyan',
      agent: 'Requirements Specialist',
      tasks: [
        'Analyze functional requirements',
        'Define non-functional requirements',
        'Identify integration needs',
        'Document acceptance criteria'
      ]
    },
    {
      id: 'proposed-architecture',
      name: 'Proposed Architecture',
      icon: 'fas fa-drafting-compass',
      description: 'Design optimal AWS architecture solution',
      color: 'green',
      agent: 'Solutions Architect',
      tasks: [
        'Design system architecture',
        'Select AWS services',
        'Create architecture diagrams',
        'Define security framework'
      ]
    },
    {
      id: 'implementation-approach',
      name: 'Implementation Approach',
      icon: 'fas fa-code',
      description: 'Plan implementation strategy and roadmap',
      color: 'orange',
      agent: 'Implementation Specialist',
      tasks: [
        'Define implementation phases',
        'Create deployment strategy',
        'Plan resource allocation',
        'Establish timelines'
      ]
    },
    {
      id: 'recommendations',
      name: 'Recommendations',
      icon: 'fas fa-lightbulb',
      description: 'Provide strategic recommendations and next steps',
      color: 'yellow',
      agent: 'Strategic Advisor',
      tasks: [
        'Summarize key recommendations',
        'Prioritize action items',
        'Define next steps',
        'Identify risks and mitigations'
      ]
    },
    {
      id: 'document-review',
      name: 'Document Review',
      icon: 'fas fa-file-export',
      description: 'Review complete analysis and export final document',
      color: 'purple',
      agent: 'Document Specialist',
      tasks: [
        'Compile all phase outputs',
        'Format comprehensive document',
        'Review for completeness',
        'Generate export-ready formats'
      ]
    }
  ], []);

  const getPhaseStatus = (phaseId) => {
    const phaseIndex = phases.findIndex(p => p.id === phaseId);
    const activeIndex = phases.findIndex(p => p.id === activePhase);

    // Check if phase is completed based on its data
    const isCompleted = phaseId === 'discovery'
      ? phaseData[phaseId]?.summary && phaseData[phaseId]?.completed
      : phaseId === 'document-review'
        ? phaseData[phaseId]?.document && phaseData[phaseId]?.completed
        : phaseData[phaseId]?.content;

    if (phaseId === activePhase) return 'active';
    if (isCompleted) return 'completed';
    if (phaseIndex < activeIndex) return 'completed';
    return 'pending';
  };

  const getColorClasses = (color, variant = 'primary') => {
    const colors = {
      blue: {
        primary: 'bg-blue-100 text-blue-800 border-blue-200',
        secondary: 'bg-blue-50 text-blue-700',
        accent: 'text-blue-600'
      },
      indigo: {
        primary: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        secondary: 'bg-indigo-50 text-indigo-700',
        accent: 'text-indigo-600'
      },
      gray: {
        primary: 'bg-gray-100 text-gray-800 border-gray-200',
        secondary: 'bg-gray-50 text-gray-700',
        accent: 'text-gray-600'
      },
      cyan: {
        primary: 'bg-cyan-100 text-cyan-800 border-cyan-200',
        secondary: 'bg-cyan-50 text-cyan-700',
        accent: 'text-cyan-600'
      },
      green: {
        primary: 'bg-green-100 text-green-800 border-green-200',
        secondary: 'bg-green-50 text-green-700',
        accent: 'text-green-600'
      },
      orange: {
        primary: 'bg-orange-100 text-orange-800 border-orange-200',
        secondary: 'bg-orange-50 text-orange-700',
        accent: 'text-orange-600'
      },
      yellow: {
        primary: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        secondary: 'bg-yellow-50 text-yellow-700',
        accent: 'text-yellow-600'
      }
    };
    return colors[color]?.[variant] || colors.blue[variant];
  };

  // Check if a phase is ready to be executed (previous phases completed)
  const isPhaseReady = (phaseId) => {
    const phaseIndex = phases.findIndex(p => p.id === phaseId);
    if (phaseIndex === 0) return true; // First phase (discovery) is always ready

    // Check if all previous phases are completed
    for (let i = 0; i < phaseIndex; i++) {
      const prevPhase = phases[i];
      // For discovery phase, check for summary; for others, check for content
      if (prevPhase.id === 'discovery') {
        if (!phaseData[prevPhase.id]?.summary) {
          return false;
        }
      } else {
        if (!phaseData[prevPhase.id]?.content) {
          return false;
        }
      }
    }
    return true;
  };

  const handlePhaseClick = (phaseId) => {
    // Clear any existing loading/error state when switching phases
    setPhaseLoading(false);
    setPhaseError('');
    setRetryCount(0);

    setActivePhase(phaseId);
    onPhaseChange && onPhaseChange(phaseId);
  };

  // Custom message handler that manages local loading state and uses enhanced features
  const handlePhaseMessage = useCallback(async (message, file, phase, currentRetryCount = 0) => {
    console.log('handlePhaseMessage called:', { phase, message: message.substring(0, 100) + '...', retryCount: currentRetryCount });
    setPhaseError('');
    setRetryCount(currentRetryCount);

    try {
      // Get appropriate AI agent for this phase
      const agent = aiAgentManager.getAgentForPhase(phase);
      if (agent) {
        aiAgentManager.setCurrentAgent(aiAgentManager.getAgentIdByName(agent.name));
      }

      // Add message to memory manager with context
      const contextualMessage = memoryManager.generateContextualPrompt(message, phase);
      
      // Add to conversation history
      memoryManager.addMessage({
        type: 'user',
        content: message,
        phase: phase,
        agent: agent ? agent.name : 'General'
      });

      // Call the parent's onSendMessage with enhanced context
      console.log('Calling onSendMessage for phase:', phase);
      const response = await onSendMessage(contextualMessage, file, phase);
      console.log('Got response for phase:', phase, response);

      // Add response to memory and extract context
      memoryManager.addMessage({
        type: 'assistant',
        content: response.text || response.response,
        phase: phase,
        agent: agent ? agent.name : 'General'
      });

      // Extract context from AI response
      memoryManager.extractContextFromResponse(response.text || response.response, phase);

      // Update phase data in memory
      memoryManager.updatePhaseData(phase, {
        content: response.text || response.response,
        completed: true,
        agent: agent ? agent.name : 'General'
      });

      // Success - reset retry count and clear loading state
      setRetryCount(0);
      setPhaseLoading(false);
    } catch (error) {
      console.error('Phase generation error:', error);

      // Handle MCP session conflicts gracefully
      if (error.type === 'MCP_SESSION_CONFLICT' || error.message.includes('client session is currently running')) {
        const nextRetryCount = currentRetryCount + 1;
        console.log(`MCP session conflict, retrying... (attempt ${nextRetryCount})`);

        // Limit retries to prevent infinite loops
        if (nextRetryCount > 10) {
          setPhaseError('Request is taking longer than expected. Please try again later.');
          setPhaseLoading(false);
          setRetryCount(0);
          return;
        }

        // Don't show error for MCP conflicts, just keep loading and retry
        setTimeout(() => {
          handlePhaseMessage(message, file, phase, nextRetryCount);
        }, 3000);
        return;
      }

      setPhaseError(`Failed to generate ${phase} content: ${error.message}`);
      setPhaseLoading(false);
      setRetryCount(0);
    }
  }, [onSendMessage]);

  const handleStartPhase = useCallback(async () => {
    const currentPhaseObj = phases.find(p => p.id === activePhase);
    if (!currentPhaseObj) return;

    // For discovery and document-review phases, we'll use dedicated components
    if (activePhase === 'discovery' || activePhase === 'document-review') {
      // The dedicated components will handle these phases
      return;
    }

    // Simple message - backend handles the detailed prompts
    const message = `Generate ${currentPhaseObj.name} content`;

    // Use our custom message handler
    await handlePhaseMessage(message, null, activePhase);
  }, [activePhase, handlePhaseMessage, phases]);

  // Update phase data when workflowData changes
  useEffect(() => {
    setPhaseData(workflowData);
  }, [workflowData]);

  // Auto-generate content when phase changes (except for requirements which has its own component)
  useEffect(() => {
    console.log('Phase change effect:', {
      activePhase,
      hasContent: !!phaseData[activePhase]?.content,
      isReady: isPhaseReady(activePhase),
      phaseData: phaseData[activePhase],
      phaseLoading
    });

    // Clear loading state if we're navigating to a phase that already has content
    if (phaseData[activePhase]?.content && phaseLoading) {
      console.log('Phase already has content, clearing loading state');
      setPhaseLoading(false);
      setPhaseError('');
      setRetryCount(0);
      return;
    }

    // Only auto-generate if phase has no content, is ready, and we're not already loading
    if (activePhase && activePhase !== 'discovery' && !phaseData[activePhase]?.content && isPhaseReady(activePhase) && !phaseLoading) {
      console.log('Auto-generating content for phase:', activePhase);
      // Immediately set loading state and start generation
      setPhaseLoading(true);
      handleStartPhase();
    }
  }, [activePhase]); // REMOVED phaseData, handleStartPhase, isPhaseReady, phaseLoading from dependencies

  const handleReviewPhase = () => {
    setReviewMode(true);
  };

  const handleApprovePhase = () => {
    // Mark phase as completed and move to next
    const currentIndex = phases.findIndex(p => p.id === activePhase);
    if (currentIndex < phases.length - 1) {
      const nextPhase = phases[currentIndex + 1];
      setActivePhase(nextPhase.id);
      onPhaseChange && onPhaseChange(nextPhase.id);
    } else {
      // If we're on the last phase (document-review), reset everything for a new workflow
      handleStartNewWorkflow();
    }
    setReviewMode(false);
  };

  const handleStartNewWorkflow = () => {
    // Clear all phase data and reset to beginning
    setPhaseData({});
    setActivePhase('discovery');
    setReviewMode(false);
    setPhaseError('');
    setPhaseLoading(false);
    setRetryCount(0);
    
    // Notify parent component to clear workflow data
    onWorkflowUpdate && onWorkflowUpdate({});
    onPhaseChange && onPhaseChange('discovery');
  };

  const handleRequestRevision = () => {
    setShowRevisionDialog(true);
  };

  const handleSubmitRevision = async () => {
    if (!revisionNotes.trim()) return;

    // Close dialog immediately when submitted
    setShowRevisionDialog(false);
    setRevisionNotes('');
    setReviewMode(false);

    // Set loading state and clear any previous errors
    setPhaseLoading(true);
    setPhaseError('');

    // Include the original content and specific revision instructions
    const currentContent = phaseData[activePhase]?.content || '';
    const message = `Please revise the ${activePhase} phase based on the following feedback: ${revisionNotes}

Current content to revise:
${currentContent}

Please provide a completely revised version that addresses the feedback above. Make sure to maintain the same structure and quality while incorporating the requested changes.`;

    try {
      await handlePhaseMessage(message, null, activePhase);
    } catch (error) {
      // Error handling is already done in handlePhaseMessage
      console.error('Revision failed:', error);
    }
  };

  const currentPhaseObj = phases.find(p => p.id === activePhase);
  const phaseStatus = getPhaseStatus(activePhase);



  // Get placeholder content for each phase
  const getPlaceholderContent = (phaseId) => {
    const placeholders = {
      'executive-summary': 'Executive summary with business objectives, key benefits, success metrics, and cost-benefit analysis will appear here.',
      'current-state': 'Current state analysis including existing architecture, pain points, technical debt assessment, and resource evaluation will appear here.',
      'requirements-analysis': 'Detailed requirements analysis with functional requirements, non-functional requirements, integration needs, and acceptance criteria will appear here.',
      'proposed-architecture': 'AWS architecture design with service selection, security framework, scalability considerations, and Well-Architected Framework compliance will appear here.',
      'implementation-approach': 'Implementation strategy including phases, deployment approach, resource allocation, timelines, and risk management will appear here.',
      'recommendations': 'Strategic recommendations, technical improvements, implementation priorities, and actionable next steps will appear here.'
    };
    return placeholders[phaseId] || 'Generated content will appear here for review.';
  };



  return (
    <div className="space-y-6">
      <style jsx>{`
        .workflow-steps::-webkit-scrollbar {
          height: 6px;
        }
        .workflow-steps::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .workflow-steps::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .workflow-steps::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .workflow-steps {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
      `}</style>
      {/* Compact Architecture Workflow */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Compact Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <i className="fas fa-route text-blue-600"></i>
            <h2 className="text-base font-semibold text-gray-900">Architecture Workflow</h2>
          </div>
          <div className="text-xs text-gray-500">
            {phases.filter(p => getPhaseStatus(p.id) === 'completed').length}/{phases.length} complete
          </div>
        </div>

        {/* Compact Phase Steps */}
        <div className="px-4 py-3">
          <div
            className="workflow-steps flex items-center space-x-3 overflow-x-auto pb-2"
            style={{
              width: '100%',
              minWidth: 0,
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {phases.map((phase, index) => {
              const status = getPhaseStatus(phase.id);
              const isActive = phase.id === activePhase;
              const isReady = isPhaseReady(phase.id);
              const isLocked = !isReady && status === 'pending';
              const isCompleted = status === 'completed';

              return (
                <div key={phase.id} className="flex items-center flex-shrink-0 min-w-max">
                  {/* Compact Phase Button */}
                  <button
                    onClick={() => handlePhaseClick(phase.id)}
                    className={`group flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : isCompleted
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : isLocked
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 cursor-pointer'
                      }`}
                    disabled={isLocked}
                    title={`${phase.name}: ${phase.description}`}
                  >
                    {/* Icon */}
                    <div className={`w-6 h-6 rounded flex items-center justify-center ${isActive ? 'bg-white/20' : ''
                      }`}>
                      {isCompleted ? (
                        <i className="fas fa-check text-xs"></i>
                      ) : isLocked ? (
                        <i className="fas fa-lock text-xs"></i>
                      ) : (
                        <i className={`${phase.icon} text-xs`}></i>
                      )}
                    </div>

                    {/* Phase Name */}
                    <span className="whitespace-nowrap">{phase.name}</span>

                    {/* Active indicator */}
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    )}
                  </button>

                  {/* Compact Connector */}
                  {index < phases.length - 1 && (
                    <div className={`w-4 h-px mx-1 transition-colors duration-300 ${getPhaseStatus(phases[index + 1].id) === 'completed' || getPhaseStatus(phases[index + 1].id) === 'active'
                      ? 'bg-green-400'
                      : 'bg-gray-300'
                      }`}></div>
                  )}
                </div>
              );
            })}
          </div>


        </div>
      </div>

      {/* Current Phase Content */}
      {currentPhaseObj && (
        <div>
          {/* Discovery Phase - Use dedicated component */}
          {activePhase === 'discovery' ? (
            <RequirementsCapture
              sessionId={phaseData.sessionId || 'default-session'}
              existingData={phaseData.discovery} // Pass existing discovery data
              phase="discovery" // Pass the phase type
              onComplete={(summary) => {
                const updatedData = {
                  ...phaseData.discovery,
                  summary,
                  completed: true,
                  timestamp: new Date().toISOString()
                };
                setPhaseData(prev => ({
                  ...prev,
                  discovery: updatedData
                }));
                onWorkflowUpdate && onWorkflowUpdate({
                  ...phaseData,
                  discovery: updatedData
                });
                handleApprovePhase();
              }}
              onUpdate={(update) => {
                const updatedData = {
                  ...phaseData.discovery,
                  ...update,
                  timestamp: new Date().toISOString()
                };
                setPhaseData(prev => ({
                  ...prev,
                  discovery: updatedData
                }));
                onWorkflowUpdate && onWorkflowUpdate({
                  ...phaseData,
                  discovery: updatedData
                });
              }}
              isActive={true}
            />
          ) : activePhase === 'document-review' ? (
            /* Document Review Phase - Use dedicated component */
            <DocumentReview
              sessionId={phaseData.sessionId || 'default-session'}
              workflowData={phaseData} // Pass all workflow data for compilation
              existingData={phaseData['document-review']} // Pass existing document data
              onComplete={(document) => {
                const updatedData = {
                  ...phaseData['document-review'],
                  document,
                  completed: true,
                  timestamp: new Date().toISOString()
                };
                setPhaseData(prev => ({
                  ...prev,
                  'document-review': updatedData
                }));
                onWorkflowUpdate && onWorkflowUpdate({
                  ...phaseData,
                  'document-review': updatedData
                });
                handleApprovePhase();
              }}
              onUpdate={(update) => {
                const updatedData = {
                  ...phaseData['document-review'],
                  ...update,
                  timestamp: new Date().toISOString()
                };
                setPhaseData(prev => ({
                  ...prev,
                  'document-review': updatedData
                }));
                onWorkflowUpdate && onWorkflowUpdate({
                  ...phaseData,
                  'document-review': updatedData
                });
              }}
              isActive={true}
            />
          ) : (
            /* Other Phases - Standard interface */
            <div className="bg-white rounded-lg shadow-lg">
              <div className="flex">
                {/* Main Content Area */}
                <div className="flex-1 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <i className={`${currentPhaseObj.icon} text-2xl ${getColorClasses(currentPhaseObj.color, 'accent')}`}></i>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {currentPhaseObj.name}
                        </h3>
                        <p className="text-sm text-gray-600">{currentPhaseObj.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setShowTasks(!showTasks)}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <i className={`fas ${showTasks ? 'fa-eye-slash' : 'fa-tasks'} mr-1`}></i>
                        {showTasks ? 'Hide Tasks' : 'Show Tasks'}
                      </button>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getColorClasses(currentPhaseObj.color, 'primary')}`}>
                        {phaseStatus === 'active' ? 'In Progress' :
                          phaseStatus === 'completed' ? 'Completed' : 'Pending'}
                      </div>
                    </div>
                  </div>

                  {/* Content Display */}
                  <div className="mb-6">
                    {phaseError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <i className="fas fa-exclamation-triangle text-red-500"></i>
                          <span className="text-sm font-medium text-red-700">Generation Error</span>
                        </div>
                        <p className="text-sm text-red-600 mt-2">{phaseError}</p>
                        <button
                          onClick={() => {
                            setPhaseError('');
                            handleStartPhase();
                          }}
                          className="mt-3 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
                        >
                          <i className="fas fa-retry mr-1"></i>
                          Retry
                        </button>
                      </div>
                    )}

                    {phaseLoading ? (
                      <div className="text-center py-12 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                          <i className="fas fa-robot text-2xl text-blue-600 animate-pulse"></i>
                        </div>
                        <h5 className="font-medium text-blue-700 mb-2">
                          Generating {currentPhaseObj.name}
                        </h5>
                        <p className="text-sm text-blue-600 mb-4">
                          AI agent is analyzing requirements and creating content...
                        </p>
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <div className="text-xs text-blue-500 mt-4">
                          <i className="fas fa-info-circle mr-1"></i>
                          {retryCount > 0
                            ? `Processing your request... (retry ${retryCount})`
                            : 'Processing your request... This may take a few moments'
                          }
                        </div>
                      </div>
                    ) : phaseData[activePhase]?.content ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium text-gray-600">
                              <i className="fas fa-check-circle text-green-500 mr-2"></i>
                              Content Generated
                            </span>
                            <div className="flex bg-gray-100 rounded-lg p-1">
                              <button
                                onClick={() => setViewMode('preview')}
                                className={`px-3 py-1 text-xs rounded transition-colors ${viewMode === 'preview'
                                  ? 'bg-white text-gray-700 shadow-sm'
                                  : 'text-gray-500 hover:text-gray-700'
                                  }`}
                              >
                                <i className="fas fa-eye mr-1"></i>
                                Preview
                              </button>
                              <button
                                onClick={() => setViewMode('raw')}
                                className={`px-3 py-1 text-xs rounded transition-colors ${viewMode === 'raw'
                                  ? 'bg-white text-gray-700 shadow-sm'
                                  : 'text-gray-500 hover:text-gray-700'
                                  }`}
                              >
                                <i className="fas fa-code mr-1"></i>
                                Raw
                              </button>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {phaseData[activePhase]?.timestamp && new Date(phaseData[activePhase].timestamp).toLocaleString()}
                          </span>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                          {viewMode === 'preview' ? (
                            <MarkdownRenderer className="markdown-content text-sm">
                              {phaseData[activePhase].content}
                            </MarkdownRenderer>
                          ) : (
                            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                              {phaseData[activePhase].content}
                            </pre>
                          )}
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigator.clipboard.writeText(phaseData[activePhase].content)}
                            className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                          >
                            <i className="fas fa-copy mr-1"></i>
                            Copy Content
                          </button>
                          <button
                            onClick={() => {
                              const element = document.createElement('a');
                              const file = new Blob([phaseData[activePhase].content], { type: 'text/plain' });
                              element.href = URL.createObjectURL(file);
                              element.download = `${activePhase}-content.txt`;
                              document.body.appendChild(element);
                              element.click();
                              document.body.removeChild(element);
                            }}
                            className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                          >
                            <i className="fas fa-download mr-1"></i>
                            Download
                          </button>
                          <button
                            onClick={() => {
                              const element = document.createElement('a');
                              const file = new Blob([phaseData[activePhase].content], { type: 'text/markdown' });
                              element.href = URL.createObjectURL(file);
                              element.download = `${activePhase}-content.md`;
                              document.body.appendChild(element);
                              element.click();
                              document.body.removeChild(element);
                            }}
                            className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                          >
                            <i className="fas fa-file-code mr-1"></i>
                            Download MD
                          </button>
                        </div>

                        {/* Well-Architected Framework Validation - Show for strategic architecture phases only */}
                        {(['proposed-architecture', 'implementation-approach', 'recommendations'].includes(activePhase)) && (
                          <div className="mt-6">
                            <WellArchitectedValidation
                              phaseContent={phaseData[activePhase]?.content}
                              phaseName={activePhase}
                              onValidationComplete={(validationResults) => {
                                // Store validation results in phase data
                                const updatedData = {
                                  ...phaseData[activePhase],
                                  wellArchitectedValidation: validationResults,
                                  timestamp: new Date().toISOString()
                                };
                                setPhaseData(prev => ({
                                  ...prev,
                                  [activePhase]: updatedData
                                }));
                                onWorkflowUpdate && onWorkflowUpdate({
                                  ...phaseData,
                                  [activePhase]: updatedData
                                });
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ) : !isPhaseReady(activePhase) ? (
                      <div className="text-center py-8 bg-orange-50 rounded-lg border border-orange-200">
                        <i className="fas fa-lock text-4xl mb-4 text-orange-400"></i>
                        <h5 className="font-medium text-orange-600 mb-2">
                          Phase Locked
                        </h5>
                        <p className="text-sm text-orange-500 mb-4">
                          Complete the previous phases to unlock {currentPhaseObj.name}.
                        </p>
                        <div className="text-xs text-orange-400">
                          <i className="fas fa-info-circle mr-1"></i>
                          You can view this phase for planning purposes, but content generation is disabled.
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                        <i className={`${currentPhaseObj.icon} text-4xl mb-4 text-gray-400`}></i>
                        <h5 className="font-medium text-gray-600 mb-2">
                          {currentPhaseObj.name}
                        </h5>
                        <p className="text-sm text-gray-500 mb-4">
                          {getPlaceholderContent(activePhase)}
                        </p>
                        <div className="text-xs text-gray-400">
                          <i className="fas fa-info-circle mr-1"></i>
                          Content will be generated automatically when you select this phase.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Phase Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      <i className="fas fa-robot mr-1"></i>
                      Agent: {currentPhaseObj.agent}
                    </div>

                    <div className="flex space-x-3">
                      {!reviewMode ? (
                        <button
                          onClick={handleReviewPhase}
                          disabled={!phaseData[activePhase]?.content || !isPhaseReady(activePhase)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${phaseData[activePhase]?.content && isPhaseReady(activePhase)
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                          <i className="fas fa-eye mr-2"></i>
                          Review & Approve
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={handleApprovePhase}
                            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-colors"
                          >
                            <i className="fas fa-check mr-2"></i>
                            Approve & Continue
                          </button>

                          <button
                            onClick={handleRequestRevision}
                            className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-medium hover:bg-orange-200 transition-colors"
                          >
                            <i className="fas fa-edit mr-2"></i>
                            Request Revision
                          </button>

                          <button
                            onClick={() => setReviewMode(false)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                          >
                            <i className="fas fa-times mr-2"></i>
                            Cancel Review
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tasks Sidebar */}
                {showTasks && (
                  <div className="w-80 border-l border-gray-200 bg-gray-50">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-700">Phase Tasks</h4>
                        <button
                          onClick={() => setShowTasks(false)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                      <div className="space-y-3">
                        {currentPhaseObj.tasks.map((task, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                            <div className="flex-shrink-0 mt-0.5">
                              <i className="fas fa-check-circle text-green-500 text-sm"></i>
                            </div>
                            <span className="text-sm text-gray-700 leading-relaxed">{task}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <i className="fas fa-info-circle text-blue-500 text-sm"></i>
                          <span className="text-sm font-medium text-blue-700">Phase Guide</span>
                        </div>
                        <p className="text-xs text-blue-600 leading-relaxed">
                          These tasks represent the key activities for the {currentPhaseObj.name} phase.
                          The AI agent will address these systematically when you start the phase.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Review Mode Banner */}
      {reviewMode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <i className="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
            <div>
              <h4 className="font-medium text-yellow-800">Review Mode Active</h4>
              <p className="text-sm text-yellow-700">
                Please review the current phase results and either approve to continue or request revisions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Revision Dialog */}
      {showRevisionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Request Revision
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              Please provide specific feedback for the agent to improve the {currentPhaseObj?.name} phase:
            </p>

            <textarea
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              placeholder="Enter your revision notes and feedback..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none"
            />

            <div className="flex space-x-3 mt-4">
              <button
                onClick={handleSubmitRevision}
                disabled={!revisionNotes.trim()}
                className={`px-4 py-2 rounded-lg font-medium ${revisionNotes.trim()
                  ? 'bg-orange-600 text-white hover:bg-orange-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                Submit Revision
              </button>

              <button
                onClick={() => {
                  setShowRevisionDialog(false);
                  setRevisionNotes('');
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedWorkflow;
