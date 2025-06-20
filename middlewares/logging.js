/**
 * Logging Middleware
 * Comprehensive request/response logging with performance metrics
 */

const config = require('../config/environment');
const database = require('../database');

class LoggingManager {
  constructor() {
    this.database = database;
  }

  // Request logging middleware
  requestLogger() {
    return (req, res, next) => {
      const startTime = Date.now();
      const requestId = require('uuid').v4();
      
      // Add request ID to req object
      req.requestId = requestId;
      
      // Log request start
      if (config.LOGGING.enableRequestLogging) {
        console.log(`[${requestId}] ${req.method} ${req.originalUrl} - Started`);
      }

      // Override res.send to capture response
      const originalSend = res.send;
      res.send = function(data) {
        const responseTime = Date.now() - startTime;
        
        // Log to database asynchronously
        setImmediate(async () => {
          try {
            await logManager.logApiUsage(req, res, responseTime, requestId);
          } catch (error) {
            console.error('Failed to log API usage:', error);
          }
        });

        // Log response
        if (config.LOGGING.enableRequestLogging) {
          console.log(`[${requestId}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${responseTime}ms)`);
        }

        return originalSend.call(this, data);
      };

      next();
    };
  }

  // Log API usage to database
  async logApiUsage(req, res, responseTime, requestId) {
    try {
      const userId = req.user ? req.user.id : null;
      const userAgent = req.get('User-Agent') || '';
      const ip = req.ip || req.connection.remoteAddress || '';
      
      await this.database.queryAsync(`
        INSERT INTO api_usage_logs (
          user_id, endpoint, method, ip_address, user_agent, 
          response_status, response_time, error_message, request_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        req.originalUrl,
        req.method,
        ip,
        userAgent,
        res.statusCode,
        responseTime,
        res.statusCode >= 400 ? `HTTP ${res.statusCode}` : null,
        requestId
      ]);

      // Update user API quota if authenticated and relevant endpoint
      if (userId && this.isQuotaRelevantEndpoint(req.originalUrl)) {
        await this.updateApiQuota(userId);
      }
    } catch (error) {
      console.error('Database logging error:', error);
    }
  }

  // Check if endpoint should count against API quota
  isQuotaRelevantEndpoint(url) {
    const quotaEndpoints = [
      '/api/generate-prompt',
      '/api/chat',
      '/api/analyze',
      '/api/optimize'
    ];
    
    return quotaEndpoints.some(endpoint => url.includes(endpoint));
  }

  // Update user API quota
  async updateApiQuota(userId) {
    try {
      await this.database.queryAsync(
        'UPDATE users SET api_quota_used_today = api_quota_used_today + 1 WHERE id = ?',
        [userId]
      );
    } catch (error) {
      console.error('Failed to update API quota:', error);
    }
  }

  // Error logging middleware
  errorLogger() {
    return (err, req, res, next) => {
      const errorId = require('uuid').v4();
      const timestamp = new Date().toISOString();
      
      // Log error details
      console.error(`[ERROR-${errorId}] ${timestamp}:`, {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
        requestId: req.requestId
      });

      // Log to database if enabled
      if (config.LOGGING.enableErrorTracking) {
        setImmediate(async () => {
          try {
            await this.logError(err, req, errorId);
          } catch (logError) {
            console.error('Failed to log error to database:', logError);
          }
        });
      }

      // Don't expose internal errors in production
      if (config.NODE_ENV === 'production') {
        res.status(500).json({
          error: 'Internal server error',
          errorId: errorId
        });
      } else {
        res.status(500).json({
          error: err.message,
          errorId: errorId,
          stack: err.stack
        });
      }
    };
  }

  // Log error to database
  async logError(err, req, errorId) {
    try {
      await this.database.queryAsync(`
        INSERT INTO error_logs (
          error_id, message, stack_trace, endpoint, method, 
          ip_address, user_agent, user_id, request_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        errorId,
        err.message,
        err.stack,
        req.originalUrl,
        req.method,
        req.ip || '',
        req.get('User-Agent') || '',
        req.user?.id || null,
        req.requestId || null
      ]);
    } catch (dbError) {
      console.error('Database error logging failed:', dbError);
    }
  }

  // Performance monitoring middleware
  performanceMonitor() {
    return (req, res, next) => {
      const startTime = process.hrtime.bigint();
      const startMemory = process.memoryUsage();

      res.on('finish', () => {
        const endTime = process.hrtime.bigint();
        const endMemory = process.memoryUsage();
        
        const duration = Number(endTime - startTime) / 1000000; // Convert to ms
        const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;

        // Log performance metrics for slow requests
        if (duration > 1000) { // Log requests slower than 1 second
          console.warn(`[PERFORMANCE] Slow request detected:`, {
            url: req.originalUrl,
            method: req.method,
            duration: `${duration.toFixed(2)}ms`,
            memoryDelta: `${(memoryDelta / 1024 / 1024).toFixed(2)}MB`,
            statusCode: res.statusCode,
            requestId: req.requestId
          });
        }

        // Store performance metrics
        if (config.LOGGING.enableRequestLogging) {
          setImmediate(async () => {
            try {
              await this.logPerformanceMetrics(req, res, duration, memoryDelta);
            } catch (error) {
              console.error('Failed to log performance metrics:', error);
            }
          });
        }
      });

      next();
    };
  }

