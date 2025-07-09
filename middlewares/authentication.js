/**
 * Authentication Middleware
 * JWT-based authentication with session management
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/environment');
const database = require('../database');

class AuthenticationManager {
  constructor() {
    this.database = database;
  }

  // JWT Token verification middleware
  verifyToken() {
    return async (req, res, next) => {
      try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
          return res.status(401).json({ 
            error: 'Access token required',
            code: 'NO_TOKEN'
          });
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);
        
        // Get user from database
        const userResult = await this.database.queryAsync(
          'SELECT * FROM users WHERE id = ? AND is_active = 1',
          [decoded.userId]
        );

        if (!userResult.rows.length) {
          return res.status(401).json({ 
            error: 'Invalid token - user not found',
            code: 'USER_NOT_FOUND'
          });
        }

        const user = userResult.rows[0];
        
        // Check if account is locked
        if (user.locked_until && new Date() < new Date(user.locked_until)) {
          return res.status(423).json({ 
            error: 'Account temporarily locked',
            lockUntil: user.locked_until,
            code: 'ACCOUNT_LOCKED'
          });
        }

        req.user = user;
        next();
      } catch (error) {
        if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({ 
            error: 'Invalid token',
            code: 'INVALID_TOKEN'
          });
        }
        
        if (error.name === 'TokenExpiredError') {
          return res.status(401).json({ 
            error: 'Token expired',
            code: 'TOKEN_EXPIRED'
          });
        }

        console.error('Auth middleware error:', error);
        return res.status(500).json({ 
          error: 'Authentication service error',
          code: 'AUTH_ERROR'
        });
      }
    };
  }

  // Optional authentication - doesn't fail if no token
  optionalAuth() {
    return async (req, res, next) => {
      try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
          req.user = null;
          return next();
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);
        const userResult = await this.database.queryAsync(
          'SELECT * FROM users WHERE id = ? AND is_active = 1',
          [decoded.userId]
        );

        req.user = userResult.rows.length ? userResult.rows[0] : null;
        next();
      } catch (error) {
        req.user = null;
        next();
      }
    };
  }

  // Role-based authorization
  requireRole(role) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      if (req.user.role !== role) {
        return res.status(403).json({ 
          error: `${role} access required`,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      next();
    };
  }

  // Multiple roles authorization
  requireAnyRole(roles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ 
          error: `Required roles: ${roles.join(', ')}`,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      next();
    };
  }

  // Admin authorization
  requireAdmin() {
    return this.requireRole('admin');
  }

  // User owns resource or is admin
  requireOwnership(resourceIdParam = 'id') {
    return async (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const resourceId = req.params[resourceIdParam];
      
      // Admin can access any resource
      if (req.user.role === 'admin') {
        return next();
      }

      // Check if user owns the resource
      if (req.user.id.toString() === resourceId) {
        return next();
      }

      return res.status(403).json({ 
        error: 'Access denied - not resource owner',
        code: 'NOT_OWNER'
      });
    };
  }

  // Generate JWT token
  generateToken(userId, options = {}) {
    const payload = { userId };
    const tokenOptions = {
      expiresIn: options.expiresIn || config.VALIDATION.tokenExpiry,
      ...options
    };

    return jwt.sign(payload, config.JWT_SECRET, tokenOptions);
  }

  // Generate refresh token
  generateRefreshToken(userId) {
    return jwt.sign(
      { userId, type: 'refresh' },
      config.JWT_SECRET,
      { expiresIn: '30d' }
    );
  }

  // Verify refresh token
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token type');
      }
      return decoded;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Hash password
  async hashPassword(password) {
    return bcrypt.hash(password, config.BCRYPT_ROUNDS);
  }

  // Verify password
  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  // Create session
  async createSession(userId, req) {
    const sessionToken = require('uuid').v4();
    const expiresAt = new Date(Date.now() + config.SESSION_TIMEOUT);

    await this.database.queryAsync(`
      INSERT INTO user_sessions (user_id, session_token, expires_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?)
    `, [
      userId,
      sessionToken,
      expiresAt.toISOString(),
      req.ip,
      req.get('User-Agent') || ''
    ]);

    return {
      sessionToken,
      expiresAt
    };
  }

  // Validate session
  async validateSession(sessionToken) {
    const result = await this.database.queryAsync(`
      SELECT s.*, u.* FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ? AND s.expires_at > datetime('now') AND u.is_active = 1
    `, [sessionToken]);

    return result.rows.length ? result.rows[0] : null;
  }

  // Revoke session
  async revokeSession(sessionToken) {
    await this.database.queryAsync(
      'DELETE FROM user_sessions WHERE session_token = ?',
      [sessionToken]
    );
  }

  // Revoke all user sessions
  async revokeAllUserSessions(userId) {
    await this.database.queryAsync(
      'DELETE FROM user_sessions WHERE user_id = ?',
      [userId]
    );
  }

  // Update login tracking
  async updateLoginTracking(userId, success = true) {
    if (success) {
      await this.database.queryAsync(
        'UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [userId]
      );
    } else {
      const user = await this.database.queryAsync(
        'SELECT failed_login_attempts FROM users WHERE id = ?',
        [userId]
      );

      if (user.rows.length) {
        const attempts = (user.rows[0].failed_login_attempts || 0) + 1;
        let lockUntil = null;

        if (attempts >= config.VALIDATION.maxLoginAttempts) {
          lockUntil = new Date(Date.now() + config.VALIDATION.lockoutDuration).toISOString();
        }

        await this.database.queryAsync(
          'UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?',
          [attempts, lockUntil, userId]
        );
      }
    }
  }

  // Get user permissions
  getUserPermissions(user) {
    const basePermissions = ['read_own_data', 'update_own_profile'];
    
    const rolePermissions = {
      admin: [...basePermissions, 'read_all_data', 'manage_users', 'manage_system'],
      moderator: [...basePermissions, 'manage_content', 'read_analytics'],
      premium: [...basePermissions, 'unlimited_prompts', 'priority_support'],
      user: basePermissions
    };

    return rolePermissions[user.role] || basePermissions;
  }

  // Permission check middleware
  requirePermission(permission) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const userPermissions = this.getUserPermissions(req.user);
      
      if (!userPermissions.includes(permission)) {
        return res.status(403).json({ 
          error: `Permission required: ${permission}`,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      next();
    };
  }
}

// Create singleton instance
const authManager = new AuthenticationManager();

module.exports = {
  authManager,
  verifyToken: authManager.verifyToken.bind(authManager),
  optionalAuth: authManager.optionalAuth.bind(authManager),
  requireAdmin: authManager.requireAdmin.bind(authManager),
  requireRole: (role) => authManager.requireRole(role),
  requireAnyRole: (roles) => authManager.requireAnyRole(roles),
  requireOwnership: (param) => authManager.requireOwnership(param),
  requirePermission: (permission) => authManager.requirePermission(permission),
  generateToken: (userId, options) => authManager.generateToken(userId, options),
  generateRefreshToken: (userId) => authManager.generateRefreshToken(userId),
  verifyRefreshToken: (token) => authManager.verifyRefreshToken(token),
  hashPassword: (password) => authManager.hashPassword(password),
  verifyPassword: (password, hash) => authManager.verifyPassword(password, hash),
  createSession: (userId, req) => authManager.createSession(userId, req),
  validateSession: (token) => authManager.validateSession(token),
  revokeSession: (token) => authManager.revokeSession(token),
  updateLoginTracking: (userId, success) => authManager.updateLoginTracking(userId, success),
  getUserPermissions: (user) => authManager.getUserPermissions(user)
};