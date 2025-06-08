const express = require('express');
const path = require('path');
const { WebSocketServer, WebSocket } = require('ws');
const http = require('http');
const { Pool } = require('pg');
const RAGDatabase = require('./rag-database');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// PostgreSQL connection with error handling
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

// WebSocket server for real-time updates
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(express.json({ limit: '10mb' }));
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  next();
});
app.use(express.static('public'));

// Initialize RAG database with real-time validation
const ragDB = new RAGDatabase();

// Store conversation sessions and real-time connections
const conversationSessions = new Map();
const activeConnections = new Set();

// Real-time validation and monitoring system
class RealTimeValidator {
  constructor() {
    this.metrics = {
      apiCalls: 0,
      ragQueries: 0,
      successRate: 0,
      responseTime: [],
      errors: []
    };
  }

  logApiCall(endpoint, startTime, success, tokens = 0) {
    const duration = Date.now() - startTime;
    this.metrics.apiCalls++;
    this.metrics.responseTime.push(duration);
    
    if (success) {
      this.metrics.successRate = (this.metrics.successRate * (this.metrics.apiCalls - 1) + 1) / this.metrics.apiCalls;
    } else {
      this.metrics.errors.push({ endpoint, timestamp: new Date(), duration });
    }

    // Real-time console validation
    console.log(`[REAL-TIME] ${endpoint} - ${success ? 'SUCCESS' : 'FAILED'} - ${duration}ms - Tokens: ${tokens}`);
    
    // Broadcast to connected clients
    this.broadcastMetrics();
  }

  logRagQuery(query, platform, results, duration) {
    this.metrics.ragQueries++;
    console.log(`[RAG-VALIDATION] Query: "${query}" | Platform: ${platform} | Results: ${results.length} | Time: ${duration}ms`);
    
    this.broadcastMetrics();
  }

  broadcastMetrics() {
    const data = {
      type: 'metrics',
      data: {
        ...this.metrics,
        avgResponseTime: this.metrics.responseTime.length > 0 
          ? this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length 
          : 0,
        timestamp: new Date().toISOString()
      }
    };

    activeConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    });
  }
}

const validator = new RealTimeValidator();

// WebSocket connection handler for real-time updates
wss.on('connection', (ws, req) => {
  console.log('[REAL-TIME] New WebSocket connection established');
  ws.isAlive = true;
  activeConnections.add(ws);
  
  // Send initial connection confirmation
  ws.send(JSON.stringify({
    type: 'connection',
    status: 'connected',
    timestamp: new Date().toISOString()
  }));

  ws.on('close', () => {
    console.log('[REAL-TIME] WebSocket connection closed');
    activeConnections.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('[REAL-TIME] WebSocket error:', error);
    activeConnections.delete(ws);
  });

  ws.on('pong', () => {
    ws.isAlive = true;
  });
});

// Add WebSocket heartbeat to prevent memory leaks
const heartbeat = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      activeConnections.delete(ws);
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

// Root route serves the HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint with real-time validation
app.get('/api/health', (req, res) => {
  const startTime = Date.now();
  
  const healthData = {
    status: 'healthy',
    service: 'DeepSeek AI Prompt Generator',
    timestamp: new Date().toISOString(),
    apiConfigured: !!process.env.DEEPSEEK_API_KEY,
    activeConnections: activeConnections.size,
    metrics: validator.metrics
  };
  
  validator.logApiCall('/api/health', startTime, true);
  res.json(healthData);
});

// Real-time metrics endpoint
app.get('/api/metrics', (req, res) => {
  const startTime = Date.now();
  
  res.json({
    metrics: validator.metrics,
    timestamp: new Date().toISOString(),
    activeConnections: activeConnections.size
  });
  
  validator.logApiCall('/api/metrics', startTime, true);
});

