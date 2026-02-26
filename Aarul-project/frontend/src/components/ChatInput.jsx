import React, { useState, useRef, useEffect } from 'react';

/**
 * Component for chat input with support for multiline input and file upload
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onSendMessage - Function to call when sending a message with optional file
 * @param {boolean} props.isLoading - Whether the agent is processing a message
 */
const ChatInput = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-resize the textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [message]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if ((message.trim() || attachedFile) && !isLoading) {
      // Send message with attached file if present
      onSendMessage(message, attachedFile);
      setMessage('');
      setAttachedFile(null);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  // Handle key press events (Enter to submit, Shift+Enter for new line)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Handle file input change
  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check if file is a valid transcript file (text, doc, pdf)
      const validTypes = ['text/plain', 'application/pdf', 'application/msword', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      if (!validTypes.includes(file.type)) {
        alert('Please upload a valid transcript file (.txt, .doc, .docx, .pdf)');
        return;
      }
      
      // Store the file for attachment with the next message
      setAttachedFile(file);
    }
  };
  
  // Remove attached file
  const removeAttachedFile = () => {
    setAttachedFile(null);
  };

  // Handle click on paperclip icon
  const handlePaperclipClick = () => {
    fileInputRef.current.click();
  };

  return (
    <form onSubmit={handleSubmit} className="chat-input-container">
      {/* Attached file indicator */}
      {attachedFile && (
        <div className="mx-2 mb-2 flex">
          <div className="inline-flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-sm">
            <i className="fas fa-file-alt mr-1"></i>
            <span className="truncate max-w-xs">{attachedFile.name}</span>
            <button
              type="button"
              onClick={removeAttachedFile}
              className="ml-2 text-blue-500 hover:text-red-500"
              aria-label="Remove attached file"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}
      
      <div className="relative flex items-center">
        {/* Paperclip for file upload */}
        <button
          type="button"
          onClick={handlePaperclipClick}
          className="absolute left-3 text-gray-500 hover:text-blue-600 transition-colors"
          disabled={isLoading || attachedFile !== null}
          aria-label="Upload file"
        >
          <i className="fas fa-paperclip"></i>
        </button>
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          onChange={handleFileInput}
          accept=".txt,.pdf,.doc,.docx"
        />
        
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a message... (Shift+Enter for new line)"
          className="chat-input pl-10"
          disabled={isLoading}
          rows={1}
        />
        <button
          type="submit"
          className="send-button"
          disabled={((!message.trim() && !attachedFile) || isLoading)}
          aria-label="Send message"
        >
          <i className="fas fa-paper-plane"></i>
        </button>
      </div>

      <div className="text-xs text-gray-500 mt-1 flex justify-between">
        <span>
          <kbd className="bg-gray-200 rounded px-1">Shift</kbd> + <kbd className="bg-gray-200 rounded px-1">Enter</kbd> for new line
        </span>
        {isLoading && <span className="text-primary-600">Agent is thinking...</span>}
      </div>
    </form>
  );
};

export default ChatInput;
