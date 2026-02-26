# Simplified Backend API with AWS MCP Integration

## Overview

This simplified backend API directly leverages the MCP server initialized in `strands_entry.py` to provide AWS-specific recommendations and documentation access in chat responses. The API has been streamlined to reduce complexity while maintaining all core functionality.

## Key Improvements

1. **Direct MCP Integration**
   - Now directly imports and uses the `strands_agent_bedrock` function from `strands_entry.py`
   - AWS documentation capabilities are available in all chat responses
   - Responses include AWS recommendations pulled from the MCP server

2. **API Simplification**
   - Reduced endpoint count from 10+ to 4 core endpoints
   - Consolidated all workflow phase endpoints into a single unified endpoint
   - Removed duplicate code for response processing
   - Simplified error handling and logging

3. **Enhanced AWS Capabilities**
   - All chat responses now have access to:
     - AWS documentation search
     - AWS documentation reading
     - AWS service recommendations
     - Well-Architected Framework guidance

## API Endpoints

### Core Endpoints

- `GET /health` - Health check and MCP integration status
- `POST /chat` - Send message to agent with MCP capabilities
- `POST /sessions` - Create new session
- `POST /workflow/phase` - Unified workflow phase endpoint (replaces multiple phase-specific endpoints)

### Example Usage

#### Chat Endpoint

```bash
curl -X POST http://localhost:3030/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "session_id": "test-session", 
    "message": "What are the best practices for S3 bucket naming?",
    "phase": "general"
  }'
```

#### Unified Workflow Phase Endpoint

```bash
curl -X POST http://localhost:3030/workflow/phase \
  -H 'Content-Type: application/json' \
  -d '{
    "session_id": "test-session", 
    "phase": "requirements", 
    "message": "Start requirements gathering for an e-commerce platform"
  }'
```

## How It Works

1. When a request is received at any endpoint, the API passes the request to `strands_agent_bedrock` 
2. The `strands_agent_bedrock` function utilizes the MCP server to access AWS documentation
3. The MCP server provides AWS-specific recommendations and documentation
4. The response is returned to the frontend with AWS-enriched information

## Phase Support

The API continues to support all specialized agent phases defined in `strands_entry.py`:

- `requirements` - Requirements gathering phase
- `architecture` - Architecture design phase
- `validation` - Architecture validation phase
- `implementation` - Implementation planning phase
- `general` - Default phase when none specified
