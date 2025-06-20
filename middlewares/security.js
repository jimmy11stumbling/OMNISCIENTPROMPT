/**
 * Security Middleware
 * Input validation, sanitization, and security headers
 */

const config = require('../config/environment');
const { logManager } = require('./logging');

class SecurityManager {
  constructor() {
    this.suspiciousPatterns = [
      /(<script[\s\S]*?>[\s\S]*?<\/script>)/gi,
      /(javascript:)/gi,
      /(on\w+\s*=)/gi,
      /(\$\(|\$\.)/gi,
      /(eval\s*\()/gi,
      /(expression\s*\()/gi
    ];
  }

  // Content Security Policy
  contentSecurityPolicy() {
    return (req, res, next) => {
      res.setHeader('Content-Security-Policy', 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' cdn.tailwindcss.com; " +
        "style-src 'self' 'unsafe-inline' cdn.tailwindcss.com; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self' wss:; " +
        "font-src 'self' https:; " +
        "frame-ancestors 'none';"
      );
      next();
    };
  }

  // Security headers
  securityHeaders() {
    return (req, res, next) => {
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
      
      if (config.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      }
      
      next();
    };
  }

  // Input sanitization
  sanitizeInput() {
    return (req, res, next) => {
      try {
        if (req.body) {
          req.body = this.sanitizeObject(req.body);
        }
        
        if (req.query) {
          req.query = this.sanitizeObject(req.query);
        }
        
        if (req.params) {
          req.params = this.sanitizeObject(req.params);
        }
        
        next();
      } catch (error) {
        console.error('Input sanitization error:', error);
        res.status(400).json({ 
          error: 'Invalid input detected',
          code: 'INVALID_INPUT'
        });
      }
    };
  }

  // SQL injection protection
  sqlInjectionProtection() {
    return (req, res, next) => {
      const sqlPatterns = [
        /(\bor\b|\band\b)\s+\d+\s*=\s*\d+/gi,
        /union\s+select/gi,
        /drop\s+table/gi,
        /delete\s+from/gi,
        /insert\s+into/gi,
        /update\s+\w+\s+set/gi,
        /--/gi,
        /\/\*[\s\S]*?\*\//gi
      ];

      const checkObject = (obj) => {
        for (const key in obj) {
          if (typeof obj[key] === 'string') {
            for (const pattern of sqlPatterns) {
              if (pattern.test(obj[key])) {
                logManager.logSecurityEvent('sql_injection_attempt', {
                  field: key,
                  value: obj[key],
                  pattern: pattern.source
                }, req);
                
                return true;
              }
            }
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            if (checkObject(obj[key])) return true;
          }
        }
        return false;
      };

      if (req.body && checkObject(req.body)) {
        return res.status(400).json({ 
          error: 'Potentially malicious input detected',
          code: 'MALICIOUS_INPUT'
        });
      }

      next();
    };
  }

  // XSS protection
  xssProtection() {
    return (req, res, next) => {
      const checkForXSS = (obj) => {
        for (const key in obj) {
          if (typeof obj[key] === 'string') {
            for (const pattern of this.suspiciousPatterns) {
              if (pattern.test(obj[key])) {
                logManager.logSecurityEvent('xss_attempt', {
                  field: key,
                  value: obj[key],
                  pattern: pattern.source
                }, req);
                
                return true;
              }
            }
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            if (checkForXSS(obj[key])) return true;
          }
        }
        return false;
      };

      if (req.body && checkForXSS(req.body)) {
        return res.status(400).json({ 
          error: 'Cross-site scripting attempt detected',
          code: 'XSS_DETECTED'
        });
      }

      next();
    };
  }

  // Request size limit
  requestSizeLimit() {
    return (req, res, next) => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
        return res.status(413).json({ 
          error: 'Request too large',
          code: 'REQUEST_TOO_LARGE'
        });
      }
      
      next();
    };
  }

  // Sanitize object recursively
  sanitizeObject(obj) {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = this.sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    
    return obj;
  }

  // Sanitize string
  sanitizeString(str) {
    if (typeof str !== 'string') return str;
    
    return str
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  }

  // Validate email format
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password strength
  validatePassword(password) {
    const minLength = config.VALIDATION.minPasswordLength;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      valid: password.length >= minLength && hasUpper && hasLower && hasNumber,
      requirements: {
        minLength: password.length >= minLength,
        hasUpper,
        hasLower,
        hasNumber,
        hasSpecial
      }
    };
  }
}

const securityManager = new SecurityManager();

module.exports = {
  securityManager,
  contentSecurityPolicy: securityManager.contentSecurityPolicy(),
  securityHeaders: securityManager.securityHeaders(),
  sanitizeInput: securityManager.sanitizeInput(),
  sqlInjectionProtection: securityManager.sqlInjectionProtection(),
  xssProtection: securityManager.xssProtection(),
  requestSizeLimit: securityManager.requestSizeLimit(),
  validateEmail: (email) => securityManager.validateEmail(email),
  validatePassword: (password) => securityManager.validatePassword(password)
};