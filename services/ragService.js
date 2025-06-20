/**
 * RAG Service
 * Advanced document retrieval with semantic search
 */

const config = require('../config/environment');
const database = require('../database');

class RAGService {
  constructor() {
    this.database = database;
    this.inMemoryDocuments = new Map();
    this.searchCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000;
    this.lastSync = 0;
    
    this.initializeDocuments();
    this.startPeriodicSync();
  }

  initializeDocuments() {
    const platformDocs = {
      replit: [
        {
          id: 'repl_1',
          title: 'Replit AI Agent Capabilities',
          content: 'Replit Agent provides intelligent coding assistance with automatic dependency management, real-time collaboration, and instant deployment. Features include code generation, debugging assistance, and project setup automation.',
          type: 'ai-features',
          keywords: ['ai-agent', 'coding-assistance', 'deployment', 'collaboration'],
          platform: 'replit',
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'repl_2',
          title: 'Database Integration Support',
          content: 'Seamless database integration with PostgreSQL, MySQL, MongoDB, and SQLite. Automated ORM setup with Prisma, Drizzle, and TypeORM. Database schema generation and migration management.',
          type: 'database',
          keywords: ['database', 'postgresql', 'mysql', 'mongodb', 'prisma', 'drizzle'],
          platform: 'replit',
          lastUpdated: new Date().toISOString()
        }
      ],
      
      lovable: [
        {
          id: 'lov_1',
          title: 'AI Fullstack Development',
          content: 'Lovable 2.0 AI Fullstack Engineer enables production-ready application development through conversational AI. Features "vibe coding" philosophy with React/Tailwind/Vite frontend and Supabase backend integration.',
          type: 'ai-fullstack',
          keywords: ['ai-engineer', 'vibe-coding', 'react', 'tailwind', 'supabase'],
          platform: 'lovable',
          lastUpdated: new Date().toISOString()
        }
      ],
      
      bolt: [
        {
          id: 'bolt_1',
          title: 'Instant Development Environment',
          content: 'Bolt.new provides instant full-stack development with WebContainers technology. Zero-setup environment with package management, real-time preview, and instant deployment capabilities.',
          type: 'development-environment',
          keywords: ['webcontainers', 'instant-setup', 'full-stack', 'preview'],
          platform: 'bolt',
          lastUpdated: new Date().toISOString()
        }
      ],
      
      cursor: [
        {
          id: 'cur_1',
          title: 'AI-Powered Code Intelligence',
          content: 'Cursor IDE offers advanced AI-powered code completion, generation, and refactoring. Context-aware suggestions, intelligent debugging, and codebase understanding with multi-file editing capabilities.',
          type: 'ai-ide',
          keywords: ['ai-completion', 'code-generation', 'refactoring', 'debugging'],
          platform: 'cursor',
          lastUpdated: new Date().toISOString()
        }
      ],
      
      windsurf: [
        {
          id: 'wind_1',
          title: 'Collaborative AI Development',
          content: 'Windsurf by Codeium provides collaborative AI coding with advanced context management. Multi-file editing, large codebase handling, and semantic code analysis with AI assistance.',
          type: 'collaborative-ai',
          keywords: ['collaborative', 'context-management', 'multi-file', 'semantic-analysis'],
          platform: 'windsurf',
          lastUpdated: new Date().toISOString()
        }
      ]
    };

    Object.entries(platformDocs).forEach(([platform, docs]) => {
      if (!this.inMemoryDocuments.has(platform)) {
        this.inMemoryDocuments.set(platform, []);
      }
      this.inMemoryDocuments.get(platform).push(...docs);
    });

    console.log('[RAG] Initialized with comprehensive platform documentation');
  }

  startPeriodicSync() {
    setInterval(async () => {
      try {
        await this.syncDatabaseDocuments();
      } catch (error) {
        console.error('[RAG] Sync error:', error.message);
      }
    }, 30 * 1000);
  }

  async syncDatabaseDocuments() {
    try {
      await this.database.queryAsync('SELECT 1');
      
      const result = await this.database.queryAsync(`
        SELECT id, title, content, platform, document_type, keywords, created_at
        FROM rag_documents 
        WHERE is_active = 1 
        ORDER BY created_at DESC
      `);

      this.lastSync = Date.now();
      console.log(`[RAG] Synchronized ${result.rows.length} documents from database`);
      
      return result.rows;
    } catch (error) {
      console.log(`[RAG] Database unavailable, using in-memory documents only`);
      return [];
    }
  }

