// Unified RAG 2.0 System - Comprehensive platform documentation from attached assets
const platformDocuments = {
  replit: [
    {
      id: 'repl_1',
      title: 'Replit Agent AI Development System',
      content: 'Replit Agent is an advanced AI system that builds complete full-stack applications from natural language prompts. It creates project structures, implements databases (PostgreSQL, SQLite), handles authentication (OAuth, JWT), manages deployments with autoscaling, and provides real-time collaboration. Agent integrates with 50+ frameworks including React, Next.js, Express, FastAPI, and supports multi-language development.',
      type: 'ai-agent',
      keywords: ['agent', 'ai', 'fullstack', 'prompt', 'natural-language', 'deployment', 'autoscaling'],
      lastUpdated: '2025-06-21',
      platform: 'replit',
      relevanceScore: 5
    },
    {
      id: 'repl_2',
      title: 'Replit Database & Object Storage Systems',
      content: 'Replit provides comprehensive data solutions: PostgreSQL with automated backups and migrations, ReplDB for key-value storage, Object Storage for file management with GCS compatibility. Environment variables auto-configured, supports schema design, real-time data sync, and seamless integration between development and production environments.',
      type: 'database',
      keywords: ['database', 'postgresql', 'repldb', 'object-storage', 'gcs', 'migrations', 'backup'],
      lastUpdated: '2025-06-21',
      platform: 'replit',
      relevanceScore: 5
    },
    {
      id: 'repl_3',
      title: 'Replit Authentication & Security',
      content: 'Replit Auth provides OAuth integration with GitHub, Google, Discord, email providers. Features session management, user profiles, role-based access control, security scanning, JWT tokens, encrypted password storage, and seamless integration with Replit databases.',
      type: 'authentication',
      keywords: ['auth', 'oauth', 'security', 'jwt', 'encryption', 'github', 'google', 'discord'],
      lastUpdated: '2025-06-21',
      platform: 'replit',
      relevanceScore: 5
    },
    {
      id: 'repl_4',
      title: 'Replit Deployment & Hosting',
      content: 'Replit Deployments provide production-ready hosting with autoscaling, custom domains, SSL certificates, environment variables, and monitoring. Supports static sites, web services, background workers, and cron jobs with automatic CI/CD from your Repl.',
      type: 'deployment',
      keywords: ['deployment', 'hosting', 'autoscaling', 'ssl', 'domains', 'monitoring', 'cicd'],
      lastUpdated: '2025-06-21',
      platform: 'replit',
      relevanceScore: 5
    }
  ],
  cursor: [
    {
      id: 'cursor_1',
      title: 'Cursor AI-First Code Editor',
      content: 'Cursor is an AI-first code editor built on VS Code with advanced AI capabilities. Features include GPT-4 powered autocomplete, natural language code generation, AI pair programming, context-aware suggestions, codebase understanding, and intelligent refactoring across all major programming languages.',
      type: 'editor',
      keywords: ['cursor', 'ai-editor', 'vscode', 'gpt4', 'autocomplete', 'pair-programming', 'refactoring'],
      lastUpdated: '2025-06-21',
      platform: 'cursor',
      relevanceScore: 5
    },
    {
      id: 'cursor_2',
      title: 'Cursor AI Chat & Code Generation',
      content: 'Cursor Chat allows natural language interactions with your codebase. Generate functions, debug code, explain complex logic, and refactor existing code through conversational AI. Supports multi-file editing, project-wide understanding, and maintains coding best practices.',
      type: 'ai-chat',
      keywords: ['ai-chat', 'code-generation', 'debugging', 'refactoring', 'multi-file', 'best-practices'],
      lastUpdated: '2025-06-21',
      platform: 'cursor',
      relevanceScore: 5
    },
    {
      id: 'cursor_3',
      title: 'Cursor Composer & Project Management',
      content: 'Cursor Composer enables AI-assisted project creation and management. Build entire applications, generate project structures, handle dependencies, and maintain code quality through AI guidance. Integrates with Git, supports team collaboration, and provides intelligent project insights.',
      type: 'project-management',
      keywords: ['composer', 'project-creation', 'dependencies', 'git', 'collaboration', 'insights'],
      lastUpdated: '2025-06-21',
      platform: 'cursor',
      relevanceScore: 5
    }
  ],
  lovable: [
    {
      id: 'lovable_1',
      title: 'Lovable 2.0 AI Fullstack Engineer',
      content: 'Lovable 2.0 features an AI Fullstack Engineer that builds production-ready applications through conversational AI. Uses "vibe coding" philosophy with React, TailwindCSS, Vite frontend and Supabase backend. Supports real-time collaboration, AI code generation, component libraries, and automated deployment.',
      type: 'ai-fullstack',
      keywords: ['lovable', 'ai-engineer', 'react', 'tailwind', 'vite', 'supabase', 'vibe-coding'],
      lastUpdated: '2025-06-21',
      platform: 'lovable',
      relevanceScore: 5
    },
    {
      id: 'lovable_2',
      title: 'Lovable Component System & Design',
      content: 'Lovable provides an extensive component library with AI-generated UI components, responsive design patterns, and design system integration. Features include automatic responsiveness, accessibility compliance, and seamless design-to-code workflow.',
      type: 'components',
      keywords: ['components', 'ui-library', 'responsive', 'accessibility', 'design-system'],
      lastUpdated: '2025-06-21',
      platform: 'lovable',
      relevanceScore: 5
    },
    {
      id: 'lovable_3',
      title: 'Lovable Supabase Integration',
      content: 'Deep integration with Supabase for backend services including authentication, real-time databases, storage, and edge functions. Automatic schema generation, type-safe queries, and seamless data synchronization between frontend and backend.',
      type: 'backend-integration',
      keywords: ['supabase', 'authentication', 'realtime-db', 'storage', 'edge-functions', 'schema'],
      lastUpdated: '2025-06-21',
      platform: 'lovable',
      relevanceScore: 5
    }
  ],
  bolt: [
    {
      id: 'bolt_1',
      title: 'Bolt AI Development Platform',
      content: 'Bolt provides instant full-stack application development with AI assistance. Features include real-time preview, collaborative coding, instant deployment, and intelligent code generation. Supports multiple frameworks and provides seamless development experience.',
      type: 'ai-platform',
      keywords: ['bolt', 'ai-development', 'instant-preview', 'collaboration', 'deployment'],
      lastUpdated: '2025-06-21',
      platform: 'bolt',
      relevanceScore: 5
    },
    {
      id: 'bolt_2',
      title: 'Bolt Real-time Collaboration',
      content: 'Advanced real-time collaboration features with live code sharing, synchronized editing, and team development workflows. Supports concurrent editing, conflict resolution, and seamless team coordination.',
      type: 'collaboration',
      keywords: ['real-time', 'collaboration', 'live-sharing', 'concurrent-editing', 'team-workflow'],
      lastUpdated: '2025-06-21',
      platform: 'bolt',
      relevanceScore: 5
    },
    {
      id: 'bolt_3',
      title: 'Bolt Instant Deployment & Preview',
      content: 'Bolt offers instant deployment with live preview capabilities. Changes are reflected immediately, supporting rapid prototyping and iterative development. Includes staging environments and production deployment options.',
      type: 'deployment',
      keywords: ['instant-deployment', 'live-preview', 'prototyping', 'staging', 'production'],
      lastUpdated: '2025-06-21',
      platform: 'bolt',
      relevanceScore: 5
    }
  ],
  windsurf: [
    {
      id: 'windsurf_1',
      title: 'Windsurf Collaborative Development Environment',
      content: 'Windsurf offers comprehensive team-based development with real-time collaboration, shared workspaces, integrated project management, and advanced debugging tools. Designed for distributed teams with seamless communication features.',
      type: 'collaboration',
      keywords: ['windsurf', 'team-development', 'collaboration', 'workspaces', 'project-management'],
      lastUpdated: '2025-06-21',
      platform: 'windsurf',
      relevanceScore: 5
    },
    {
      id: 'windsurf_2',
      title: 'Windsurf AI-Powered Development',
      content: 'AI-assisted coding with intelligent suggestions, automated testing, code review assistance, and smart refactoring. Integrates AI throughout the development lifecycle for enhanced productivity.',
      type: 'ai-development',
      keywords: ['ai-coding', 'intelligent-suggestions', 'automated-testing', 'code-review', 'refactoring'],
      lastUpdated: '2025-06-21',
      platform: 'windsurf',
      relevanceScore: 5
    },
    {
      id: 'windsurf_3',
      title: 'Windsurf Team Management & Workflows',
      content: 'Advanced team management with role-based permissions, workflow automation, sprint planning, and productivity analytics. Supports agile methodologies with integrated tools for project tracking.',
      type: 'team-management',
      keywords: ['team-management', 'permissions', 'workflow-automation', 'agile', 'analytics'],
      lastUpdated: '2025-06-21',
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