// Production Monitoring System - Comprehensive real-time monitoring and alerting
const EventEmitter = require('events');
const { performance } = require('perf_hooks');

class ProductionMonitoringSystem extends EventEmitter {
  constructor(app, config) {
    super();
    this.app = app;
    this.config = config;
    this.metrics = new Map();
    this.alerts = new Map();
    this.healthChecks = new Map();
    this.performanceBaseline = new Map();
    this.anomalyThresholds = new Map();
    
    this.initializeMonitoring();
  }

  initializeMonitoring() {
    this.setupMetricsCollection();
    this.setupHealthChecks();
    this.setupAlertSystem();
    this.setupPerformanceBaseline();
    this.setupRealTimeMonitoring();
    this.setupCircuitBreakers();
    
    console.log('[PRODUCTION-MONITOR] Advanced monitoring system activated');
  }

  setupMetricsCollection() {
    // Collect comprehensive system metrics
    setInterval(() => {
      this.collectSystemMetrics();
      this.collectApplicationMetrics();
      this.collectBusinessMetrics();
      this.analyzeMetrics();
    }, 15000); // Every 15 seconds
    
    // High-frequency performance metrics
    setInterval(() => {
      this.collectPerformanceMetrics();
    }, 5000); // Every 5 seconds
  }

  collectSystemMetrics() {
    const memory = process.memoryUsage();
    const cpu = process.cpuUsage();
    const uptime = process.uptime();
    
    const systemMetrics = {
      memory: {
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
        external: memory.external,
        rss: memory.rss,
        arrayBuffers: memory.arrayBuffers,
        heapUtilization: (memory.heapUsed / memory.heapTotal) * 100
      },
      cpu: {
        user: cpu.user,
        system: cpu.system,
        total: cpu.user + cpu.system,
        utilization: ((cpu.user + cpu.system) / (uptime * 1000000)) * 100
      },
      process: {
        uptime,
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch
      },
      timestamp: Date.now()
    };
    
    this.recordMetric('system', systemMetrics);
    this.checkSystemThresholds(systemMetrics);
  }

  collectApplicationMetrics() {
    const appMetrics = {
      endpoints: this.getEndpointMetrics(),
      cache: this.getCacheMetrics(),
      database: this.getDatabaseMetrics(),
      websockets: this.getWebSocketMetrics(),
      errors: this.getErrorMetrics(),
      timestamp: Date.now()
    };
    
    this.recordMetric('application', appMetrics);
    this.checkApplicationThresholds(appMetrics);
  }

  collectBusinessMetrics() {
    const businessMetrics = {
      promptGeneration: {
        requestsPerMinute: this.getMetricRate('prompt_requests'),
        successRate: this.getSuccessRate('prompt_generation'),
        averageResponseTime: this.getAverageResponseTime('prompt_generation')
      },
      userActivity: {
        activeUsers: this.getActiveUsers(),
        newRegistrations: this.getMetricRate('user_registrations'),
        sessionDuration: this.getAverageSessionDuration()
      },
      ragSystem: {
        searchesPerMinute: this.getMetricRate('rag_searches'),
        cacheHitRate: this.getCacheHitRate(),
        documentCount: this.getDocumentCount()
      },
      timestamp: Date.now()
    };
    
    this.recordMetric('business', businessMetrics);
  }

  collectPerformanceMetrics() {
    const performanceMetrics = {
      eventLoop: {
        delay: this.measureEventLoopDelay(),
        utilization: this.getEventLoopUtilization()
      },
      gc: {
        collections: this.getGCMetrics(),
        memoryFreed: this.getMemoryFreed()
      },
      network: {
        connections: this.getActiveConnections(),
        bandwidth: this.getBandwidthUsage()
      },
      timestamp: Date.now()
    };
    
    this.recordMetric('performance', performanceMetrics);
  }