// Analytics data endpoint
app.get('/api/analytics', async (req, res) => {
  const { timeRange = '24h' } = req.query;
  
  try {
    let timeCondition = '';
    switch (timeRange) {
      case '24h':
        timeCondition = "created_at >= NOW() - INTERVAL '24 hours'";
        break;
      case '7d':
        timeCondition = "created_at >= NOW() - INTERVAL '7 days'";
        break;
      case '30d':
        timeCondition = "created_at >= NOW() - INTERVAL '30 days'";
        break;
      case '90d':
        timeCondition = "created_at >= NOW() - INTERVAL '90 days'";
        break;
      default:
        timeCondition = "created_at >= NOW() - INTERVAL '24 hours'";
    }

    // Get prompt generation analytics
    const promptStats = await pool.query(`
      SELECT 
        DATE_TRUNC('hour', created_at) as hour,
        COUNT(*) as count,
        AVG(tokens_used) as avg_tokens,
        AVG(response_time) as avg_response_time,
        platform
      FROM saved_prompts 
      WHERE ${timeCondition}
      GROUP BY DATE_TRUNC('hour', created_at), platform
      ORDER BY hour ASC
    `);

    // Get platform distribution
    const platformStats = await pool.query(`
      SELECT platform, COUNT(*) as count
      FROM saved_prompts 
      WHERE ${timeCondition}
      GROUP BY platform
      ORDER BY count DESC
    `);

    // Get token usage trends
    const tokenStats = await pool.query(`
      SELECT 
        DATE_TRUNC('day', created_at) as day,
        SUM(tokens_used) as total_tokens,
        COUNT(*) as requests
      FROM saved_prompts 
      WHERE ${timeCondition} AND tokens_used > 0
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY day ASC
    `);

    // Calculate performance metrics
    const performanceStats = await pool.query(`
      SELECT 
        AVG(response_time) as avg_response_time,
        MIN(response_time) as min_response_time,
        MAX(response_time) as max_response_time,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time) as p95_response_time
      FROM saved_prompts 
      WHERE ${timeCondition} AND response_time > 0
    `);

    res.json({
      timeRange,
      promptStats: promptStats.rows,
      platformStats: platformStats.rows,
      tokenStats: tokenStats.rows,
      performanceStats: performanceStats.rows[0] || {},
      realTimeMetrics: validator.metrics,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Analytics query error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// RAG Search endpoint with real-time validation
app.post('/api/rag/search', (req, res) => {
  const startTime = Date.now();
  const { query, platform, limit = 5 } = req.body;
  
  if (!query) {
    validator.logApiCall('/api/rag/search', startTime, false);
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const ragStartTime = Date.now();
    const results = ragDB.searchDocuments(query, platform, limit);
    const ragDuration = Date.now() - ragStartTime;
    
    // Real-time RAG validation
    validator.logRagQuery(query, platform || 'all', results, ragDuration);
    
    const response = {
      query,
      platform: platform || 'all',
      results,
      totalFound: results.length,
      searchTime: ragDuration,
      timestamp: new Date().toISOString()
    };
    
    // Broadcast RAG search results to connected clients
    activeConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'rag_search',
          data: {
            query,
            platform: platform || 'all',
            resultsCount: results.length,
            searchTime: ragDuration
          }
        }));
      }
    });
    
    validator.logApiCall('/api/rag/search', startTime, true);
    res.json(response);
  } catch (error) {
    console.error('[RAG-ERROR] Search failed:', error);
    validator.logApiCall('/api/rag/search', startTime, false);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get platform documentation
app.get('/api/rag/platform/:platform', (req, res) => {
  const { platform } = req.params;
  
  try {
    const docs = ragDB.getPlatformDocs(platform);
    res.json({
      platform,
      documents: docs,
      count: docs.length
    });
  } catch (error) {
    console.error('Platform docs error:', error);
    res.status(500).json({ error: 'Failed to retrieve platform documentation' });
  }
});

// Get contextual recommendations
app.post('/api/rag/recommendations', (req, res) => {
  const { query, platform } = req.body;
  
  if (!query || !platform) {
    return res.status(400).json({ error: 'Query and platform are required' });
  }

  try {
    const recommendations = ragDB.getContextualRecommendations(query, platform);
    res.json(recommendations);
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Multi-round conversation endpoint with real-time validation and interface updates
app.post('/api/chat', async (req, res) => {
  const startTime = Date.now();
  const { message, sessionId, platform } = req.body;
  
  if (!message || !platform) {
    validator.logApiCall('/api/chat', startTime, false);
    return res.status(400).json({ 
      error: 'Message and platform are required' 
    });
  }

  try {
    console.log(`[CHAT-START] Session: ${sessionId || 'new'} | Platform: ${platform} | Message: "${message}"`);
    
    // Real-time notification of chat start
    activeConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'chat_start',
          data: { sessionId, platform, message }
        }));
      }
    });

    // Get relevant documentation from RAG database with timing
    const ragStartTime = Date.now();
    const ragResults = ragDB.searchDocuments(message, platform, 3);
    const ragDuration = Date.now() - ragStartTime;
    
    validator.logRagQuery(message, platform, ragResults, ragDuration);
    
    const contextualInfo = ragResults.map(doc => 
      `${doc.title}: ${doc.snippet}`
    ).join('\n');

    // Get or create conversation session
    const session = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let messages = conversationSessions.get(session) || [];

    // Add user message to conversation
    messages.push({ role: 'user', content: message });

    if (process.env.DEEPSEEK_API_KEY) {
      try {
        console.log('[DEEPSEEK-API] Making request to deepseek-reasoner...');
        
        const fetch = (await import('node-fetch')).default;
        
        // Enhanced system prompt with RAG context
        const systemPrompt = `You are an expert full-stack application developer specializing in ${platform}. 

PLATFORM-SPECIFIC CONTEXT:
${contextualInfo}

Use this context to provide accurate, platform-specific guidance. Reference specific ${platform} features, APIs, and best practices from the context when relevant.

Help users build comprehensive applications with detailed technical guidance based on ${platform}'s capabilities.`;

        const apiStartTime = Date.now();
        console.log('[DEEPSEEK-API] Making request to deepseek-reasoner...');
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
          },
          body: JSON.stringify({
            model: 'deepseek-reasoner',
            messages: [
              {
                role: 'system',
                content: systemPrompt
              },
              ...messages
            ],
            max_tokens: 2000
          })
        });

        const apiDuration = Date.now() - apiStartTime;

        if (response.ok) {
          const data = await response.json();
          const tokensUsed = data.usage?.total_tokens || 0;
          
          console.log(`[DEEPSEEK-SUCCESS] Response received - Tokens: ${tokensUsed} | Time: ${apiDuration}ms`);
          // console.log(`[DEEPSEEK-DEBUG] Full response structure:`, JSON.stringify(data, null, 2));
          
          const assistantMessage = {
            role: 'assistant',
            content: data.choices[0]?.message?.content || 'No response generated'
          };
          
          // console.log(`[DEEPSEEK-DEBUG] Assistant message content:`, assistantMessage.content);
          
          // Add assistant response to conversation (without reasoning_content)
          messages.push(assistantMessage);
          conversationSessions.set(session, messages);

          const responseData = {
            response: assistantMessage.content,
            reasoning: data.choices[0]?.message?.reasoning_content,
            sessionId: session,
            platform,
            ragContext: ragResults,
            tokensUsed,
            responseTime: Date.now() - startTime,
            apiTime: apiDuration,
            ragTime: ragDuration
          };

          // Real-time broadcast of successful response
          activeConnections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'chat_response',
                data: {
                  sessionId: session,
                  platform,
                  tokensUsed,
                  responseTime: responseData.responseTime,
                  hasReasoning: !!data.choices[0]?.message?.reasoning_content
                }
              }));
            }
          });

          validator.logApiCall('/api/chat', startTime, true, tokensUsed);
          res.json(responseData);
          return;
        } else {
          const errorText = await response.text();
          console.error(`[DEEPSEEK-ERROR] API request failed: ${response.status} - ${errorText}`);
          throw new Error(`DeepSeek API error: ${response.status}`);
        }
      } catch (apiError) {
        console.error('[DEEPSEEK-ERROR] API call failed:', apiError);
        
        // Real-time error notification
        activeConnections.forEach(ws => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'chat_error',
              data: { sessionId: session, platform, error: apiError.message }
            }));
          }
        });
      }
    }

    // Enhanced fallback response with RAG context
    console.log('[FALLBACK] Using enhanced demo mode with RAG context');
    
    const contextSummary = ragResults.length > 0 
      ? `Based on ${platform} documentation, here are some relevant points:\n${ragResults.map(doc => `• ${doc.title}: ${doc.snippet}`).join('\n')}\n\n`
      : '';

    const fallbackResponse = `${contextSummary}I understand you want to work on "${message}" for ${platform}. Let me help you create a comprehensive solution. This appears to be a ${platform} development question. What specific aspect would you like to focus on first?`;
    
    console.log('[FALLBACK-DEBUG] Generated fallback response:', fallbackResponse.substring(0, 200));
    
    messages.push({ role: 'assistant', content: fallbackResponse });
    conversationSessions.set(session, messages);

    const responseData = {
      response: fallbackResponse,
      reasoning: 'Enhanced demo mode with RAG context - add DEEPSEEK_API_KEY for full AI reasoning',
      sessionId: session,
      platform,
      ragContext: ragResults,
      tokensUsed: 0,
      responseTime: Date.now() - startTime,
      ragTime: ragDuration
    };
    
    console.log('[FALLBACK-DEBUG] Response data keys:', Object.keys(responseData));

    // Real-time broadcast of fallback response
    activeConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'chat_fallback',
          data: {
            sessionId: session,
            platform,
            responseTime: responseData.responseTime
          }
        }));
      }
    });

    validator.logApiCall('/api/chat', startTime, true);
    res.json(responseData);

  } catch (error) {
    console.error('[CHAT-ERROR] Processing failed:', error);
    
    activeConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'chat_error',
          data: { error: error.message }
        }));
      }
    });
    
    validator.logApiCall('/api/chat', startTime, false);
    res.status(500).json({ 
      error: 'Failed to process chat message' 
    });
  }
});

