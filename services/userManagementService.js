
const { db } = require('../database');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

class UserManagementService {
  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    this.initializeDatabase();
  }

  initializeDatabase() {
    try {
      // Create users table if it doesn't exist
      db.prepare(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT DEFAULT 'user',
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME,
          login_attempts INTEGER DEFAULT 0,
          locked_until DATETIME,
          profile_data TEXT
        )
      `).run();

      // Create sessions table
      db.prepare(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          session_token TEXT UNIQUE NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          user_agent TEXT,
          ip_address TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `).run();

      // Create API keys table
      db.prepare(`
        CREATE TABLE IF NOT EXISTS api_keys (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          key_hash TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          permissions TEXT DEFAULT '{}',
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_used DATETIME,
          usage_count INTEGER DEFAULT 0,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `).run();

      // Create activity log table
      db.prepare(`
        CREATE TABLE IF NOT EXISTS activity_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          action TEXT NOT NULL,
          type TEXT NOT NULL,
          message TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          ip_address TEXT,
          user_agent TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `).run();

      console.log('[USER-MGMT] Database tables initialized');
    } catch (error) {
      console.error('[USER-MGMT] Database initialization error:', error);
    }
  }

  // User registration
  async registerUser(userData) {
    try {
      const { email, password, role = 'user' } = userData;
      
      // Check if user already exists
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existingUser) {
        throw new Error('User already exists');
      }

      // Hash password
      const passwordHash = this.hashPassword(password);

      // Insert user
      const result = db.prepare(`
        INSERT INTO users (email, password_hash, role, status, created_at)
        VALUES (?, ?, ?, 'active', datetime('now'))
      `).run(email, passwordHash, role);

      // Log activity
      this.logActivity(result.lastInsertRowid, 'user_registered', 'auth', 'User registered successfully');

      return {
        success: true,
        userId: result.lastInsertRowid,
        message: 'User registered successfully'
      };
    } catch (error) {
      console.error('[USER-MGMT] Registration error:', error);
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  // User login
  async loginUser(email, password, userAgent = '', ipAddress = '') {
    try {
      // Get user
      const user = db.prepare(`
        SELECT id, email, password_hash, role, status, login_attempts, locked_until 
        FROM users WHERE email = ?
      `).get(email);

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check if account is locked
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        throw new Error('Account is temporarily locked');
      }

      // Check if account is active
      if (user.status !== 'active') {
        throw new Error('Account is deactivated');
      }

      // Verify password
      if (!this.verifyPassword(password, user.password_hash)) {
        // Increment login attempts
        const attempts = user.login_attempts + 1;
        const lockUntil = attempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null; // 30 minutes

        db.prepare(`
          UPDATE users 
          SET login_attempts = ?, locked_until = ?
          WHERE id = ?
        `).run(attempts, lockUntil, user.id);

        throw new Error('Invalid credentials');
      }

      // Reset login attempts and update last login
      db.prepare(`
        UPDATE users 
        SET login_attempts = 0, locked_until = NULL, last_login = datetime('now')
        WHERE id = ?
      `).run(user.id);

      // Create session
      const sessionToken = this.generateSessionToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      db.prepare(`
        INSERT INTO user_sessions (user_id, session_token, expires_at, user_agent, ip_address)
        VALUES (?, ?, ?, ?, ?)
      `).run(user.id, sessionToken, expiresAt, userAgent, ipAddress);

      // Generate JWT token
      const jwtToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        this.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Log activity
      this.logActivity(user.id, 'user_login', 'auth', 'User logged in successfully', ipAddress, userAgent);

      return {
        success: true,
        token: jwtToken,
        sessionToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      };
    } catch (error) {
      console.error('[USER-MGMT] Login error:', error);
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  // Session validation
  async validateSession(sessionToken) {
    try {
      const session = db.prepare(`
        SELECT s.*, u.email, u.role, u.status 
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.session_token = ? AND s.expires_at > datetime('now')
      `).get(sessionToken);

      if (!session) {
        return { valid: false, error: 'Invalid or expired session' };
      }

      if (session.status !== 'active') {
        return { valid: false, error: 'Account is deactivated' };
      }

      return {
        valid: true,
        user: {
          id: session.user_id,
          email: session.email,
          role: session.role
        }
      };
    } catch (error) {
      console.error('[USER-MGMT] Session validation error:', error);
      return { valid: false, error: 'Session validation failed' };
    }
  }

  // JWT token validation
  validateJWTToken(token) {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET);
      return { valid: true, user: decoded };
    } catch (error) {
      return { valid: false, error: 'Invalid token' };
    }
  }

  // User logout
  async logoutUser(sessionToken) {
    try {
      const result = db.prepare('DELETE FROM user_sessions WHERE session_token = ?').run(sessionToken);
      
      if (result.changes > 0) {
        return { success: true, message: 'Logged out successfully' };
      } else {
        return { success: false, error: 'Session not found' };
      }
    } catch (error) {
      console.error('[USER-MGMT] Logout error:', error);
      throw new Error(`Logout failed: ${error.message}`);
    }
  }

  // Generate API key
  async generateAPIKey(userId, name, permissions = {}) {
    try {
      const apiKey = 'sk-' + crypto.randomBytes(32).toString('hex');
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

      const result = db.prepare(`
        INSERT INTO api_keys (user_id, key_hash, name, permissions, status, created_at)
        VALUES (?, ?, ?, ?, 'active', datetime('now'))
      `).run(userId, keyHash, name, JSON.stringify(permissions));

      // Log activity
      this.logActivity(userId, 'api_key_generated', 'security', `API key "${name}" generated`);

      return {
        success: true,
        keyId: result.lastInsertRowid,
        apiKey: apiKey,
        message: 'API key generated successfully'
      };
    } catch (error) {
      console.error('[USER-MGMT] API key generation error:', error);
      throw new Error(`API key generation failed: ${error.message}`);
    }
  }

  // Validate API key
  async validateAPIKey(apiKey) {
    try {
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      
      const key = db.prepare(`
        SELECT k.*, u.email, u.role, u.status 
        FROM api_keys k
        JOIN users u ON k.user_id = u.id
        WHERE k.key_hash = ? AND k.status = 'active'
      `).get(keyHash);

      if (!key) {
        return { valid: false, error: 'Invalid API key' };
      }

      if (key.status !== 'active') {
        return { valid: false, error: 'Account is deactivated' };
      }

      // Update usage count and last used
      db.prepare(`
        UPDATE api_keys 
        SET usage_count = usage_count + 1, last_used = datetime('now')
        WHERE id = ?
      `).run(key.id);

      return {
        valid: true,
        user: {
          id: key.user_id,
          email: key.email,
          role: key.role
        },
        permissions: JSON.parse(key.permissions || '{}')
      };
    } catch (error) {
      console.error('[USER-MGMT] API key validation error:', error);
      return { valid: false, error: 'API key validation failed' };
    }
  }

  // Get user profile
  async getUserProfile(userId) {
    try {
      const user = db.prepare(`
        SELECT id, email, role, status, created_at, last_login, profile_data
        FROM users WHERE id = ?
      `).get(userId);

      if (!user) {
        throw new Error('User not found');
      }

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.created_at,
        lastLogin: user.last_login,
        profile: JSON.parse(user.profile_data || '{}')
      };
    } catch (error) {
      console.error('[USER-MGMT] Get profile error:', error);
      throw new Error(`Failed to get user profile: ${error.message}`);
    }
  }

  // Update user profile
  async updateUserProfile(userId, profileData) {
    try {
      const result = db.prepare(`
        UPDATE users 
        SET profile_data = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(JSON.stringify(profileData), userId);

      if (result.changes === 0) {
        throw new Error('User not found');
      }

      // Log activity
      this.logActivity(userId, 'profile_updated', 'user', 'Profile updated successfully');

      return { success: true, message: 'Profile updated successfully' };
    } catch (error) {
      console.error('[USER-MGMT] Update profile error:', error);
      throw new Error(`Failed to update profile: ${error.message}`);
    }
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      if (!this.verifyPassword(currentPassword, user.password_hash)) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = this.hashPassword(newPassword);

      // Update password
      db.prepare(`
        UPDATE users 
        SET password_hash = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(newPasswordHash, userId);

      // Log activity
      this.logActivity(userId, 'password_changed', 'security', 'Password changed successfully');

      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      console.error('[USER-MGMT] Change password error:', error);
      throw new Error(`Failed to change password: ${error.message}`);
    }
  }

  // Utility methods
  hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  verifyPassword(password, hashedPassword) {
    const [salt, hash] = hashedPassword.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  }

  generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  logActivity(userId, action, type, message, ipAddress = '', userAgent = '') {
    try {
      db.prepare(`
        INSERT INTO activity_log (user_id, action, type, message, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(userId, action, type, message, ipAddress, userAgent);
    } catch (error) {
      console.error('[USER-MGMT] Activity logging error:', error);
    }
  }

  // Get user statistics
  async getUserStats() {
    try {
      const stats = db.prepare(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
          COUNT(CASE WHEN last_login > datetime('now', '-7 days') THEN 1 END) as activeWeek
        FROM users
      `).get();

      return {
        totalUsers: stats.total,
        activeUsers: stats.active,
        adminUsers: stats.admins,
        activeThisWeek: stats.activeWeek
      };
    } catch (error) {
      console.error('[USER-MGMT] Get stats error:', error);
      throw new Error(`Failed to get user stats: ${error.message}`);
    }
  }
}

module.exports = UserManagementService;
