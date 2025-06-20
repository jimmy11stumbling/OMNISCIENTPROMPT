// Performance Optimization Module - Production-ready enhancements
const cluster = require('cluster');
const os = require('os');

class PerformanceOptimizer {
  constructor(app, config) {
    this.app = app;
    this.config = config;
    this.metrics = new Map();
    this.responseTimeCache = [];
    this.connectionPool = new Map();
    
    this.initializeOptimizations();
  }

  initializeOptimizations() {
    this.setupResponseCaching();
    this.setupConnectionPooling();
    this.setupMemoryManagement();
    
    console.log('[PERFORMANCE] Optimization modules initialized');
  }

  setupResponseCaching() {
    const cache = new Map();
    const maxCacheSize = 1000;
    const cacheTimeout = 5 * 60 * 1000; // 5 minutes

    this.app.use('/api/', (req, res, next) => {
      if (req.method !== 'GET') return next();
      
      const cacheKey = `${req.originalUrl}_${JSON.stringify(req.query)}`;
      const cached = cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < cacheTimeout) {
        res.set('X-Cache', 'HIT');
        return res.json(cached.data);
      }
      
      const originalSend = res.json;
      res.json = function(data) {
        if (res.statusCode === 200) {
          cache.set(cacheKey, { data, timestamp: Date.now() });
          
          if (cache.size > maxCacheSize) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
          }
        }
        
        res.set('X-Cache', 'MISS');
        originalSend.call(this, data);
      };
      
      next();
    });
  }

  setupConnectionPooling() {
    const activeConnections = new Set();
    const maxConnections = 1000;
    
    this.app.use((req, res, next) => {
      if (activeConnections.size >= maxConnections) {
        return res.status(503).json({
          error: 'Service temporarily unavailable',
          retryAfter: 30
        });
      }
      
      const connectionId = `${req.ip}_${Date.now()}_${Math.random()}`;
      activeConnections.add(connectionId);
      
      res.on('finish', () => {
        activeConnections.delete(connectionId);
      });
      
      res.on('close', () => {
        activeConnections.delete(connectionId);
      });
      
      next();
    });
  }

  setupMemoryManagement() {
    const memoryThreshold = 0.95; // 95% memory usage threshold (less sensitive)
    let lastWarning = 0;
    const warningCooldown = 300000; // 5 minutes between warnings
    
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const heapUsedPercent = memUsage.heapUsed / memUsage.heapTotal;
      
      if (heapUsedPercent > memoryThreshold) {
        const now = Date.now();
        if (now - lastWarning > warningCooldown) {
          console.warn('[PERFORMANCE] High memory usage detected:', {
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
            percentage: Math.round(heapUsedPercent * 100) + '%'
          });
          lastWarning = now;
        }
        
        if (global.gc) {
          global.gc();
        }
      }
    }, 60000); // Check every 60 seconds instead of 30
  }

  trackResponseTime(req, res, responseTime) {
    this.responseTimeCache.push({
      endpoint: req.path,
      method: req.method,
      responseTime,
      timestamp: Date.now()
    });
    
    // Keep only last 1000 entries
    if (this.responseTimeCache.length > 1000) {
      this.responseTimeCache = this.responseTimeCache.slice(-1000);
    }
  }

  getPerformanceMetrics() {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    // Calculate average response time
    const recentEntries = this.responseTimeCache.slice(-100);
    const avgResponseTime = recentEntries.length > 0 
      ? recentEntries.reduce((sum, entry) => sum + entry.responseTime, 0) / recentEntries.length
      : 0;
    
    return {
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024)
      },
      performance: {
        uptime: Math.round(uptime),
        avgResponseTime: Math.round(avgResponseTime),
        requestsPerSecond: this.calculateRPS(),
        cpuUsage: process.cpuUsage()
      },
      cluster: {
        worker: cluster.worker ? cluster.worker.id : 'master',
        pid: process.pid
      },
      timestamp: new Date().toISOString()
    };
  }

  calculateRPS() {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    
    return this.responseTimeCache.filter(
      entry => entry.timestamp > oneSecondAgo
    ).length;
  }

  optimizeDatabase(pool) {
    // Database connection optimization
    const originalQuery = pool.queryAsync;
    
    pool.queryAsync = async function(sql, params = []) {
      const startTime = Date.now();
      
      try {
        const result = await originalQuery.call(this, sql, params);
        const duration = Date.now() - startTime;
        
        if (duration > 1000) {
          console.warn('[DATABASE] Slow query detected:', {
            sql: sql.substring(0, 100),
            duration: duration + 'ms'
          });
        }
        
        return result;
      } catch (error) {
        console.error('[DATABASE] Query error:', {
          sql: sql.substring(0, 100),
          error: error.message
        });
        throw error;
      }
    };
  }

  generatePerformanceReport() {
    const metrics = this.getPerformanceMetrics();
    const slowEndpoints = this.getSlowEndpoints();
    const memoryTrends = this.getMemoryTrends();
    
    return {
      summary: {
        status: this.getHealthStatus(metrics),
        uptime: metrics.performance.uptime,
        memoryUsage: `${metrics.memory.heapUsed}MB / ${metrics.memory.heapTotal}MB`,
        avgResponseTime: `${metrics.performance.avgResponseTime}ms`,
        requestsPerSecond: metrics.performance.requestsPerSecond
      },
      metrics,
      slowEndpoints,
      memoryTrends,
      recommendations: this.generateRecommendations(metrics),
      generatedAt: new Date().toISOString()
    };
  }

  getSlowEndpoints() {
    const endpointStats = new Map();
    
    this.responseTimeCache.forEach(entry => {
      const key = `${entry.method} ${entry.endpoint}`;
      if (!endpointStats.has(key)) {
        endpointStats.set(key, { times: [], count: 0 });
      }
      
      const stats = endpointStats.get(key);
      stats.times.push(entry.responseTime);
      stats.count++;
    });
    
    const slowEndpoints = [];
    
    for (const [endpoint, stats] of endpointStats.entries()) {
      const avgTime = stats.times.reduce((sum, time) => sum + time, 0) / stats.times.length;
      
      if (avgTime > 500) { // Endpoints slower than 500ms
        slowEndpoints.push({
          endpoint,
          avgResponseTime: Math.round(avgTime),
          requestCount: stats.count,
          maxResponseTime: Math.max(...stats.times)
        });
      }
    }
    
    return slowEndpoints.sort((a, b) => b.avgResponseTime - a.avgResponseTime);
  }

  getMemoryTrends() {
    // Simple memory trend analysis
    const memUsage = process.memoryUsage();
    const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    return {
      current: heapUsedPercent,
      status: heapUsedPercent > 85 ? 'critical' : heapUsedPercent > 70 ? 'warning' : 'healthy'
    };
  }

  getHealthStatus(metrics) {
    const memoryPercent = (metrics.memory.heapUsed / metrics.memory.heapTotal) * 100;
    const avgResponseTime = metrics.performance.avgResponseTime;
    
    if (memoryPercent > 85 || avgResponseTime > 1000) {
      return 'critical';
    } else if (memoryPercent > 70 || avgResponseTime > 500) {
      return 'warning';
    }
    
    return 'healthy';
  }

  generateRecommendations(metrics) {
    const recommendations = [];
    const memoryPercent = (metrics.memory.heapUsed / metrics.memory.heapTotal) * 100;
    
    if (memoryPercent > 85) {
      recommendations.push('Consider increasing memory allocation or optimizing memory usage');
    }
    
    if (metrics.performance.avgResponseTime > 500) {
      recommendations.push('Optimize slow endpoints and consider caching strategies');
    }
    
    if (metrics.performance.requestsPerSecond > 100) {
      recommendations.push('Consider implementing load balancing');
    }
    
    return recommendations;
  }
}

module.exports = PerformanceOptimizer;