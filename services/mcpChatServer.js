/**
 * MCP Chat Server - Seamless Document Retrieval for Chat Interface
 * Optimized for conversational document access with intelligent context selection
 */

const UnifiedRAGSystem = require('../unified-rag-system');

class MCPChatServer {
  constructor() {
    this.ragSystem = null;
    this.capabilities = {
      tools: {
        chat_search_documents: {
          description: "Search documents optimized for chat conversations with intelligent ranking",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "User's conversational query"
              },
              platform: {
                type: "string",
                description: "Specific platform to focus on (optional)",
                enum: ["replit", "lovable", "bolt", "cursor", "windsurf"]
              },
              intent: {
                type: "string",
                description: "Conversation intent for optimized retrieval",
                enum: ["question", "comparison", "feature_inquiry", "pricing", "tutorial"]
              },
              limit: {
                type: "number",
                description: "Maximum number of documents to return",
                default: 10
              }
            },
            required: ["query"]
          }
        },
        chat_compare_platforms: {
          description: "Compare multiple platforms with relevant documentation",
          inputSchema: {
            type: "object",
            properties: {
              platforms: {
                type: "array",
                items: { type: "string" },
                description: "Platforms to compare"
              },
              aspect: {
                type: "string",
                description: "Specific aspect to compare (features, pricing, etc.)"
              }
            },
            required: ["platforms"]
          }
        },
        chat_get_platform_overview: {
          description: "Get comprehensive platform overview for general questions",
          inputSchema: {
            type: "object",
            properties: {
              platform: {
                type: "string",
                description: "Platform to get overview for",
                enum: ["replit", "lovable", "bolt", "cursor", "windsurf"]
              }
            },
            required: ["platform"]
          }
        }
      },
      resources: {
        "chat://documents": {
          description: "Chat-optimized document access",
          mimeType: "application/json"
        }
      }
    };
    
    this.initializeRAG();
    console.log('[MCP-CHAT-SERVER] Initialized for seamless chat document retrieval');
  }

  async initializeRAG() {
    try {
      this.ragSystem = new UnifiedRAGSystem();
      await this.ragSystem.initializeDatabase();
      console.log('[MCP-CHAT-SERVER] RAG system initialized');
    } catch (error) {
      console.error('[MCP-CHAT-SERVER] RAG initialization error:', error);
    }
  }

  /**
   * Handle MCP tool requests for chat interface
   */
  async handleToolRequest(request) {
    const { name, arguments: args } = request;

    try {
      switch (name) {
        case 'chat_search_documents':
          return await this.chatSearchDocuments(args);
        case 'chat_compare_platforms':
          return await this.chatComparePlatforms(args);
        case 'chat_get_platform_overview':
          return await this.chatGetPlatformOverview(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      console.error(`[MCP-CHAT-SERVER] Tool error (${name}):`, error);
      return {
        success: false,
        error: error.message,
        content: []
      };
    }
  }

  /**
   * Optimized document search for chat conversations
   */
  async chatSearchDocuments({ query, platform = null, intent = 'question', limit = 10 }) {
    if (!this.ragSystem) {
      await this.initializeRAG();
    }

    console.log(`[MCP-CHAT-SERVER] Chat search: "${query}" | Platform: ${platform || 'all'} | Intent: ${intent}`);

    // Intent-based search strategy
    let searchResults = [];

    if (intent === 'comparison') {
      // For comparisons, get documents from multiple platforms
      const platforms = ['replit', 'lovable', 'bolt', 'cursor', 'windsurf'];
      for (const p of platforms) {
        const results = await this.ragSystem.searchDocuments(query, p, 3);
        searchResults = [...searchResults, ...results];
      }
    } else if (intent === 'pricing') {
      // For pricing questions, focus on pricing and cost documents
      const pricingQuery = `${query} pricing cost plans subscription`;
      searchResults = await this.ragSystem.searchDocuments(pricingQuery, platform, limit);
    } else if (intent === 'feature_inquiry') {
      // For feature questions, search for feature-specific docs
      const featureQuery = `${query} features capabilities functionality`;
      searchResults = await this.ragSystem.searchDocuments(featureQuery, platform, limit);
    } else {
      // General question - comprehensive search
      if (platform) {
        searchResults = await this.ragSystem.searchDocuments(query, platform, limit);
      } else {
        // Multi-platform search for general questions
        const platforms = ['replit', 'lovable', 'bolt', 'cursor', 'windsurf'];
        for (const p of platforms) {
          const results = await this.ragSystem.searchDocuments(query, p, 2);
          searchResults = [...searchResults, ...results];
        }
      }
    }

    // Remove duplicates and rank by relevance
    const uniqueResults = this.removeDuplicatesAndRank(searchResults, query);
    const finalResults = uniqueResults.slice(0, limit);

    console.log(`[MCP-CHAT-SERVER] Retrieved ${finalResults.length} documents for chat`);

    return {
      success: true,
      query: query,
      intent: intent,
      platform: platform,
      totalResults: finalResults.length,
      content: finalResults.map(doc => ({
        id: doc.id,
        title: doc.title || 'Untitled',
        platform: doc.platform || 'general',
        type: doc.document_type || doc.type || 'general',
        content: doc.content || doc.snippet || '',
        keywords: doc.keywords,
        relevanceScore: doc.relevanceScore || 0
      }))
    };
  }

  /**
   * Platform comparison with relevant documentation
   */
  async chatComparePlatforms({ platforms, aspect = 'general' }) {
    if (!this.ragSystem) {
      await this.initializeRAG();
    }

    console.log(`[MCP-CHAT-SERVER] Comparing platforms: ${platforms.join(', ')} | Aspect: ${aspect}`);

    const comparisonData = {};

    for (const platform of platforms) {
      const searchQuery = aspect === 'general' ? 
        `${platform} features overview capabilities` : 
        `${platform} ${aspect}`;
      
      const results = await this.ragSystem.searchDocuments(searchQuery, platform, 5);
      comparisonData[platform] = results;
    }

    return {
      success: true,
      platforms: platforms,
      aspect: aspect,
      comparison: comparisonData,
      totalDocuments: Object.values(comparisonData).flat().length
    };
  }

  /**
   * Get comprehensive platform overview
   */
  async chatGetPlatformOverview({ platform }) {
    if (!this.ragSystem) {
      await this.initializeRAG();
    }

    console.log(`[MCP-CHAT-SERVER] Getting overview for: ${platform}`);

    // Search for overview documents
    const overviewQueries = [
      `${platform} overview features`,
      `${platform} getting started`,
      `${platform} pricing plans`,
      `${platform} capabilities`,
      `${platform} documentation`
    ];

    let allResults = [];
    for (const query of overviewQueries) {
      const results = await this.ragSystem.searchDocuments(query, platform, 3);
      allResults = [...allResults, ...results];
    }

    // Remove duplicates
    const uniqueResults = this.removeDuplicatesAndRank(allResults, `${platform} overview`);

    return {
      success: true,
      platform: platform,
      overview: uniqueResults.slice(0, 10),
      categories: {
        features: uniqueResults.filter(doc => doc.content.toLowerCase().includes('feature')),
        pricing: uniqueResults.filter(doc => doc.content.toLowerCase().includes('pricing') || doc.content.toLowerCase().includes('cost')),
        gettingStarted: uniqueResults.filter(doc => doc.content.toLowerCase().includes('getting started') || doc.content.toLowerCase().includes('tutorial'))
      }
    };
  }

  /**
   * Remove duplicates and rank by relevance
   */
  removeDuplicatesAndRank(results, query) {
    // Remove duplicates by ID
    const uniqueResults = results.filter((doc, index, self) => 
      index === self.findIndex(d => d.id === doc.id)
    );

    // Calculate relevance scores
    const queryTerms = query.toLowerCase().split(' ');
    
    return uniqueResults.map(doc => {
      let score = 0;
      const content = (doc.content || '').toLowerCase();
      const title = (doc.title || '').toLowerCase();
      
      // Score based on query term matches
      queryTerms.forEach(term => {
        if (title.includes(term)) score += 3;
        if (content.includes(term)) score += 1;
      });
      
      // Boost score for certain document types
      if (doc.document_type === 'overview' || doc.document_type === 'features') score += 2;
      if (doc.document_type === 'pricing') score += 1;
      
      return { ...doc, relevanceScore: score };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Get server capabilities for MCP handshake
   */
  getCapabilities() {
    return this.capabilities;
  }

  /**
   * Handle resource requests
   */
  async handleResourceRequest(uri) {
    if (uri === 'chat://documents') {
      return {
        contents: [{
          uri: uri,
          mimeType: "application/json",
          text: JSON.stringify({
            description: "Chat-optimized document retrieval system",
            totalDocuments: await this.ragSystem?.getDocumentStats() || 0,
            supportedPlatforms: ['replit', 'lovable', 'bolt', 'cursor', 'windsurf'],
            capabilities: Object.keys(this.capabilities.tools)
          })
        }]
      };
    }
    
    throw new Error(`Unknown resource: ${uri}`);
  }
}

module.exports = MCPChatServer;