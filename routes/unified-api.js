// Unified API Routes - Consolidating all endpoints with feature management
const express = require('express');
const router = express.Router();

class UnifiedAPIRouter {
  constructor(app, ragDB, featureManager, queryWithRetry) {
    this.app = app;
    this.ragDB = ragDB;
    this.featureManager = featureManager;
    this.queryWithRetry = queryWithRetry;
    
    this.initializeRoutes();
  }

  initializeRoutes() {
    // Feature Management Endpoints
    this.app.get('/api/features', this.getFeatures.bind(this));
    this.app.get('/api/features/:id', this.getFeature.bind(this));
    this.app.post('/api/features/:id/toggle', this.toggleFeature.bind(this));
    this.app.get('/api/system/health', this.getSystemHealth.bind(this));
    this.app.get('/api/system/report', this.getSystemReport.bind(this));

    // Enhanced RAG Endpoints
    this.app.post('/api/rag/search', this.ragSearch.bind(this));
    this.app.post('/api/rag/documents', this.addDocument.bind(this));
    this.app.get('/api/rag/stats', this.getRagStats.bind(this));
    this.app.get('/api/rag/platforms', this.getPlatforms.bind(this));
    this.app.get('/api/rag/recommendations', this.getRecommendations.bind(this));

    // Advanced Analytics Endpoints
    this.app.get('/api/analytics/usage', this.getUsageAnalytics.bind(this));
    this.app.get('/api/analytics/features', this.getFeatureAnalytics.bind(this));
    this.app.get('/api/analytics/performance', this.getPerformanceAnalytics.bind(this));
    this.app.get('/api/analytics/trends', this.getTrendAnalytics.bind(this));

    // Real-time Status Endpoints
    this.app.get('/api/realtime/status', this.getRealtimeStatus.bind(this));
    this.app.get('/api/realtime/metrics', this.getRealtimeMetrics.bind(this));
    this.app.post('/api/realtime/broadcast', this.broadcastMessage.bind(this));

    // MCP Protocol Endpoints
    this.app.get('/api/mcp/contexts', this.getMCPContexts.bind(this));
    this.app.post('/api/mcp/context', this.createMCPContext.bind(this));
    this.app.get('/api/mcp/tools', this.getMCPTools.bind(this));

    // A2A Protocol Endpoints
    this.app.get('/api/a2a/agents', this.getAgents.bind(this));
    this.app.post('/api/a2a/communicate', this.agentCommunicate.bind(this));
    this.app.get('/api/a2a/sessions', this.getAgentSessions.bind(this));

    console.log('[UNIFIED-API] All routes initialized');
  }

  // Feature Management
  async getFeatures(req, res) {
    try {
      this.featureManager.logFeatureUsage('feature-management', req.path);
      const features = this.featureManager.getAllFeatures();
      res.json({ features, total: features.length });
    } catch (error) {
      this.featureManager.logFeatureUsage('feature-management', req.path, false);
      res.status(500).json({ error: 'Failed to retrieve features' });
    }
  }

  async getFeature(req, res) {
    try {
      const { id } = req.params;
      const feature = this.featureManager.getFeature(id);
      
      if (!feature) {
        return res.status(404).json({ error: 'Feature not found' });
      }
      
      this.featureManager.logFeatureUsage('feature-management', req.path);
      res.json(feature);
    } catch (error) {
      this.featureManager.logFeatureUsage('feature-management', req.path, false);
      res.status(500).json({ error: 'Failed to retrieve feature' });
    }
  }

  async toggleFeature(req, res) {
    try {
      const { id } = req.params;
      const feature = this.featureManager.getFeature(id);
      
      if (!feature) {
        return res.status(404).json({ error: 'Feature not found' });
      }
      
      const isActive = this.featureManager.isFeatureActive(id);
      const result = isActive ? 
        this.featureManager.deactivateFeature(id) : 
        this.featureManager.activateFeature(id);
      
      this.featureManager.logFeatureUsage('feature-management', req.path);
      res.json({ 
        feature: id, 
        status: !isActive ? 'activated' : 'deactivated',
        success: result 
      });
    } catch (error) {
      this.featureManager.logFeatureUsage('feature-management', req.path, false);
      res.status(500).json({ error: 'Failed to toggle feature' });
    }
  }

  async getSystemHealth(req, res) {
    try {
      const health = this.featureManager.getSystemHealth();
      const integrity = this.featureManager.validateFeatureIntegrity();
      
      this.featureManager.logFeatureUsage('analytics', req.path);
      res.json({ health, integrity });
    } catch (error) {
      this.featureManager.logFeatureUsage('analytics', req.path, false);
      res.status(500).json({ error: 'Failed to get system health' });
    }
  }

  async getSystemReport(req, res) {
    try {
      const report = this.featureManager.generateFeatureReport();
      const ragStats = await this.ragDB.getDocumentStats();
      
      this.featureManager.logFeatureUsage('analytics', req.path);
      res.json({ ...report, ragStats });
    } catch (error) {
      this.featureManager.logFeatureUsage('analytics', req.path, false);
      res.status(500).json({ error: 'Failed to generate system report' });
    }
  }