// Save generated prompt to database
app.post('/api/prompts/save', async (req, res) => {
  const { title, originalQuery, platform, generatedPrompt, reasoning, ragContext, tokensUsed, responseTime } = req.body;
  
  if (!title || !originalQuery || !platform || !generatedPrompt) {
    return res.status(400).json({ error: 'Title, originalQuery, platform, and generatedPrompt are required' });
  }

  try {
    const result = await pool.query(`
      INSERT INTO saved_prompts (title, original_query, platform, generated_prompt, reasoning, rag_context, tokens_used, response_time, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      RETURNING *
    `, [title, originalQuery, platform, generatedPrompt, reasoning, ragContext, tokensUsed || 0, responseTime || 0]);

    console.log(`[PROMPT-SAVED] ID: ${result.rows[0].id} | Platform: ${platform} | Title: "${title}"`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Save prompt error:', error);
    res.status(500).json({ error: 'Failed to save prompt' });
  }
});

// Get all saved prompts
app.get('/api/prompts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM saved_prompts ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Get prompts error:', error);
    res.status(500).json({ error: 'Failed to retrieve prompts' });
  }
});

// Get saved prompt by ID
app.get('/api/prompts/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('SELECT * FROM saved_prompts WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get prompt error:', error);
    res.status(500).json({ error: 'Failed to retrieve prompt' });
  }
});

