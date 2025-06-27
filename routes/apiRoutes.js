/**
 * API Routes
 * Main routing configuration for all API endpoints
 */

const express = require('express');
const authController = require('../controllers/authController');
const promptController = require('../controllers/promptController');
const { verifyToken, optionalAuth, requireAdmin } = require('../middlewares/authentication');
const { defaultLimiter, promptLimiter, chatLimiter, authLimiter } = require('../middlewares/rateLimiting');
const { ragService } = require('../services/ragService');
const { deepSeekService } = require('../services/deepseekService');
const { webSocketService } = require('../services/websocketService');
const { logManager } = require('../middlewares/logging');
const database = require('../database');

const router = express.Router();

// Apply default rate limiting to all API routes
router.use(defaultLimiter);

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const [deepSeekStatus, ragStats, wsMetrics] = await Promise.all([
      deepSeekService.getServiceStatus(),
      ragService.getDocumentStats(),
      Promise.resolve(webSocketService.getMetrics())
    ]);

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        deepseek: deepSeekStatus,
        rag: {
          status: 'healthy',
          ...ragStats
        },
        websocket: {
          status: 'healthy',
          ...wsMetrics
        },
        database: {
          status: 'healthy',
          type: 'sqlite'
        }
      },
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Authentication routes
router.post('/auth/register', authLimiter, authController.register);
router.post('/auth/login', authLimiter, authController.login);
router.post('/auth/logout', verifyToken(), authController.logout);
router.post('/auth/refresh', authController.refreshToken);
router.get('/auth/verify', authController.verifyEmail);
router.post('/auth/resend-verification', authLimiter, authController.resendVerification);
router.post('/auth/forgot-password', authLimiter, authController.requestPasswordReset);
router.post('/auth/reset-password', authLimiter, authController.resetPassword);
router.get('/auth/profile', verifyToken(), authController.getProfile);
router.put('/auth/profile', verifyToken(), authController.updateProfile);

// Prompt generation routes
router.post('/generate-prompt', promptLimiter, optionalAuth(), promptController.generatePrompt);
router.post('/optimize-prompt', promptLimiter, optionalAuth(), promptController.optimizePrompt);
router.post('/generate-batch', promptLimiter, verifyToken(), promptController.generateBatch);
router.get('/templates', promptController.getTemplates);

// Saved prompts routes
router.get('/prompts', optionalAuth(), promptController.getSavedPrompts);
router.get('/prompts/:id', optionalAuth(), promptController.getSavedPrompt);
router.put('/prompts/:id', verifyToken(), promptController.updateSavedPrompt);
router.delete('/prompts/:id', verifyToken(), promptController.deleteSavedPrompt);
router.get('/prompts/stats', optionalAuth(), promptController.getPromptStats);

// RAG and search routes
router.post('/search', async (req, res) => {
  try {
    const { query, platform, limit = 5 } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        error: 'Search query is required',
        code: 'MISSING_QUERY'
      });
    }

    const results = await ragService.searchDocuments(query, platform, limit);
    
    res.json({
      query,
      platform,
      results,
      total: results.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Search failed',
      code: 'SEARCH_ERROR'
    });
  }
});

router.get('/search/stats', async (req, res) => {
  try {
    const stats = await ragService.getDocumentStats();
    res.json(stats);
  } catch (error) {
    console.error('Search stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get search statistics',
      code: 'STATS_ERROR'
    });
  }
});

// Document management routes
router.post('/documents', verifyToken(), async (req, res) => {
  try {
    const { title, content, platform, documentType, keywords } = req.body;
    
    if (!title || !content || !platform) {
      return res.status(400).json({ 
        error: 'Title, content, and platform are required',
        code: 'MISSING_FIELDS'
      });
    }

    await ragService.addDocument({
      title,
      content,
      platform,
      documentType,
      keywords: Array.isArray(keywords) ? keywords : [],
      uploadedBy: req.user.id
    });

    res.status(201).json({ message: 'Document added successfully' });
  } catch (error) {
    console.error('Add document error:', error);
    res.status(500).json({ 
      error: 'Failed to add document',
      code: 'ADD_DOCUMENT_ERROR'
    });
  }
});

router.get('/documents/platforms/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const documents = ragService.getPlatformDocuments(platform);
    
    res.json({
      platform,
      documents,
      total: documents.length
    });
  } catch (error) {
    console.error('Get platform documents error:', error);
    res.status(500).json({ 
      error: 'Failed to get platform documents',
      code: 'GET_DOCUMENTS_ERROR'
    });
  }
});

