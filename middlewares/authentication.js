
/**
 * Enhanced Authentication Middleware
 * Comprehensive security with JWT, password validation, and session management
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

class AuthenticationManager {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'deepseek-ai-secret-key-change-in-production';
    this.bcryptRounds = 12;
    this.tokenExpiry = '24h';
    this.refreshTokenExpiry = '7d';
    this.activeSessions = new Map();
    
    // Rate limiting for auth endpoints
    this.authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per window
      message: { error: 'Too many authentication attempts. Please try again later.' },
      standardHeaders: true,
      legacyHeaders: false
    });

    this.loginLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 3, // 3 login attempts per window
      message: { error: 'Too many login attempts. Please try again later.' },
      standardHeaders: true,
      legacyHeaders: false
    });
  }

  // Password utilities
  async hashPassword(password) {
    if (!this.validatePasswordStrength(password)) {
      throw new Error('Password does not meet security requirements');
    }
    return await bcrypt.hash(password, this.bcryptRounds);
  }

  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  validatePasswordStrength(password) {
    // Minimum 8 characters, at least one uppercase, lowercase, number, and special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  // Email validation
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Token management
  generateToken(userId, options = {}) {
    const payload = {
      userId,
      type: 'access',
      iat: Math.floor(Date.now() / 1000)
    };

    const tokenOptions = {
      expiresIn: options.expiresIn || this.tokenExpiry,
      issuer: 'deepseek-ai-platform',
      audience: 'deepseek-users'
    };

    const token = jwt.sign(payload, this.jwtSecret, tokenOptions);
    
    // Track active session
    this.activeSessions.set(userId, {
      tokenId: payload.iat,
      createdAt: new Date(),
      lastActivity: new Date(),
      userAgent: options.userAgent || 'unknown',
      ipAddress: options.ipAddress || 'unknown'
    });

    return token;
  }

  generateRefreshToken(userId) {
    const payload = {
      userId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: 'deepseek-ai-platform',
      audience: 'deepseek-users'
    });
  }

  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: 'deepseek-ai-platform',
        audience: 'deepseek-users'
      });

      // Update last activity for active sessions
      if (this.activeSessions.has(decoded.userId)) {
        const session = this.activeSessions.get(decoded.userId);
        session.lastActivity = new Date();
      }

      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Middleware functions
  authenticateToken() {
    return async (req, res, next) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ 
          error: 'Access token required',
          code: 'MISSING_TOKEN'
        });
      }

      try {
        const decoded = this.verifyToken(token);
        
        // Check if session is still active
        if (!this.activeSessions.has(decoded.userId)) {
          return res.status(403).json({ 
            error: 'Session expired',
            code: 'SESSION_EXPIRED'
          });
        }

        req.user = { id: decoded.userId };
        req.tokenPayload = decoded;
        next();
      } catch (error) {
        return res.status(403).json({ 
          error: 'Invalid token',
          code: 'INVALID_TOKEN',
          details: error.message
        });
      }
    };
  }

  optionalAuth() {
    return async (req, res, next) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        req.user = null;
        return next();
      }

      try {
        const decoded = this.verifyToken(token);
        if (this.activeSessions.has(decoded.userId)) {
          req.user = { id: decoded.userId };
          req.tokenPayload = decoded;
        } else {
          req.user = null;
        }
      } catch (error) {
        req.user = null;
      }

      next();
    };
  }

  requireAdmin() {
    return async (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // For demo purposes, check if user ID is 1 (first user is admin)
      // In production, this should check a proper role field
      if (req.user.id !== 1) {
        return res.status(403).json({ 
          error: 'Admin access required',
          code: 'ADMIN_REQUIRED'
        });
      }

      next();
    };
  }

  // Session management
  invalidateSession(userId) {
    this.activeSessions.delete(userId);
  }

  invalidateAllSessions() {
    this.activeSessions.clear();
  }

  getActiveSessions() {
    const sessions = [];
    for (const [userId, session] of this.activeSessions.entries()) {
      sessions.push({
        userId,
        ...session,
        duration: Date.now() - session.createdAt.getTime()
      });
    }
    return sessions;
  }

  // Permission system
  getUserPermissions(user) {
    const basePermissions = [
      'read_own_data',
      'create_prompts',
      'use_api'
    ];

    const adminPermissions = [
      ...basePermissions,
      'read_all_data',
      'manage_users',
      'system_admin',
      'delete_data'
    ];

    // Simple role-based permissions
    if (user.role === 'admin' || user.id === 1) {
      return adminPermissions;
    }

    return basePermissions;
  }

  hasPermission(user, permission) {
    const userPermissions = this.getUserPermissions(user);
    return userPermissions.includes(permission);
  }

  requirePermission(permission) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      if (!this.hasPermission(req.user, permission)) {
        return res.status(403).json({ 
          error: `Permission '${permission}' required`,
          code: 'PERMISSION_DENIED'
        });
      }

      next();
    };
  }

  // Security utilities
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // Remove potentially dangerous characters
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  generateSecureToken(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Rate limiters
  getAuthLimiter() {
    return this.authLimiter;
  }

  getLoginLimiter() {
    return this.loginLimiter;
  }

  // Cleanup expired sessions
  cleanupExpiredSessions() {
    const now = Date.now();
    const sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours

    for (const [userId, session] of this.activeSessions.entries()) {
      if (now - session.lastActivity.getTime() > sessionTimeout) {
        this.activeSessions.delete(userId);
      }
    }
  }

  // Initialize periodic cleanup
  startSessionCleanup() {
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60 * 60 * 1000); // Run every hour
  }
}

// Create singleton instance
const authManager = new AuthenticationManager();

// Start session cleanup
authManager.startSessionCleanup();

module.exports = authManager;
