/**
 * Centralized configuration for the frontend application
 */

// Runtime configuration that can be updated
let runtimeConfig = {
    backendUrl: process.env.REACT_APP_BACKEND_URL || 'http://localhost:3030'
};

// Production environment detection
const isProduction = process.env.NODE_ENV === 'production';

const config = {
    // API endpoints
    endpoints: {
        chat: '/chat',
        workflowPhase: '/workflow/phase',
        health: '/health',
        sessions: '/sessions',
        agentStatus: '/agent/status',
        upload: '/upload',

        // Enhanced endpoints for all 6 differentiators
        awsDocsQuery: '/aws-docs/query',
        wellArchitectedValidate: '/well-architected/validate',
        agentsList: '/agents/list',

        // Architecture specific endpoints
        architectureGenerate: '/workflow/architecture/generate',
        architectureRevise: '/workflow/architecture/revise',
        architectureQuestion: '/workflow/architecture/question',
        architectureGenerateCode: '/workflow/architecture/generate-code'
    },

    // Default request configuration
    defaultRequestConfig: {
        headers: {
            'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit'
    },

    // Production-specific settings
    production: {
        enableLogging: false,
        enableDebugMode: false,
        apiTimeout: 30000
    },

    // Development-specific settings
    development: {
        enableLogging: true,
        enableDebugMode: true,
        apiTimeout: 60000
    }
};

/**
 * Set the backend URL at runtime
 * @param {string} url - The new backend URL
 */
export const setBackendUrl = (url) => {
    runtimeConfig.backendUrl = url;
};

/**
 * Get the full URL for an API endpoint
 * @param {string} endpoint - The endpoint key from config.endpoints
 * @returns {string} - The full URL
 */
export const getApiUrl = (endpoint) => {
    const endpointPath = config.endpoints[endpoint];
    if (!endpointPath) {
        throw new Error(`Unknown endpoint: ${endpoint}`);
    }
    return `${runtimeConfig.backendUrl}${endpointPath}`;
};

/**
 * Get the backend base URL
 * @returns {string} - The backend base URL
 */
export const getBackendUrl = () => {
    return runtimeConfig.backendUrl;
};

/**
 * Get default request configuration
 * @returns {object} - Default fetch configuration
 */
export const getDefaultRequestConfig = () => {
    return { ...config.defaultRequestConfig };
};

export default config;