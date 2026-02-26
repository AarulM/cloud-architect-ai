/**
 * Memory & Context Retention Manager
 * Maintains conversation context across entire consulting engagements
 */

class MemoryManager {
  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.conversationHistory = this.loadConversationHistory();
    this.contextData = this.loadContextData();
    this.engagementData = this.loadEngagementData();
  }

  // Session Management
  getOrCreateSessionId() {
    let sessionId = localStorage.getItem('consulting_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('consulting_session_id', sessionId);
    }
    return sessionId;
  }

  // Conversation History Management
  loadConversationHistory() {
    const stored = localStorage.getItem(`conversation_history_${this.sessionId}`);
    return stored ? JSON.parse(stored) : [];
  }

  saveConversationHistory() {
    localStorage.setItem(
      `conversation_history_${this.sessionId}`, 
      JSON.stringify(this.conversationHistory)
    );
  }

  addMessage(message) {
    const messageWithContext = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      ...message
    };
    
    this.conversationHistory.push(messageWithContext);
    this.saveConversationHistory();
    return messageWithContext;
  }

  getConversationHistory(limit = null) {
    if (limit) {
      return this.conversationHistory.slice(-limit);
    }
    return this.conversationHistory;
  }

  // Context Data Management
  loadContextData() {
    const stored = localStorage.getItem(`context_data_${this.sessionId}`);
    return stored ? JSON.parse(stored) : {
      businessContext: {},
      technicalRequirements: {},
      stakeholders: [],
      constraints: [],
      decisions: [],
      assumptions: []
    };
  }

  saveContextData() {
    localStorage.setItem(
      `context_data_${this.sessionId}`, 
      JSON.stringify(this.contextData)
    );
  }

  updateContext(category, data) {
    if (this.contextData[category]) {
      if (Array.isArray(this.contextData[category])) {
        this.contextData[category].push({
          ...data,
          timestamp: new Date().toISOString(),
          id: `${category}_${Date.now()}`
        });
      } else {
        this.contextData[category] = {
          ...this.contextData[category],
          ...data,
          lastUpdated: new Date().toISOString()
        };
      }
      this.saveContextData();
    }
  }

  getContext(category = null) {
    if (category) {
      return this.contextData[category] || null;
    }
    return this.contextData;
  }

  // Engagement Data Management
  loadEngagementData() {
    const stored = localStorage.getItem(`engagement_data_${this.sessionId}`);
    return stored ? JSON.parse(stored) : {
      startDate: new Date().toISOString(),
      phases: {},
      milestones: [],
      deliverables: [],
      status: 'active',
      metadata: {}
    };
  }

  saveEngagementData() {
    localStorage.setItem(
      `engagement_data_${this.sessionId}`, 
      JSON.stringify(this.engagementData)
    );
  }

  updateEngagement(data) {
    this.engagementData = {
      ...this.engagementData,
      ...data,
      lastUpdated: new Date().toISOString()
    };
    this.saveEngagementData();
  }

  // Phase Management
  updatePhaseData(phaseId, data) {
    if (!this.engagementData.phases[phaseId]) {
      this.engagementData.phases[phaseId] = {
        id: phaseId,
        startDate: new Date().toISOString(),
        status: 'in-progress'
      };
    }
    
    this.engagementData.phases[phaseId] = {
      ...this.engagementData.phases[phaseId],
      ...data,
      lastUpdated: new Date().toISOString()
    };
    
    this.saveEngagementData();
  }

  getPhaseData(phaseId) {
    return this.engagementData.phases[phaseId] || null;
  }

  // Context-Aware Message Generation
  generateContextualPrompt(currentMessage, phaseId = null) {
    const recentHistory = this.getConversationHistory(5);
    const context = this.getContext();
    const phaseData = phaseId ? this.getPhaseData(phaseId) : null;

    let contextualPrompt = currentMessage;

    // Add conversation history context
    if (recentHistory.length > 0) {
      contextualPrompt += "\n\n--- CONVERSATION CONTEXT ---\n";
      contextualPrompt += "Recent conversation history:\n";
      recentHistory.forEach((msg, index) => {
        contextualPrompt += `${index + 1}. ${msg.type}: ${msg.content.substring(0, 200)}...\n`;
      });
    }

    // Add business context
    if (context.businessContext && Object.keys(context.businessContext).length > 0) {
      contextualPrompt += "\n--- BUSINESS CONTEXT ---\n";
      Object.entries(context.businessContext).forEach(([key, value]) => {
        contextualPrompt += `${key}: ${value}\n`;
      });
    }

    // Add technical requirements
    if (context.technicalRequirements && Object.keys(context.technicalRequirements).length > 0) {
      contextualPrompt += "\n--- TECHNICAL REQUIREMENTS ---\n";
      Object.entries(context.technicalRequirements).forEach(([key, value]) => {
        contextualPrompt += `${key}: ${value}\n`;
      });
    }

    // Add constraints
    if (context.constraints && context.constraints.length > 0) {
      contextualPrompt += "\n--- CONSTRAINTS ---\n";
      context.constraints.forEach((constraint, index) => {
        contextualPrompt += `${index + 1}. ${constraint.description}\n`;
      });
    }

    // Add previous decisions
    if (context.decisions && context.decisions.length > 0) {
      contextualPrompt += "\n--- PREVIOUS DECISIONS ---\n";
      context.decisions.forEach((decision, index) => {
        contextualPrompt += `${index + 1}. ${decision.description} (Rationale: ${decision.rationale})\n`;
      });
    }

    // Add phase-specific context
    if (phaseData) {
      contextualPrompt += `\n--- CURRENT PHASE CONTEXT ---\n`;
      contextualPrompt += `Phase: ${phaseId}\n`;
      contextualPrompt += `Status: ${phaseData.status}\n`;
      if (phaseData.content) {
        contextualPrompt += `Previous content: ${phaseData.content.substring(0, 300)}...\n`;
      }
    }

    return contextualPrompt;
  }

  // Extract and Store Context from AI Responses
  extractContextFromResponse(response, phaseId = null) {
    // Simple keyword-based context extraction
    const businessKeywords = ['business', 'company', 'organization', 'stakeholder', 'objective', 'goal'];
    const technicalKeywords = ['architecture', 'service', 'database', 'security', 'performance', 'scalability'];
    const constraintKeywords = ['budget', 'timeline', 'compliance', 'regulation', 'limitation'];

    const words = response.toLowerCase().split(/\s+/);
    
    // Extract business context
    businessKeywords.forEach(keyword => {
      if (words.includes(keyword)) {
        const sentences = response.split(/[.!?]+/);
        const relevantSentences = sentences.filter(sentence => 
          sentence.toLowerCase().includes(keyword)
        );
        if (relevantSentences.length > 0) {
          this.updateContext('businessContext', {
            [keyword]: relevantSentences[0].trim()
          });
        }
      }
    });

    // Extract technical requirements
    technicalKeywords.forEach(keyword => {
      if (words.includes(keyword)) {
        const sentences = response.split(/[.!?]+/);
        const relevantSentences = sentences.filter(sentence => 
          sentence.toLowerCase().includes(keyword)
        );
        if (relevantSentences.length > 0) {
          this.updateContext('technicalRequirements', {
            [keyword]: relevantSentences[0].trim()
          });
        }
      }
    });

    // Extract constraints
    constraintKeywords.forEach(keyword => {
      if (words.includes(keyword)) {
        const sentences = response.split(/[.!?]+/);
        const relevantSentences = sentences.filter(sentence => 
          sentence.toLowerCase().includes(keyword)
        );
        if (relevantSentences.length > 0) {
          this.updateContext('constraints', {
            description: relevantSentences[0].trim(),
            type: keyword,
            source: phaseId || 'general'
          });
        }
      }
    });
  }

  // Session Management
  startNewEngagement() {
    // Archive current engagement
    this.archiveCurrentEngagement();
    
    // Create new session
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('consulting_session_id', this.sessionId);
    
    // Reset data
    this.conversationHistory = [];
    this.contextData = {
      businessContext: {},
      technicalRequirements: {},
      stakeholders: [],
      constraints: [],
      decisions: [],
      assumptions: []
    };
    this.engagementData = {
      startDate: new Date().toISOString(),
      phases: {},
      milestones: [],
      deliverables: [],
      status: 'active',
      metadata: {}
    };
    
    // Save new data
    this.saveConversationHistory();
    this.saveContextData();
    this.saveEngagementData();
  }

  archiveCurrentEngagement() {
    const archiveKey = `archived_engagement_${this.sessionId}`;
    const archiveData = {
      sessionId: this.sessionId,
      conversationHistory: this.conversationHistory,
      contextData: this.contextData,
      engagementData: this.engagementData,
      archivedAt: new Date().toISOString()
    };
    
    localStorage.setItem(archiveKey, JSON.stringify(archiveData));
    
    // Keep track of archived engagements
    const archivedList = JSON.parse(localStorage.getItem('archived_engagements') || '[]');
    archivedList.push({
      sessionId: this.sessionId,
      archivedAt: new Date().toISOString(),
      title: this.engagementData.metadata.title || 'Untitled Engagement'
    });
    localStorage.setItem('archived_engagements', JSON.stringify(archivedList));
  }

  getArchivedEngagements() {
    return JSON.parse(localStorage.getItem('archived_engagements') || '[]');
  }

  loadArchivedEngagement(sessionId) {
    const archiveKey = `archived_engagement_${sessionId}`;
    const archived = localStorage.getItem(archiveKey);
    return archived ? JSON.parse(archived) : null;
  }

  // Export engagement data
  exportEngagementData() {
    return {
      sessionId: this.sessionId,
      conversationHistory: this.conversationHistory,
      contextData: this.contextData,
      engagementData: this.engagementData,
      exportedAt: new Date().toISOString()
    };
  }

  // Import engagement data
  importEngagementData(data) {
    this.sessionId = data.sessionId;
    this.conversationHistory = data.conversationHistory || [];
    this.contextData = data.contextData || {};
    this.engagementData = data.engagementData || {};
    
    localStorage.setItem('consulting_session_id', this.sessionId);
    this.saveConversationHistory();
    this.saveContextData();
    this.saveEngagementData();
  }
}

// Create singleton instance
const memoryManager = new MemoryManager();

export default memoryManager;