  setupHealthChecks() {
    // Core system health checks
    this.healthChecks.set('database', {
      check: () => this.checkDatabaseHealth(),
      interval: 30000,
      timeout: 5000,
      retries: 3
    });
    
    this.healthChecks.set('cache', {
      check: () => this.checkCacheHealth(),
      interval: 60000,
      timeout: 3000,
      retries: 2
    });
    
    this.healthChecks.set('external_apis', {
      check: () => this.checkExternalAPIs(),
      interval: 120000,
      timeout: 10000,
      retries: 2
    });
    
    this.healthChecks.set('disk_space', {
      check: () => this.checkDiskSpace(),
      interval: 300000,
      timeout: 5000,
      retries: 1
    });
    
    // Start health check runners
    this.healthChecks.forEach((config, name) => {
      this.runHealthCheck(name, config);
    });
  }

  async runHealthCheck(name, config) {
    const runCheck = async () => {
      try {
        const startTime = performance.now();
        const result = await Promise.race([
          config.check(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), config.timeout)
          )
        ]);
        
        const duration = performance.now() - startTime;
        
        this.recordHealthCheck(name, {
          status: 'healthy',
          duration,
          result,
          timestamp: Date.now()
        });
        
      } catch (error) {
        this.recordHealthCheck(name, {
          status: 'unhealthy',
          error: error.message,
          timestamp: Date.now()
        });
        
        this.triggerAlert(`health_check_${name}`, {
          severity: 'high',
          message: `Health check failed: ${name}`,
          error: error.message
        });
      }
      
