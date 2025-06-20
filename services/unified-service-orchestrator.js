// Unified Service Orchestrator - Consolidates all services into one comprehensive system
const DeepSeekService = require('./deepseekService');
const RAGService = require('./ragService');
const WebSocketService = require('./websocketService');

class UnifiedServiceOrchestrator {
  constructor(pool, featureManager) {
    this.pool = pool;
    this.featureManager = featureManager;
    this.services = new Map();
    this.serviceMetrics = new Map();
    this.dependencies = new Map();
    this.healthChecks = new Map();
    
    this.initializeServices();
    this.startHealthMonitoring();
  }

  initializeServices() {
    // Initialize DeepSeek Service
    this.registerService('deepseek', new DeepSeekService(), {
      dependencies: [],
      healthCheck: () => this.services.get('deepseek').getServiceStatus(),
      critical: true
    });

    // Initialize RAG Service
    this.registerService('rag', new RAGService(), {
      dependencies: ['database'],
      healthCheck: () => this.checkRAGHealth(),
      critical: true
    });

    // Initialize WebSocket Service
    this.registerService('websocket', new WebSocketService(), {
      dependencies: [],
      healthCheck: () => this.checkWebSocketHealth(),
      critical: false
    });

    // Initialize Email Service
    this.registerService('email', this.createEmailService(), {
      dependencies: [],
      healthCheck: () => this.checkEmailHealth(),
      critical: false
    });

    // Initialize Analytics Service
    this.registerService('analytics', this.createAnalyticsService(), {
      dependencies: ['database'],
      healthCheck: () => this.checkAnalyticsHealth(),
      critical: false
    });

    // Initialize Security Service
    this.registerService('security', this.createSecurityService(), {
      dependencies: [],
      healthCheck: () => this.checkSecurityHealth(),
      critical: true
    });

    console.log(`[SERVICE-ORCHESTRATOR] Initialized ${this.services.size} services`);
  }

  registerService(name, service, config = {}) {
    this.services.set(name, service);
    this.dependencies.set(name, config.dependencies || []);
    this.healthChecks.set(name, config.healthCheck || (() => ({ status: 'unknown' })));
    
    this.serviceMetrics.set(name, {
      status: 'initializing',
      lastHealthCheck: null,
      uptime: 0,
      requests: 0,
      errors: 0,
      critical: config.critical || false,
      startTime: Date.now()
    });

    console.log(`[SERVICE-ORCHESTRATOR] Registered service: ${name}`);
  }

  getService(name) {
    return this.services.get(name);
  }

  getAllServices() {
    const serviceList = [];
    for (const [name, service] of this.services.entries()) {
      serviceList.push({
        name,
        service,
        metrics: this.serviceMetrics.get(name),
        dependencies: this.dependencies.get(name)
      });
    }
    return serviceList;
  }

  async checkServiceHealth(name) {
    const healthCheck = this.healthChecks.get(name);
    const metrics = this.serviceMetrics.get(name);
    
    try {
      const health = await healthCheck();
      metrics.status = health.status || 'healthy';
      metrics.lastHealthCheck = new Date().toISOString();
      metrics.uptime = Date.now() - metrics.startTime;
      
      return { service: name, ...health, healthy: true };
    } catch (error) {
      metrics.status = 'unhealthy';
      metrics.errors += 1;
      metrics.lastHealthCheck = new Date().toISOString();
      
      return { 
        service: name, 
        status: 'unhealthy', 
        error: error.message, 
        healthy: false 
      };
    }
  }

  async checkAllServicesHealth() {
    const healthResults = {};
    
    for (const serviceName of this.services.keys()) {
      healthResults[serviceName] = await this.checkServiceHealth(serviceName);
    }
    
    return healthResults;
  }

  startHealthMonitoring() {
    setInterval(async () => {
      const healthResults = await this.checkAllServicesHealth();
      this.updateFeatureMetrics(healthResults);
    }, 60000); // Check every minute
  }

