import { getBackendUrl, getApiUrl, getDefaultRequestConfig } from './config';

/**
 * Backend API client for communicating with the Flask backend
 * This removes the need for AWS credentials in the frontend
 */
class BackendClient {
  constructor(config = {}) {
    this.config = {
      baseUrl: config.baseUrl || getBackendUrl(),
      sessionId: config.sessionId || this.generateSessionId(),
      ...config
    };

    console.log("Backend client initialized:", this.config.baseUrl);
  }

  /**
   * Generate a unique session ID
   * @returns {string} A unique session ID (minimum 33 characters for AWS)
   */
  generateSessionId() {
    // Generate a longer session ID to meet AWS minimum length requirement (33+ chars)
    const randomPart = Math.random().toString(36).substr(2, 15);
    const timestamp = Date.now().toString();
    return `session-${randomPart}-${timestamp}`;
  }

  /**
   * Get the current session ID
   * @returns {string} The current session ID
   */
  getSessionId() {
    return this.config.sessionId;
  }

  /**
   * Set a new session ID
   * @param {string} sessionId - The new session ID
   */
  setSessionId(sessionId) {
    this.config.sessionId = sessionId;
  }

  /**
   * Force generate a new session ID and clear localStorage
   * @returns {string} The new session ID
   */
  forceNewSession() {
    const newSessionId = this.generateSessionId();
    this.config.sessionId = newSessionId;
    localStorage.removeItem('chatSessionId');
    localStorage.setItem('chatSessionId', newSessionId);
    console.log('Generated new session ID:', newSessionId, 'Length:', newSessionId.length);
    return newSessionId;
  }

  /**
   * Send a message to the agent via the backend API
   * @param {string} message - The message to send
   * @param {string} phase - Optional workflow phase
   * @returns {Promise<Object>} The agent's response
   */
  async sendMessage(message, phase = null) {
    try {
      console.log("Sending message to backend:", message, "Phase:", phase);

      // Use different endpoints based on whether it's a workflow phase or general chat
      const endpointKey = phase && phase !== 'general' ? 'workflowPhase' : 'chat';
      const url = getApiUrl(endpointKey);

      const response = await fetch(url, {
        method: 'POST',
        ...getDefaultRequestConfig(),
        body: JSON.stringify({
          message: message,
          session_id: this.config.sessionId,
          phase: phase
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      console.log("Backend response:", data);

      if (data.status === 'error') {
        throw new Error(data.error || 'Unknown error from backend');
      }

      // Update session ID if provided by backend
      if (data.session_id) {
        this.config.sessionId = data.session_id;
      }

      return {
        text: data.response || 'No response received',
        sourceCitations: [],
        sessionId: data.session_id
      };

    } catch (error) {
      console.error('Error communicating with backend:', error);

      // Provide helpful error messages
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to backend server. Make sure the backend is running on ' + this.config.baseUrl);
      }

      // Don't propagate MCP session conflict errors - backend handles retries
      if (error.message.includes('client session is currently running')) {
        console.log('MCP session conflict detected - backend will retry automatically');
        // Return a special error type that can be handled differently
        const mcpError = new Error('MCP_SESSION_CONFLICT');
        mcpError.type = 'MCP_SESSION_CONFLICT';
        throw mcpError;
      }

      throw error;
    }
  }

  /**
   * Check if the backend is healthy
   * @returns {Promise<Object>} Health status
   */
  async checkHealth() {
    try {
      const response = await fetch(getApiUrl('health'), {
        method: 'GET',
        ...getDefaultRequestConfig()
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);

      // Provide specific error message for mixed content issues
      if (error.message.includes('Mixed Content') ||
        (window.location.protocol === 'https:' && this.config.baseUrl.startsWith('http:'))) {
        throw new Error('Mixed Content: HTTPS frontend cannot connect to HTTP backend. Use HTTPS backend URL or access frontend via HTTP.');
      }

      throw error;
    }
  }

  /**
   * Get agent status
   * @returns {Promise<Object>} Agent status
   */
  async getAgentStatus() {
    try {
      const response = await fetch(getApiUrl('agentStatus'));

      if (!response.ok) {
        throw new Error(`Agent status check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Agent status check failed:', error);
      throw error;
    }
  }

  /**
   * Create a new session
   * @returns {Promise<Object>} New session info
   */
  async createNewSession() {
    try {
      const response = await fetch(getApiUrl('sessions'), {
        method: 'POST',
        ...getDefaultRequestConfig()
      });

      if (!response.ok) {
        throw new Error(`Session creation failed: ${response.status}`);
      }

      const data = await response.json();

      // Update our session ID
      if (data.session_id) {
        this.config.sessionId = data.session_id;
      }

      return data;
    } catch (error) {
      console.error('Session creation failed:', error);
      throw error;
    }
  }

  /**
   * Upload a file for context
   * @param {File} file - The file to upload
   * @returns {Promise<Object>} Upload result
   */
  async uploadContextFile(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(getApiUrl('upload'), {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
        }
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log(`File uploaded successfully: ${file.name}`);
      
      return {
        success: true,
        filename: result.filename,
        size: result.size,
        type: result.content_type,
        message: result.message,
        analysis: result.analysis
      };

    } catch (error) {
      console.error('File upload error:', error);
      return {
        success: false,
        error: error.message,
        filename: file.name
      };
    }
  }

  /**
   * Query AWS documentation via MCP
   * @param {string} query - The documentation query
   * @returns {Promise<Object>} Documentation results
   */
  async queryAwsDocs(query) {
    try {
      const response = await fetch(getApiUrl('awsDocsQuery'), {
        method: 'POST',
        ...getDefaultRequestConfig(),
        body: JSON.stringify({
          query: query,
          session_id: this.config.sessionId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('AWS docs query failed:', error);
      throw error;
    }
  }

  /**
   * Validate content against Well-Architected Framework
   * @param {string} content - Content to validate
   * @param {string} phase - Current workflow phase
   * @returns {Promise<Object>} Validation results
   */
  async validateWellArchitected(content, phase = null) {
    try {
      const response = await fetch(getApiUrl('wellArchitectedValidate'), {
        method: 'POST',
        ...getDefaultRequestConfig(),
        body: JSON.stringify({
          content: content,
          phase: phase,
          session_id: this.config.sessionId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Well-Architected validation failed:', error);
      throw error;
    }
  }

  /**
   * Get list of available AI agents
   * @returns {Promise<Object>} List of agents
   */
  async getAgentsList() {
    try {
      const response = await fetch(getApiUrl('agentsList'), {
        method: 'GET',
        ...getDefaultRequestConfig()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get agents list:', error);
      throw error;
    }
  }
}

export default BackendClient;