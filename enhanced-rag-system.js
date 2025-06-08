// Enhanced RAG System with Database Integration and Document Management
const { Pool } = require('pg');

class EnhancedRAGSystem {
  constructor(pool, inMemoryDocs) {
    this.pool = pool;
    this.inMemoryDocs = inMemoryDocs;
    this.documentCache = new Map();
    this.lastCacheUpdate = 0;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Comprehensive document search across all sources
  async searchAllDocuments(query, platform = null, limit = 10) {
    const searchTerms = query.toLowerCase().split(' ');
    const results = [];

    // Search in-memory platform documents (always available)
    const memoryResults = this.searchInMemoryDocuments(query, platform, searchTerms);
    results.push(...memoryResults);

    // Search database documents (with caching)
    const dbResults = await this.searchDatabaseDocuments(query, platform, searchTerms, limit);
    results.push(...dbResults);

    // Combine and rank all results
    const combinedResults = this.rankAndDeduplicateResults(results, limit);
    
    console.log(`[RAG-ENHANCED] Found ${combinedResults.length} documents: ${memoryResults.length} platform + ${dbResults.length} database`);
    
    return combinedResults;
  }

  // Search in-memory platform documentation
  searchInMemoryDocuments(query, platform, searchTerms) {
    const results = [];
    const platforms = platform ? [platform] : Object.keys(this.inMemoryDocs);

    for (const platformName of platforms) {
      const docs = this.inMemoryDocs[platformName] || [];
      
      for (const doc of docs) {
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
    }

    return results;
  }

  // Search database documents with caching
  async searchDatabaseDocuments(query, platform, searchTerms, limit) {
    if (!this.pool) return [];

    try {
      // Check cache first
      const cacheKey = `${query}-${platform || 'all'}`;
      const now = Date.now();
      
      if (this.documentCache.has(cacheKey) && (now - this.lastCacheUpdate) < this.cacheTimeout) {
        return this.documentCache.get(cacheKey);
      }

      // Build dynamic query
      let dbQuery = `
        SELECT id, title, content, platform, document_type, keywords, created_at, updated_at
        FROM rag_documents 
        WHERE is_active = true
      `;
      const queryParams = [];
      let paramIndex = 1;

      // Platform filter
      if (platform) {
        dbQuery += ` AND platform = $${paramIndex}`;
        queryParams.push(platform);
        paramIndex++;
      }

      // Text search across title and content
      if (searchTerms.length > 0) {
        const searchConditions = searchTerms.map(term => {
          const condition = `(title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`;
          queryParams.push(`%${term}%`);
          paramIndex++;
          return condition;
        }).join(' OR ');

        dbQuery += ` AND (${searchConditions})`;
      }

      dbQuery += ` ORDER BY updated_at DESC, created_at DESC LIMIT ${limit * 2}`;

      const dbResult = await this.pool.query(dbQuery, queryParams);
      const results = [];

      // Process and score database results
      for (const row of dbResult.rows) {
        const keywords = Array.isArray(row.keywords) ? row.keywords : [];
        const docForScoring = {
          title: row.title,
          content: row.content,
          keywords: keywords
        };
        
        const score = this.calculateRelevanceScore(docForScoring, searchTerms);
        
        if (score > 0) {
          results.push({
            id: `db_${row.id}`,
            title: row.title,
            content: row.content,
            type: row.document_type || 'document',
            keywords: keywords,
            platform: row.platform,
            relevanceScore: score,
            snippet: this.generateSnippet(row.content, searchTerms),
            source: 'user-uploaded',
            lastUpdated: row.updated_at || row.created_at
          });
        }
      }

      // Cache results
      this.documentCache.set(cacheKey, results);
      this.lastCacheUpdate = now;

      return results;
    } catch (error) {
      console.error('Enhanced database search error:', error);
      return [];
    }
  }

  // Calculate relevance score for any document
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
        // Content matches get base score, with frequency bonus
        const matches = (searchableText.match(new RegExp(term, 'g')) || []).length;
        score += matches;
      }
    }
    
    return score;
  }

  // Rank and deduplicate results
  rankAndDeduplicateResults(results, limit) {
    // Remove duplicates based on title similarity
    const seen = new Set();
    const uniqueResults = results.filter(doc => {
      const key = doc.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

    // Sort by relevance score
    return uniqueResults
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  // Generate contextual snippet
  generateSnippet(content, searchTerms, maxLength = 200) {
    const words = content.split(' ');
    let bestStart = 0;
    let maxMatches = 0;

    // Find section with most search term matches
    for (let i = 0; i < words.length - 20; i++) {
      const section = words.slice(i, i + 20).join(' ').toLowerCase();
      const matches = searchTerms.reduce((count, term) => {
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
    if (!this.pool) return null;

    try {
      const result = await this.pool.query(`
        INSERT INTO rag_documents (title, content, platform, document_type, keywords, uploaded_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        document.title,
        document.content,
        document.platform,
        document.type || 'document',
        document.keywords || [],
        document.uploadedBy || null
      ]);

      // Clear cache to include new document
      this.documentCache.clear();
      
      return result.rows[0];
    } catch (error) {
      console.error('Add document error:', error);
      return null;
    }
  }

  // Get document statistics
  async getDocumentStats() {
    const stats = {
      platformDocs: 0,
      databaseDocs: 0,
      totalPlatforms: Object.keys(this.inMemoryDocs).length
    };

    // Count platform documents
    for (const platform of Object.keys(this.inMemoryDocs)) {
      stats.platformDocs += this.inMemoryDocs[platform].length;
    }

    // Count database documents
    if (this.pool) {
      try {
        const result = await this.pool.query('SELECT COUNT(*) as count FROM rag_documents WHERE is_active = true');
        stats.databaseDocs = parseInt(result.rows[0].count);
      } catch (error) {
        console.error('Stats query error:', error);
      }
    }

    return stats;
  }

  // Clear document cache
  clearCache() {
    this.documentCache.clear();
    this.lastCacheUpdate = 0;
  }
}

module.exports = EnhancedRAGSystem;