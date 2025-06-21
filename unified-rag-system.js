// Unified RAG 2.0 System - Consolidating all RAG functionality into one comprehensive system
const platformDocuments = {
  replit: [
    {
      id: 'repl_1',
      title: 'Replit Agent AI Development',
      content: 'Replit Agent is an AI system that builds full-stack applications from natural language prompts. It creates complete project structures, implements databases, handles authentication, and manages deployments. Agent can work with PostgreSQL, Redis, and various APIs while providing real-time collaboration features.',
      type: 'ai-agent',
      keywords: ['agent', 'ai', 'fullstack', 'prompt', 'natural-language'],
      lastUpdated: '2025-06-08',
      platform: 'replit',
      relevanceScore: 5
    },
    {
      id: 'repl_2',
      title: 'Replit Database & Storage Systems',
      content: 'Replit provides comprehensive database solutions including PostgreSQL with automated backups, ReplDB for key-value storage, and Object Storage for file management. Environment variables are auto-configured. Supports schema design, migrations, and real-time data sync.',
      type: 'database',
      keywords: ['database', 'postgresql', 'repldb', 'storage', 'migrations'],
      lastUpdated: '2025-06-08',
      platform: 'replit',
      relevanceScore: 5
    },
    {
      id: 'repl_3',
      title: 'Authentication & Security Systems',
      content: 'Replit Auth provides OAuth integration with GitHub, Google, email, and custom providers. Includes session management, user profiles, role-based access control, and security scanning. Supports JWT tokens and encrypted password storage.',
      type: 'authentication',
      keywords: ['auth', 'oauth', 'security', 'jwt', 'encryption'],
      lastUpdated: '2025-06-08',
      platform: 'replit',
      relevanceScore: 5
    }
  ],
  cursor: [
    {
      id: 'cursor_1',
      title: 'Cursor AI Code Editor',
      content: 'Cursor is an AI-first code editor built on VS Code. Features include AI autocomplete, code generation from natural language, real-time AI pair programming, and context-aware suggestions. Supports all major programming languages with advanced refactoring capabilities.',
      type: 'editor',
      keywords: ['cursor', 'ai-editor', 'vscode', 'autocomplete', 'pair-programming'],
      lastUpdated: '2025-06-08',
      platform: 'cursor',
      relevanceScore: 5
    }
  ],
  lovable: [
    {
      id: 'lovable_1',
      title: 'Lovable Full-Stack Development',
      content: 'Lovable is an AI-powered platform for building full-stack web applications. Uses React, TypeScript, Node.js, and Supabase. Features include real-time collaboration, AI code generation, component libraries, and automated deployment.',
      type: 'fullstack',
      keywords: ['lovable', 'react', 'typescript', 'supabase', 'fullstack'],
      lastUpdated: '2025-06-08',
      platform: 'lovable',
      relevanceScore: 5
    }
  ],
  bolt: [
    {
      id: 'bolt_1',
      title: 'Bolt AI Development Platform',
      content: 'Bolt provides instant full-stack application development with AI assistance. Features real-time preview, collaborative coding, and instant deployment capabilities.',
      type: 'platform',
      keywords: ['bolt', 'ai-development', 'instant-preview', 'collaboration'],
      lastUpdated: '2025-06-08',
      platform: 'bolt',
      relevanceScore: 5
    }
  ],
  windsurf: [
    {
      id: 'windsurf_1',
      title: 'Windsurf Collaborative Development',
      content: 'Windsurf offers team-based development environments with real-time collaboration, shared workspaces, and integrated project management tools.',
      type: 'collaboration',
      keywords: ['windsurf', 'team-development', 'collaboration', 'workspaces'],
      lastUpdated: '2025-06-08',
      platform: 'windsurf',
      relevanceScore: 5
    }
  ]
};

class UnifiedRAGSystem {
  constructor(pool = null) {
    this.pool = pool;
    this.documents = platformDocuments;
    this.dbDocuments = new Map();
    this.documentCache = new Map();
    this.lastDbSync = 0;
    this.syncInterval = 300000; // 5 minutes
    this.lastDocumentCount = 0;
    this.lastCacheUpdate = 0;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.lastSyncTime = 0;

    // Initialize if database is available
    if (this.pool) {
      this.initializeDatabase();
    }
  }

  async initializeDatabase() {
    try {
      // Test database connection first
      await this.pool.queryAsync('SELECT 1');
      await this.syncDatabaseDocuments();
      
      // Less frequent syncing to reduce resource usage
      setInterval(() => this.smartSync(), 600000); // 10 minutes
      console.log('[UNIFIED-RAG] Database integration initialized');
    } catch (error) {
      console.log('[UNIFIED-RAG] Database not available, using in-memory documents only');
    }
  }

