import { useEffect, useState } from 'react';

/**
 * MermaidDiagram component renders Mermaid diagrams
 * Uses a simple approach with dangerouslySetInnerHTML to avoid DOM conflicts
 */
const MermaidDiagram = ({ chart }) => {
  const [svgContent, setSvgContent] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chart || !chart.trim()) {
      setError('No chart data provided');
      setLoading(false);
      return;
    }

    loadMermaidAndRender();
  }, [chart]);

  const loadMermaidAndRender = async () => {
    try {
      setLoading(true);
      setError(null);
      setSvgContent('');

      // Load Mermaid if not already loaded
      if (!window.mermaid) {
        await loadMermaidScript();
      }

      // Initialize Mermaid with AWS theme
      window.mermaid.initialize({ 
        startOnLoad: false,
        theme: 'base',
        securityLevel: 'loose',
        fontFamily: 'Amazon Ember, system-ui, -apple-system, sans-serif',
        themeVariables: {
          // AWS Color Palette
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
          curve: 'basis',
          padding: 20,
          nodeSpacing: 50,
          rankSpacing: 80,
          diagramPadding: 20
        },
        gantt: {
          useMaxWidth: true,
          leftPadding: 75,
          gridLineStartPadding: 35,
          fontSize: 11,
          sectionFontSize: 11,
          numberSectionStyles: 4,
          axisFormat: '%m/%d',
          topPadding: 50,
          bottomPadding: 50,
          rightPadding: 100
        }
      });

      // Render the diagram
      await renderDiagram();
    } catch (err) {
      console.error('Mermaid error:', err);
      setError(`Failed to render diagram: ${err.message}`);
      setLoading(false);
    }
  };

  const loadMermaidScript = () => {
    return new Promise((resolve, reject) => {
      // Check if already loading
      const existingScript = document.querySelector('script[src*="mermaid"]');
      if (existingScript) {
        if (window.mermaid) {
          resolve();
        } else {
          existingScript.addEventListener('load', resolve);
          existingScript.addEventListener('error', reject);
        }
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const renderDiagram = async () => {
    if (!chart || !window.mermaid) return;

    try {
      // Clean the chart content
      const cleanChart = chart.trim();
      
      // Validate basic Mermaid syntax
      if (!cleanChart.includes('graph') && !cleanChart.includes('flowchart') && 
          !cleanChart.includes('sequenceDiagram') && !cleanChart.includes('classDiagram') &&
          !cleanChart.includes('gantt') && !cleanChart.includes('gitgraph') &&
          !cleanChart.includes('pie') && !cleanChart.includes('journey')) {
        throw new Error('Invalid Mermaid diagram syntax');
      }
      
      // Generate unique ID
      const id = `mermaid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Render the diagram
      const { svg } = await window.mermaid.render(id, cleanChart);
      
      setSvgContent(svg);
      setLoading(false);
    } catch (err) {
      throw new Error(`Rendering failed: ${err.message}`);
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
        <div className="flex items-center mb-2">
          <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-red-600 text-sm font-medium">Diagram Error</p>
        </div>
        <p className="text-red-600 text-sm mb-2">{error}</p>
        <details className="mt-2">
          <summary className="text-xs text-gray-600 cursor-pointer">Show diagram source</summary>
          <pre className="mt-2 text-xs text-gray-600 overflow-auto bg-gray-100 p-2 rounded">{chart}</pre>
        </details>
      </div>
    );
  }

  return (
    <div className="my-6 p-6 bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl shadow-lg overflow-auto">
      <div className="mb-4 flex items-center">
        <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
        <div className="text-sm text-gray-700 font-semibold">
          {chart && chart.includes('gantt') ? 'AWS Implementation Timeline' : 'AWS Architecture Diagram'}
        </div>
      </div>
      <div 
        className="flex justify-center items-center min-h-[300px] bg-white rounded-lg border border-gray-100 p-4"
        style={{
          fontFamily: 'Amazon Ember, system-ui, -apple-system, sans-serif'
        }}
      >
        {loading ? (
          <div className="flex items-center text-gray-400">
            <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-600">
              {chart && chart.includes('gantt') ? 'Generating AWS implementation timeline...' : 'Generating AWS architecture diagram...'}
            </span>
          </div>
        ) : (
          <div 
            className="w-full flex justify-center"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}
      </div>
      <div className="mt-3 text-xs text-gray-500 text-center">
        {chart && chart.includes('gantt') ? 'Interactive AWS implementation timeline' : 'Interactive AWS architecture visualization'}
      </div>
    </div>
  );
};

export default MermaidDiagram;
