
const express = require('express');
const router = express.Router();
const { db } = require('../database');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configure multer for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Admin authentication middleware
const requireAdmin = (req, res, next) => {
  // In a real app, this would check for admin role
  const isAdmin = req.headers.authorization === 'Bearer admin-token';
  if (!isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Dashboard endpoint
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    // Get user count
    const userCountResult = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const totalUsers = userCountResult?.count || 0;
    
    // Get API call count (last 24 hours)
    const apiCallsResult = db.prepare(`
      SELECT COUNT(*) as count FROM api_usage 
      WHERE timestamp > datetime('now', '-24 hours')
    `).get();
    const apiCalls24h = apiCallsResult?.count || 0;
    
    // Get active sessions (mock data)
    const activeSessions = Math.floor(Math.random() * 20) + 5;
    
    // Get recent activity
    const recentActivity = db.prepare(`
      SELECT * FROM activity_log 
      ORDER BY timestamp DESC 
      LIMIT 20
    `).all() || [];
    
    res.json({
      totalUsers,
      apiCalls24h,
      activeSessions,
      systemHealth: 'Good',
      recentActivity: recentActivity.map(activity => ({
        type: activity.type,
        message: activity.message,
        timestamp: activity.timestamp
      }))
    });
    
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// User management endpoints
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, email, role, status, created_at as lastActive 
      FROM users 
      ORDER BY created_at DESC
    `).all();
    
    res.json(users.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role || 'user',
      status: user.status || 'active',
      lastActive: user.lastActive
    })));
    
  } catch (error) {
    console.error('User data error:', error);
    res.status(500).json({ error: 'Failed to load user data' });
  }
});

router.post('/users', requireAdmin, async (req, res) => {
  try {
    const { email, role, status } = req.body;
    
    const result = db.prepare(`
      INSERT INTO users (email, role, status, created_at) 
      VALUES (?, ?, ?, datetime('now'))
    `).run(email, role, status);
    
    res.json({ 
      success: true, 
      userId: result.lastInsertRowid,
      message: 'User created successfully'
    });
    
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.put('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role, status } = req.body;
    
    const result = db.prepare(`
      UPDATE users 
      SET email = ?, role = ?, status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(email, role, status, id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, message: 'User updated successfully' });
    
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, message: 'User deleted successfully' });
    
  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Document management endpoints
router.get('/documents/stats', requireAdmin, async (req, res) => {
  try {
    const totalDocsResult = db.prepare('SELECT COUNT(*) as count FROM documents').get();
    const platformDocsResult = db.prepare(`
      SELECT COUNT(*) as count FROM documents 
      WHERE type = 'platform'
    `).get();
    const customDocsResult = db.prepare(`
      SELECT COUNT(*) as count FROM documents 
      WHERE type = 'custom'
    `).get();
    
    const lastUpdatedResult = db.prepare(`
      SELECT MAX(updated_at) as lastUpdated FROM documents
    `).get();
    
    res.json({
      total: totalDocsResult?.count || 0,
      platform: platformDocsResult?.count || 0,
      custom: customDocsResult?.count || 0,
      lastUpdated: lastUpdatedResult?.lastUpdated || 'Unknown'
    });
    
  } catch (error) {
    console.error('Document stats error:', error);
    res.status(500).json({ error: 'Failed to load document stats' });
  }
});

router.post('/documents/upload', requireAdmin, upload.array('documents'), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    let uploadedCount = 0;
    
    for (const file of files) {
      try {
        // Read file content
        const content = fs.readFileSync(file.path, 'utf8');
        
        // Extract keywords from filename and content
        const keywords = file.originalname.split(/[\s.-]+/)
          .filter(word => word.length > 2)
          .join(',');
        
        // Insert document into database
        db.prepare(`
          INSERT INTO documents (title, content, type, keywords, created_at, updated_at)
          VALUES (?, ?, 'custom', ?, datetime('now'), datetime('now'))
        `).run(file.originalname, content, keywords);
        
        uploadedCount++;
        
        // Clean up uploaded file
        fs.unlinkSync(file.path);
        
      } catch (fileError) {
        console.error(`Error processing file ${file.originalname}:`, fileError);
        // Continue with other files
      }
    }
    
    res.json({ 
      success: true, 
      uploaded: uploadedCount, 
      message: `Successfully uploaded ${uploadedCount} documents` 
    });
    
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ error: 'Failed to upload documents' });
  }
});

