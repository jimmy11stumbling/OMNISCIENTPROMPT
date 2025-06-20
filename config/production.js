// Production Configuration - Optimized for deployment
const productionConfig = {
  // Server Configuration
  server: {
    port: process.env.PORT || 5000,
    host: '0.0.0.0',
    keepAliveTimeout: 65000,
    headersTimeout: 66000,
    maxConnections: 1000,
    timeout: 120000
  },

  // Database Optimization
  database: {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    pool: {
      min: 2,
      max: 20,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200
    }
  },

  // Caching Strategy
  cache: {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      ttl: 300, // 5 minutes
      maxRetriesPerRequest: 3
    },
    memory: {
      max: 100,
      ttl: 1000 * 60 * 5 // 5 minutes
    }
  },

  // Security Hardening
  security: {
    cors: {
      origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : false,
      credentials: true,
      optionsSuccessStatus: 200
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "cdn.tailwindcss.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "cdn.tailwindcss.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:", "ws:"],
          fontSrc: ["'self'", "https:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000,
      standardHeaders: true,
      legacyHeaders: false,
      message: 'Too many requests from this IP'
    }
  },

  // Performance Optimization
  performance: {
    compression: {
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
      }
    },
    static: {
      maxAge: '1y',
      etag: true,
      lastModified: true
    }
  },

  // Monitoring & Analytics
  monitoring: {
    healthCheck: {
      path: '/health',
      interval: 30000
    },
    metrics: {
      enabled: true,
      endpoint: '/metrics',
      prefix: 'deepseek_',
      defaultLabels: {
        app: 'deepseek-ai-platform',
        version: process.env.npm_package_version || '1.0.0'
      }
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      format: 'json',
      destination: process.env.LOG_FILE || 'logs/app.log',
      rotation: {
        size: '10MB',
        interval: '1d',
        compress: true
      }
    }
  },

  // WebSocket Configuration
  websocket: {
    pingTimeout: 60000,
    pingInterval: 25000,
    maxConnections: 1000,
    compression: true,
    perMessageDeflate: {
      threshold: 1024,
      concurrencyLimit: 10
    }
  },

  // API Configuration
  api: {
    timeout: 30000,
    retries: 3,
    rateLimit: {
      prompt: { max: 100, window: '1h' },
      search: { max: 1000, window: '1h' },
      upload: { max: 50, window: '1h' }
    },
    fileUpload: {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/*', 'text/*', 'application/pdf'],
      destination: process.env.UPLOAD_PATH || 'uploads/'
    }
  },

  // External Services
  external: {
    deepseek: {
      apiUrl: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com',
      timeout: 30000,
      retries: 3,
      rateLimit: {
        rpm: 60,
        rph: 1000
      }
    },
    email: {
      service: process.env.EMAIL_SERVICE || 'smtp',
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5
    }
  },

  // Feature Flags
  features: {
    enableRAG: true,
    enableRealTime: true,
    enableAnalytics: true,
    enableFileUpload: true,
    enableA2AProtocol: true,
    enableMCPIntegration: true,
    enableAdvancedAuth: true,
    enableCaching: true,
    enableCompression: true,
    enableMetrics: true
  },

  // Deployment
  deployment: {
    cluster: process.env.CLUSTER_MODE === 'true',
    workers: process.env.WORKERS || require('os').cpus().length,
    gracefulShutdown: {
      timeout: 30000,
      killTimeout: 5000
    },
    health: {
      checkInterval: 30000,
      unhealthyThreshold: 3,
      healthyThreshold: 2
    }
  }
};

module.exports = productionConfig;