// Unified Feature Management System - Consolidates all application features
class FeatureManager {
  constructor() {
    this.features = new Map();
    this.activeFeatures = new Set();
    this.featureMetrics = new Map();
    this.dependencies = new Map();
    
    this.initializeFeatures();
  }

  initializeFeatures() {
    // Core Features
    this.registerFeature('authentication', {
      name: 'User Authentication',
      description: 'JWT-based authentication with session management',
      version: '2.0.0',
      status: 'active',
      endpoints: ['/api/auth/login', '/api/auth/register', '/api/auth/logout'],
      dependencies: ['database', 'security'],
      metrics: { requests: 0, errors: 0, lastUsed: null }
    });

    this.registerFeature('prompt-generation', {
      name: 'AI Prompt Generation',
      description: 'DeepSeek AI-powered prompt generation with RAG enhancement',
      version: '3.0.0',
      status: 'active',
      endpoints: ['/api/generate-prompt', '/api/prompts'],
      dependencies: ['rag-system', 'deepseek-api'],
      metrics: { requests: 0, errors: 0, lastUsed: null }
    });

    this.registerFeature('rag-system', {
      name: 'Unified RAG 2.0',
      description: 'Advanced retrieval-augmented generation with multi-platform support',
      version: '2.0.0',
      status: 'active',
      endpoints: ['/api/search', '/api/documents'],
      dependencies: ['database'],
      metrics: { requests: 0, errors: 0, lastUsed: null }
    });

    this.registerFeature('real-time', {
      name: 'Real-time Communications',
      description: 'WebSocket-based real-time features and validation',
      version: '1.5.0',
      status: 'active',
      endpoints: ['/ws'],
      dependencies: ['websocket-service'],
      metrics: { connections: 0, messages: 0, lastActivity: null }
    });

    this.registerFeature('analytics', {
      name: 'Advanced Analytics',
      description: 'Comprehensive usage analytics and monitoring',
      version: '1.0.0',
      status: 'active',
      endpoints: ['/api/analytics', '/api/admin/analytics'],
      dependencies: ['database', 'logging'],
      metrics: { queries: 0, dataPoints: 0, lastUpdate: null }
    });

    this.registerFeature('file-management', {
      name: 'Document Management',
      description: 'File upload, processing, and storage system',
      version: '1.2.0',
      status: 'active',
      endpoints: ['/api/upload', '/api/documents/upload'],
      dependencies: ['storage', 'security'],
      metrics: { uploads: 0, storage: 0, lastUpload: null }
    });

    this.registerFeature('security', {
      name: 'Security Layer',
      description: 'Input validation, rate limiting, and protection',
      version: '2.1.0',
      status: 'active',
      endpoints: ['*'],
      dependencies: ['logging'],
      metrics: { requests: 0, blocked: 0, threats: 0 }
    });

    this.registerFeature('a2a-protocol', {
      name: 'Agent-to-Agent Protocol',
      description: 'Advanced agent communication and coordination',
      version: '1.0.0',
      status: 'active',
      endpoints: ['/api/a2a'],
      dependencies: ['real-time', 'authentication'],
      metrics: { agents: 0, communications: 0, lastSync: null }
    });

    this.registerFeature('mcp-integration', {
      name: 'Model Context Protocol',
      description: 'Context sharing and model integration protocol',
      version: '1.0.0',
      status: 'active',
      endpoints: ['/api/mcp'],
      dependencies: ['rag-system'],
      metrics: { contexts: 0, integrations: 0, lastUpdate: null }
    });

    console.log(`[FEATURE-MANAGER] Initialized ${this.features.size} features`);
  }

  registerFeature(id, feature) {
    this.features.set(id, {
      id,
      ...feature,
      registeredAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    });

    if (feature.status === 'active') {
      this.activeFeatures.add(id);
    }

    this.featureMetrics.set(id, feature.metrics || {});
    
    if (feature.dependencies) {
      this.dependencies.set(id, feature.dependencies);
    }
  }

  getFeature(id) {
    return this.features.get(id);
  }

  getAllFeatures() {
    return Array.from(this.features.values());
  }

  getActiveFeatures() {
    return Array.from(this.activeFeatures).map(id => this.features.get(id));
  }

  isFeatureActive(id) {
    return this.activeFeatures.has(id);
  }

