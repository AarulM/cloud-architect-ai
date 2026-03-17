import React, { useState, useRef } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

/**
 * Discovery/Requirements Capture Component
 * Upload transcript and process discovery or requirements
 */
const RequirementsCapture = ({
  sessionId,
  onComplete,
  onUpdate,
  onSendMessage,
  isActive = false,
  existingData = null,
  phase = 'discovery'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [projectContext, setProjectContext] = useState(existingData?.projectContext || `Example: E-commerce company with 50k daily orders. Struggling with downtime during traffic spikes (Black Friday, flash sales). Need AWS migration for auto-scaling, 99.9% uptime, PCI-DSS compliance, and CI/CD pipeline for a 15-person dev team.`);
  const [phaseSummary, setPhaseSummary] = useState(existingData?.summary || '');
  const [currentStep, setCurrentStep] = useState(
    existingData?.summary ? 'summary' : 'upload'
  );

  // Phase-specific configuration
  const phaseConfig = {
    discovery: {
      title: 'Discovery',
      icon: 'fas fa-search',
      description: 'Upload transcript and extract discovery insights',
      processButtonText: 'Extract Discovery Insights',
      processingText: 'Processing Discovery...',
      completeTitle: 'Discovery Analysis Complete',
      continueText: 'Continue to Executive Summary',
      placeholderText: 'Describe your business context, challenges, and initial project goals...'
    },
    requirements: {
      title: 'Requirements Capture',
      icon: 'fas fa-clipboard-list',
      description: 'Upload transcript and extract requirements',
      processButtonText: 'Extract Requirements',
      processingText: 'Processing Requirements...',
      completeTitle: 'Requirements Analysis Complete',
      continueText: 'Continue to Next Phase',
      placeholderText: 'Describe your AWS project requirements, objectives, and constraints...'
    }
  };

  const config = phaseConfig[phase] || phaseConfig.discovery;
  const fileInputRef = useRef(null);

  const processTranscript = async () => {
    if (!attachedFile && !projectContext.trim()) {
      alert('Please upload a transcript file or provide project context');
      return;
    }

    setIsLoading(true);
    try {
      let message = '';

      if (attachedFile) {
        const fileContent = await readFileContent(attachedFile);
        if (phase === 'discovery') {
          message = `Please analyze this discovery call transcript and extract comprehensive business context, challenges, and initial requirements for an AWS architecture project:\n\n${fileContent}`;
        } else {
          message = `Please analyze this transcript and extract comprehensive requirements for an AWS architecture project:\n\n${fileContent}`;
        }
      } else {
        if (phase === 'discovery') {
          message = `Please help me with discovery for my AWS project. Here's the business context: ${projectContext}`;
        } else {
          message = `Please help me gather requirements for my AWS project. Here's the context: ${projectContext}`;
        }
      }

      const response = await onSendMessage(message, attachedFile, phase);

      if (response && response.text) {
        setPhaseSummary(response.text);
        setCurrentStep('summary');
        onUpdate && onUpdate({
          phase: phase,
          status: 'completed',
          summary: response.text,
          projectContext: projectContext,
          attachedFileName: attachedFile?.name || null
        });
      } else {
        throw new Error('No response received from backend');
      }
    } catch (error) {
      console.error('Error processing transcript:', error);
      if (error.message.includes('client session is currently running')) {
        console.log('MCP session conflict - backend will retry automatically');
        return;
      }
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const validTypes = ['text/plain', 'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

      if (!validTypes.includes(file.type)) {
        alert('Please upload a valid transcript file (.txt, .doc, .docx, .pdf)');
        return;
      }

      setAttachedFile(file);
    }
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
  };

  const handlePaperclipClick = () => {
    fileInputRef.current.click();
  };



  if (!isActive) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <i className={`${config.icon} text-4xl text-gray-400 mb-4`}></i>
        <h3 className="text-lg font-medium text-gray-600 mb-2">{config.title}</h3>
        <p className="text-sm text-gray-500">
          This phase will be available when activated
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <i className={`${config.icon} text-2xl text-blue-600`}></i>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{config.title}</h3>
              <p className="text-sm text-gray-600">{config.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {currentStep === 'upload' ? (
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                <i className="fas fa-upload mr-1"></i>
                In Progress
              </div>
            ) : (
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                <i className="fas fa-check mr-1"></i>
                Complete
              </div>
            )}
          </div>
        </div>

        {/* Upload Phase */}
        {currentStep === 'upload' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* File Upload Area */}
              <div className="space-y-4">
                <h5 className="text-sm font-medium text-gray-700 flex items-center">
                  <i className="fas fa-upload mr-2 text-blue-600"></i>
                  Upload Transcript File
                </h5>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center h-48 flex flex-col justify-center">
                  {attachedFile ? (
                    <div className="space-y-3">
                      <div className="inline-flex items-center bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
                        <i className="fas fa-file-alt mr-2"></i>
                        <span className="font-medium">{attachedFile.name}</span>
                        <button
                          type="button"
                          onClick={removeAttachedFile}
                          className="ml-3 text-blue-500 hover:text-red-500"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                      <p className="text-sm text-gray-600">File ready for processing</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <i className="fas fa-cloud-upload-alt text-4xl text-gray-400"></i>
                      <div>
                        <button
                          type="button"
                          onClick={handlePaperclipClick}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Click to upload transcript
                        </button>
                        <p className="text-sm text-gray-500 mt-1">
                          Supports .txt, .doc, .docx, .pdf files
                        </p>
                      </div>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileInput}
                    accept=".txt,.pdf,.doc,.docx"
                  />
                </div>
              </div>

              {/* Manual Context Input */}
              <div className="space-y-4">
                <h5 className="text-sm font-medium text-gray-700 flex items-center">
                  <i className="fas fa-edit mr-2 text-green-600"></i>
                  Or Provide Context Manually
                </h5>
                <div className="h-48">
                  <textarea
                    value={projectContext}
                    onChange={(e) => setProjectContext(e.target.value)}
                    placeholder={config.placeholderText}
                    className="w-full h-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={processTranscript}
                disabled={isLoading || (!attachedFile && !projectContext.trim())}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${isLoading || (!attachedFile && !projectContext.trim())
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    {config.processingText}
                  </>
                ) : (
                  <>
                    <i className="fas fa-magic mr-2"></i>
                    {config.processButtonText}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Summary Phase */}
        {currentStep === 'summary' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-800">
                <i className="fas fa-file-alt mr-2 text-green-600"></i>
                {config.completeTitle}
              </h4>
              <div className="flex items-center space-x-2">
                {existingData?.completed && (
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    <i className="fas fa-history mr-1"></i>
                    Previously Completed
                  </div>
                )}
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  <i className="fas fa-check mr-1"></i>
                  Complete
                </div>
              </div>
            </div>

            {phaseSummary && (
              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <MarkdownRenderer className="markdown-content text-sm">
                    {phaseSummary}
                  </MarkdownRenderer>
                </div>

                {existingData?.timestamp && (
                  <div className="text-xs text-gray-500 flex items-center space-x-2">
                    <i className="fas fa-clock"></i>
                    <span>Completed: {new Date(existingData.timestamp).toLocaleString()}</span>
                    {existingData?.attachedFileName && (
                      <>
                        <span>•</span>
                        <span>Source: {existingData.attachedFileName}</span>
                      </>
                    )}
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={() => onComplete && onComplete(phaseSummary)}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    <i className="fas fa-arrow-right mr-2"></i>
                    {config.continueText}
                  </button>

                  <button
                    onClick={() => {
                      setCurrentStep('upload');
                      setPhaseSummary('');
                    }}
                    className="px-4 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
                  >
                    <i className="fas fa-edit mr-2"></i>
                    Revise
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RequirementsCapture;