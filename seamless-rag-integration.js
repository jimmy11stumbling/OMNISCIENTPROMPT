const database = require('./database');

/**
 * Seamless RAG Integration for No-Code Platform Knowledge
 * Ensures AI has explicit detailed knowledge of all platforms
 */
class SeamlessRAGIntegration {
  constructor() {
    this.platforms = ['lovable', 'bolt', 'cursor', 'windsurf', 'replit'];
    // Cache for database schema verification
    this.schemaVerified = false;
  }

  /**
   * Get comprehensive platform documentation with guaranteed results
   */
  async getComprehensivePlatformKnowledge(userQuery, requestedPlatform = null) {
    console.log(`[SEAMLESS-RAG] Starting comprehensive knowledge retrieval for: "${userQuery}"`);
    
    const queryLower = userQuery.toLowerCase();
    const mentionedPlatforms = this.platforms.filter(p => queryLower.includes(p));
    
    let allResults = [];
    
    try {
      // Strategy 1: Direct platform documentation retrieval
      if (mentionedPlatforms.length > 0) {
        for (const platform of mentionedPlatforms) {
          const platformDocs = await this.getPlatformDocuments(platform, userQuery);
          allResults = [...allResults, ...platformDocs];
          console.log(`[SEAMLESS-RAG] ${platform}: ${platformDocs.length} documents`);
        }
      }
      
      // Strategy 2: Ensure all platforms have representation for comparative queries
      if (queryLower.includes('compare') || queryLower.includes('vs') || queryLower.includes('all platforms')) {
        for (const platform of this.platforms) {
          if (!mentionedPlatforms.includes(platform)) {
            const platformDocs = await this.getPlatformDocuments(platform, userQuery, 3);
            allResults = [...allResults, ...platformDocs];
            console.log(`[SEAMLESS-RAG] Comparative ${platform}: ${platformDocs.length} documents`);
          }
        }
      }
      
      // Strategy 3: General knowledge base search
      if (allResults.length < 10) {
        const generalDocs = await this.getGeneralDocuments(userQuery);
        allResults = [...allResults, ...generalDocs];
        console.log(`[SEAMLESS-RAG] General: ${generalDocs.length} documents`);
      }
      
      // Remove duplicates and rank by relevance
      const uniqueResults = this.removeDuplicatesAndRank(allResults, userQuery, mentionedPlatforms);
      
      console.log(`[SEAMLESS-RAG] Final result: ${uniqueResults.length} comprehensive documents`);
      return uniqueResults;
      
    } catch (error) {
      console.error(`[SEAMLESS-RAG] Error:`, error);
      return [];
    }
  }

  /**
   * Get platform-specific documents with guaranteed results
   */
  async getPlatformDocuments(platform, query, limit = 15) {
    try {
      // Direct platform query
      const platformResults = await database.queryAsync(`
        SELECT 
          id, title, content, platform, document_type, keywords, created_at,
          CASE 
            WHEN title LIKE ? THEN 300
            WHEN content LIKE ? THEN 200
            WHEN content LIKE ? THEN 150
            ELSE 100
          END as relevanceScore
        FROM rag_documents 
        WHERE platform = ?
        ORDER BY relevanceScore DESC, length(content) DESC
        LIMIT ?
      `, [
        `%${query}%`, `%${query}%`, `%${platform}%`, platform, limit
      ]);

      return Array.isArray(platformResults) ? platformResults : [];
    } catch (error) {
      console.error(`[SEAMLESS-RAG] Platform query error for ${platform}:`, error);
      return [];
    }
  }

  /**
   * Get general documents for comprehensive coverage
   */
  async getGeneralDocuments(query, limit = 20) {
    try {
      const generalResults = await database.queryAsync(`
        SELECT 
          id, title, content, platform, document_type, keywords, created_at,
          CASE 
            WHEN title LIKE ? THEN 200
            WHEN content LIKE ? THEN 150
            ELSE 100
          END as relevanceScore
        FROM rag_documents 
        WHERE content LIKE ? OR title LIKE ? OR keywords LIKE ?
        ORDER BY relevanceScore DESC
        LIMIT ?
      `, [
        `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, limit
      ]);

      return Array.isArray(generalResults) ? generalResults : [];
    } catch (error) {
      console.error(`[SEAMLESS-RAG] General query error:`, error);
      return [];
    }
  }

  /**
   * Remove duplicates and rank by enhanced relevance
   */
  removeDuplicatesAndRank(results, query, mentionedPlatforms) {
    // Remove duplicates
    const uniqueResults = results.filter((doc, index, self) => 
      index === self.findIndex(d => d.id === doc.id)
    );

    // Enhanced relevance scoring
    const queryLower = query.toLowerCase();
    
    for (const doc of uniqueResults) {
      let score = doc.relevanceScore || 0;
      
      // Boost for mentioned platforms
      if (mentionedPlatforms.includes(doc.platform?.toLowerCase())) {
        score += 400;
      }
      
      // Content analysis boost
      const contentLower = (doc.content || '').toLowerCase();
      const titleLower = (doc.title || '').toLowerCase();
      
      for (const platform of mentionedPlatforms) {
        if (titleLower.includes(platform)) score += 300;
        if (contentLower.includes(platform)) score += 200;
      }
      
      // Feature/comparison query boost
      if (queryLower.includes('feature') && contentLower.includes('feature')) score += 100;
      if (queryLower.includes('compare') && contentLower.includes('comparison')) score += 100;
      if (queryLower.includes('pricing') && contentLower.includes('pricing')) score += 100;
      
      doc.relevanceScore = score;
    }

    // Sort by relevance and ensure platform diversity
    uniqueResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    
    return this.ensurePlatformDiversity(uniqueResults, mentionedPlatforms);
  }

  /**
   * Ensure platform diversity while maintaining relevance
   */
  ensurePlatformDiversity(results, mentionedPlatforms) {
    const platformCounts = {};
    const diverseResults = [];
    
    for (const doc of results) {
      const platform = doc.platform || 'general';
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
      
      // Allow more docs from mentioned platforms
      const maxPerPlatform = mentionedPlatforms.includes(platform) ? 15 : 5;
      
      if (platformCounts[platform] <= maxPerPlatform && diverseResults.length < 30) {
        diverseResults.push(doc);
      }
    }
    
    return diverseResults;
  }

  /**
   * Format results for AI context
   */
  formatForAIContext(results) {
    return results.map(doc => {
      const title = doc.title || 'Untitled Document';
      const platform = doc.platform ? `[${doc.platform.toUpperCase()}]` : '[GENERAL]';
      const content = doc.content || 'No content available';
      const docType = doc.document_type || 'general';
      const keywords = doc.keywords ? (Array.isArray(doc.keywords) ? doc.keywords.join(', ') : doc.keywords) : 'none';
      
      return `${platform} ${title}
Type: ${docType}
Content: ${content}
Keywords: ${keywords}`;
    }).join('\n\n========================================\n\n');
  }
}

module.exports = SeamlessRAGIntegration;