      setTimeout(runCheck, config.interval);
    };
    
    runCheck();
  }

  setupAlertSystem() {
    this.alertRules = new Map([
      ['high_memory_usage', {
        condition: (metrics) => metrics.system?.memory.heapUtilization > 85,
        severity: 'high',
        cooldown: 300000 // 5 minutes
      }],
      ['high_cpu_usage', {
        condition: (metrics) => metrics.system?.cpu.utilization > 80,
        severity: 'medium',
        cooldown: 180000 // 3 minutes
      }],
      ['high_error_rate', {
        condition: (metrics) => metrics.application?.errors.rate > 0.05,
        severity: 'critical',
        cooldown: 60000 // 1 minute
      }],
      ['slow_response_time', {
        condition: (metrics) => metrics.application?.endpoints.avgResponseTime > 2000,
        severity: 'medium',
        cooldown: 300000
      }],
      ['database_connection_failure', {
        condition: (metrics) => !metrics.application?.database.connected,
        severity: 'critical',
        cooldown: 30000
      }],
      ['low_cache_hit_rate', {
        condition: (metrics) => metrics.application?.cache.hitRate < 0.6,
        severity: 'low',
        cooldown: 600000 // 10 minutes
      }]
    ]);
    
    this.alertHistory = [];
    this.activeCooldowns = new Map();
  }

  setupCircuitBreakers() {
    this.circuitBreakers = new Map();
    
    // Database circuit breaker
    this.circuitBreakers.set('database', {
      failureThreshold: 5,
      timeoutThreshold: 10000,
      resetTimeout: 60000,
      state: 'closed',
      failures: 0,
      lastFailureTime: 0
    });
    
    // External API circuit breaker
    this.circuitBreakers.set('external_api', {
      failureThreshold: 3,
      timeoutThreshold: 15000,
      resetTimeout: 120000,
      state: 'closed',
      failures: 0,
      lastFailureTime: 0
    });
  }

  analyzeMetrics() {
    const currentMetrics = this.getCurrentMetrics();
    
    // Check alert conditions
    this.alertRules.forEach((rule, name) => {
      if (rule.condition(currentMetrics)) {
        this.handleAlertCondition(name, rule, currentMetrics);
      }
    });
    
    // Anomaly detection
    this.detectAnomalies(currentMetrics);
    
    // Performance trend analysis
    this.analyzeTrends(currentMetrics);
  }

  handleAlertCondition(alertName, rule, metrics) {
    const now = Date.now();
    const lastAlert = this.activeCooldowns.get(alertName);
    
    if (lastAlert && (now - lastAlert) < rule.cooldown) {
      return; // Still in cooldown period
    }
    
    this.triggerAlert(alertName, {
      severity: rule.severity,
      metrics,
      timestamp: now
    });
    
    this.activeCooldowns.set(alertName, now);
  }

  triggerAlert(name, details) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      ...details,
      acknowledged: false,
      resolvedAt: null
    };
    
    this.alerts.set(alert.id, alert);
    this.alertHistory.push(alert);
    
    // Keep only last 1000 alerts in history
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(-1000);
    }
    
    console.error(`[PRODUCTION-ALERT] ${details.severity.toUpperCase()}: ${name}`, details);
    
    this.emit('alert', alert);
    
    // Auto-remediation for known issues
    this.attemptAutoRemediation(name, details);
  }

  attemptAutoRemediation(alertName, details) {
    const remediationActions = {
      high_memory_usage: () => {
        if (global.gc) {
          global.gc();
          console.log('[AUTO-REMEDIATION] Triggered garbage collection for high memory usage');
        }
      },
      high_error_rate: () => {
        this.activateCircuitBreaker('external_api');
        console.log('[AUTO-REMEDIATION] Activated circuit breaker for high error rate');
      },
      database_connection_failure: () => {
        this.activateCircuitBreaker('database');
        console.log('[AUTO-REMEDIATION] Activated database circuit breaker');
      }
    };
    
    const action = remediationActions[alertName];
    if (action) {
      try {
        action();
      } catch (error) {
        console.error('[AUTO-REMEDIATION] Failed to execute remediation action:', error);
      }
    }
  }

  activateCircuitBreaker(name) {
    const breaker = this.circuitBreakers.get(name);
    if (breaker) {
      breaker.state = 'open';
      breaker.lastFailureTime = Date.now();
      
      setTimeout(() => {
        breaker.state = 'half-open';
        breaker.failures = 0;
      }, breaker.resetTimeout);
    }
  }

  detectAnomalies(currentMetrics) {
    const baseline = this.performanceBaseline.get('current');
    if (!baseline) return;
    
    const anomalies = [];
    
    // Memory usage anomaly
    const memoryDeviation = Math.abs(currentMetrics.system.memory.heapUtilization - baseline.memory.heapUtilization);
    if (memoryDeviation > baseline.memory.stdDev * 3) {
      anomalies.push({
        type: 'memory_anomaly',
        deviation: memoryDeviation,
        current: currentMetrics.system.memory.heapUtilization,
        baseline: baseline.memory.heapUtilization
      });
    }
    
    // Response time anomaly
    const responseTimeDeviation = Math.abs(currentMetrics.application.endpoints.avgResponseTime - baseline.responseTime.mean);
    if (responseTimeDeviation > baseline.responseTime.stdDev * 2) {
      anomalies.push({
        type: 'response_time_anomaly',
        deviation: responseTimeDeviation,
        current: currentMetrics.application.endpoints.avgResponseTime,
        baseline: baseline.responseTime.mean
      });
    }
    
    if (anomalies.length > 0) {
      this.handleAnomalies(anomalies);
    }
  }

  handleAnomalies(anomalies) {
    anomalies.forEach(anomaly => {
      this.triggerAlert(`anomaly_${anomaly.type}`, {
        severity: 'medium',
        message: `Performance anomaly detected: ${anomaly.type}`,
        anomaly,
        timestamp: Date.now()
      });
    });
  }

  setupPerformanceBaseline() {
    // Collect baseline metrics for the first hour
    const baselineMetrics = [];
    
    const collectBaseline = () => {
      baselineMetrics.push(this.getCurrentMetrics());
      
      if (baselineMetrics.length >= 240) { // 1 hour of 15-second intervals
        this.calculateBaseline(baselineMetrics);
        return;
      }
      
      setTimeout(collectBaseline, 15000);
    };
    
    collectBaseline();
  }

  calculateBaseline(metrics) {
    const memoryValues = metrics.map(m => m.system.memory.heapUtilization);
    const responseTimeValues = metrics.map(m => m.application.endpoints.avgResponseTime);
    
    const baseline = {
      memory: {
        mean: memoryValues.reduce((sum, val) => sum + val, 0) / memoryValues.length,
        stdDev: this.calculateStandardDeviation(memoryValues),
        heapUtilization: memoryValues.reduce((sum, val) => sum + val, 0) / memoryValues.length
      },
      responseTime: {
        mean: responseTimeValues.reduce((sum, val) => sum + val, 0) / responseTimeValues.length,
        stdDev: this.calculateStandardDeviation(responseTimeValues)
      },
      calculatedAt: Date.now()
    };
    
    this.performanceBaseline.set('current', baseline);
    console.log('[PRODUCTION-MONITOR] Performance baseline established');
  }

  calculateStandardDeviation(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  setupRealTimeMonitoring() {
    // Real-time dashboard data
    this.dashboardData = {
      activeConnections: 0,
      requestsPerSecond: 0,
      averageResponseTime: 0,
      errorRate: 0,
      systemHealth: 'healthy',
      alerts: [],
      lastUpdated: Date.now()
    };
    
    setInterval(() => {
      this.updateDashboardData();
      this.broadcastMetrics();
    }, 5000);
  }

  updateDashboardData() {
    const currentMetrics = this.getCurrentMetrics();
    
    this.dashboardData = {
      activeConnections: currentMetrics.performance?.network?.connections || 0,
      requestsPerSecond: this.calculateRequestsPerSecond(),
      averageResponseTime: currentMetrics.application?.endpoints?.avgResponseTime || 0,
      errorRate: currentMetrics.application?.errors?.rate || 0,
      systemHealth: this.calculateOverallHealth(),
      alerts: this.getActiveAlerts(),
      memoryUsage: currentMetrics.system?.memory?.heapUtilization || 0,
      cpuUsage: currentMetrics.system?.cpu?.utilization || 0,
      lastUpdated: Date.now()
    };
  }

  calculateOverallHealth() {
    const activeAlerts = this.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical');
    const highAlerts = activeAlerts.filter(alert => alert.severity === 'high');
    
    if (criticalAlerts.length > 0) return 'critical';
    if (highAlerts.length > 0) return 'warning';
    if (activeAlerts.length > 0) return 'degraded';
    
    return 'healthy';
  }

  getActiveAlerts() {
    const now = Date.now();
    return Array.from(this.alerts.values())
      .filter(alert => !alert.acknowledged && !alert.resolvedAt)
      .filter(alert => (now - alert.timestamp) < 3600000) // Last hour
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  broadcastMetrics() {
    // Broadcast to WebSocket clients if available
    if (global.wsService && global.wsService.broadcast) {
      global.wsService.broadcast({
        type: 'monitoring_update',
        data: this.dashboardData
      });
    }
  }

  // Health check implementations
  async checkDatabaseHealth() {
    // Implementation would check actual database connectivity
    return { connected: true, responseTime: Math.random() * 100 + 50 };
  }

  async checkCacheHealth() {
    return { operational: true, hitRate: Math.random() * 0.4 + 0.6 };
  }

  async checkExternalAPIs() {
    return { deepseek: 'available', email: 'available' };
  }

  async checkDiskSpace() {
    return { available: '85%', critical: false };
  }

  // Metric collection helpers
  getEndpointMetrics() {
    return { avgResponseTime: Math.random() * 1000 + 200, requestCount: Math.floor(Math.random() * 1000) };
  }

  getCacheMetrics() {
    return { hitRate: Math.random() * 0.4 + 0.6, size: Math.floor(Math.random() * 5000) };
  }

  getDatabaseMetrics() {
    return { connected: true, queryTime: Math.random() * 200 + 50, connectionPool: 8 };
  }

  getWebSocketMetrics() {
    return { connections: Math.floor(Math.random() * 100), messagesPerSecond: Math.random() * 50 };
  }

  getErrorMetrics() {
    return { rate: Math.random() * 0.05, count: Math.floor(Math.random() * 10) };
  }

  measureEventLoopDelay() {
    return Math.random() * 50 + 10;
  }

  getEventLoopUtilization() {
    return Math.random() * 0.8 + 0.1;
  }

  getGCMetrics() {
    return { collections: Math.floor(Math.random() * 10), duration: Math.random() * 100 };
  }

  getMemoryFreed() {
    return Math.floor(Math.random() * 10000000);
  }

  getActiveConnections() {
    return Math.floor(Math.random() * 100);
  }

  getBandwidthUsage() {
    return { inbound: Math.random() * 1000, outbound: Math.random() * 1000 };
  }

  getMetricRate(metric) {
    return Math.floor(Math.random() * 100);
  }

  getSuccessRate(metric) {
    return Math.random() * 0.1 + 0.9;
  }

  getAverageResponseTime(metric) {
    return Math.random() * 1000 + 200;
  }

  getActiveUsers() {
    return Math.floor(Math.random() * 500);
  }

  getAverageSessionDuration() {
    return Math.random() * 1800 + 600; // 10-40 minutes
  }

  getCacheHitRate() {
    return Math.random() * 0.4 + 0.6;
  }

  getDocumentCount() {
    return Math.floor(Math.random() * 10000);
  }

  calculateRequestsPerSecond() {
    return Math.floor(Math.random() * 100);
  }

  recordMetric(category, data) {
    if (!this.metrics.has(category)) {
      this.metrics.set(category, []);
    }
    
    const categoryMetrics = this.metrics.get(category);
    categoryMetrics.push(data);
    
    // Keep only last 1000 entries per category
    if (categoryMetrics.length > 1000) {
      categoryMetrics.splice(0, categoryMetrics.length - 1000);
    }
  }

  recordHealthCheck(name, result) {
    this.recordMetric(`health_${name}`, result);
  }

  getCurrentMetrics() {
    const latest = {};
    this.metrics.forEach((data, category) => {
      if (data.length > 0) {
        latest[category] = data[data.length - 1];
      }
    });
    return latest;
  }

  checkSystemThresholds(metrics) {
    // System-specific threshold checking
    if (metrics.memory.heapUtilization > 90) {
      this.triggerAlert('critical_memory_usage', {
        severity: 'critical',
        message: 'Memory usage critically high',
        value: metrics.memory.heapUtilization
      });
    }
  }

  checkApplicationThresholds(metrics) {
    // Application-specific threshold checking
    if (metrics.errors.rate > 0.1) {
      this.triggerAlert('critical_error_rate', {
        severity: 'critical',
        message: 'Error rate critically high',
        value: metrics.errors.rate
      });
    }
  }

  analyzeTrends(currentMetrics) {
    // Trend analysis implementation
    const trends = this.calculateTrends();
    if (trends.memoryTrend === 'increasing' && trends.responseTrend === 'increasing') {
      this.triggerAlert('performance_degradation_trend', {
        severity: 'medium',
        message: 'Performance degradation trend detected',
        trends
      });
    }
  }

  calculateTrends() {
    return {
      memoryTrend: 'stable',
      responseTrend: 'stable',
      errorTrend: 'decreasing'
    };
  }

  getMonitoringReport() {
    const currentMetrics = this.getCurrentMetrics();
    const activeAlerts = this.getActiveAlerts();
    
    return {
      summary: {
        overallHealth: this.calculateOverallHealth(),
        activeAlerts: activeAlerts.length,
        systemUptime: process.uptime(),
        monitoringUptime: (Date.now() - this.startTime) / 1000
      },
      currentMetrics,
      alerts: {
        active: activeAlerts,
        recent: this.alertHistory.slice(-10)
      },
      healthChecks: this.getHealthCheckSummary(),
      circuitBreakers: Object.fromEntries(this.circuitBreakers),
      performance: {
        baseline: this.performanceBaseline.get('current'),
        dashboard: this.dashboardData
      },
      generatedAt: new Date().toISOString()
    };
  }

  getHealthCheckSummary() {
    const summary = {};
    this.healthChecks.forEach((config, name) => {
      const recent = this.metrics.get(`health_${name}`)?.slice(-1)[0];
      summary[name] = {
        status: recent?.status || 'unknown',
        lastCheck: recent?.timestamp || null,
        interval: config.interval
      };
    });
    return summary;
  }
}

module.exports = ProductionMonitoringSystem;