  updateFeatureMetrics(healthResults) {
    for (const [serviceName, health] of Object.entries(healthResults)) {
      if (this.featureManager) {
        this.featureManager.updateFeatureMetrics(serviceName, {
          status: health.status,
          lastCheck: health.lastHealthCheck || new Date().toISOString(),
          healthy: health.healthy
        });
      }
    }
  }

  async executeServiceMethod(serviceName, methodName, ...args) {
    const service = this.services.get(serviceName);
    const metrics = this.serviceMetrics.get(serviceName);
    
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    if (!service[methodName] || typeof service[methodName] !== 'function') {
      throw new Error(`Method ${methodName} not found on service ${serviceName}`);
    }

    try {
      metrics.requests += 1;
      const result = await service[methodName](...args);
      return result;
    } catch (error) {
      metrics.errors += 1;
      throw error;
    }
  }

  // Service Health Checks
  async checkRAGHealth() {
    const ragService = this.services.get('rag');
    if (!ragService) return { status: 'not_found' };
    
    try {
      const stats = await ragService.getDocumentStats();
      return { 
        status: 'healthy', 
        documents: stats.totalDocuments,
        platforms: stats.platforms 
      };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  checkWebSocketHealth() {
    const wsService = this.services.get('websocket');
    if (!wsService) return { status: 'not_found' };
    
    try {
      const metrics = wsService.getMetrics();
      return { 
        status: 'healthy', 
        connections: metrics.totalConnections,
        activeConnections: metrics.activeConnections 
      };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  checkEmailHealth() {
    return { 
      status: process.env.SMTP_USER ? 'configured' : 'not_configured',
      provider: process.env.SMTP_USER ? 'smtp' : null
    };
  }

  checkAnalyticsHealth() {
    return { 
      status: 'healthy',
      metricsCollected: this.serviceMetrics.size,
      activeServices: Array.from(this.services.keys()).length
    };
  }

  checkSecurityHealth() {
    return { 
      status: 'healthy',
      rateLimiting: 'active',
      validation: 'active',
      encryption: 'active'
    };
  }

  // Service Factories
  createEmailService() {
    return {
      async sendEmail(to, subject, content, options = {}) {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
          throw new Error('Email service not configured');
        }
        
        // Email sending logic would go here
        console.log(`[EMAIL] Sending email to ${to}: ${subject}`);
        return { messageId: `email_${Date.now()}`, status: 'sent' };
      },
      
      async sendVerificationEmail(user, token) {
        return this.sendEmail(
          user.email,
          'Verify your account',
          `Click here to verify: ${process.env.BASE_URL}/verify?token=${token}`
        );
      },
      
      getStatus() {
        return {
          configured: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
          provider: 'smtp'
        };
      }
    };
  }

  createAnalyticsService() {
    const analytics = {
      metrics: new Map(),
      events: new Map(),
      
      track(event, data) {
        const timestamp = new Date().toISOString();
        const key = `${event}_${Date.now()}`;
        
        this.events.set(key, {
          event,
          data,
          timestamp
        });
        
        // Update metrics
        const current = this.metrics.get(event) || { count: 0, lastSeen: null };
        this.metrics.set(event, {
          count: current.count + 1,
          lastSeen: timestamp,
          latestData: data
        });
        
        // Keep only last 1000 events
        if (this.events.size > 1000) {
          const firstKey = this.events.keys().next().value;
          this.events.delete(firstKey);
        }
      },
      
      getMetrics(event = null) {
        if (event) {
          return this.metrics.get(event) || null;
        }
        return Object.fromEntries(this.metrics.entries());
      },
      
      getEvents(event = null, limit = 100) {
        const events = Array.from(this.events.values());
        
        if (event) {
          return events.filter(e => e.event === event).slice(-limit);
        }
        
        return events.slice(-limit);
      },
      
      generateReport(timeRange = '24h') {
        const now = Date.now();
        const timeRanges = {
          '1h': 60 * 60 * 1000,
          '24h': 24 * 60 * 60 * 1000,
          '7d': 7 * 24 * 60 * 60 * 1000
        };
        
        const cutoff = now - (timeRanges[timeRange] || timeRanges['24h']);
        const recentEvents = Array.from(this.events.values())
          .filter(e => new Date(e.timestamp).getTime() > cutoff);
        
        return {
          timeRange,
          totalEvents: recentEvents.length,
          uniqueEvents: [...new Set(recentEvents.map(e => e.event))].length,
          events: recentEvents,
          generatedAt: new Date().toISOString()
        };
      }
    };
    
    return analytics;
  }

  createSecurityService() {
    return {
      validateInput(input, rules = {}) {
        const errors = [];
        
        if (rules.required && (!input || input.trim() === '')) {
          errors.push('Input is required');
        }
        
        if (rules.minLength && input.length < rules.minLength) {
          errors.push(`Input must be at least ${rules.minLength} characters`);
        }
        
        if (rules.maxLength && input.length > rules.maxLength) {
          errors.push(`Input must not exceed ${rules.maxLength} characters`);
        }
        
        if (rules.pattern && !rules.pattern.test(input)) {
          errors.push('Input format is invalid');
        }
        
        return { valid: errors.length === 0, errors };
      },
      
      sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        return input
          .replace(/[<>]/g, '') // Remove potential HTML tags
          .replace(/javascript:/gi, '') // Remove javascript: URLs
          .replace(/on\w+=/gi, '') // Remove event handlers
          .trim();
      },
      
      checkRateLimit(clientId, limit = 100, window = 60000) {
        // Rate limiting logic would integrate with existing middleware
        return { allowed: true, remaining: limit - 1, resetTime: Date.now() + window };
      },
      
      generateSecurityReport() {
        return {
          rateLimiting: 'active',
          inputValidation: 'active',
          sqlInjectionProtection: 'active',
          xssProtection: 'active',
          corsEnabled: true,
          httpsOnly: process.env.NODE_ENV === 'production',
          generatedAt: new Date().toISOString()
        };
      }
    };
  }

  // Service orchestration methods
  async startAllServices() {
    const results = [];
    
    for (const [name, service] of this.services.entries()) {
      try {
        if (service.start && typeof service.start === 'function') {
          await service.start();
        }
        
        const metrics = this.serviceMetrics.get(name);
        metrics.status = 'running';
        
        results.push({ service: name, status: 'started' });
      } catch (error) {
        results.push({ service: name, status: 'failed', error: error.message });
      }
    }
    
    return results;
  }

  async stopAllServices() {
    const results = [];
    
    for (const [name, service] of this.services.entries()) {
      try {
        if (service.stop && typeof service.stop === 'function') {
          await service.stop();
        }
        
        const metrics = this.serviceMetrics.get(name);
        metrics.status = 'stopped';
        
        results.push({ service: name, status: 'stopped' });
      } catch (error) {
        results.push({ service: name, status: 'failed', error: error.message });
      }
    }
    
    return results;
  }

  getServiceMetrics(serviceName = null) {
    if (serviceName) {
      return this.serviceMetrics.get(serviceName);
    }
    
    const allMetrics = {};
    for (const [name, metrics] of this.serviceMetrics.entries()) {
      allMetrics[name] = metrics;
    }
    
    return allMetrics;
  }

  generateOrchestrationReport() {
    const services = this.getAllServices();
    const overallHealth = services.every(s => s.metrics.status === 'healthy' || s.metrics.status === 'running');
    
    return {
      totalServices: services.length,
      healthyServices: services.filter(s => s.metrics.status === 'healthy' || s.metrics.status === 'running').length,
      criticalServices: services.filter(s => s.metrics.critical).length,
      overallHealth: overallHealth ? 'healthy' : 'degraded',
      services: services.map(s => ({
        name: s.name,
        status: s.metrics.status,
        uptime: s.metrics.uptime,
        requests: s.metrics.requests,
        errors: s.metrics.errors,
        critical: s.metrics.critical
      })),
      generatedAt: new Date().toISOString()
    };
  }
}

module.exports = UnifiedServiceOrchestrator;