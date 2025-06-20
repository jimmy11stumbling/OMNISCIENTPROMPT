/**
 * Utility Helper Functions
 * Common utility functions used across the application
 */

const crypto = require('crypto');

class UtilityHelpers {
  /**
   * Generate unique ID
   */
  static generateId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
  }

  /**
   * Generate secure random string
   */
  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Deep clone object
   */
  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => UtilityHelpers.deepClone(item));
    
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = UtilityHelpers.deepClone(obj[key]);
      }
    }
    return cloned;
  }

  /**
   * Debounce function
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle function
   */
  static throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Format bytes to human readable
   */
  static formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Format duration in milliseconds to human readable
   */
  static formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    if (seconds > 0) return `${seconds}s`;
    return `${ms}ms`;
  }

  /**
   * Validate email format
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL format
   */
  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sanitize filename
   */
  static sanitizeFilename(filename) {
    return filename
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_{2,}/g, '_')
      .trim();
  }

  /**
   * Get file extension
   */
  static getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  }

  /**
   * Check if string is JSON
   */
  static isJsonString(str) {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Safe JSON parse
   */
  static safeJsonParse(str, defaultValue = null) {
    try {
      return JSON.parse(str);
    } catch {
      return defaultValue;
    }
  }

  /**
   * Truncate string with ellipsis
   */
  static truncateString(str, maxLength, suffix = '...') {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - suffix.length) + suffix;
  }

  /**
   * Convert string to slug
   */
  static slugify(str) {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Capitalize first letter
   */
  static capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * Convert camelCase to snake_case
   */
  static camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * Convert snake_case to camelCase
   */
  static snakeToCamel(str) {
    return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
  }

  /**
   * Generate random integer between min and max
   */
  static randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generate random string
   */
  static randomString(length, charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }

  /**
   * Check if object is empty
   */
  static isEmpty(obj) {
    if (obj == null) return true;
    if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
    return Object.keys(obj).length === 0;
  }

  /**
   * Merge objects deeply
   */
  static deepMerge(target, source) {
    const output = Object.assign({}, target);
    
    if (UtilityHelpers.isObject(target) && UtilityHelpers.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (UtilityHelpers.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = UtilityHelpers.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    
    return output;
  }

  /**
   * Check if value is object
   */
  static isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  /**
   * Get nested property safely
   */
  static getNestedProperty(obj, path, defaultValue = undefined) {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result == null || typeof result !== 'object') {
        return defaultValue;
      }
      result = result[key];
    }
    
    return result !== undefined ? result : defaultValue;
  }

  /**
   * Set nested property
   */
  static setNestedProperty(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = obj;
    
    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[lastKey] = value;
  }

  /**
   * Retry function with exponential backoff
   */
  static async retry(fn, options = {}) {
    const {
      retries = 3,
      delay = 1000,
      factor = 2,
      maxDelay = 10000
    } = options;

    let lastError;
    
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (i === retries) break;
        
        const waitTime = Math.min(delay * Math.pow(factor, i), maxDelay);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    throw lastError;
  }

  /**
   * Create delay/sleep function
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = UtilityHelpers;