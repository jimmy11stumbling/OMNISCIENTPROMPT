// Comprehensive RAG System with Real-time Database Integration
const RAGDatabase = require('./rag-database');

class ComprehensiveRAG {
  constructor(pool) {
    this.pool = pool;
    const ragInstance = new RAGDatabase();
    this.inMemoryDocs = ragInstance.documents || {};
    this.dbDocuments = new Map();
    this.lastDbSync = 0;
    this.syncInterval = 600000; // 10 minutes
    this.lastDocumentCount = 0;
    this.lastSyncCheck = 0;
    this.syncCheckInterval = 120000; // Check for changes every 2 minutes
    
    // Initialize database document sync
    this.syncDatabaseDocuments();
    setInterval(() => this.smartSync(), this.syncCheckInterval);
  }

  // Smart sync only when changes detected
  async smartSync() {
    if (!this.pool) return;
    
    const now = Date.now();
    
    // Only perform full sync every 10 minutes
    if (now - this.lastSyncCheck < this.syncCheckInterval) {
      return;
    }
    
    this.lastSyncCheck = now;

    try {
      // First check if document count has changed
      const countResult = await this.pool.queryAsync('SELECT COUNT(*) as count FROM rag_documents WHERE is_active = 1');
      const currentCount = parseInt(countResult.rows[0]?.count || 0);
      
      if (currentCount !== this.lastDocumentCount) {
        console.log(`[RAG-SYNC] Document count changed: ${this.lastDocumentCount} -> ${currentCount}`);
        await this.syncDatabaseDocuments();
        this.lastDocumentCount = currentCount;
      }
    } catch (error) {
      // Silently handle database connection issues
      if (!this.dbUnavailable) {
        console.log('[RAG-SYNC] Database temporarily unavailable');
        this.dbUnavailable = true;
      }
    }
  }

  // Sync database documents to memory for fast access
  async syncDatabaseDocuments() {
    if (!this.pool) {
      console.log('[RAG-SYNC] Database pool not available, using in-memory documents only');
      return;
    }

    try {
      // Test database connection first
      await this.pool.queryAsync('SELECT 1');
      
      const result = await this.pool.queryAsync(`
        SELECT id, title, content, platform, document_type, keywords, created_at
        FROM rag_documents 
        WHERE is_active = 1 
        ORDER BY created_at DESC
      `);

      this.dbDocuments.clear();
      
      for (const row of result.rows) {
        const platform = row.platform || 'general';
        if (!this.dbDocuments.has(platform)) {
          this.dbDocuments.set(platform, []);
        }
        
        this.dbDocuments.get(platform).push({
          id: `db_${row.id}`,
          title: row.title,
          content: row.content,
          type: row.document_type || 'document',
          keywords: Array.isArray(row.keywords) ? row.keywords : [],
          platform: platform,
          source: 'database',
          lastUpdated: row.created_at
        });
      }

      this.lastDbSync = Date.now();
      this.lastDocumentCount = result.rows.length;
      console.log(`[RAG-SYNC] Synchronized ${result.rows.length} documents from database`);
    } catch (error) {
      console.log(`[RAG-SYNC] Database unavailable, continuing with in-memory documents only`);
      // Set flag to indicate database is unavailable
      this.dbUnavailable = true;
    }
  }

  // Comprehensive search across all document sources
  searchDocuments(query, platform = null, limit = 5) {
    // Clean and filter search terms to avoid regex issues
    const searchTerms = query.toLowerCase()
      .split(' ')
      .map(term => term.trim())
      .filter(term => term.length > 0 && term !== 'and' && term !== 'the' && term !== 'of' && term !== 'to');
    const results = [];

    // Search in-memory platform documents
    const platforms = platform ? [platform] : [...Object.keys(this.inMemoryDocs), ...this.dbDocuments.keys()];

    for (const platformName of platforms) {
      // Search platform documentation
      const platformDocs = this.inMemoryDocs[platformName] || [];
      for (const doc of platformDocs) {
        const score = this.calculateRelevanceScore(doc, searchTerms);
        if (score > 0) {
          results.push({
            ...doc,
            platform: platformName,
            relevanceScore: score,
            snippet: this.generateSnippet(doc.content, searchTerms),
            source: 'platform-docs'
          });
        }
      }

      // Search database documents
      const dbDocs = this.dbDocuments.get(platformName) || [];
      for (const doc of dbDocs) {
        const score = this.calculateRelevanceScore(doc, searchTerms);
        if (score > 0) {
          results.push({
            ...doc,
            relevanceScore: score,
            snippet: this.generateSnippet(doc.content, searchTerms)
          });
        }
      }
    }

    // Sort by relevance and return top results
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  // Calculate relevance score
  calculateRelevanceScore(doc, searchTerms) {
    let score = 0;
    const searchableText = `${doc.title} ${doc.content} ${doc.keywords?.join(' ') || ''}`.toLowerCase();
    
    for (const term of searchTerms) {
      if (searchableText.includes(term)) {
        // Title matches get highest score
        if (doc.title.toLowerCase().includes(term)) {
          score += 5;
        }
        // Keyword matches get medium score
        if (doc.keywords?.some(kw => kw.toLowerCase().includes(term))) {
          score += 3;
        }
        // Content matches with frequency bonus - use simple string counting for safety
        const termOccurrences = searchableText.split(term).length - 1;
        score += termOccurrences;
      }
    }
    
    return score;
  }

  // Generate contextual snippet
  generateSnippet(content, searchTerms, maxLength = 200) {
    const words = content.split(' ');
    let bestStart = 0;
    let maxMatches = 0;

    // Find section with most search term matches
    for (let i = 0; i < Math.max(0, words.length - 20); i++) {
      const section = words.slice(i, i + 20).join(' ').toLowerCase();
      const matches = searchTerms.reduce((count, term) => {
        // Safe term matching without regex
        const cleanTerm = term.toLowerCase().trim();
        return count + (cleanTerm && section.includes(cleanTerm) ? 1 : 0);
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
    
    return snippet || content.substring(0, maxLength - 3) + '...';
  }

  // Get all available platforms
  getPlatforms() {
    const platforms = new Set([
      ...Object.keys(this.inMemoryDocs),
      ...this.dbDocuments.keys()
    ]);
    return Array.from(platforms);
  }

  // Get document count by platform
  getDocumentStats() {
    const stats = {};
    
    // Platform docs
    for (const [platform, docs] of Object.entries(this.inMemoryDocs)) {
      stats[platform] = {
        platform: docs.length,
        database: 0,
        total: docs.length
      };
    }

    // Database docs
    for (const [platform, docs] of this.dbDocuments.entries()) {
      if (!stats[platform]) {
        stats[platform] = { platform: 0, database: 0, total: 0 };
      }
      stats[platform].database = docs.length;
      stats[platform].total += docs.length;
    }

    return stats;
  }

  // Add document to database
  addDocument(platform, document) {
    if (!this.dbDocuments.has(platform)) {
      this.dbDocuments.set(platform, []);
    }
    
    const newDoc = {
      id: `temp_${Date.now()}`,
      ...document,
      platform: platform,
      source: 'database',
      lastUpdated: new Date().toISOString()
    };
    
    this.dbDocuments.get(platform).push(newDoc);
    return newDoc;
  }
}

module.exports = ComprehensiveRAG;