  // Log performance metrics
  async logPerformanceMetrics(req, res, duration, memoryDelta) {
    try {
      await this.database.queryAsync(`
        INSERT INTO performance_logs (
          endpoint, method, response_time, memory_delta, 
          status_code, user_id, request_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        req.originalUrl,
        req.method,
        Math.round(duration),
        Math.round(memoryDelta),
        res.statusCode,
        req.user?.id || null,
        req.requestId || null
      ]);
    } catch (error) {
      console.error('Performance logging error:', error);
    }
  }

  // Security event logging
  logSecurityEvent(type, details, req) {
    const securityId = require('uuid').v4();
    
    console.warn(`[SECURITY-${securityId}] ${type}:`, {
      ...details,
      timestamp: new Date().toISOString(),
      ip: req?.ip,
      userAgent: req?.get('User-Agent'),
      userId: req?.user?.id
    });

    // Log to database
    setImmediate(async () => {
      try {
        await this.database.queryAsync(`
          INSERT INTO security_logs (
            security_id, event_type, details, ip_address, 
            user_agent, user_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
          securityId,
          type,
          JSON.stringify(details),
          req?.ip || '',
          req?.get('User-Agent') || '',
          req?.user?.id || null
        ]);
      } catch (error) {
        console.error('Security logging error:', error);
      }
    });

    return securityId;
  }

  // Analytics data aggregation
  async getAnalytics(timeRange = '24h') {
    try {
      const timeCondition = this.getTimeCondition(timeRange);
      
      const [requests, errors, performance, topEndpoints] = await Promise.all([
        this.getRequestAnalytics(timeCondition),
        this.getErrorAnalytics(timeCondition),
        this.getPerformanceAnalytics(timeCondition),
        this.getTopEndpoints(timeCondition)
      ]);

      return {
        timeRange,
        requests,
        errors,
        performance,
        topEndpoints,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Analytics generation error:', error);
      throw error;
    }
  }

  getTimeCondition(timeRange) {
    switch (timeRange) {
      case '1h':
        return "created_at >= datetime('now', '-1 hour')";
      case '24h':
        return "created_at >= datetime('now', '-1 day')";
      case '7d':
        return "created_at >= datetime('now', '-7 days')";
      case '30d':
        return "created_at >= datetime('now', '-30 days')";
      default:
        return "created_at >= datetime('now', '-1 day')";
    }
  }

  async getRequestAnalytics(timeCondition) {
    const result = await this.database.queryAsync(`
      SELECT 
        COUNT(*) as total_requests,
        AVG(response_time) as avg_response_time,
        COUNT(CASE WHEN response_status >= 400 THEN 1 END) as error_count,
        COUNT(CASE WHEN response_status = 200 THEN 1 END) as success_count
      FROM api_usage_logs 
      WHERE ${timeCondition}
    `);

    return result.rows[0] || {};
  }

  async getErrorAnalytics(timeCondition) {
    const result = await this.database.queryAsync(`
      SELECT 
        COUNT(*) as total_errors,
        COUNT(DISTINCT user_id) as affected_users
      FROM error_logs 
      WHERE ${timeCondition}
    `);

    return result.rows[0] || {};
  }

  async getPerformanceAnalytics(timeCondition) {
    const result = await this.database.queryAsync(`
      SELECT 
        AVG(response_time) as avg_response_time,
        MAX(response_time) as max_response_time,
        COUNT(CASE WHEN response_time > 1000 THEN 1 END) as slow_requests
      FROM performance_logs 
      WHERE ${timeCondition}
    `);

    return result.rows[0] || {};
  }

  async getTopEndpoints(timeCondition) {
    const result = await this.database.queryAsync(`
      SELECT 
        endpoint,
        COUNT(*) as request_count,
        AVG(response_time) as avg_response_time
      FROM api_usage_logs 
      WHERE ${timeCondition}
      GROUP BY endpoint
      ORDER BY request_count DESC
      LIMIT 10
    `);

    return result.rows || [];
  }
}

// Create singleton instance
const logManager = new LoggingManager();

module.exports = {
  logManager,
  requestLogger: logManager.requestLogger(),
  errorLogger: logManager.errorLogger(),
  performanceMonitor: logManager.performanceMonitor(),
  logSecurityEvent: (type, details, req) => logManager.logSecurityEvent(type, details, req),
  getAnalytics: (timeRange) => logManager.getAnalytics(timeRange)
};