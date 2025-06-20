/**
 * Rate Limiting Middleware
 * Production-ready rate limiting with memory-efficient cleanup
 */

const config = require('../config/environment');

class RateLimitManager {
  constructor() {
    this.store = new Map();
    this.cleanupInterval = null;
    this.initCleanup();
  }

  initCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  cleanup() {
    const now = Date.now();
    const cleanupThreshold = 15 * 60 * 1000;

    for (const [clientId, data] of this.store.entries()) {
      const validRequests = data.requests.filter(
        timestamp => timestamp > (now - cleanupThreshold)
      );
      
      if (validRequests.length === 0) {
        this.store.delete(clientId);
      } else {
        this.store.set(clientId, {
          ...data,
          requests: validRequests
        });
      }
    }
  }

  getRateLimit(options = {}) {
    const {
      windowMs = config.RATE_LIMITS.DEFAULT.windowMs,
      maxRequests = config.RATE_LIMITS.DEFAULT.maxRequests,
      keyGenerator = (req) => req.ip || req.connection.remoteAddress,
      skipSuccessfulRequests = false,
      skipFailedRequests = false
    } = options;

    return (req, res, next) => {
      const clientId = keyGenerator(req);
      const now = Date.now();
      const windowStart = now - windowMs;

      if (!this.store.has(clientId)) {
        this.store.set(clientId, {
          requests: [],
          firstRequest: now
        });
      }

      const clientData = this.store.get(clientId);
      const validRequests = clientData.requests.filter(
        request => request.timestamp > windowStart
      );

      if (validRequests.length >= maxRequests) {
        const oldestRequest = validRequests[0];
        const resetTime = oldestRequest.timestamp + windowMs;
        
        res.status(429).json({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((resetTime - now) / 1000),
          limit: maxRequests,
          windowMs: windowMs
        });
        return;
      }

      const currentRequest = {
        timestamp: now,
        method: req.method,
        url: req.originalUrl
      };

      validRequests.push(currentRequest);
      
      this.store.set(clientId, {
        ...clientData,
        requests: validRequests
      });

      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - validRequests.length);
      res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));
      res.setHeader('X-RateLimit-Window', windowMs);

      const originalSend = res.send;
      res.send = function(data) {
        const statusCode = res.statusCode;
        const shouldSkip = (
          (skipSuccessfulRequests && statusCode < 400) ||
          (skipFailedRequests && statusCode >= 400)
        );

        if (shouldSkip) {
          const updatedRequests = validRequests.filter(
            req => req.timestamp !== currentRequest.timestamp
          );
          
          rateLimitManager.store.set(clientId, {
            ...clientData,
            requests: updatedRequests
          });
        }

        return originalSend.call(this, data);
      };

      next();
    };
  }

  createDefaultLimiter() {
    return this.getRateLimit(config.RATE_LIMITS.DEFAULT);
  }

  createPromptLimiter() {
    return this.getRateLimit({
      ...config.RATE_LIMITS.PROMPT_GENERATION,
      keyGenerator: (req) => {
        return req.user?.id || req.ip || req.connection.remoteAddress;
      }
    });
  }

  createChatLimiter() {
    return this.getRateLimit({
      ...config.RATE_LIMITS.CHAT,
      keyGenerator: (req) => {
        return req.user?.id || req.ip || req.connection.remoteAddress;
      }
    });
  }

  createAuthLimiter() {
    return this.getRateLimit({
      ...config.RATE_LIMITS.AUTH,
      keyGenerator: (req) => req.ip || req.connection.remoteAddress,
      skipSuccessfulRequests: true
    });
  }

  getStatus(clientId) {
    const clientData = this.store.get(clientId);
    if (!clientData) {
      return {
        requests: 0,
        remaining: config.RATE_LIMITS.DEFAULT.maxRequests,
        resetTime: Date.now() + config.RATE_LIMITS.DEFAULT.windowMs
      };
    }

    const now = Date.now();
    const windowStart = now - config.RATE_LIMITS.DEFAULT.windowMs;
    const validRequests = clientData.requests.filter(
      req => req.timestamp > windowStart
    );

    return {
      requests: validRequests.length,
      remaining: Math.max(0, config.RATE_LIMITS.DEFAULT.maxRequests - validRequests.length),
      resetTime: validRequests.length > 0 ? 
        validRequests[0].timestamp + config.RATE_LIMITS.DEFAULT.windowMs : 
        now + config.RATE_LIMITS.DEFAULT.windowMs,
      firstRequest: clientData.firstRequest
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

const rateLimitManager = new RateLimitManager();

module.exports = {
  rateLimitManager,
  defaultLimiter: rateLimitManager.createDefaultLimiter(),
  promptLimiter: rateLimitManager.createPromptLimiter(),
  chatLimiter: rateLimitManager.createChatLimiter(),
  authLimiter: rateLimitManager.createAuthLimiter(),
  createCustomLimiter: (options) => rateLimitManager.getRateLimit(options),
  getRateLimitStatus: (clientId) => rateLimitManager.getStatus(clientId)
};