// Analytics endpoints
router.get('/analytics', requireAdmin, async (req, res) => {
  try {
    // Get usage data for the last 30 days
    const usageData = db.prepare(`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as value
      FROM api_usage 
      WHERE timestamp > datetime('now', '-30 days')
      GROUP BY DATE(timestamp)
      ORDER BY date
    `).all();
    
    // Get performance metrics
    const performanceData = db.prepare(`
      SELECT 
        AVG(response_time) as avgResponseTime,
        AVG(CASE WHEN status = 'success' THEN 1 ELSE 0 END) * 100 as successRate,
        AVG(CASE WHEN status = 'error' THEN 1 ELSE 0 END) * 100 as errorRate
      FROM api_usage 
      WHERE timestamp > datetime('now', '-24 hours')
    `).get();
    
    res.json({
      usage: usageData.map(item => ({
        date: item.date,
        value: item.value
      })),
      performance: {
        avgResponseTime: performanceData?.avgResponseTime || 0,
        successRate: performanceData?.successRate || 0,
        errorRate: performanceData?.errorRate || 0
      }
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to load analytics data' });
  }
});

// API key management endpoints
router.get('/api-keys', requireAdmin, async (req, res) => {
  try {
    const keys = db.prepare(`
      SELECT id, key_hash as key, status, created_at as created
      FROM api_keys 
      ORDER BY created_at DESC
    `).all();
    
    res.json(keys.map(key => ({
      id: key.id,
      key: key.key,
      status: key.status,
      created: key.created
    })));
    
  } catch (error) {
    console.error('API keys error:', error);
    res.status(500).json({ error: 'Failed to load API keys' });
  }
});

router.post('/api-keys', requireAdmin, async (req, res) => {
  try {
    const { name, permissions } = req.body;
    
    // Generate API key
    const crypto = require('crypto');
    const apiKey = 'sk-' + crypto.randomBytes(32).toString('hex');
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    const result = db.prepare(`
      INSERT INTO api_keys (key_hash, name, permissions, status, created_at) 
      VALUES (?, ?, ?, 'active', datetime('now'))
    `).run(keyHash, name, JSON.stringify(permissions || {}));
    
    res.json({ 
      success: true, 
      keyId: result.lastInsertRowid,
      apiKey: apiKey,
      message: 'API key generated successfully' 
    });
    
  } catch (error) {
    console.error('API key generation error:', error);
    res.status(500).json({ error: 'Failed to generate API key' });
  }
});

router.delete('/api-keys/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = db.prepare(`
      UPDATE api_keys 
      SET status = 'revoked', updated_at = datetime('now') 
      WHERE id = ?
    `).run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    res.json({ success: true, message: 'API key revoked successfully' });
    
  } catch (error) {
    console.error('API key revocation error:', error);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

// System monitoring endpoints
router.get('/system', requireAdmin, async (req, res) => {
  try {
    const systemInfo = {
      services: {
        deepseek: process.env.DEEPSEEK_API_KEY ? 'connected' : 'disconnected',
        database: 'connected',
        websocket: 'active',
        rag: 'operational'
      },
      resources: {
        cpu: Math.floor(Math.random() * 50) + 30, // Mock CPU usage
        memory: Math.floor(Math.random() * 30) + 60, // Mock memory usage
        storage: Math.floor(Math.random() * 20) + 25 // Mock storage usage
      },
      uptime: process.uptime(),
      version: '1.0.0'
    };
    
    res.json(systemInfo);
    
  } catch (error) {
    console.error('System info error:', error);
    res.status(500).json({ error: 'Failed to load system information' });
  }
});

module.exports = router;
