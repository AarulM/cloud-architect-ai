import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import MermaidDiagram from './MermaidDiagram';

/**
 * Consistent markdown renderer component used across the application
 * Provides syntax highlighting, Mermaid diagrams, and consistent styling
 */
const MarkdownRenderer = ({ 
  children, 
  className = "markdown-content",
  ...props 
}) => {
  return (
    <div className={className}>
      <ReactMarkdown
        children={children}
        components={{
          code({node, inline, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const code = String(children).replace(/\n$/, '');
            
            // Render Mermaid diagrams
            if (!inline && language === 'mermaid') {
              return <MermaidDiagram chart={code} />;
            }
            
            // Render code blocks with syntax highlighting
            return !inline && match ? (
              <SyntaxHighlighter
                children={code}
                style={vscDarkPlus}
                language={language}
                PreTag="div"
                {...props}
              />
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }
        }}
        {...props}
      />
    </div>
  );
};

export default MarkdownRenderer;