  // Smart sync only when changes detected
  async smartSync() {
    if (!this.pool) return;

    try {
      // Skip if recently synced
      const now = Date.now();
      if (now - this.lastSyncTime < 300000) { // 5 minutes minimum
        return;
      }

      const countResult = await this.pool.queryAsync('SELECT COUNT(*) as count FROM rag_documents WHERE is_active = 1');
      const currentCount = parseInt(countResult.rows[0]?.count || 0);

      if (currentCount !== this.lastDocumentCount) {
        await this.syncDatabaseDocuments();
        this.lastDocumentCount = currentCount;
      }
    } catch (error) {
      // Silently handle database connection issues
      console.log('[UNIFIED-RAG] Database temporarily unavailable for sync');
    }
  }

  // Sync database documents to memory for fast access
  async syncDatabaseDocuments() {
    if (!this.pool) return;

    try {
      const now = Date.now();
      // Only sync if it's been more than 5 minutes since last sync
      if (now - this.lastSyncTime < 5 * 60 * 1000) {
        return;
      }

      this.lastSyncTime = now;

      const result = await this.pool.queryAsync(`
        SELECT id, title, content, platform, document_type, keywords, created_at
        FROM rag_documents 
        WHERE is_active = 1
        ORDER BY created_at DESC
        LIMIT 100
      `);

      this.dbDocuments.clear();

      for (const row of result.rows) {
        const platform = row.platform || 'unknown';
        if (!this.dbDocuments.has(platform)) {
          this.dbDocuments.set(platform, []);
        }

        let keywords = [];
        try {
          keywords = Array.isArray(row.keywords) ? row.keywords : 
                    (typeof row.keywords === 'string' && row.keywords ? JSON.parse(row.keywords) : []);
        } catch (e) {
          keywords = [];
        }

        this.dbDocuments.get(platform).push({
          id: `db_${row.id}`,
          title: row.title || 'Untitled',
          content: row.content || '',
          type: row.document_type || 'document',
          keywords: keywords,
          lastUpdated: row.created_at,
          source: 'database'
        });
      }

      this.lastDbSync = Date.now();
      console.log(`[UNIFIED-RAG] Synchronized ${result.rows.length} documents from database`);
    } catch (error) {
      console.log('[UNIFIED-RAG] Database sync failed, using in-memory documents');
    }
  }

  // Main search function combining all sources
  async searchDocuments(query, platform = null, limit = 10) {
    try {
      if (!query || typeof query !== 'string') {
        console.warn('[UNIFIED-RAG] Invalid query provided');
        return [];
      }

      const results = this.performSemanticSearch(query, platform, limit);
      const validResults = Array.isArray(results) ? results : [];
      console.log(`[UNIFIED-RAG] Query: "${query}" | Found ${validResults.length} documents`);
      return validResults;
    } catch (error) {
      console.error('[UNIFIED-RAG] Search error:', error);
      return [];
    }
  }