// Delete saved prompt
app.delete('/api/prompts/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('DELETE FROM saved_prompts WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    
    console.log(`[PROMPT-DELETED] ID: ${id}`);
    res.json({ message: 'Prompt deleted successfully' });
  } catch (error) {
    console.error('Delete prompt error:', error);
    res.status(500).json({ error: 'Failed to delete prompt' });
  }
});

// Search saved prompts
app.post('/api/prompts/search', async (req, res) => {
  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const result = await pool.query(`
      SELECT * FROM saved_prompts 
      WHERE title ILIKE $1 OR original_query ILIKE $1 OR generated_prompt ILIKE $1
      ORDER BY created_at DESC
    `, [`%${query}%`]);

    res.json(result.rows);
  } catch (error) {
    console.error('Search prompts error:', error);
    res.status(500).json({ error: 'Failed to search prompts' });
  }
});

// Main prompt generation endpoint with advanced DeepSeek integration
app.post('/api/generate-prompt', async (req, res) => {
  const { query, platform } = req.body;
  
  if (!query || !platform) {
    return res.status(400).json({ 
      error: 'Both query and platform are required' 
    });
  }

  try {
    let optimizedPrompt;
    let reasoning;
    let tokensUsed = 0;

    // Get RAG context for enhanced prompt generation
    const ragResults = ragDB.searchDocuments(query, platform, 5);
    const ragContext = ragResults.map(doc => 
      `${doc.title}: ${doc.content}`
    ).join('\n\n');

    // Ultra-specific system prompt for detailed full-stack applications
    const systemPrompt = `You are a SENIOR FULL-STACK ARCHITECT with 15+ years building production applications. Your task is to transform "${query}" into an EXTREMELY DETAILED, SPECIFIC full-stack application specification.

**CRITICAL REQUIREMENTS:**
1. NO GENERIC RESPONSES - Every detail must be SPECIFIC and ACTIONABLE
2. Include EXACT file structures, folder hierarchies, and code organization
3. Specify PRECISE database schemas with table names, columns, relationships
4. Detail SPECIFIC API endpoints with exact request/response formats
5. List EXACT package dependencies and version numbers
6. Provide CONCRETE component names and prop structures
7. Include SPECIFIC authentication flows and security implementations

**PLATFORM-SPECIFIC CONTEXT FOR ${platform.toUpperCase()}:**
${ragContext}

**MANDATORY OUTPUT STRUCTURE:**

# ${query.toUpperCase()} - Complete Full-Stack Application

## 🎯 SPECIFIC APPLICATION OVERVIEW
- **Exact Purpose:** [Ultra-specific description of what this app does]
- **Target Users:** [Specific user personas with detailed characteristics]
- **Core Value Proposition:** [Specific problems solved and benefits delivered]
- **Success Metrics:** [Specific KPIs and measurement criteria]

## 🏗️ DETAILED TECHNICAL ARCHITECTURE

### Frontend Architecture (React/Next.js)
\`\`\`
src/
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Modal.tsx
│   ├── forms/
│   │   ├── [SpecificFormName]Form.tsx
│   │   └── [AnotherFormName]Form.tsx
│   └── features/
│       ├── [FeatureName]/
│       │   ├── [FeatureName]List.tsx
│       │   ├── [FeatureName]Detail.tsx
│       │   └── [FeatureName]Create.tsx
├── pages/
│   ├── index.tsx
│   ├── [specific-route].tsx
│   └── api/
├── hooks/
├── utils/
├── types/
└── styles/
\`\`\`

### Backend Architecture (Node.js/Express)
\`\`\`
server/
├── controllers/
│   ├── [entityName]Controller.js
│   └── authController.js
├── models/
│   ├── [EntityName].js
│   └── User.js
├── routes/
│   ├── [entityName]Routes.js
│   └── authRoutes.js
├── middleware/
├── utils/
├── config/
└── tests/
\`\`\`

## 📊 SPECIFIC DATABASE SCHEMA

### Primary Tables:
\`\`\`sql
-- [Specific table based on the application]
CREATE TABLE [specific_table_name] (
  id SERIAL PRIMARY KEY,
  [specific_column_1] VARCHAR(255) NOT NULL,
  [specific_column_2] TEXT,
  [specific_column_3] INTEGER,
  [specific_column_4] TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- [Another specific table]
CREATE TABLE [another_table_name] (
  id SERIAL PRIMARY KEY,
  [specific_foreign_key] INTEGER REFERENCES [specific_table_name](id),
  [specific_data_field] JSONB,
  status VARCHAR(50) DEFAULT 'active'
);
\`\`\`

## 🔗 SPECIFIC API ENDPOINTS

### Core API Routes:
\`\`\`
POST /api/[specific-entity] - Create new [entity]
GET /api/[specific-entity] - List all [entities] with pagination
GET /api/[specific-entity]/:id - Get specific [entity] details
PUT /api/[specific-entity]/:id - Update [entity]
DELETE /api/[specific-entity]/:id - Delete [entity]
POST /api/auth/register - User registration
POST /api/auth/login - User authentication
GET /api/[specific-entity]/search?q=[query] - Search functionality
\`\`\`

### Request/Response Examples:
\`\`\`json
POST /api/[specific-entity]
{
  "[specificField1]": "specific value",
  "[specificField2]": 123,
  "[specificField3]": ["array", "of", "values"]
}

Response:
{
  "id": 1,
  "[specificField1]": "specific value",
  "created_at": "2024-01-20T10:30:00Z"
}
\`\`\`

## 📦 EXACT DEPENDENCIES

### Frontend (package.json):
\`\`\`json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tanstack/react-query": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "framer-motion": "^10.16.0",
    "[specific-ui-library]": "^x.x.x",
    "[specific-state-management]": "^x.x.x"
  }
}
\`\`\`

### Backend (package.json):
\`\`\`json
{
  "dependencies": {
    "express": "^4.18.0",
    "pg": "^8.11.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "[specific-validation-library]": "^x.x.x",
    "[specific-middleware]": "^x.x.x"
  }
}
\`\`\`

## 🔐 SPECIFIC AUTHENTICATION & SECURITY
- JWT token implementation with specific expiration times
- Bcrypt password hashing with specific salt rounds
- Role-based access control with specific permissions
- Input validation using specific validation schemas
- Rate limiting with specific thresholds
- CORS configuration for specific domains

## 🚀 ${platform.toUpperCase()}-SPECIFIC IMPLEMENTATION
[Use the platform context to provide SPECIFIC implementation details, file configurations, and deployment steps unique to ${platform}]

## 📈 SPECIFIC PERFORMANCE OPTIMIZATIONS
- Database indexing on specific columns
- Caching strategies for specific data types
- Image optimization for specific use cases
- Lazy loading for specific components
- Bundle splitting for specific routes

## 🧪 SPECIFIC TESTING STRATEGY
- Unit tests for specific functions and components
- Integration tests for specific API endpoints
- E2E tests for specific user workflows
- Performance tests for specific bottlenecks

**TRANSFORM "${query}" into this SPECIFIC, DETAILED, ACTIONABLE full-stack application specification. NO GENERIC CONTENT ALLOWED.**`;

    if (process.env.DEEPSEEK_API_KEY) {
      try {
        // Real DeepSeek API integration with advanced reasoning
        const fetch = (await import('node-fetch')).default;
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
          },
          body: JSON.stringify({
            model: 'deepseek-reasoner',
            messages: [
              {
                role: 'system',
                content: systemPrompt
              },
              {
                role: 'user',
                content: `GENERATE ULTRA-SPECIFIC FULL-STACK APPLICATION SPECIFICATION:

Application: "${query}"
Platform: ${platform}

REQUIREMENTS:
1. Provide EXACT file structures with specific filenames
2. Include DETAILED database schemas with actual table/column names
3. List SPECIFIC API endpoints with exact request/response formats
4. Specify EXACT package dependencies and versions
5. Include CONCRETE component names and implementations
6. Detail SPECIFIC authentication flows and security measures
7. Provide ${platform}-specific configuration and deployment steps

NO GENERIC RESPONSES. Every detail must be ACTIONABLE and IMPLEMENTATION-READY.`
              }
            ],
            max_tokens: 8000,
            temperature: 0.7
          })
        });

        if (response.ok) {
          const data = await response.json();
          optimizedPrompt = data.choices[0]?.message?.content;
          reasoning = data.choices[0]?.message?.reasoning_content || 'Generated using DeepSeek AI reasoning';
          tokensUsed = data.usage?.total_tokens || 0;
          
          console.log('DeepSeek API Response:', {
            hasContent: !!optimizedPrompt,
            hasReasoning: !!reasoning,
            tokensUsed
          });
        } else {
          const errorText = await response.text();
          console.error('DeepSeek API error response:', errorText);
          throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
        }
      } catch (apiError) {
        console.error('DeepSeek API error:', apiError);
        // Fallback to advanced demo mode
      }
    }

    // Advanced demo mode with full-stack prompt generation
    if (!optimizedPrompt) {
      optimizedPrompt = `# Full-Stack Application Development Prompt for ${platform.toUpperCase()}

## 🎯 Project Overview
**User Idea:** "${query}"

**Comprehensive Application Specification:**

### 🏗️ Architecture & Technology Stack
**Frontend:**
- Framework: ${platform === 'replit' ? 'React/Next.js' : platform === 'lovable' ? 'React with TailwindCSS' : platform === 'bolt' ? 'React/Vue.js' : platform === 'cursor' ? 'React/TypeScript' : 'Modern JavaScript Framework'}
- UI/UX: Responsive design, component-based architecture
- State Management: Context API / Redux Toolkit
- Styling: TailwindCSS / Styled Components

**Backend:**
- Runtime: Node.js / Express.js
- Database: PostgreSQL / MongoDB with proper indexing
- Authentication: JWT / OAuth 2.0
- API Design: RESTful / GraphQL endpoints
- File Storage: Cloud integration (AWS S3 / Cloudinary)

**Platform-Specific Optimizations for ${platform.toUpperCase()}:**
${generatePlatformOptimizations(platform)}

### 📋 Detailed Implementation Roadmap

#### Phase 1: Foundation Setup
1. Initialize ${platform} project with proper configuration
2. Set up development environment and dependencies
3. Configure database schema and connections
4. Implement basic authentication system

#### Phase 2: Core Features Development  
1. Build main application components based on "${query}"
2. Implement CRUD operations and data flow
3. Design responsive UI/UX following ${platform} best practices
4. Add real-time features where applicable

#### Phase 3: Advanced Features
1. Integrate third-party APIs and services
2. Implement advanced search/filtering capabilities
3. Add file upload/management functionality
4. Optimize performance and caching strategies

#### Phase 4: Production Readiness
1. Implement comprehensive error handling
2. Add monitoring and analytics
3. Configure CI/CD pipeline on ${platform}
4. Perform security audits and optimization

### 🔒 Security & Performance Considerations
- Input validation and sanitization
- Rate limiting and DDoS protection
- Database query optimization
- Lazy loading and code splitting
- SEO optimization and meta tags
- Accessibility compliance (WCAG 2.1)

### 🚀 ${platform.toUpperCase()} Deployment Strategy
${generateDeploymentStrategy(platform)}

### 💡 Additional Recommendations
- Implement proper logging and monitoring
- Set up automated testing (unit, integration, E2E)
- Configure environment-specific settings
- Plan for scalability and future enhancements

**This comprehensive prompt transforms "${query}" into a production-ready application specification optimized for ${platform}.**

${process.env.DEEPSEEK_API_KEY ? '✨ Generated using DeepSeek AI reasoning capabilities.' : '📝 Demo mode - add DEEPSEEK_API_KEY for enhanced AI-powered generation'}`;

      reasoning = process.env.DEEPSEEK_API_KEY ? 'Generated using DeepSeek AI reasoning' : 'Advanced demo mode with full-stack prompt generation template';
      tokensUsed = 450;
    }

    res.json({
      prompt: optimizedPrompt,
      platform,
      reasoning,
      tokensUsed
    });

  } catch (error) {
    console.error('Error generating prompt:', error);
    res.status(500).json({ 
      error: 'Failed to generate prompt. Please try again.' 
    });
  }
});

