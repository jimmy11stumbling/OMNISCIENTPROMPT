/**
 * Environment Configuration Module
 * Centralizes all environment variables and application settings
 */

const config = {
  // Server Configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Security Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'deepseek-ai-secret-key-change-in-production',
  BCRYPT_ROUNDS: 12,
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours

  // API Configuration
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  DEEPSEEK_API_URL: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions',

  // Rate Limiting Configuration
  RATE_LIMITS: {
    DEFAULT: { windowMs: 60000, maxRequests: 100 },
    PROMPT_GENERATION: { windowMs: 300000, maxRequests: 10 },
    CHAT: { windowMs: 60000, maxRequests: 20 },
    AUTH: { windowMs: 900000, maxRequests: 5 }
  },

  // Email Configuration
  SMTP_CONFIG: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  },

  // File Upload Configuration
  UPLOAD_CONFIG: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf', 'text/plain', 'application/json'],
    uploadDir: 'uploads/'
  },

  // Database Configuration
  DATABASE: {
    path: './app_database.sqlite',
    options: { foreign_keys: 'ON' }
  },

  // WebSocket Configuration
  WEBSOCKET: {
    path: '/ws',
    heartbeatInterval: 30000,
    maxConnections: 1000
  },

  // Validation Settings
  VALIDATION: {
    minPasswordLength: 8,
    maxLoginAttempts: 5,
    lockoutDuration: 30 * 60 * 1000,
    tokenExpiry: '24h'
  },

  // Feature Flags
  FEATURES: {
    enableEmailVerification: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
    enableRealTimeValidation: true,
    enableAdvancedRAG: true,
    enableA2AProtocol: true,
    enableMCPIntegration: true
  },

  // Logging Configuration
  LOGGING: {
    level: process.env.LOG_LEVEL || 'info',
    enableRequestLogging: true,
    enableErrorTracking: true
  }
};

// Environment validation
function validateEnvironment() {
  const requiredVars = [];
  const warnings = [];

  if (!config.DEEPSEEK_API_KEY) {
    warnings.push('DEEPSEEK_API_KEY not set - using demo mode');
  }

  if (config.NODE_ENV === 'production') {
    if (config.JWT_SECRET === 'deepseek-ai-secret-key-change-in-production') {
      requiredVars.push('JWT_SECRET must be changed in production');
    }

    if (!config.SMTP_CONFIG.auth.user || !config.SMTP_CONFIG.auth.pass) {
      warnings.push('SMTP credentials not configured - email features disabled');
    }
  }

  if (requiredVars.length > 0) {
    throw new Error(`Environment validation failed: ${requiredVars.join(', ')}`);
  }

  if (warnings.length > 0) {
    console.warn('Environment warnings:', warnings.join(', '));
  }
}

validateEnvironment();
module.exports = config;