  // Enhanced RAG Endpoints
  async ragSearch(req, res) {
    try {
      const { query, platform, limit = 10 } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }
      
      const results = await this.ragDB.searchDocuments(query, platform, limit);
      const recommendations = this.ragDB.getContextualRecommendations(query, platform);
      
      this.featureManager.logFeatureUsage('rag-system', req.path);
      res.json({ results, recommendations, query, platform, total: results.length });
    } catch (error) {
      this.featureManager.logFeatureUsage('rag-system', req.path, false);
      res.status(500).json({ error: 'Search failed' });
    }
  }

  async addDocument(req, res) {
    try {
      const document = req.body;
      
      if (!document.title || !document.content || !document.platform) {
        return res.status(400).json({ error: 'Title, content, and platform are required' });
      }
      
      const result = await this.ragDB.addDocument(document);
      
      this.featureManager.logFeatureUsage('rag-system', req.path);
      res.json({ message: 'Document added successfully', result });
    } catch (error) {
      this.featureManager.logFeatureUsage('rag-system', req.path, false);
      res.status(500).json({ error: 'Failed to add document' });
    }
  }

  async getRagStats(req, res) {
    try {
      const stats = await this.ragDB.getDocumentStats();
      
      this.featureManager.logFeatureUsage('rag-system', req.path);
      res.json(stats);
    } catch (error) {
      this.featureManager.logFeatureUsage('rag-system', req.path, false);
      res.status(500).json({ error: 'Failed to get RAG statistics' });
    }
  }

  async getPlatforms(req, res) {
    try {
      const platforms = Object.keys(this.ragDB.documents || {});
      
      this.featureManager.logFeatureUsage('rag-system', req.path);
      res.json({ platforms, total: platforms.length });
    } catch (error) {
      this.featureManager.logFeatureUsage('rag-system', req.path, false);
      res.status(500).json({ error: 'Failed to get platforms' });
    }
  }

  async getRecommendations(req, res) {
    try {
      const { query, platform } = req.query;
      
      if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
      }
      
      const recommendations = this.ragDB.getContextualRecommendations(query, platform);
      
      this.featureManager.logFeatureUsage('rag-system', req.path);
      res.json({ recommendations, query, platform });
    } catch (error) {
      this.featureManager.logFeatureUsage('rag-system', req.path, false);
      res.status(500).json({ error: 'Failed to get recommendations' });
    }
  }

  // Analytics Endpoints
  async getUsageAnalytics(req, res) {
    try {
      const { timeRange = '24h' } = req.query;
      const metrics = this.featureManager.getAllMetrics();
      
      this.featureManager.logFeatureUsage('analytics', req.path);
      res.json({ metrics, timeRange, generatedAt: new Date().toISOString() });
    } catch (error) {
      this.featureManager.logFeatureUsage('analytics', req.path, false);
      res.status(500).json({ error: 'Failed to get usage analytics' });
    }
  }

  async getFeatureAnalytics(req, res) {
    try {
      const features = this.featureManager.getAllFeatures();
      const analytics = features.map(feature => ({
        id: feature.id,
        name: feature.name,
        status: feature.status,
        metrics: this.featureManager.getFeatureMetrics(feature.id),
        dependencies: this.featureManager.checkDependencies(feature.id)
      }));
      
      this.featureManager.logFeatureUsage('analytics', req.path);
      res.json({ analytics, total: analytics.length });
    } catch (error) {
      this.featureManager.logFeatureUsage('analytics', req.path, false);
      res.status(500).json({ error: 'Failed to get feature analytics' });
    }
  }

  async getPerformanceAnalytics(req, res) {
    try {
      const performance = {
        features: this.featureManager.features.size,
        activeFeatures: this.featureManager.activeFeatures.size,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      };
      
      this.featureManager.logFeatureUsage('analytics', req.path);
      res.json(performance);
    } catch (error) {
      this.featureManager.logFeatureUsage('analytics', req.path, false);
      res.status(500).json({ error: 'Failed to get performance analytics' });
    }
  }

  async getTrendAnalytics(req, res) {
    try {
      const { period = '7d' } = req.query;
      const trends = {
        period,
        featureUsage: this.featureManager.getAllMetrics(),
        systemHealth: this.featureManager.getSystemHealth(),
        generatedAt: new Date().toISOString()
      };
      
      this.featureManager.logFeatureUsage('analytics', req.path);
      res.json(trends);
    } catch (error) {
      this.featureManager.logFeatureUsage('analytics', req.path, false);
      res.status(500).json({ error: 'Failed to get trend analytics' });
    }
  }

  // Real-time Endpoints
  async getRealtimeStatus(req, res) {
    try {
      const status = {
        websocket: 'active',
        connections: global.wsConnections || 0,
        lastActivity: new Date().toISOString(),
        features: this.featureManager.isFeatureActive('real-time')
      };
      
      this.featureManager.logFeatureUsage('real-time', req.path);
      res.json(status);
    } catch (error) {
      this.featureManager.logFeatureUsage('real-time', req.path, false);
      res.status(500).json({ error: 'Failed to get real-time status' });
    }
  }

  async getRealtimeMetrics(req, res) {
    try {
      const metrics = this.featureManager.getFeatureMetrics('real-time');
      
      this.featureManager.logFeatureUsage('real-time', req.path);
      res.json(metrics);
    } catch (error) {
      this.featureManager.logFeatureUsage('real-time', req.path, false);
      res.status(500).json({ error: 'Failed to get real-time metrics' });
    }
  }

  async broadcastMessage(req, res) {
    try {
      const { message, type = 'broadcast' } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }
      
      // This would integrate with WebSocket service
      this.featureManager.logFeatureUsage('real-time', req.path);
      res.json({ message: 'Broadcast sent', type, timestamp: new Date().toISOString() });
    } catch (error) {
      this.featureManager.logFeatureUsage('real-time', req.path, false);
      res.status(500).json({ error: 'Failed to broadcast message' });
    }
  }

  // MCP Protocol Endpoints
  async getMCPContexts(req, res) {
    try {
      const contexts = {
        available: ['platform', 'user', 'session', 'document'],
        active: this.featureManager.isFeatureActive('mcp-integration'),
        timestamp: new Date().toISOString()
      };
      
      this.featureManager.logFeatureUsage('mcp-integration', req.path);
      res.json(contexts);
    } catch (error) {
      this.featureManager.logFeatureUsage('mcp-integration', req.path, false);
      res.status(500).json({ error: 'Failed to get MCP contexts' });
    }
  }

  async createMCPContext(req, res) {
    try {
      const { type, data } = req.body;
      
      if (!type || !data) {
        return res.status(400).json({ error: 'Type and data are required' });
      }
      
      const context = {
        id: `mcp_${Date.now()}`,
        type,
        data,
        createdAt: new Date().toISOString()
      };
      
      this.featureManager.logFeatureUsage('mcp-integration', req.path);
      res.json({ message: 'MCP context created', context });
    } catch (error) {
      this.featureManager.logFeatureUsage('mcp-integration', req.path, false);
      res.status(500).json({ error: 'Failed to create MCP context' });
    }
  }

  async getMCPTools(req, res) {
    try {
      const tools = {
        available: ['search', 'generate', 'analyze', 'transform'],
        protocols: ['tools/list', 'tools/call', 'prompts/list', 'prompts/get'],
        active: this.featureManager.isFeatureActive('mcp-integration')
      };
      
      this.featureManager.logFeatureUsage('mcp-integration', req.path);
      res.json(tools);
    } catch (error) {
      this.featureManager.logFeatureUsage('mcp-integration', req.path, false);
      res.status(500).json({ error: 'Failed to get MCP tools' });
    }
  }

  // A2A Protocol Endpoints
  async getAgents(req, res) {
    try {
      const agents = {
        registered: ['prompt-agent', 'rag-agent', 'analytics-agent'],
        active: this.featureManager.isFeatureActive('a2a-protocol'),
        lastSync: new Date().toISOString()
      };
      
      this.featureManager.logFeatureUsage('a2a-protocol', req.path);
      res.json(agents);
    } catch (error) {
      this.featureManager.logFeatureUsage('a2a-protocol', req.path, false);
      res.status(500).json({ error: 'Failed to get agents' });
    }
  }

  async agentCommunicate(req, res) {
    try {
      const { fromAgent, toAgent, message, type = 'communication' } = req.body;
      
      if (!fromAgent || !toAgent || !message) {
        return res.status(400).json({ error: 'fromAgent, toAgent, and message are required' });
      }
      
      const communication = {
        id: `a2a_${Date.now()}`,
        fromAgent,
        toAgent,
        message,
        type,
        timestamp: new Date().toISOString()
      };
      
      this.featureManager.logFeatureUsage('a2a-protocol', req.path);
      res.json({ message: 'Communication sent', communication });
    } catch (error) {
      this.featureManager.logFeatureUsage('a2a-protocol', req.path, false);
      res.status(500).json({ error: 'Failed to send agent communication' });
    }
  }

  async getAgentSessions(req, res) {
    try {
      const sessions = {
        active: 0,
        total: 0,
        protocols: ['handshake', 'negotiate', 'execute', 'terminate'],
        status: this.featureManager.isFeatureActive('a2a-protocol') ? 'active' : 'inactive'
      };
      
      this.featureManager.logFeatureUsage('a2a-protocol', req.path);
      res.json(sessions);
    } catch (error) {
      this.featureManager.logFeatureUsage('a2a-protocol', req.path, false);
      res.status(500).json({ error: 'Failed to get agent sessions' });
    }
  }
}

module.exports = UnifiedAPIRouter;