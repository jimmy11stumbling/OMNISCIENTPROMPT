/**
 * Prompt Controller
 * Handles AI prompt generation, optimization, and management
 */

const { deepSeekService } = require('../services/deepseekService');
const { ragService } = require('../services/ragService');
const { webSocketService } = require('../services/websocketService');
const database = require('../database');
const config = require('../config/environment');

class PromptController {
  constructor() {
    this.database = database;
  }

  /**
   * Generate AI-optimized prompt
   */
  async generatePrompt(req, res) {
    try {
      const { query, platform, options = {} } = req.body;
      
      if (!query || !platform) {
        return res.status(400).json({ 
          error: 'Query and platform are required',
          code: 'MISSING_FIELDS'
        });
      }

      const startTime = Date.now();

      // Check user quota if authenticated
      if (req.user) {
        const quotaCheck = await this.checkUserQuota(req.user);
        if (!quotaCheck.allowed) {
          return res.status(429).json({
            error: 'Daily API quota exceeded',
            quota: quotaCheck.quota,
            used: quotaCheck.used,
            code: 'QUOTA_EXCEEDED'
          });
        }
      }

      // Broadcast generation start via WebSocket
      if (req.user) {
        webSocketService.broadcastToAuthenticated({
          type: 'prompt_generation_started',
          userId: req.user.id,
          query,
          platform
        });
      }

      // Get RAG context for enhanced prompts
      const ragContext = await ragService.searchDocuments(query, platform, 3);

      // Generate prompt using DeepSeek
      const result = await deepSeekService.generatePrompt(query, platform, {
        ...options,
        ragContext: ragContext.map(doc => ({
          title: doc.title,
          snippet: doc.snippet
        }))
      });

      const responseTime = Date.now() - startTime;

      // Save prompt if user is authenticated
      let savedPromptId = null;
      if (req.user) {
        savedPromptId = await this.savePrompt({
          userId: req.user.id,
          title: this.generatePromptTitle(query, platform),
          originalQuery: query,
          platform,
          generatedPrompt: result.prompt,
          reasoning: result.reasoning,
          ragContext: ragContext,
          tokensUsed: result.tokensUsed,
          responseTime
        });
      }

      // Broadcast completion via WebSocket
      if (req.user) {
        webSocketService.broadcastToAuthenticated({
          type: 'prompt_generation_completed',
          userId: req.user.id,
          promptId: savedPromptId,
          ...result
        });
      }

      res.json({
        ...result,
        promptId: savedPromptId,
        ragContext: ragContext.length > 0 ? ragContext : undefined,
        recommendations: ragService.getContextualRecommendations(query, platform)
      });

    } catch (error) {
      console.error('Prompt generation error:', error);
      
      // Broadcast error via WebSocket
      if (req.user) {
        webSocketService.broadcastToAuthenticated({
          type: 'prompt_generation_error',
          userId: req.user.id,
          error: error.message
        });
      }

      res.status(500).json({ 
        error: 'Prompt generation failed',
        code: 'GENERATION_ERROR'
      });
    }
  }

  /**
   * Optimize existing prompt
   */
  async optimizePrompt(req, res) {
    try {
      const { prompt, platform, goals = [] } = req.body;
      
      if (!prompt || !platform) {
        return res.status(400).json({ 
          error: 'Prompt and platform are required',
          code: 'MISSING_FIELDS'
        });
      }

      // Check user quota
      if (req.user) {
        const quotaCheck = await this.checkUserQuota(req.user);
        if (!quotaCheck.allowed) {
          return res.status(429).json({
            error: 'Daily API quota exceeded',
            code: 'QUOTA_EXCEEDED'
          });
        }
      }

      const result = await deepSeekService.optimizePrompt(prompt, platform, goals);

      // Save optimization if user is authenticated
      let savedPromptId = null;
      if (req.user) {
        savedPromptId = await this.savePrompt({
          userId: req.user.id,
          title: `Optimized: ${this.generatePromptTitle(prompt.substring(0, 50), platform)}`,
          originalQuery: prompt,
          platform,
          generatedPrompt: result.optimizedPrompt,
          reasoning: result.improvements,
          ragContext: [],
          tokensUsed: 0,
          responseTime: 0,
          isOptimization: true
        });
      }

      res.json({
        ...result,
        promptId: savedPromptId
      });

    } catch (error) {
      console.error('Prompt optimization error:', error);
      res.status(500).json({ 
        error: 'Prompt optimization failed',
        code: 'OPTIMIZATION_ERROR'
      });
    }
  }