  activateFeature(id) {
    if (this.features.has(id)) {
      this.activeFeatures.add(id);
      const feature = this.features.get(id);
      feature.status = 'active';
      feature.lastModified = new Date().toISOString();
      console.log(`[FEATURE-MANAGER] Activated feature: ${id}`);
      return true;
    }
    return false;
  }

  deactivateFeature(id) {
    if (this.features.has(id)) {
      this.activeFeatures.delete(id);
      const feature = this.features.get(id);
      feature.status = 'inactive';
      feature.lastModified = new Date().toISOString();
      console.log(`[FEATURE-MANAGER] Deactivated feature: ${id}`);
      return true;
    }
    return false;
  }

  updateFeatureMetrics(id, metrics) {
    if (this.featureMetrics.has(id)) {
      const current = this.featureMetrics.get(id);
      this.featureMetrics.set(id, { ...current, ...metrics, lastUpdate: new Date().toISOString() });
      
      // Update feature last modified
      const feature = this.features.get(id);
      if (feature) {
        feature.lastModified = new Date().toISOString();
      }
    }
  }

  getFeatureMetrics(id) {
    return this.featureMetrics.get(id) || {};
  }

  getAllMetrics() {
    const metrics = {};
    for (const [id, data] of this.featureMetrics.entries()) {
      metrics[id] = data;
    }
    return metrics;
  }

  checkDependencies(id) {
    const deps = this.dependencies.get(id) || [];
    const missingDeps = [];
    
    for (const dep of deps) {
      if (!this.isFeatureActive(dep)) {
        missingDeps.push(dep);
      }
    }
    
    return { satisfied: missingDeps.length === 0, missing: missingDeps };
  }

  getFeaturesByEndpoint(endpoint) {
    const features = [];
    for (const feature of this.features.values()) {
      if (feature.endpoints && (
        feature.endpoints.includes(endpoint) || 
        feature.endpoints.includes('*') ||
        feature.endpoints.some(ep => endpoint.startsWith(ep.replace('*', '')))
      )) {
        features.push(feature);
      }
    }
    return features;
  }

  getSystemHealth() {
    const totalFeatures = this.features.size;
    const activeFeatures = this.activeFeatures.size;
    const healthScore = (activeFeatures / totalFeatures) * 100;
    
    const criticalFeatures = ['authentication', 'security', 'database'];
    const criticalActive = criticalFeatures.filter(id => this.isFeatureActive(id)).length;
    const criticalHealth = (criticalActive / criticalFeatures.length) * 100;
    
    return {
      overall: healthScore,
      critical: criticalHealth,
      totalFeatures,
      activeFeatures,
      status: healthScore >= 90 ? 'healthy' : healthScore >= 70 ? 'warning' : 'critical',
      timestamp: new Date().toISOString()
    };
  }

  generateFeatureReport() {
    const features = this.getAllFeatures();
    const metrics = this.getAllMetrics();
    const health = this.getSystemHealth();
    
    return {
      summary: {
        totalFeatures: features.length,
        activeFeatures: this.activeFeatures.size,
        health: health.overall,
        status: health.status
      },
      features: features.map(feature => ({
        ...feature,
        metrics: metrics[feature.id] || {},
        dependencies: this.checkDependencies(feature.id)
      })),
      systemHealth: health,
      generatedAt: new Date().toISOString()
    };
  }

  logFeatureUsage(id, endpoint = null, success = true) {
    if (this.featureMetrics.has(id)) {
      const metrics = this.featureMetrics.get(id);
      metrics.requests = (metrics.requests || 0) + 1;
      if (!success) {
        metrics.errors = (metrics.errors || 0) + 1;
      }
      metrics.lastUsed = new Date().toISOString();
      if (endpoint) {
        metrics.lastEndpoint = endpoint;
      }
      this.featureMetrics.set(id, metrics);
    }
  }

  validateFeatureIntegrity() {
    const issues = [];
    
    for (const [id, feature] of this.features.entries()) {
      // Check dependencies
      const depCheck = this.checkDependencies(id);
      if (!depCheck.satisfied && feature.status === 'active') {
        issues.push({
          type: 'dependency',
          feature: id,
          message: `Missing dependencies: ${depCheck.missing.join(', ')}`
        });
      }
      
      // Check if feature has required properties
      if (!feature.name || !feature.description || !feature.version) {
        issues.push({
          type: 'configuration',
          feature: id,
          message: 'Missing required properties (name, description, version)'
        });
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      checkedAt: new Date().toISOString()
    };
  }
}

module.exports = FeatureManager;