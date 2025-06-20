/**
 * Authentication Controller
 * Handles user registration, login, and session management
 */

const { authManager, hashPassword, verifyPassword, generateToken, createSession, updateLoginTracking } = require('../middlewares/authentication');
const { logManager } = require('../middlewares/logging');
const database = require('../database');
const config = require('../config/environment');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

class AuthController {
  constructor() {
    this.database = database;
    this.setupEmailTransporter();
  }

  setupEmailTransporter() {
    if (config.FEATURES.enableEmailVerification) {
      this.emailTransporter = nodemailer.createTransporter(config.SMTP_CONFIG);
    }
  }

  async register(req, res) {
    try {
      const { username, email, password, fullName } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ 
          error: 'Username, email, and password are required',
          code: 'MISSING_FIELDS'
        });
      }

      if (password.length < config.VALIDATION.minPasswordLength) {
        return res.status(400).json({ 
          error: `Password must be at least ${config.VALIDATION.minPasswordLength} characters`,
          code: 'WEAK_PASSWORD'
        });
      }

      // Check if user exists
      const existingUser = await this.database.queryAsync(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({ 
          error: 'Username or email already exists',
          code: 'USER_EXISTS'
        });
      }

      // Create user
      const passwordHash = await hashPassword(password);
      const verificationToken = uuidv4();
      const apiKey = `dsk_${uuidv4().replace(/-/g, '')}`;

      const result = await this.database.queryAsync(`
        INSERT INTO users (username, email, password_hash, full_name, verification_token, api_key)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [username, email, passwordHash, fullName, verificationToken, apiKey]);

      const userId = result.lastInsertRowid;
      const userResult = await this.database.queryAsync(
        'SELECT id, username, email, full_name, role, is_active, email_verified, created_at FROM users WHERE id = ?',
        [userId]
      );

      const user = userResult.rows[0];

      // Send verification email
      if (config.FEATURES.enableEmailVerification) {
        await this.sendVerificationEmail(user, verificationToken, req);
      }

      // Create welcome notification
      await this.database.queryAsync(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (?, ?, ?, ?)
      `, [
        user.id, 
        'Welcome!', 
        'Welcome to DeepSeek AI Platform. Your account has been created successfully.', 
        'success'
      ]);

      // Generate tokens
      const token = generateToken(user.id);
      const sessionData = await createSession(user.id, req);

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          emailVerified: user.email_verified,
          apiKey
        },
        token,
        sessionToken: sessionData.sessionToken,
        requiresVerification: config.FEATURES.enableEmailVerification
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        error: 'Registration failed',
        code: 'REGISTRATION_ERROR'
      });
    }
  }

  async login(req, res) {
    try {
      const { username, password, rememberMe = false } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ 
          error: 'Username and password are required',
          code: 'MISSING_CREDENTIALS'
        });
      }

      // Get user
      const userResult = await this.database.queryAsync(
        'SELECT * FROM users WHERE (username = ? OR email = ?) AND is_active = 1',
        [username, username]
      );

      if (userResult.rows.length === 0) {
        await this.logSecurityEvent('failed_login_attempt', { username }, req);
        return res.status(401).json({ 
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      const user = userResult.rows[0];

      // Check account lock
      if (user.locked_until && new Date() < new Date(user.locked_until)) {
        await this.logSecurityEvent('locked_account_access', { userId: user.id }, req);
        return res.status(423).json({ 
          error: 'Account temporarily locked due to failed login attempts',
          lockUntil: user.locked_until,
          code: 'ACCOUNT_LOCKED'
        });
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.password_hash);

      if (!isValidPassword) {
        await updateLoginTracking(user.id, false);
        await this.logSecurityEvent('failed_login_attempt', { 
          userId: user.id, 
          username: user.username 
        }, req);

        return res.status(401).json({ 
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Successful login
      await updateLoginTracking(user.id, true);

      // Generate tokens
      const tokenOptions = rememberMe ? { expiresIn: '30d' } : {};
      const token = generateToken(user.id, tokenOptions);
      const sessionData = await createSession(user.id, req);

      // Log successful login
      await this.logSecurityEvent('successful_login', { 
        userId: user.id, 
        username: user.username 
      }, req);

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          emailVerified: user.email_verified,
          apiQuotaDaily: user.api_quota_daily,
          apiQuotaUsed: user.api_quota_used_today
        },
        token,
        sessionToken: sessionData.sessionToken,
        expiresAt: sessionData.expiresAt
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        error: 'Login failed',
        code: 'LOGIN_ERROR'
      });
    }
  }

  async logout(req, res) {
    try {
      const sessionToken = req.headers['x-session-token'];
      
      if (sessionToken) {
        await authManager.revokeSession(sessionToken);
      }

      if (req.user) {
        await this.logSecurityEvent('user_logout', { 
          userId: req.user.id,
          username: req.user.username 
        }, req);
      }

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ 
        error: 'Logout failed',
        code: 'LOGOUT_ERROR'
      });
    }
  }

  async sendVerificationEmail(user, token, req) {
    if (!this.emailTransporter) return;

    try {
      const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify?token=${token}`;
      
      await this.emailTransporter.sendMail({
        from: config.SMTP_CONFIG.auth.user,
        to: user.email,
        subject: 'Verify your DeepSeek AI account',
        html: `
          <h2>Welcome to DeepSeek AI Platform!</h2>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verificationUrl}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Verify Email</a>
          <p>Your API key: <code>${user.api_key}</code></p>
          <p>If you didn't create this account, please ignore this email.</p>
        `
      });
    } catch (error) {
      console.error('Email sending failed:', error);
    }
  }

  async logSecurityEvent(type, details, req) {
    return logManager.logSecurityEvent(type, details, req);
  }
}

module.exports = new AuthController();