  /**
   * Get saved prompts for user
   */
  async getSavedPrompts(req, res) {
    try {
      if (!req.user) {
        return res.json([]); // Return empty array for unauthenticated users
      }

      const { page = 1, limit = 20, platform, search } = req.query;
      const offset = (page - 1) * limit;

      let sql = `
        SELECT id, title, original_query, platform, generated_prompt, 
               reasoning, tokens_used, response_time, created_at
        FROM saved_prompts 
        WHERE user_id = ?
      `;
      const params = [req.user.id];

      if (platform) {
        sql += ' AND platform = ?';
        params.push(platform);
      }

      if (search) {
        sql += ' AND (title LIKE ? OR original_query LIKE ? OR generated_prompt LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);

      const result = await this.database.queryAsync(sql, params);

      // Get total count
      let countSql = 'SELECT COUNT(*) as total FROM saved_prompts WHERE user_id = ?';
      const countParams = [req.user.id];
      
      if (platform) {
        countSql += ' AND platform = ?';
        countParams.push(platform);
      }
      
      if (search) {
        countSql += ' AND (title LIKE ? OR original_query LIKE ? OR generated_prompt LIKE ?)';
        const searchTerm = `%${search}%`;
        countParams.push(searchTerm, searchTerm, searchTerm);
      }

      const countResult = await this.database.queryAsync(countSql, countParams);
      const total = countResult.rows[0].total;

      res.json({
        prompts: result.rows.map(row => ({
          ...row,
          ragContext: this.parseJsonField(row.rag_context)
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Get saved prompts error:', error);
      res.status(500).json({ 
        error: 'Failed to get saved prompts',
        code: 'GET_PROMPTS_ERROR'
      });
    }
  }

  /**
   * Get specific saved prompt
   */
  async getSavedPrompt(req, res) {
    try {
      const { id } = req.params;
      
      if (!req.user) {
        return res.status(404).json({ 
          error: 'Prompt not found',
          code: 'PROMPT_NOT_FOUND'
        });
      }

      const result = await this.database.queryAsync(
        'SELECT * FROM saved_prompts WHERE id = ? AND user_id = ?',
        [id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ 
          error: 'Prompt not found',
          code: 'PROMPT_NOT_FOUND'
        });
      }

      const prompt = {
        ...result.rows[0],
        ragContext: this.parseJsonField(result.rows[0].rag_context)
      };

      res.json({ prompt });

    } catch (error) {
      console.error('Get saved prompt error:', error);
      res.status(500).json({ 
        error: 'Failed to get prompt',
        code: 'GET_PROMPT_ERROR'
      });
    }
  }

  /**
   * Update saved prompt
   */
  async updateSavedPrompt(req, res) {
    try {
      const { id } = req.params;
      const { title, notes } = req.body;
      
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Verify ownership
      const existing = await this.database.queryAsync(
        'SELECT id FROM saved_prompts WHERE id = ? AND user_id = ?',
        [id, req.user.id]
      );

      if (existing.rows.length === 0) {
        return res.status(404).json({ 
          error: 'Prompt not found',
          code: 'PROMPT_NOT_FOUND'
        });
      }

      const updates = {};
      if (title !== undefined) updates.title = title;
      if (notes !== undefined) updates.notes = notes;

      if (Object.keys(updates).length > 0) {
        const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updates), id];

        await this.database.queryAsync(
          `UPDATE saved_prompts SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          values
        );
      }

      res.json({ message: 'Prompt updated successfully' });

    } catch (error) {
      console.error('Update saved prompt error:', error);
      res.status(500).json({ 
        error: 'Failed to update prompt',
        code: 'UPDATE_PROMPT_ERROR'
      });
    }
  }

  /**
   * Delete saved prompt
   */
  async deleteSavedPrompt(req, res) {
    try {
      const { id } = req.params;
      
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const result = await this.database.queryAsync(
        'DELETE FROM saved_prompts WHERE id = ? AND user_id = ?',
        [id, req.user.id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ 
          error: 'Prompt not found',
          code: 'PROMPT_NOT_FOUND'
        });
      }

      res.json({ message: 'Prompt deleted successfully' });

    } catch (error) {
      console.error('Delete saved prompt error:', error);
      res.status(500).json({ 
        error: 'Failed to delete prompt',
        code: 'DELETE_PROMPT_ERROR'
      });
    }
  }

  /**
   * Batch prompt generation
   */
  async generateBatch(req, res) {
    try {
      const { requests } = req.body;
      
      if (!Array.isArray(requests) || requests.length === 0) {
        return res.status(400).json({ 
          error: 'Requests array is required',
          code: 'MISSING_REQUESTS'
        });
      }

      if (requests.length > 10) {
        return res.status(400).json({ 
          error: 'Maximum 10 requests per batch',
          code: 'BATCH_LIMIT_EXCEEDED'
        });
      }

      // Check user quota
      if (req.user) {
        const quotaCheck = await this.checkUserQuota(req.user, requests.length);
        if (!quotaCheck.allowed) {
          return res.status(429).json({
            error: 'Insufficient quota for batch generation',
            code: 'QUOTA_EXCEEDED'
          });
        }
      }

      const results = await deepSeekService.generateBatch(requests);

      // Save successful prompts if user is authenticated
      if (req.user) {
        const savedPromptIds = await Promise.all(
          results.map(async (result, index) => {
            if (result.success) {
              return await this.savePrompt({
                userId: req.user.id,
                title: this.generatePromptTitle(requests[index].query, requests[index].platform),
                originalQuery: requests[index].query,
                platform: requests[index].platform,
                generatedPrompt: result.prompt,
                reasoning: result.reasoning,
                ragContext: [],
                tokensUsed: result.tokensUsed,
                responseTime: result.responseTime
              });
            }
            return null;
          })
        );

        results.forEach((result, index) => {
          result.promptId = savedPromptIds[index];
        });
      }

      res.json({
        results,
        summary: {
          total: results.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      });

    } catch (error) {
      console.error('Batch generation error:', error);
      res.status(500).json({ 
        error: 'Batch generation failed',
        code: 'BATCH_ERROR'
      });
    }
  }

  /**
   * Get prompt templates
   */
  async getTemplates(req, res) {
    try {
      const { platform } = req.query;

      const templates = await this.getPromptTemplates(platform);
      res.json({ templates });

    } catch (error) {
      console.error('Get templates error:', error);
      res.status(500).json({ 
        error: 'Failed to get templates',
        code: 'TEMPLATES_ERROR'
      });
    }
  }

  /**
   * Get user prompt statistics
   */
  async getPromptStats(req, res) {
    try {
      if (!req.user) {
        return res.json({
          summary: { total_prompts: 0, total_tokens: 0, avg_response_time: 0 },
          byPlatform: [],
          timeRange: req.query.timeRange || '30d'
        });
      }

      const { timeRange = '30d' } = req.query;
      const timeCondition = this.getTimeCondition(timeRange);

      const stats = await this.database.queryAsync(`
        SELECT 
          COUNT(*) as total_prompts,
          COUNT(DISTINCT platform) as platforms_used,
          AVG(tokens_used) as avg_tokens,
          AVG(response_time) as avg_response_time,
          SUM(tokens_used) as total_tokens,
          platform,
          COUNT(*) as count
        FROM saved_prompts 
        WHERE user_id = ? AND ${timeCondition}
        GROUP BY platform
      `, [req.user.id]);

      const summary = await this.database.queryAsync(`
        SELECT 
          COUNT(*) as total_prompts,
          SUM(tokens_used) as total_tokens,
          AVG(response_time) as avg_response_time
        FROM saved_prompts 
        WHERE user_id = ? AND ${timeCondition}
      `, [req.user.id]);

      res.json({
        summary: summary.rows[0] || { total_prompts: 0, total_tokens: 0, avg_response_time: 0 },
        byPlatform: stats.rows,
        timeRange
      });

    } catch (error) {
      console.error('Get prompt stats error:', error);
      res.status(500).json({ 
        error: 'Failed to get prompt statistics',
        code: 'STATS_ERROR'
      });
    }
  }

  /**
   * Check user API quota
   */
  async checkUserQuota(user, requestCount = 1) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Reset quota if new day
      if (user.api_quota_reset_date !== today) {
        await this.database.queryAsync(
          'UPDATE users SET api_quota_used_today = 0, api_quota_reset_date = ? WHERE id = ?',
          [today, user.id]
        );
        user.api_quota_used_today = 0;
      }

      const remaining = user.api_quota_daily - user.api_quota_used_today;
      
      return {
        allowed: remaining >= requestCount,
        quota: user.api_quota_daily,
        used: user.api_quota_used_today,
        remaining: Math.max(0, remaining)
      };
    } catch (error) {
      console.error('Quota check error:', error);
      return { allowed: false, quota: 0, used: 0, remaining: 0 };
    }
  }

  /**
   * Save prompt to database
   */
  async savePrompt(promptData) {
    try {
      const result = await this.database.queryAsync(`
        INSERT INTO saved_prompts (
          user_id, title, original_query, platform, generated_prompt, 
          reasoning, rag_context, tokens_used, response_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        promptData.userId,
        promptData.title,
        promptData.originalQuery,
        promptData.platform,
        promptData.generatedPrompt,
        promptData.reasoning,
        JSON.stringify(promptData.ragContext),
        promptData.tokensUsed,
        promptData.responseTime
      ]);

      return result.lastInsertRowid;
    } catch (error) {
      console.error('Save prompt error:', error);
      return null;
    }
  }

  /**
   * Generate prompt title
   */
  generatePromptTitle(query, platform) {
    const truncatedQuery = query.substring(0, 50);
    const timestamp = new Date().toLocaleDateString();
    return `${platform}: ${truncatedQuery}${query.length > 50 ? '...' : ''} (${timestamp})`;
  }

  /**
   * Parse JSON field safely
   */
  parseJsonField(field) {
    if (!field) return [];
    try {
      return typeof field === 'string' ? JSON.parse(field) : field;
    } catch {
      return [];
    }
  }

  /**
   * Get time condition for SQL queries
   */
  getTimeCondition(timeRange) {
    switch (timeRange) {
      case '1d':
        return "created_at >= datetime('now', '-1 day')";
      case '7d':
        return "created_at >= datetime('now', '-7 days')";
      case '30d':
        return "created_at >= datetime('now', '-30 days')";
      default:
        return "created_at >= datetime('now', '-30 days')";
    }
  }

  /**
   * Get prompt templates
   */
  async getPromptTemplates(platform) {
    const templates = {
      replit: [
        {
          id: 'repl_web_app',
          title: 'Full-Stack Web Application',
          description: 'Generate a complete web application with frontend and backend',
          template: 'Create a {technology} web application that {functionality}. Include {features} and ensure {requirements}.'
        },
        {
          id: 'repl_api',
          title: 'REST API Development',
          description: 'Build a RESTful API with proper endpoints',
          template: 'Build a REST API for {domain} with endpoints for {operations}. Use {database} for persistence and include {authentication}.'
        }
      ],
      lovable: [
        {
          id: 'lov_component',
          title: 'React Component',
          description: 'Create a reusable React component with Tailwind styling',
          template: 'Create a {componentType} React component that {functionality}. Style with Tailwind CSS and include {props}.'
        },
        {
          id: 'lov_app',
          title: 'Complete Application',
          description: 'Generate a full application with Supabase backend',
          template: 'Build a {appType} application with {features}. Use Supabase for {backend_features} and ensure {requirements}.'
        }
      ]
    };

    return platform ? (templates[platform] || []) : templates;
  }
}

module.exports = new PromptController();