// Chat and conversation routes
router.post('/chat', chatLimiter, verifyToken, async (req, res) => {
  try {
    const { message, conversationId, platform } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        error: 'Message is required',
        code: 'MISSING_MESSAGE'
      });
    }

    // Broadcast chat start
    webSocketService.broadcastToAuthenticated({
      type: 'chat_start',
      userId: req.user.id,
      conversationId,
      message
    });

    // Get relevant context from RAG
    const context = await ragService.searchDocuments(message, platform, 3);
    
    // Generate response using DeepSeek
    const response = await deepSeekService.generatePrompt(message, platform || 'general', {
      context: context.map(doc => doc.snippet).join('\n'),
      conversational: true
    });

    // Save conversation if needed
    const chatData = {
      conversationId: conversationId || `chat_${Date.now()}`,
      userId: req.user.id,
      message,
      response: response.prompt,
      platform,
      context,
      timestamp: new Date().toISOString()
    };

    // Broadcast response
    webSocketService.broadcastToAuthenticated({
      type: 'chat_response',
      userId: req.user.id,
      ...chatData
    });

    res.json(chatData);
  } catch (error) {
    console.error('Chat error:', error);
    
    webSocketService.broadcastToAuthenticated({
      type: 'chat_error',
      userId: req.user?.id,
      error: error.message
    });

    res.status(500).json({ 
      error: 'Chat failed',
      code: 'CHAT_ERROR'
    });
  }
});

// Notifications routes
router.get('/notifications', verifyToken(), async (req, res) => {
  try {
    const { limit = 20, unreadOnly = false } = req.query;
    
    let sql = 'SELECT * FROM notifications WHERE user_id = ?';
    const params = [req.user.id];
    
    if (unreadOnly === 'true') {
      sql += ' AND is_read = 0';
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const result = await database.queryAsync(sql, params);
    
    res.json({
      notifications: result.rows,
      unreadCount: unreadOnly === 'true' ? result.rows.length : 
        (await database.queryAsync('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0', [req.user.id])).rows[0].count
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ 
      error: 'Failed to get notifications',
      code: 'NOTIFICATIONS_ERROR'
    });
  }
});

router.put('/notifications/:id/read', verifyToken(), async (req, res) => {
  try {
    const { id } = req.params;
    
    await database.queryAsync(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ 
      error: 'Failed to mark notification as read',
      code: 'MARK_READ_ERROR'
    });
  }
});

router.put('/notifications/read-all', verifyToken(), async (req, res) => {
  try {
    await database.queryAsync(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ 
      error: 'Failed to mark all notifications as read',
      code: 'MARK_ALL_READ_ERROR'
    });
  }
});

// Analytics routes
router.get('/analytics', verifyToken(), requireAdmin(), async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    const analytics = await logManager.getAnalytics(timeRange);
    
    res.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to get analytics',
      code: 'ANALYTICS_ERROR'
    });
  }
});

// System status routes
router.get('/system/status', verifyToken(), requireAdmin(), async (req, res) => {
  try {
    const [wsMetrics, ragStats] = await Promise.all([
      Promise.resolve(webSocketService.getMetrics()),
      ragService.getDocumentStats()
    ]);

    const systemStatus = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      websocket: wsMetrics,
      rag: ragStats,
      timestamp: new Date().toISOString()
    };

    res.json(systemStatus);
  } catch (error) {
    console.error('System status error:', error);
    res.status(500).json({ 
      error: 'Failed to get system status',
      code: 'SYSTEM_STATUS_ERROR'
    });
  }
});

// User management routes (admin only)
router.get('/admin/users', verifyToken(), requireAdmin(), async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const offset = (page - 1) * limit;

    let sql = 'SELECT id, username, email, full_name, role, is_active, email_verified, created_at, last_login FROM users';
    const params = [];

    if (search) {
      sql += ' WHERE username LIKE ? OR email LIKE ? OR full_name LIKE ?';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const result = await database.queryAsync(sql, params);
    
    const countSql = search ? 
      'SELECT COUNT(*) as total FROM users WHERE username LIKE ? OR email LIKE ? OR full_name LIKE ?' :
      'SELECT COUNT(*) as total FROM users';
    const countParams = search ? [searchTerm, searchTerm, searchTerm] : [];
    
    const countResult = await database.queryAsync(countSql, countParams);
    const total = countResult.rows[0].total;

    res.json({
      users: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      error: 'Failed to get users',
      code: 'GET_USERS_ERROR'
    });
  }
});

// File upload route
router.post('/upload', verifyToken(), async (req, res) => {
  try {
    // This would be handled by multer middleware in the main app
    res.json({ message: 'File upload endpoint ready' });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed',
      code: 'UPLOAD_ERROR'
    });
  }
});

// Error handling middleware for API routes
router.use((error, req, res, next) => {
  console.error('API Error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details,
      code: 'VALIDATION_ERROR'
    });
  }

  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      code: 'UNAUTHORIZED'
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

module.exports = router;