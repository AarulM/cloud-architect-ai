import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import MCPSources from './MCPSources';

/**
 * Component to display a chat message with markdown support
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - Type of message ('user' or 'agent')
 * @param {string} props.content - Content of the message
 * @param {Date} props.timestamp - Timestamp of the message
 * @param {boolean} props.hasAttachment - Whether the message has a file attachment
 * @param {string} props.attachmentName - Name of the attached file
 * @param {Array} props.mcpSources - MCP documentation sources used
 * @param {string} props.agent - AI agent that generated the response
 */
const Message = ({ type, content, timestamp, hasAttachment, attachmentName, mcpSources, agent }) => {
  // Format the timestamp
  const formattedTime = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  
  // Determine message class based on type
  const messageClass = type === 'user' ? 'message message-user' : 'message message-agent';
  
  return (
    <div className={messageClass}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {formattedTime && <div className="text-xs text-gray-500">{formattedTime}</div>}
          {agent && type === 'agent' && (
            <div className="text-xs text-blue-600 font-medium">
              <i className="fas fa-robot mr-1"></i>
              {agent}
            </div>
          )}
        </div>
        {hasAttachment && (
          <div className="text-xs text-blue-600">
            <i className="fas fa-paperclip mr-1"></i>
            {attachmentName}
          </div>
        )}
      </div>
      
      <div className="markdown-content">
        <MarkdownRenderer className="text-sm">
          {content}
        </MarkdownRenderer>
      </div>
      
      {/* Show MCP sources for agent messages */}
      {type === 'agent' && mcpSources && mcpSources.length > 0 && (
        <MCPSources sources={mcpSources} />
      )}
    </div>
  );
};

/**
 * Component to display typing indicator animation
 */
export const TypingIndicator = () => {
  return (
    <div className="message-typing">
      <div className="typing-animation">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
};

export default Message;