  performSemanticSearch(query, platform = null, limit = 10) {
    try {
      // Combine in-memory and database documents
      let allDocuments = [];
      
      // Add in-memory documents
      if (platform) {
        allDocuments = [...(this.documents[platform] || [])];
        // Add database documents for the platform
        if (this.dbDocuments.has(platform)) {
          allDocuments = [...allDocuments, ...this.dbDocuments.get(platform)];
        }
      } else {
        // All platforms
        allDocuments = Object.values(this.documents).flat();
        // Add all database documents
        for (const docs of this.dbDocuments.values()) {
          allDocuments = [...allDocuments, ...docs];
        }
      }

      if (!Array.isArray(allDocuments) || allDocuments.length === 0) {
        return [];
      }

      const queryTerms = this.extractKeywords(query.toLowerCase());

      const scoredDocuments = allDocuments.map(doc => {
        const score = this.calculateRelevanceScore(doc, queryTerms, query);
        return { ...doc, relevanceScore: score };
      });

      const results = scoredDocuments
        .filter(doc => doc.relevanceScore > 0.1)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit)
        .map(doc => ({
          id: doc.id,
          title: doc.title || 'Untitled',
          content: doc.content || '',
          snippet: this.generateSnippet(doc.content || '', query),
          relevanceScore: doc.relevanceScore,
          platform: doc.platform,
          lastUpdated: doc.lastUpdated
        }));

      return Array.isArray(results) ? results : [];
    } catch (error) {
      console.error('[RAG] performSemanticSearch error:', error);
      return [];
    }
  }

  // Calculate relevance score with enhanced scoring
  calculateRelevanceScore(doc, searchTerms, originalQuery = '') {
    let score = 0;
    const content = (doc.title + ' ' + doc.content + ' ' + (doc.keywords || []).join(' ')).toLowerCase();

    // Exact phrase matching (highest weight)
    if (content.includes(originalQuery.toLowerCase())) {
      score += 50;
    }

    // Title matching (high weight)
    const titleMatches = searchTerms.filter(term => doc.title.toLowerCase().includes(term)).length;
    score += titleMatches * 15;

    // Content matching (medium weight)
    const contentMatches = searchTerms.filter(term => doc.content.toLowerCase().includes(term)).length;
    score += contentMatches * 10;

    // Keyword matching (medium weight)
    if (doc.keywords) {
      const keywordMatches = searchTerms.filter(term => 
        doc.keywords.some(keyword => keyword.toLowerCase().includes(term))
      ).length;
      score += keywordMatches * 12;
    }

    // Type-specific bonuses
    if (doc.type === 'ai-agent' && originalQuery.toLowerCase().includes('ai')) score += 10;
    if (doc.type === 'database' && originalQuery.toLowerCase().includes('data')) score += 10;
    if (doc.type === 'authentication' && originalQuery.toLowerCase().includes('auth')) score += 10;

    return Math.max(0, score);
  }

  // Generate contextual snippet
  generateSnippet(content, query, maxLength = 200) {
    if (!content) return '';

    const words = content.split(' ');
    let bestStart = 0;
    let maxMatches = 0;
    const queryTerms = this.extractKeywords(query.toLowerCase());

    // Find section with most search term matches
    for (let i = 0; i < words.length - 20; i++) {
      const section = words.slice(i, i + 20).join(' ').toLowerCase();
      const matches = queryTerms.reduce((count, term) => {
        return count + (section.includes(term) ? 1 : 0);
      }, 0);

      if (matches > maxMatches) {
        maxMatches = matches;
        bestStart = i;
      }
    }

    let snippet = words.slice(bestStart, bestStart + 30).join(' ');
    if (snippet.length > maxLength) {
      snippet = snippet.substring(0, maxLength - 3) + '...';
    }

    return snippet;
  }

  // Add document to database
  async addDocument(document) {
    if (!this.pool) {
      console.log('[UNIFIED-RAG] Database not available for document addition');
      return null;
    }

    try {
      const result = await this.pool.queryAsync(`
        INSERT INTO rag_documents (title, content, platform, document_type, keywords, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        document.title,
        document.content,
        document.platform,
        document.type || 'document',
        JSON.stringify(document.keywords || []),
        document.uploadedBy || null
      ]);

      // Refresh database cache
      await this.syncDatabaseDocuments();

      console.log(`[UNIFIED-RAG] Added document: ${document.title}`);
      return result;
    } catch (error) {
      console.error('[UNIFIED-RAG] Error adding document:', error);
      return null;
    }
  }

  // Get platform documents
  getPlatformDocuments(platform) {
    return this.documents[platform] || [];
  }

  // Get document statistics
  async getDocumentStats() {
    const stats = {
      platforms: Object.keys(this.documents).length,
      memoryDocuments: 0,
      databaseDocuments: 0,
      totalDocuments: 0
    };

    // Count in-memory documents
    for (const platform of Object.keys(this.documents)) {
      stats.memoryDocuments += this.documents[platform].length;
    }

    // Count database documents
    for (const docs of this.dbDocuments.values()) {
      stats.databaseDocuments += docs.length;
    }

    stats.totalDocuments = stats.memoryDocuments + stats.databaseDocuments;

    return stats;
  }

  // Get total document count for quick access
  getTotalDocumentCount() {
    let total = 0;
    
    // Count in-memory documents
    for (const platform of Object.keys(this.documents)) {
      total += this.documents[platform].length;
    }
    
    // Count database documents
    for (const docs of this.dbDocuments.values()) {
      total += docs.length;
    }
    
    return total;
  }

  // Get contextual recommendations
  getContextualRecommendations(query, platform) {
    const recommendations = [];
    const queryLower = query.toLowerCase();

    // Platform-specific recommendations
    if (platform === 'replit') {
      if (queryLower.includes('deploy') || queryLower.includes('host')) {
        recommendations.push('Consider using Replit Autoscale for dynamic scaling');
      }
      if (queryLower.includes('database') || queryLower.includes('data')) {
        recommendations.push('Replit PostgreSQL provides automated backups and migrations');
      }
    }

    // General recommendations based on query content
    if (queryLower.includes('auth') || queryLower.includes('login')) {
      recommendations.push('Implement OAuth for secure user authentication');
    }
    if (queryLower.includes('real-time') || queryLower.includes('live')) {
      recommendations.push('Consider WebSocket integration for real-time features');
    }

    return recommendations;
  }

  // Clear caches
  clearCaches() {
    this.documentCache.clear();
    this.lastCacheUpdate = 0;
    console.log('[UNIFIED-RAG] Caches cleared');
  }

  // Extract keywords from query
  extractKeywords(query) {
    // Basic keyword extraction (can be improved with NLP techniques)
    return query.split(/\s+/).filter(word => word.length > 2);
  }
}

module.exports = UnifiedRAGSystem;