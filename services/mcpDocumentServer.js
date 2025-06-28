/**
 * MCP Document Server - Model Context Protocol Implementation
 * Provides seamless access to all 759+ documents through JSON-RPC 2.0
 * Universal AI-to-document connectivity ("USB-C for AI")
 */

const { EventEmitter } = require('events');
const database = require('../database');
const UnifiedRAGSystem = require('../unified-rag-system');

class MCPDocumentServer extends EventEmitter {
  constructor() {
    super();
    this.protocol_version = "2024-11-05";
    this.server_info = {
      name: "DeepSeek Document Server",
      version: "1.0.0",
      description: "MCP server providing access to all platform documentation"
    };
    this.capabilities = {
      tools: true,
      resources: true,
      prompts: true,
      logging: true
    };
    this.ragSystem = new UnifiedRAGSystem();
    this.initializeServer();
  }

  async initializeServer() {
    try {
      await this.ragSystem.initializeDatabase();
      console.log('[MCP-SERVER] Initialized with access to all documents');
      this.emit('ready');
    } catch (error) {
      console.error('[MCP-SERVER] Initialization error:', error);
      this.emit('error', error);
    }
  }

  /**
   * MCP Protocol Handler - JSON-RPC 2.0 Message Processing
   */
  async handleRequest(request) {
    try {
      const { jsonrpc, method, params, id } = request;

      if (jsonrpc !== "2.0") {
        return this.createErrorResponse(id, -32600, "Invalid Request", "Invalid JSON-RPC version");
      }

      switch (method) {
        case "initialize":
          return this.handleInitialize(params, id);
        case "tools/list":
          return this.handleToolsList(id);
        case "tools/call":
          return this.handleToolsCall(params, id);
        case "resources/list":
          return this.handleResourcesList(id);
        case "resources/read":
          return this.handleResourcesRead(params, id);
        case "resources/subscribe":
          return this.handleResourcesSubscribe(params, id);
        case "prompts/list":
          return this.handlePromptsList(id);
        case "prompts/get":
          return this.handlePromptsGet(params, id);
        default:
          return this.createErrorResponse(id, -32601, "Method not found", `Unknown method: ${method}`);
      }
    } catch (error) {
      console.error('[MCP-SERVER] Request handling error:', error);
      return this.createErrorResponse(request.id, -32603, "Internal error", error.message);
    }
  }