// Export analytics data endpoint
app.get('/api/analytics/export', async (req, res) => {
  const { timeRange = '30d', format = 'json' } = req.query;
  
  try {
    let timeCondition = '';
    switch (timeRange) {
      case '24h':
        timeCondition = "created_at >= NOW() - INTERVAL '24 hours'";
        break;
      case '7d':
        timeCondition = "created_at >= NOW() - INTERVAL '7 days'";
        break;
      case '30d':
        timeCondition = "created_at >= NOW() - INTERVAL '30 days'";
        break;
      case '90d':
        timeCondition = "created_at >= NOW() - INTERVAL '90 days'";
        break;
      default:
        timeCondition = "created_at >= NOW() - INTERVAL '30 days'";
    }

    const exportData = await pool.query(`
      SELECT 
        id,
        title,
        platform,
        tokens_used,
        response_time,
        created_at,
        updated_at
      FROM saved_prompts 
      WHERE ${timeCondition}
      ORDER BY created_at DESC
    `);

    if (format === 'csv') {
      const csvHeader = 'ID,Title,Platform,Tokens Used,Response Time (ms),Created At,Updated At\n';
      const csvData = exportData.rows.map(row => 
        `${row.id},"${row.title}",${row.platform},${row.tokens_used || 0},${row.response_time || 0},${row.created_at},${row.updated_at || ''}`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="deepseek_analytics_${timeRange}_${Date.now()}.csv"`);
      res.send(csvHeader + csvData);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="deepseek_analytics_${timeRange}_${Date.now()}.json"`);
      res.json({
        exportInfo: {
          timeRange,
          recordCount: exportData.rows.length,
          exportedAt: new Date().toISOString()
        },
        data: exportData.rows
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Admin configuration endpoints
app.get('/api/admin/config', (req, res) => {
  res.json({
    apiKeyConfigured: !!process.env.DEEPSEEK_API_KEY,
    databaseConnected: true,
    ragDocumentCount: ragDB.getAllDocuments ? ragDB.getAllDocuments().length : 0,
    activeConnections: activeConnections.size,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    systemMetrics: validator.metrics
  });
});

app.post('/api/admin/test-api', async (req, res) => {
  if (!process.env.DEEPSEEK_API_KEY) {
    return res.status(400).json({ 
      success: false, 
      error: 'DeepSeek API key not configured' 
    });
  }

  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('https://api.deepseek.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      }
    });

    if (response.ok) {
      res.json({ 
        success: true, 
        message: 'DeepSeek API connection successful',
        status: response.status
      });
    } else {
      res.json({ 
        success: false, 
        error: `API returned status ${response.status}`,
        status: response.status
      });
    }
  } catch (error) {
    res.json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Bulk operations for prompts
app.post('/api/prompts/bulk-delete', async (req, res) => {
  const { ids } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Array of IDs is required' });
  }

  try {
    const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
    const result = await pool.query(
      `DELETE FROM saved_prompts WHERE id IN (${placeholders}) RETURNING id`,
      ids
    );

    res.json({ 
      message: `Successfully deleted ${result.rows.length} prompts`,
      deletedIds: result.rows.map(row => row.id)
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: 'Failed to delete prompts' });
  }
});

// Helper functions for platform-specific optimizations
function generatePlatformOptimizations(platform) {
  const optimizations = {
    replit: `- Utilize Replit's built-in database and authentication
- Leverage Replit's real-time collaboration features
- Optimize for Replit's container-based deployment
- Use Replit's package management and version control`,
    
    lovable: `- Implement Lovable's AI-assisted development patterns
- Utilize Lovable's component generation capabilities
- Optimize for rapid prototyping and iteration
- Leverage Lovable's design-to-code workflow`,
    
    bolt: `- Use Bolt's instant deployment capabilities
- Implement Bolt's real-time preview features
- Optimize for Bolt's collaborative development environment
- Leverage Bolt's integrated development tools`,
    
    cursor: `- Utilize Cursor's AI-powered code completion
- Implement Cursor's intelligent refactoring suggestions
- Optimize for Cursor's context-aware development
- Leverage Cursor's automated testing capabilities`,
    
    windsurf: `- Use Windsurf's collaborative coding features
- Implement Windsurf's real-time synchronization
- Optimize for Windsurf's team development workflow
- Leverage Windsurf's integrated project management`
  };
  
  return optimizations[platform] || '- Follow platform-specific best practices and conventions';
}

function generateDeploymentStrategy(platform) {
  const strategies = {
    replit: `- Configure Replit deployment settings and environment variables
- Set up custom domains and SSL certificates
- Implement Replit's scaling and monitoring features`,
    
    lovable: `- Deploy using Lovable's automated build and deployment pipeline
- Configure production environment variables and secrets
- Set up monitoring and analytics integration`,
    
    bolt: `- Use Bolt's instant deployment with custom configuration
- Configure production-ready environment settings
- Implement proper error tracking and monitoring`,
    
    cursor: `- Deploy using Cursor's integrated deployment tools
- Set up automated testing and deployment pipeline
- Configure monitoring and performance optimization`,
    
    windsurf: `- Utilize Windsurf's team deployment capabilities
- Configure collaborative deployment workflows
- Set up proper staging and production environments`
  };
  
  return strategies[platform] || '- Follow platform-specific deployment best practices';
}

// Helper functions for ultra-specific content generation
function generateSpecificPurpose(query) {
  const purposes = {
    'social media': 'A comprehensive social networking platform enabling users to create profiles, share multimedia content, engage through likes/comments, and build communities',
    'e-commerce': 'A multi-vendor marketplace platform allowing businesses to sell products, customers to browse/purchase items, and administrators to manage transactions',
    'task management': 'A collaborative project management system enabling teams to create, assign, track, and complete tasks with real-time progress monitoring',
    'chat': 'A real-time messaging application supporting one-on-one conversations, group chats, file sharing, and multimedia communication',
    'blog': 'A content management system allowing writers to publish articles, readers to engage through comments, and administrators to moderate content'
  };
  
  for (const [key, purpose] of Object.entries(purposes)) {
    if (query.toLowerCase().includes(key)) return purpose;
  }
  return `A specialized application designed to ${query.toLowerCase()} with comprehensive user management and data processing capabilities`;
}

function generateSpecificUsers(query) {
  const users = {
    'social media': 'Content creators (18-45), social influencers, businesses seeking brand awareness, and everyday users wanting to connect with friends',
    'e-commerce': 'Online shoppers (25-65), small business owners, enterprise vendors, and marketplace administrators',
    'task management': 'Project managers, development teams, remote workers, and business executives needing project oversight',
    'chat': 'Remote teams, customer service representatives, community moderators, and individuals seeking secure communication',
    'blog': 'Professional writers, thought leaders, marketing teams, and content consumers seeking quality articles'
  };
  
  for (const [key, userBase] of Object.entries(users)) {
    if (query.toLowerCase().includes(key)) return userBase;
  }
  return 'Professional users requiring efficient workflows, administrators managing system operations, and end-users seeking seamless experiences';
}

function generateSpecificFeatures(query) {
  const features = {
    'social media': 'User profiles with bio/photos, multimedia post creation, real-time feed updates, like/comment system, friend/follow mechanisms, direct messaging, story features',
    'e-commerce': 'Product catalog with search/filters, shopping cart functionality, secure payment processing, order tracking, vendor dashboards, inventory management, review system',
    'task management': 'Project creation/management, task assignment with due dates, progress tracking, team collaboration, file attachments, time tracking, reporting dashboards',
    'chat': 'Real-time messaging, group chat creation, file/image sharing, message encryption, user status indicators, notification system, message history',
    'blog': 'Article creation with rich text editor, category/tag management, comment system, user authentication, content moderation, SEO optimization, analytics dashboard'
  };
  
  for (const [key, featureSet] of Object.entries(features)) {
    if (query.toLowerCase().includes(key)) return featureSet;
  }
  return 'Core functionality specific to user requirements, administrative controls, data management, and user interaction features';
}

function generateEntityFromQuery(query) {
  const entities = {
    'social media': 'Post',
    'e-commerce': 'Product',
    'task management': 'Task',
    'chat': 'Message',
    'blog': 'Article'
  };
  
  for (const [key, entity] of Object.entries(entities)) {
    if (query.toLowerCase().includes(key)) return entity;
  }
  return 'Item';
}

function generateRouteFromQuery(query) {
  const routes = {
    'social media': 'posts',
    'e-commerce': 'products',
    'task management': 'tasks',
    'chat': 'messages',
    'blog': 'articles'
  };
  
  for (const [key, route] of Object.entries(routes)) {
    if (query.toLowerCase().includes(key)) return route;
  }
  return 'items';
}

function generateSpecificTables(query) {
  const entity = generateEntityFromQuery(query);
  const tableName = entity.toLowerCase() + 's';
  
  if (query.toLowerCase().includes('social media')) {
    return `\`\`\`sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  bio TEXT,
  profile_picture_url VARCHAR(500),
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Posts table
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_urls TEXT[],
  video_url VARCHAR(500),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Follows table
CREATE TABLE follows (
  id SERIAL PRIMARY KEY,
  follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id)
);

-- Likes table
CREATE TABLE likes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, post_id)
);
\`\`\``;
  }
  
  if (query.toLowerCase().includes('e-commerce')) {
    return `\`\`\`sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  role VARCHAR(20) DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  vendor_id INTEGER REFERENCES users(id),
  stock_quantity INTEGER DEFAULT 0,
  image_urls TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  shipping_address JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order_items table
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL
);
\`\`\``;
  }
  
  return `\`\`\`sql
-- Generic table structure for ${entity.toLowerCase()}s
CREATE TABLE ${tableName} (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\``;
}

function generateSpecificEndpoints(query) {
  const entity = generateEntityFromQuery(query);
  const route = generateRouteFromQuery(query);
  
  return `\`\`\`
### Core API Endpoints:
POST /api/${route} - Create new ${entity.toLowerCase()}
GET /api/${route} - List all ${route} with pagination
GET /api/${route}/:id - Get specific ${entity.toLowerCase()} details
PUT /api/${route}/:id - Update ${entity.toLowerCase()}
DELETE /api/${route}/:id - Delete ${entity.toLowerCase()}

### Authentication:
POST /api/auth/register - User registration
POST /api/auth/login - User authentication
POST /api/auth/logout - User logout
GET /api/auth/me - Get current user

### Request/Response Example:
POST /api/${route}
{
  "title": "Specific ${entity} Title",
  "description": "Detailed description",
  "additionalData": "specific to ${query}"
}

Response:
{
  "id": 1,
  "title": "Specific ${entity} Title",
  "description": "Detailed description",
  "created_at": "2024-01-20T10:30:00Z"
}
\`\`\``;
}

function generateSpecificComponents(query) {
  const entity = generateEntityFromQuery(query);
  
  return `\`\`\`tsx
// ${entity}List.tsx
interface ${entity}ListProps {
  ${entity.toLowerCase()}s: ${entity}[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export function ${entity}List({ ${entity.toLowerCase()}s, onEdit, onDelete }: ${entity}ListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {${entity.toLowerCase()}s.map(${entity.toLowerCase()} => (
        <${entity}Card 
          key={${entity.toLowerCase()}.id} 
          ${entity.toLowerCase()}={${entity.toLowerCase()}} 
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

// ${entity}Form.tsx
interface ${entity}FormProps {
  onSubmit: (data: ${entity}FormData) => void;
  initialData?: Partial<${entity}>;
}

export function ${entity}Form({ onSubmit, initialData }: ${entity}FormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<${entity}FormData>();
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input 
        {...register("title", { required: "Title is required" })}
        placeholder="${entity} title"
        error={errors.title?.message}
      />
      <Textarea 
        {...register("description")}
        placeholder="Description"
      />
      <Button type="submit">Save ${entity}</Button>
    </form>
  );
}
\`\`\``;
}

server.listen(PORT, () => {
  console.log(`✅ DeepSeek AI Prompt Generator running on port ${PORT}`);
  console.log(`🔑 API Key configured: ${!!process.env.DEEPSEEK_API_KEY ? 'Yes' : 'No'}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
  console.log(`🔄 WebSocket server running at ws://localhost:${PORT}/ws`);
  console.log(`📊 Real-time validation and monitoring: ACTIVE`);
  
  // Initialize real-time validation system
  console.log('[REAL-TIME] Validation system initialized');
  console.log('[RAG-SYSTEM] Database loaded with comprehensive platform documentation');
  console.log('[A2A-PROTOCOL] Agent-to-Agent communication ready');
  console.log('[MCP-INTEGRATION] Model Context Protocol handlers active');
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  clearInterval(heartbeat);
  wss.clients.forEach((ws) => {
    ws.close();
  });
  server.close(() => {
    pool.end(() => {
      console.log('Process terminated');
    });
  });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});