  async searchDocuments(query, platform = null, limit = 5) {
    const cacheKey = `${query}_${platform}_${limit}`;
    
    if (this.searchCache.has(cacheKey)) {
      const cached = this.searchCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.results;
      }
    }

    try {
      const searchTerms = this.extractSearchTerms(query);
      
      const [memoryResults, dbResults] = await Promise.all([
        this.searchInMemoryDocuments(query, platform, searchTerms),
        this.searchDatabaseDocuments(query, platform, searchTerms, limit * 2)
      ]);

      const allResults = [...memoryResults, ...dbResults];
      const rankedResults = this.rankAndDeduplicateResults(allResults, limit);

      this.searchCache.set(cacheKey, {
        results: rankedResults,
        timestamp: Date.now()
      });

      return rankedResults;
    } catch (error) {
      console.error('[RAG] Search error:', error);
      return [];
    }
  }

  extractSearchTerms(query) {
    return query.toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 2)
      .slice(0, 10);
  }

  async searchInMemoryDocuments(query, platform, searchTerms) {
    const results = [];
    const documentsToSearch = platform ? 
      (this.inMemoryDocuments.get(platform) || []) :
      Array.from(this.inMemoryDocuments.values()).flat();

    documentsToSearch.forEach(doc => {
      const score = this.calculateRelevanceScore(doc, searchTerms, query);
      if (score > 0) {
        results.push({
          ...doc,
          score,
          snippet: this.generateSnippet(doc.content, searchTerms),
          source: 'memory'
        });
      }
    });

    return results.sort((a, b) => b.score - a.score);
  }

  async searchDatabaseDocuments(query, platform, searchTerms, limit) {
    try {
      let sql = `
        SELECT id, title, content, platform, document_type, keywords, created_at
        FROM rag_documents 
        WHERE is_active = 1
      `;
      const params = [];

      if (platform) {
        sql += ' AND platform = ?';
        params.push(platform);
      }

      if (searchTerms.length > 0) {
        const searchConditions = searchTerms.map(() => 
          '(title LIKE ? OR content LIKE ? OR keywords LIKE ?)'
        ).join(' OR ');
        
        sql += ` AND (${searchConditions})`;
        
        searchTerms.forEach(term => {
          const searchTerm = `%${term}%`;
          params.push(searchTerm, searchTerm, searchTerm);
        });
      }

      sql += ' ORDER BY created_at DESC LIMIT ?';
      params.push(limit);

      const result = await this.database.queryAsync(sql, params);
      
      return result.rows.map(row => {
        const doc = {
          id: `db_${row.id}`,
          title: row.title,
          content: row.content,
          type: row.document_type || 'document',
          keywords: this.parseKeywords(row.keywords),
          platform: row.platform,
          lastUpdated: row.created_at,
          source: 'database'
        };

        return {
          ...doc,
          score: this.calculateRelevanceScore(doc, searchTerms, query),
          snippet: this.generateSnippet(doc.content, searchTerms)
        };
      });
    } catch (error) {
      console.error('[RAG] Database search error:', error);
      return [];
    }
  }

  parseKeywords(keywords) {
    if (typeof keywords === 'string') {
      try {
        return JSON.parse(keywords);
      } catch {
        return keywords.split(',').map(k => k.trim());
      }
    }
    return Array.isArray(keywords) ? keywords : [];
  }

  calculateRelevanceScore(doc, searchTerms, originalQuery = '') {
    let score = 0;
    const content = doc.content.toLowerCase();
    const title = doc.title.toLowerCase();
    const keywords = (doc.keywords || []).join(' ').toLowerCase();

    if (title.includes(originalQuery.toLowerCase())) {
      score += 100;
    }

    if (content.includes(originalQuery.toLowerCase())) {
      score += 50;
    }

    searchTerms.forEach(term => {
      if (title.includes(term)) score += 20;
      if (keywords.includes(term)) score += 15;
      
      const contentMatches = (content.match(new RegExp(term, 'g')) || []).length;
      score += contentMatches * 5;
      
      if (doc.type && doc.type.toLowerCase().includes(term)) score += 10;
    });

    if (doc.platform && searchTerms.some(term => 
      doc.platform.toLowerCase().includes(term)
    )) {
      score += 25;
    }

    return Math.max(0, score);
  }

  generateSnippet(content, searchTerms, maxLength = 200) {
    if (!content || !searchTerms.length) {
      return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
    }

    const lowerContent = content.toLowerCase();
    let bestStart = 0;
    let bestScore = 0;

    for (let i = 0; i < content.length - maxLength; i += 50) {
      const snippet = lowerContent.substring(i, i + maxLength);
      const score = searchTerms.reduce((acc, term) => 
        acc + (snippet.match(new RegExp(term, 'g')) || []).length, 0
      );
      
      if (score > bestScore) {
        bestScore = score;
        bestStart = i;
      }
    }

    let snippet = content.substring(bestStart, bestStart + maxLength);
    
    if (bestStart > 0) snippet = '...' + snippet;
    if (bestStart + maxLength < content.length) snippet += '...';

    return snippet;
  }

  rankAndDeduplicateResults(results, limit) {
    const uniqueResults = [];
    const seenContent = new Set();

    results.forEach(result => {
      const contentHash = this.generateContentHash(result.content);
      if (!seenContent.has(contentHash)) {
        seenContent.add(contentHash);
        uniqueResults.push(result);
      }
    });

    return uniqueResults
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  generateContentHash(content) {
    return content.toLowerCase()
      .replace(/\s+/g, ' ')
      .substring(0, 100);
  }

  async addDocument(document) {
    try {
      const {
        title,
        content,
        platform,
        documentType = 'document',
        keywords = [],
        uploadedBy = null
      } = document;

      await this.database.queryAsync(`
        INSERT INTO rag_documents (
          title, content, platform, document_type, 
          keywords, uploaded_by, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, 1)
      `, [
        title,
        content,
        platform,
        documentType,
        JSON.stringify(keywords),
        uploadedBy
      ]);

      this.searchCache.clear();
      console.log(`[RAG] Document added: ${title}`);
      return true;
    } catch (error) {
      console.error('[RAG] Add document error:', error);
      throw error;
    }
  }

  getPlatformDocuments(platform) {
    const memoryDocs = this.inMemoryDocuments.get(platform) || [];
    return memoryDocs.map(doc => ({
      ...doc,
      source: 'memory'
    }));
  }

  async getDocumentStats() {
    try {
      const dbStats = await this.database.queryAsync(`
        SELECT 
          platform,
          COUNT(*) as count,
          MAX(created_at) as last_updated
        FROM rag_documents 
        WHERE is_active = 1
        GROUP BY platform
      `);

      const memoryStats = {};
      this.inMemoryDocuments.forEach((docs, platform) => {
        memoryStats[platform] = docs.length;
      });

      return {
        database: dbStats.rows,
        memory: memoryStats,
        totalMemory: Array.from(this.inMemoryDocuments.values())
          .reduce((sum, docs) => sum + docs.length, 0),
        cacheSize: this.searchCache.size,
        lastSync: new Date(this.lastSync).toISOString()
      };
    } catch (error) {
      console.error('[RAG] Stats error:', error);
      return {
        database: [],
        memory: {},
        totalMemory: 0,
        cacheSize: this.searchCache.size,
        lastSync: new Date(this.lastSync).toISOString()
      };
    }
  }

  clearCaches() {
    this.searchCache.clear();
    console.log('[RAG] Caches cleared');
  }

  getContextualRecommendations(query, platform) {
    const recommendations = [];
    const searchTerms = this.extractSearchTerms(query);
    
    const platformDocs = this.getPlatformDocuments(platform);
    
    platformDocs.forEach(doc => {
      if (searchTerms.some(term => 
        doc.keywords.some(keyword => keyword.includes(term))
      )) {
        recommendations.push({
          title: doc.title,
          type: doc.type,
          relevance: 'high'
        });
      }
    });

    return recommendations.slice(0, 3);
  }
}

const ragService = new RAGService();

module.exports = RAGService;