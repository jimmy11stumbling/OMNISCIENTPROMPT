// Unified Deployment Configuration - Production-ready settings
const deploymentConfig = {
  production: {
    port: process.env.PORT || 5000,
    host: '0.0.0.0',
    ssl: {
      enabled: true,
      cert: process.env.SSL_CERT_PATH,
      key: process.env.SSL_KEY_PATH
    },
    database: {
      url: process.env.DATABASE_URL,
      poolSize: 20,
      connectionTimeout: 30000,
      idleTimeout: 600000
    },
    cache: {
      enabled: true,
      ttl: 300000, // 5 minutes
      maxSize: 100
    },
    security: {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        credentials: true
      },
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000 // requests per windowMs
      },
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
      }
    },
    monitoring: {
      healthCheck: true,
      metrics: true,
      logging: {
        level: 'info',
        format: 'json'
      }
    }
  },
  
  development: {
    port: process.env.PORT || 5000,
    host: 'localhost',
    ssl: { enabled: false },
    database: {
      url: process.env.DATABASE_URL || 'sqlite:./app_database.sqlite',
      poolSize: 5,
      connectionTimeout: 10000
    },
    cache: {
      enabled: false
    },
    security: {
      cors: {
        origin: '*',
        credentials: true
      },
      rateLimit: {
        windowMs: 15 * 60 * 1000,
        max: 10000
      }
    },
    monitoring: {
      healthCheck: true,
      metrics: true,
      logging: {
        level: 'debug',
        format: 'pretty'
      }
    }
  }
};

const environment = process.env.NODE_ENV || 'development';
const config = deploymentConfig[environment];

module.exports = {
  ...config,
  environment,
  isProduction: environment === 'production',
  isDevelopment: environment === 'development'
};