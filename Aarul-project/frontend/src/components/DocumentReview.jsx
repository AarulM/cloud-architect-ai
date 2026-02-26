import React, { useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

/**
 * Document Review Component
 * Compile all workflow phases into a comprehensive document and provide export options
 */
const DocumentReview = ({ 
  sessionId, 
  onComplete, 
  onUpdate,
  isActive = false,
  workflowData = {},
  existingData = null
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [compiledDocument, setCompiledDocument] = useState(existingData?.document || '');
  const [currentStep, setCurrentStep] = useState(
    existingData?.document ? 'review' : 'compile'
  );

  const compileDocument = () => {
    setIsLoading(true);
    
    try {
      // Compile document from existing workflow data without making API calls
      const documentSections = [];
      
      // Title and metadata
      documentSections.push('# AWS Architecture Analysis Report');
      documentSections.push(`**Generated:** ${new Date().toLocaleDateString()}`);
      documentSections.push('---\n');
      
      // Executive Summary
      if (workflowData['executive-summary']?.content) {
        documentSections.push('## Executive Summary');
        documentSections.push(workflowData['executive-summary'].content);
        documentSections.push('');
      }
      
      // Requirements Analysis
      if (workflowData.requirements?.summary) {
        documentSections.push('## Requirements Analysis');
        documentSections.push(workflowData.requirements.summary);
        documentSections.push('');
      }
      
      // Architecture Design
      if (workflowData.architecture?.content) {
        documentSections.push('## Architecture Design');
        documentSections.push(workflowData.architecture.content);
        documentSections.push('');
      }
      
      // Security Analysis
      if (workflowData.security?.content) {
        documentSections.push('## Security Analysis');
        documentSections.push(workflowData.security.content);
        documentSections.push('');
      }
      
      // Cost Analysis
      if (workflowData.cost?.content) {
        documentSections.push('## Cost Analysis');
        documentSections.push(workflowData.cost.content);
        documentSections.push('');
      }
      
      // Implementation Plan
      if (workflowData.implementation?.content) {
        documentSections.push('## Implementation Plan');
        documentSections.push(workflowData.implementation.content);
        documentSections.push('');
      }
      
      // Strategic Recommendations
      if (workflowData.recommendations?.content) {
        documentSections.push('## Strategic Recommendations');
        documentSections.push(workflowData.recommendations.content);
        documentSections.push('');
      }
      
      // Add conclusion if we have content
      if (documentSections.length > 3) {
        documentSections.push('## Conclusion');
        documentSections.push('This comprehensive analysis provides a roadmap for implementing a robust, secure, and cost-effective AWS architecture. The recommendations outlined above should be prioritized based on business requirements and available resources.');
      }
      
      const compiledDoc = documentSections.join('\n\n');
      
      setCompiledDocument(compiledDoc);
      setCurrentStep('review');
      onUpdate && onUpdate({ 
        phase: 'document-review', 
        status: 'completed',
        document: compiledDoc
      });
      
    } catch (error) {
      console.error('Error compiling document:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadWordDocument = async () => {
    try {
      // Wait for Mermaid diagrams to render
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Capture all rendered Mermaid diagrams as SVG
      const mermaidElements = document.querySelectorAll('.mermaid svg');
      const diagramSVGs = [];
      
      mermaidElements.forEach((svg, index) => {
        // Clean up the SVG for Word compatibility
        const svgClone = svg.cloneNode(true);
        svgClone.setAttribute('width', '600');
        svgClone.setAttribute('height', '400');
        diagramSVGs.push({
          index,
          svg: svgClone.outerHTML
        });
      });

      // Create a professional HTML document with embedded SVG diagrams
      let processedContent = compiledDocument;
      let diagramCounter = 0;
      
      // Replace Mermaid code blocks with actual SVG diagrams
      processedContent = processedContent.replace(/```mermaid\n([\s\S]*?)\n```/g, (match, diagramCode) => {
        const svgDiagram = diagramSVGs[diagramCounter];
        diagramCounter++;
        
        if (svgDiagram) {
          const diagramType = diagramCode.includes('gantt') ? 'Implementation Timeline' : 'Architecture Diagram';
          return `\n\n<div class="diagram-container">
            <h4 class="diagram-title">🏗️ AWS ${diagramType} ${diagramCounter}</h4>
            ${svgDiagram.svg}
          </div>\n\n`;
        } else {
          const diagramType = diagramCode.includes('gantt') ? 'Implementation Timeline' : 'Architecture Diagram';
          return `\n\n<div class="diagram-placeholder">
            <h4>🏗️ AWS ${diagramType} ${diagramCounter}</h4>
            <p><em>Diagram will be rendered when viewed in the application</em></p>
          </div>\n\n`;
        }
      });

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>AWS Architecture Analysis</title>
          <style>
            body { 
              font-family: 'Calibri', Arial, sans-serif; 
              line-height: 1.6; 
              margin: 40px; 
              color: #333;
              max-width: 8.5in;
            }
            .header { 
              text-align: center; 
              margin-bottom: 40px; 
              border-bottom: 3px solid #FF9900;
              padding-bottom: 20px;
            }
            .header h1 { 
              color: #FF9900; 
              font-size: 28px;
              margin-bottom: 10px;
            }
            .header p { 
              color: #666; 
              font-size: 14px;
            }
            .aws-logo {
              color: #FF9900;
              font-weight: bold;
              font-size: 16px;
            }
            h1 { 
              color: #FF9900; 
              border-bottom: 2px solid #FF9900; 
              padding-bottom: 10px; 
              margin-top: 30px;
              page-break-after: avoid;
            }
            h2 { 
              color: #232F3E; 
              margin-top: 25px; 
              border-left: 4px solid #FF9900;
              padding-left: 15px;
              page-break-after: avoid;
            }
            h3 { 
              color: #232F3E; 
              margin-top: 20px; 
              page-break-after: avoid;
            }
            p { 
              margin-bottom: 15px; 
              text-align: justify;
            }
            ul, ol { 
              margin-bottom: 15px; 
              padding-left: 25px;
            }
            li { 
              margin-bottom: 8px; 
            }
            .section { 
              margin-bottom: 30px; 
              page-break-inside: avoid;
            }
            .diagram-container {
              margin: 30px 0;
              padding: 20px;
              background: #f8f9fa;
              border: 2px solid #FF9900;
              border-radius: 8px;
              text-align: center;
              page-break-inside: avoid;
            }
            .diagram-title {
              font-weight: bold;
              color: #FF9900;
              margin-bottom: 15px;
              font-size: 16px;
            }
            .diagram-placeholder {
              margin: 30px 0;
              padding: 30px;
              background: #fff3e0;
              border: 2px dashed #FF9900;
              border-radius: 8px;
              text-align: center;
            }
            .diagram-note {
              background-color: #fff3cd;
              border: 1px solid #ffc107;
              padding: 15px;
              margin: 15px 0;
              border-radius: 5px;
              border-left: 4px solid #FF9900;
            }
            .footer { 
              color: #666; 
              font-size: 12px; 
              margin-top: 40px; 
              border-top: 1px solid #ccc; 
              padding-top: 15px; 
              text-align: center;
              page-break-inside: avoid;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
              page-break-inside: avoid;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #f8f9fa;
              font-weight: bold;
            }
            .highlight {
              background-color: #fff3cd;
              padding: 15px;
              border-left: 4px solid #ffc107;
              margin: 15px 0;
            }
            .aws-service {
              background-color: #f0f9ff;
              padding: 3px 8px;
              border-radius: 4px;
              font-family: monospace;
              font-size: 0.9em;
            }
            @page {
              margin: 1in;
            }
            @media print {
              body { margin: 0; }
              .page-break { page-break-before: always; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="aws-logo">⚡ AWS Solutions Architecture</div>
            <h1>Architecture Analysis Report</h1>
            <p>Comprehensive Analysis and Recommendations</p>
            <p>Generated on ${new Date().toLocaleDateString()} | Powered by AWS Bedrock & Claude AI</p>
          </div>
          
          <div class="diagram-note">
            <strong>📊 AWS Architecture Diagrams:</strong> This document contains embedded AWS architecture diagrams 
            rendered as high-quality SVG graphics. All diagrams use official AWS colors and styling for professional presentation.
          </div>
          
          <div class="content">
            ${processedContent
              .replace(/\n/g, '<br>')
              .replace(/#{6}\s(.*?)(<br>|$)/g, '<h6>$1</h6>')
              .replace(/#{5}\s(.*?)(<br>|$)/g, '<h5>$1</h5>')
              .replace(/#{4}\s(.*?)(<br>|$)/g, '<h4>$1</h4>')
              .replace(/#{3}\s(.*?)(<br>|$)/g, '<h3>$1</h3>')
              .replace(/#{2}\s(.*?)(<br>|$)/g, '<h2>$1</h2>')
              .replace(/#{1}\s(.*?)(<br>|$)/g, '<h1>$1</h1>')
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
              .replace(/`(.*?)`/g, '<code class="aws-service">$1</code>')
              .replace(/^- (.*?)(<br>|$)/gm, '<li>$1</li>')
              .replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>')
              .replace(/^\d+\. (.*?)(<br>|$)/gm, '<li>$1</li>')
              .replace(/(<br>){2,}/g, '</p><p>')
              .replace(/^(?!<[h|u|o|l])/gm, '<p>')
              .replace(/(<br>)$/gm, '</p>')
              .replace(/\[AWS Architecture Diagram \d+\]/g, '')
            }
          </div>
          
          <div class="page-break"></div>
          
          <div class="footer">
            <p><strong>AWS Architecture Analysis Report</strong></p>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <p>Tools: AWS Bedrock, Claude 3.5 Sonnet, React, Mermaid.js</p>
            <p>⚡ Powered by AWS Cloud Services</p>
          </div>
        </body>
        </html>
      `;

      // Create and download the file
      const blob = new Blob([htmlContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AWS_Architecture_Analysis_${new Date().toISOString().split('T')[0]}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Show success message
      alert('✅ Word document downloaded successfully!\n\n📊 All AWS architecture diagrams are embedded as high-quality SVG graphics.');
      
    } catch (error) {
      console.error('Error creating Word document:', error);
      alert('❌ Error creating Word document. Please try again.');
    }
  };

  const downloadPDF = async () => {
    try {
      // Wait for Mermaid diagrams to render
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create an enhanced HTML file with embedded Mermaid diagrams for PDF export
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>AWS Architecture Analysis</title>
          <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
          <style>
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
              .page-break { page-break-before: always; }
              .mermaid { 
                page-break-inside: avoid; 
                margin: 20px 0;
                display: flex;
                justify-content: center;
              }
              .diagram-container {
                page-break-inside: avoid;
                margin: 20px 0;
              }
            }
            @media screen {
              .print-instructions {
                background: #f0f9ff;
                border: 2px solid #FF9900;
                padding: 20px;
                margin: 20px 0;
                border-radius: 8px;
                text-align: center;
              }
            }
            body { 
              font-family: 'Arial', 'Helvetica', sans-serif; 
              line-height: 1.6; 
              margin: 20px; 
              color: #333;
              max-width: 8.5in;
              margin: 0 auto;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 3px solid #FF9900;
              padding-bottom: 20px;
              page-break-after: avoid;
            }
            .header h1 { 
              color: #FF9900; 
              font-size: 28px;
              margin-bottom: 10px;
            }
            .aws-logo {
              color: #FF9900;
              font-weight: bold;
              font-size: 18px;
              margin-bottom: 10px;
            }
            h1 { 
              color: #FF9900; 
              border-bottom: 2px solid #FF9900; 
              padding-bottom: 10px; 
              margin-top: 30px;
              page-break-after: avoid;
            }
            h2 { 
              color: #232F3E; 
              margin-top: 25px; 
              border-left: 4px solid #FF9900;
              padding-left: 15px;
              page-break-after: avoid;
            }
            h3 { 
              color: #232F3E; 
              margin-top: 20px; 
              page-break-after: avoid;
            }
            p { 
              margin-bottom: 15px; 
              text-align: justify;
            }
            ul, ol { 
              margin-bottom: 15px; 
              padding-left: 25px;
            }
            li { 
              margin-bottom: 8px; 
            }
            .mermaid {
              text-align: center;
              margin: 30px 0;
              padding: 20px;
              background: #f8f9fa;
              border-radius: 8px;
              border: 1px solid #e9ecef;
              page-break-inside: avoid;
            }
            .diagram-container {
              margin: 30px 0;
              padding: 20px;
              background: #f8f9fa;
              border: 2px solid #FF9900;
              border-radius: 8px;
              text-align: center;
              page-break-inside: avoid;
            }
            .diagram-title {
              font-weight: bold;
              color: #FF9900;
              margin-bottom: 15px;
              text-align: center;
              font-size: 16px;
            }
            .aws-service {
              background-color: #f0f9ff;
              padding: 2px 6px;
              border-radius: 3px;
              font-family: monospace;
              font-size: 0.9em;
            }
            code {
              background-color: #f1f3f4;
              padding: 2px 4px;
              border-radius: 3px;
              font-family: monospace;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #FF9900;
              text-align: center;
              color: #666;
              font-size: 12px;
              page-break-inside: avoid;
            }
            .tech-stack {
              background: #f8f9fa;
              border: 1px solid #dee2e6;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .tech-category {
              margin-bottom: 15px;
            }
            .tech-category h4 {
              color: #FF9900;
              margin-bottom: 8px;
              font-size: 14px;
            }
            .tech-list {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
            }
            .tech-item {
              background: #e3f2fd;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              border: 1px solid #bbdefb;
            }
            .aws-tech {
              background: #fff3e0;
              border-color: #ffcc02;
            }
          </style>
        </head>
        <body>
          <div class="print-instructions no-print">
            <div class="aws-logo">⚡ AWS Architecture Analysis</div>
            <strong>📄 PDF Export Ready</strong><br>
            Press <kbd>Ctrl+P</kbd> (or <kbd>Cmd+P</kbd> on Mac), then select "Save as PDF" as the destination.<br>
            <small>All diagrams are embedded and will be preserved in the PDF.</small>
          </div>
          
          <div class="header">
            <div class="aws-logo">⚡ AWS Solutions Architecture</div>
            <h1>Architecture Analysis Report</h1>
            <p><strong>Comprehensive Analysis and Recommendations</strong></p>
            <p>Generated on ${new Date().toLocaleDateString()} | Powered by AWS Bedrock & Claude AI</p>
          </div>
          
          <div class="content">
            ${compiledDocument
              .replace(/\n/g, '<br>')
              .replace(/```mermaid\n([\s\S]*?)\n```/g, (match, diagramCode) => {
                const diagramType = diagramCode.includes('gantt') ? 'Implementation Timeline' : 'Architecture Diagram';
                return `<div class="diagram-container">
                  <div class="diagram-title">🏗️ AWS ${diagramType}</div>
                  <div class="mermaid">${diagramCode.trim()}</div>
                </div>`;
              })
              .replace(/#{6}\s(.*?)(<br>|$)/g, '<h6>$1</h6>')
              .replace(/#{5}\s(.*?)(<br>|$)/g, '<h5>$1</h5>')
              .replace(/#{4}\s(.*?)(<br>|$)/g, '<h4>$1</h4>')
              .replace(/#{3}\s(.*?)(<br>|$)/g, '<h3>$1</h3>')
              .replace(/#{2}\s(.*?)(<br>|$)/g, '<h2>$1</h2>')
              .replace(/#{1}\s(.*?)(<br>|$)/g, '<h1>$1</h1>')
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
              .replace(/`([^`]+)`/g, '<code class="aws-service">$1</code>')
              .replace(/^- (.*?)(<br>|$)/gm, '<li>$1</li>')
              .replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>')
              .replace(/^\d+\. (.*?)(<br>|$)/gm, '<li>$1</li>')
              .replace(/(<br>){2,}/g, '</p><p>')
              .replace(/^(?!<[h|u|o|l|d])/gm, '<p>')
              .replace(/(<br>)$/gm, '</p>')
            }
          </div>
          
          <div class="page-break"></div>
          
          <div class="tech-stack">
            <h3 style="color: #FF9900; text-align: center; margin-bottom: 20px;">🛠️ Technology Stack & Tools Used</h3>
            
            <div class="tech-category">
              <h4>☁️ AWS Services</h4>
              <div class="tech-list">
                <span class="tech-item aws-tech">Amazon Bedrock</span>
                <span class="tech-item aws-tech">Claude 3.5 Sonnet v2</span>
                <span class="tech-item aws-tech">AWS IAM</span>
                <span class="tech-item aws-tech">AWS CLI</span>
                <span class="tech-item aws-tech">Boto3 SDK</span>
                <span class="tech-item aws-tech">AWS CloudWatch</span>
                <span class="tech-item aws-tech">AWS Secrets Manager</span>
              </div>
            </div>
            
            <div class="tech-category">
              <h4>⚛️ Frontend Technologies</h4>
              <div class="tech-list">
                <span class="tech-item">React 18.2.0</span>
                <span class="tech-item">JavaScript (ES6+)</span>
                <span class="tech-item">Tailwind CSS</span>
                <span class="tech-item">React Markdown</span>
                <span class="tech-item">Mermaid.js</span>
                <span class="tech-item">React Syntax Highlighter</span>
                <span class="tech-item">HTML5 & CSS3</span>
              </div>
            </div>
            
            <div class="tech-category">
              <h4>🔧 Backend Technologies</h4>
              <div class="tech-list">
                <span class="tech-item">Python 3.9+</span>
                <span class="tech-item">Flask 3.1.2</span>
                <span class="tech-item">Flask-CORS</span>
                <span class="tech-item">Boto3</span>
                <span class="tech-item">Botocore</span>
                <span class="tech-item">JSON</span>
                <span class="tech-item">UUID</span>
              </div>
            </div>
            
            <div class="tech-category">
              <h4>🔨 Development Tools</h4>
              <div class="tech-list">
                <span class="tech-item">Node.js</span>
                <span class="tech-item">npm</span>
                <span class="tech-item">Create React App</span>
                <span class="tech-item">PostCSS</span>
                <span class="tech-item">Autoprefixer</span>
                <span class="tech-item">ESLint</span>
              </div>
            </div>
            
            <div class="tech-category">
              <h4>📊 Visualization & Export</h4>
              <div class="tech-list">
                <span class="tech-item">Mermaid Diagrams</span>
                <span class="tech-item">SVG Graphics</span>
                <span class="tech-item">HTML Export</span>
                <span class="tech-item">PDF Generation</span>
                <span class="tech-item">Word Document Export</span>
                <span class="tech-item">Markdown Processing</span>
              </div>
            </div>
            
            <div class="tech-category">
              <h4>🔐 Security & Authentication</h4>
              <div class="tech-list">
                <span class="tech-item aws-tech">AWS IAM Policies</span>
                <span class="tech-item aws-tech">AWS Access Keys</span>
                <span class="tech-item">CORS Configuration</span>
                <span class="tech-item">Secure API Communication</span>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>AWS Architecture Analysis Report</strong></p>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <p><strong>Powered by:</strong> AWS Bedrock | Claude 3.5 Sonnet | React | Mermaid.js</p>
            <p>⚡ <strong>AWS Solutions Architecture Tool</strong> ⚡</p>
          </div>
          
          <script>
            // Initialize Mermaid for diagram rendering
            mermaid.initialize({ 
              startOnLoad: true,
              theme: 'base',
              securityLevel: 'loose',
              fontFamily: 'Arial, sans-serif',
              themeVariables: {
                primaryColor: '#FF9900',
                primaryTextColor: '#FFFFFF',
                primaryBorderColor: '#FF6600',
                lineColor: '#232F3E',
                sectionBkgColor: '#F2F3F3',
                altSectionBkgColor: '#FFFFFF',
                gridColor: '#E5E5E5',
                secondaryColor: '#232F3E',
                tertiaryColor: '#FAFAFA',
                background: '#FFFFFF',
                mainBkg: '#FFFFFF',
                secondBkg: '#F2F3F3',
                tertiaryBkg: '#FAFAFA'
              },
              flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
                curve: 'basis'
              },
              gantt: {
                useMaxWidth: true,
                leftPadding: 75,
                gridLineStartPadding: 35,
                fontSize: 11,
                sectionFontSize: 11,
                numberSectionStyles: 4
              }
            });
            
            // Auto-print functionality (optional)
            window.addEventListener('load', function() {
              // Give Mermaid time to render
              setTimeout(function() {
                console.log('Document ready for PDF export with embedded diagrams');
              }, 3000);
            });
          </script>
        </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Show instructions
      setTimeout(() => {
        alert('✅ PDF export window opened!\n\n📄 Instructions:\n1. Wait for diagrams to load (3-4 seconds)\n2. Press Ctrl+P (Cmd+P on Mac)\n3. Select "Save as PDF"\n4. Choose your preferred settings\n5. Click "Save"\n\n🎨 All AWS architecture diagrams are embedded!');
      }, 1000);
      
    } catch (error) {
      console.error('Error creating PDF:', error);
      alert('❌ Error creating PDF export. Please try again.');
    }
  };

  const exportDiagramsOnly = async () => {
    try {
      // Extract all Mermaid diagrams from the document
      const mermaidMatches = compiledDocument.match(/```mermaid\n([\s\S]*?)\n```/g);
      
      if (!mermaidMatches || mermaidMatches.length === 0) {
        alert('ℹ️ No architecture diagrams found in the document.');
        return;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>AWS Architecture Diagrams</title>
          <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
          <style>
            body { 
              font-family: 'Arial', sans-serif; 
              margin: 20px; 
              background: #f8f9fa;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding: 20px;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .diagram-container {
              background: white;
              margin: 30px 0;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              page-break-inside: avoid;
            }
            .diagram-title {
              font-size: 18px;
              font-weight: bold;
              color: #FF9900;
              margin-bottom: 20px;
              text-align: center;
              border-bottom: 2px solid #FF9900;
              padding-bottom: 10px;
            }
            .mermaid {
              text-align: center;
              margin: 20px 0;
            }
            .export-note {
              background: #e3f2fd;
              border: 1px solid #2196f3;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
              text-align: center;
            }
            @media print {
              body { background: white; margin: 0; }
              .export-note { display: none; }
              .diagram-container { 
                page-break-inside: avoid; 
                margin: 20px 0;
                box-shadow: none;
                border: 1px solid #ddd;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="color: #FF9900;">🏗️ AWS Architecture Diagrams</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="export-note">
            <strong>📄 Export Instructions:</strong> Press Ctrl+P (Cmd+P on Mac) and select "Save as PDF" to export all diagrams.
          </div>
          
          ${mermaidMatches.map((match, index) => {
            const diagramCode = match.replace(/```mermaid\n/, '').replace(/\n```$/, '');
            const diagramType = diagramCode.includes('gantt') ? 'Implementation Timeline' : 'Architecture Diagram';
            return `
              <div class="diagram-container">
                <div class="diagram-title">AWS ${diagramType} ${index + 1}</div>
                <div class="mermaid">${diagramCode.trim()}</div>
              </div>
            `;
          }).join('')}
          
          <script>
            mermaid.initialize({ 
              startOnLoad: true,
              theme: 'base',
              securityLevel: 'loose',
              fontFamily: 'Arial, sans-serif',
              themeVariables: {
                primaryColor: '#FF9900',
                primaryTextColor: '#FFFFFF',
                primaryBorderColor: '#FF6600',
                lineColor: '#232F3E',
                sectionBkgColor: '#F2F3F3',
                altSectionBkgColor: '#FFFFFF',
                gridColor: '#E5E5E5',
                secondaryColor: '#232F3E',
                tertiaryColor: '#FAFAFA'
              },
              flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
                curve: 'basis'
              },
              gantt: {
                useMaxWidth: true,
                leftPadding: 75,
                gridLineStartPadding: 35,
                fontSize: 11,
                sectionFontSize: 11,
                numberSectionStyles: 4,
                axisFormat: '%m/%d'
              }
            });
          </script>
        </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      setTimeout(() => {
        const diagramCount = mermaidMatches.length;
        const hasGantt = mermaidMatches.some(match => match.includes('gantt'));
        const diagramTypes = hasGantt ? 'architecture diagrams and implementation timelines' : 'architecture diagrams';
        alert(`✅ Diagrams export opened!\n\nFound ${diagramCount} ${diagramTypes}.\n\n📄 To save as PDF:\n1. Wait for diagrams to render\n2. Press Ctrl+P (Cmd+P on Mac)\n3. Select "Save as PDF"`);
      }, 1000);
      
    } catch (error) {
      console.error('Error exporting diagrams:', error);
      alert('❌ Error exporting diagrams. Please try again.');
    }
  };

  if (!isActive) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <i className="fas fa-file-export text-4xl text-gray-400 mb-4"></i>
        <h3 className="text-lg font-medium text-gray-600 mb-2">Document Review</h3>
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
            <i className="fas fa-file-export text-2xl text-purple-600"></i>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Document Review</h3>
              <p className="text-sm text-gray-600">Review complete analysis and export final document</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {currentStep === 'compile' ? (
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                <i className="fas fa-cogs mr-1"></i>
                Ready to Compile
              </div>
            ) : (
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                <i className="fas fa-check mr-1"></i>
                Complete
              </div>
            )}
          </div>
        </div>

        {/* Compile Phase */}
        {currentStep === 'compile' && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="mb-6">
                <i className="fas fa-file-contract text-4xl text-purple-600 mb-4"></i>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  Compile Final Document
                </h4>
                <p className="text-gray-600">
                  Generate a comprehensive document from all workflow phases
                </p>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-medium text-blue-900 mb-2">Document will include:</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Requirements Analysis</li>
                <li>• Executive Summary</li>
                <li>• Architecture Design</li>
                <li>• Security Analysis</li>
                <li>• Cost Analysis</li>
                <li>• Implementation Plan</li>
                <li>• Strategic Recommendations</li>
              </ul>
            </div>

            <button
              onClick={compileDocument}
              disabled={isLoading}
              className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Compiling Document...
                </>
              ) : (
                <>
                  <i className="fas fa-magic mr-2"></i>
                  Compile Final Document
                </>
              )}
            </button>
          </div>
        )}

        {/* Review Phase */}
        {currentStep === 'review' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-800">
                <i className="fas fa-file-alt mr-2 text-green-600"></i>
                Document Compilation Complete
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
            
            {compiledDocument && (
              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <MarkdownRenderer className="markdown-content text-sm">
                    {compiledDocument}
                  </MarkdownRenderer>
                </div>
                
                {existingData?.timestamp && (
                  <div className="text-xs text-gray-500 flex items-center space-x-2">
                    <i className="fas fa-clock"></i>
                    <span>Completed: {new Date(existingData.timestamp).toLocaleString()}</span>
                  </div>
                )}
                
                <div className="space-y-3">
                  {/* Primary Export Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={downloadWordDocument}
                      className="px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <i className="fas fa-file-word mr-2"></i>
                      Download Word Document
                    </button>
                    
                    <button
                      onClick={downloadPDF}
                      className="px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center"
                    >
                      <i className="fas fa-file-pdf mr-2"></i>
                      Export as PDF
                    </button>
                  </div>

                  {/* Diagram Export */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-green-900 mb-1">🏗️ Architecture Diagrams</h5>
                        <p className="text-sm text-green-700">All AWS architecture diagrams are embedded in Word and PDF exports</p>
                      </div>
                      <button
                        onClick={exportDiagramsOnly}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center"
                      >
                        <i className="fas fa-project-diagram mr-2"></i>
                        View Diagrams Only
                      </button>
                    </div>
                  </div>

                  {/* Secondary Actions */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(compiledDocument);
                        alert('✅ Document copied to clipboard!');
                      }}
                      className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                    >
                      <i className="fas fa-copy mr-2"></i>
                      Copy Text
                    </button>
                    
                    <button
                      onClick={() => {
                        setCurrentStep('compile');
                        setCompiledDocument('');
                      }}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
                    >
                      <i className="fas fa-redo mr-2"></i>
                      Regenerate
                    </button>

                    <button
                      onClick={() => onComplete && onComplete(compiledDocument)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      <i className="fas fa-plus mr-2"></i>
                      New Workflow
                    </button>
                  </div>
                  
                  {/* Technology Stack Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <h5 className="font-medium text-blue-900 mb-2">🛠️ Technology Stack Included</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div className="text-blue-800">
                        <strong>AWS:</strong><br />
                        • Bedrock<br />
                        • Claude AI<br />
                        • IAM<br />
                        • CLI
                      </div>
                      <div className="text-blue-800">
                        <strong>Frontend:</strong><br />
                        • React 18<br />
                        • Tailwind CSS<br />
                        • Mermaid.js<br />
                        • JavaScript
                      </div>
                      <div className="text-blue-800">
                        <strong>Backend:</strong><br />
                        • Python 3.9+<br />
                        • Flask<br />
                        • Boto3<br />
                        • CORS
                      </div>
                      <div className="text-blue-800">
                        <strong>Export:</strong><br />
                        • PDF/Word<br />
                        • SVG Diagrams<br />
                        • HTML<br />
                        • Markdown
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentReview;