  /**
   * Initialize MCP Connection with Capability Negotiation
   */
  handleInitialize(params, id) {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: this.protocol_version,
        capabilities: this.capabilities,
        serverInfo: this.server_info,
        instructions: "Access to complete knowledge base: 759+ documents across all platforms"
      }
    };
  }

  /**
   * Tools List - Available Document Operations
   */
  handleToolsList(id) {
    const tools = [
      {
        name: "search_documents",
        description: "Search across all 759+ documents with semantic and keyword matching",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
            platform: { type: "string", description: "Platform filter (optional): replit, lovable, bolt, cursor, windsurf" },
            limit: { type: "number", description: "Maximum results (default: 10)" },
            type: { type: "string", description: "Document type filter (optional)" }
          },
          required: ["query"]
        }
      },
      {
        name: "get_document_by_id",
        description: "Retrieve specific document by ID",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "Document ID" },
            platform: { type: "string", description: "Platform name" }
          },
          required: ["id"]
        }
      },
      {
        name: "get_platform_documents",
        description: "Get all documents for a specific platform",
        inputSchema: {
          type: "object",
          properties: {
            platform: { type: "string", description: "Platform: replit, lovable, bolt, cursor, windsurf" },
            limit: { type: "number", description: "Maximum results (default: 50)" }
          },
          required: ["platform"]
        }
      },
      {
        name: "cross_platform_analysis",
        description: "Compare features and capabilities across platforms",
        inputSchema: {
          type: "object",
          properties: {
            platforms: { type: "array", items: { type: "string" }, description: "Platforms to compare" },
            topic: { type: "string", description: "Specific topic or feature to analyze" }
          },
          required: ["platforms", "topic"]
        }
      },
      {
        name: "get_document_stats",
        description: "Get comprehensive statistics about the document corpus",
        inputSchema: {
          type: "object",
          properties: {}
        }
      }
    ];

    return {
      jsonrpc: "2.0",
      id,
      result: { tools }
    };
  }

  /**
   * Tools Call - Execute Document Operations
   */
  async handleToolsCall(params, id) {
    const { name, arguments: args } = params;

    try {
      let result;

      switch (name) {
        case "search_documents":
          result = await this.searchDocuments(args);
          break;
        case "get_document_by_id":
          result = await this.getDocumentById(args);
          break;
        case "get_platform_documents":
          result = await this.getPlatformDocuments(args);
          break;
        case "cross_platform_analysis":
          result = await this.crossPlatformAnalysis(args);
          break;
        case "get_document_stats":
          result = await this.getDocumentStats(args);
          break;
        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        }
      };
    } catch (error) {
      return this.createErrorResponse(id, -32603, "Tool execution failed", error.message);
    }
  }

  /**
   * Resources List - Available Document Resources
   */
  async handleResourcesList(id) {
    try {
      const stats = await this.ragSystem.getDocumentStats();
      const resources = [];

      // Create resource URIs for all platforms
      const platforms = ['replit', 'lovable', 'bolt', 'cursor', 'windsurf', 'general'];
      
      for (const platform of platforms) {
        const count = stats.platformCounts?.[platform] || 0;
        if (count > 0) {
          resources.push({
            uri: `resource://documents/${platform}`,
            name: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Documents`,
            description: `All ${count} documents for ${platform} platform`,
            mimeType: "application/json"
          });
        }
      }

      // Add comprehensive search resource
      resources.push({
        uri: "resource://documents/all",
        name: "Complete Document Corpus",
        description: `Access to all ${stats.totalDocuments} documents across all platforms`,
        mimeType: "application/json"
      });

      return {
        jsonrpc: "2.0",
        id,
        result: { resources }
      };
    } catch (error) {
      return this.createErrorResponse(id, -32603, "Resource listing failed", error.message);
    }
  }

  /**
   * Resources Read - Access Document Content
   */
  async handleResourcesRead(params, id) {
    const { uri } = params;
    
    try {
      let content;
      const uriParts = uri.split('/');
      
      if (uri === "resource://documents/all") {
        // Return all documents
        content = await this.getAllDocuments();
      } else if (uri.startsWith("resource://documents/")) {
        // Return platform-specific documents
        const platform = uriParts[2];
        content = await this.getPlatformDocuments({ platform, limit: 1000 });
      } else {
        throw new Error(`Unknown resource URI: ${uri}`);
      }

      return {
        jsonrpc: "2.0",
        id,
        result: {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(content, null, 2)
            }
          ]
        }
      };
    } catch (error) {
      return this.createErrorResponse(id, -32603, "Resource read failed", error.message);
    }
  }

  /**
   * Resources Subscribe - Real-time Document Updates
   */
  handleResourcesSubscribe(params, id) {
    const { uri } = params;
    
    // Store subscription for real-time updates
    this.emit('subscribe', { uri, clientId: id });
    
    return {
      jsonrpc: "2.0",
      id,
      result: {
        subscribed: true,
        uri
      }
    };
  }

  /**
   * Prompts List - Available Document Prompt Templates
   */
  handlePromptsList(id) {
    const prompts = [
      {
        name: "platform_comparison",
        description: "Compare features across multiple no-code platforms",
        arguments: [
          {
            name: "platforms",
            description: "Platforms to compare",
            required: true
          },
          {
            name: "feature",
            description: "Specific feature to compare",
            required: true
          }
        ]
      },
      {
        name: "comprehensive_analysis",
        description: "Comprehensive analysis using all available documentation",
        arguments: [
          {
            name: "topic",
            description: "Topic to analyze",
            required: true
          }
        ]
      },
      {
        name: "platform_recommendation",
        description: "Recommend best platform for specific use case",
        arguments: [
          {
            name: "requirements",
            description: "Project requirements",
            required: true
          },
          {
            name: "constraints",
            description: "Any constraints or preferences",
            required: false
          }
        ]
      }
    ];

    return {
      jsonrpc: "2.0",
      id,
      result: { prompts }
    };
  }

  /**
   * Prompts Get - Retrieve Prompt Template
   */
  async handlePromptsGet(params, id) {
    const { name, arguments: args } = params;

    try {
      let prompt;

      switch (name) {
        case "platform_comparison":
          prompt = await this.generatePlatformComparisonPrompt(args);
          break;
        case "comprehensive_analysis":
          prompt = await this.generateComprehensiveAnalysisPrompt(args);
          break;
        case "platform_recommendation":
          prompt = await this.generatePlatformRecommendationPrompt(args);
          break;
        default:
          throw new Error(`Unknown prompt: ${name}`);
      }

      return {
        jsonrpc: "2.0",
        id,
        result: { prompt }
      };
    } catch (error) {
      return this.createErrorResponse(id, -32603, "Prompt generation failed", error.message);
    }
  }

  /**
   * Document Operation Implementations
   */
  async searchDocuments({ query, platform, limit = 10, type }) {
    console.log(`[MCP-SEARCH] Query: "${query}", Platform: ${platform || 'all'}, Limit: ${limit}`);
    
    const results = await this.ragSystem.searchDocuments(query, platform, limit);
    
    return {
      query,
      platform: platform || 'all',
      totalFound: results.length,
      documents: results.map(doc => ({
        id: doc.id,
        title: doc.title,
        platform: doc.platform,
        type: doc.document_type || doc.type,
        content: doc.content || doc.snippet,
        keywords: doc.keywords,
        relevanceScore: doc.relevanceScore || 1.0
      }))
    };
  }

  async getDocumentById({ id, platform }) {
    console.log(`[MCP-GET] Document ID: ${id}, Platform: ${platform || 'any'}`);
    
    // Search for specific document
    const results = await this.ragSystem.searchDocuments(id, platform, 1);
    
    if (results.length === 0) {
      throw new Error(`Document not found: ${id}`);
    }

    return results[0];
  }

  async getPlatformDocuments({ platform, limit = 50 }) {
    console.log(`[MCP-PLATFORM] Platform: ${platform}, Limit: ${limit}`);
    
    const results = await this.ragSystem.searchDocuments('', platform, limit);
    
    return {
      platform,
      totalDocuments: results.length,
      documents: results
    };
  }

  async getAllDocuments() {
    console.log('[MCP-ALL] Retrieving complete document corpus');
    
    const stats = await this.ragSystem.getDocumentStats();
    const platforms = ['replit', 'lovable', 'bolt', 'cursor', 'windsurf'];
    const allDocuments = [];

    for (const platform of platforms) {
      const docs = await this.ragSystem.searchDocuments('', platform, 1000);
      allDocuments.push(...docs);
    }

    return {
      totalDocuments: allDocuments.length,
      platforms: stats.platformCounts,
      documents: allDocuments
    };
  }

  async crossPlatformAnalysis({ platforms, topic }) {
    console.log(`[MCP-ANALYSIS] Platforms: ${platforms.join(', ')}, Topic: ${topic}`);
    
    const analysis = {};
    
    for (const platform of platforms) {
      const docs = await this.ragSystem.searchDocuments(topic, platform, 10);
      analysis[platform] = {
        relevantDocuments: docs.length,
        documents: docs.map(doc => ({
          title: doc.title,
          content: doc.content?.substring(0, 300) + '...',
          keywords: doc.keywords
        }))
      };
    }

    return {
      topic,
      platforms,
      analysis,
      summary: `Cross-platform analysis for "${topic}" across ${platforms.length} platforms`
    };
  }

  async getDocumentStats() {
    console.log('[MCP-STATS] Retrieving document statistics');
    
    const stats = await this.ragSystem.getDocumentStats();
    
    return {
      totalDocuments: stats.totalDocuments,
      platformBreakdown: stats.platformCounts,
      lastUpdated: new Date().toISOString(),
      coverage: {
        replit: stats.platformCounts?.replit || 0,
        lovable: stats.platformCounts?.lovable || 0,
        bolt: stats.platformCounts?.bolt || 0,
        cursor: stats.platformCounts?.cursor || 0,
        windsurf: stats.platformCounts?.windsurf || 0
      }
    };
  }

  /**
   * Prompt Generation Methods
   */
  async generatePlatformComparisonPrompt({ platforms, feature }) {
    const docs = await this.crossPlatformAnalysis({ platforms, topic: feature });
    
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Compare ${feature} across these platforms: ${platforms.join(', ')}. Use the following documentation context:\n\n${JSON.stringify(docs, null, 2)}`
          }
        }
      ]
    };
  }

  async generateComprehensiveAnalysisPrompt({ topic }) {
    const allDocs = await this.searchDocuments({ query: topic, limit: 20 });
    
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Provide comprehensive analysis of "${topic}" using all available platform documentation:\n\n${JSON.stringify(allDocs, null, 2)}`
          }
        }
      ]
    };
  }

  async generatePlatformRecommendationPrompt({ requirements, constraints }) {
    const allPlatforms = await this.getAllDocuments();
    
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Recommend the best platform for these requirements: ${requirements}${constraints ? ` with constraints: ${constraints}` : ''}. Consider all platform capabilities:\n\n${JSON.stringify(allPlatforms.platforms, null, 2)}`
          }
        }
      ]
    };
  }

  /**
   * Utility Methods
   */
  createErrorResponse(id, code, message, data) {
    return {
      jsonrpc: "2.0",
      id,
      error: {
        code,
        message,
        data
      }
    };
  }

  /**
   * Notification for Resource Updates
   */
  notifyResourceUpdate(uri, content) {
    this.emit('notification', {
      jsonrpc: "2.0",
      method: "notifications/resources/updated",
      params: {
        uri,
        content
      }
    });
  }
}

module.exports = MCPDocumentServer;