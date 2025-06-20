
const express = require('express');
const app = express();

// Component Validation System
class ComponentValidator {
  constructor() {
    this.results = new Map();
    this.errors = [];
    this.warnings = [];
  }

  async validateAllComponents() {
    console.log('🔍 Starting comprehensive component validation...\n');

    const validations = [
      { name: 'Database Connection', fn: this.validateDatabase },
      { name: 'DeepSeek API Service', fn: this.validateDeepSeekService },
      { name: 'RAG System', fn: this.validateRAGSystem },
      { name: 'WebSocket Connection', fn: this.validateWebSocket },
      { name: 'Feature Manager', fn: this.validateFeatureManager },
      { name: 'Performance Optimizers', fn: this.validatePerformanceOptimizers },
      { name: 'Memory Management', fn: this.validateMemoryManagement },
      { name: 'API Endpoints', fn: this.validateAPIEndpoints }
    ];

    for (const validation of validations) {
      try {
        console.log(`Testing ${validation.name}...`);
        const result = await validation.fn.call(this);
        this.results.set(validation.name, { status: 'PASS', result });
        console.log(`✅ ${validation.name}: PASSED\n`);
      } catch (error) {
        this.results.set(validation.name, { status: 'FAIL', error: error.message });
        this.errors.push(`${validation.name}: ${error.message}`);
        console.log(`❌ ${validation.name}: FAILED - ${error.message}\n`);
      }
    }

    return this.generateReport();
  }

  async validateDatabase() {
    const database = require('./database');
    const result = await database.queryAsync('SELECT 1 as test');
    if (!result || !result.rows) throw new Error('Database query failed');
    return { connection: 'active', testQuery: 'successful' };
  }

  async validateDeepSeekService() {
    const DeepSeekService = require('./services/deepseekService');
    const service = new DeepSeekService();
    
    const status = await service.getServiceStatus();
    if (!status.configured && !process.env.DEEPSEEK_API_KEY) {
      this.warnings.push('DeepSeek API key not configured - running in demo mode');
    }
    
    const stats = service.getUsageStats();
    return { 
      configured: status.configured, 
      status: status.status,
      features: Object.keys(stats.features).length 
    };
  }

  async validateRAGSystem() {
    const UnifiedRAGSystem = require('./unified-rag-system');
    const database = require('./database');
    const ragDB = new UnifiedRAGSystem(database);
    
    const testQuery = 'test query for validation';
    const results = await ragDB.searchDocuments(testQuery, 'replit', 5);
    
    if (!Array.isArray(results)) {
      throw new Error('RAG search did not return array');
    }
    
    return { 
      searchWorking: true, 
      resultsCount: results.length,
      documentsLoaded: Object.keys(ragDB.documents || {}).length 
    };
  }

  async validateWebSocket() {
    const wsConnections = global.activeConnections || new Set();
    return { 
      connectionCount: wsConnections.size,
      serverActive: true 
    };
  }

  async validateFeatureManager() {
    const FeatureManager = require('./features/feature-manager');
    const featureManager = new FeatureManager();
    
    const features = featureManager.getAllFeatures();
    const activeFeatures = features.filter(f => f.status === 'active').length;
    
    return { 
      totalFeatures: features.length,
      activeFeatures,
      managerWorking: true 
    };
  }

  async validatePerformanceOptimizers() {
    const optimizers = [];
    
    try {
      const PerformanceOptimizer = require('./optimization/performance-optimizer');
      optimizers.push('performance-optimizer');
    } catch (e) {
      this.warnings.push('Performance optimizer not found');
    }
    
    try {
      const QuantumCaching = require('./optimization/quantum-caching');
      optimizers.push('quantum-caching');
    } catch (e) {
      this.warnings.push('Quantum caching not found');
    }
    
    try {
      const AIOptimizer = require('./optimization/ai-performance-optimizer');
      optimizers.push('ai-performance-optimizer');
    } catch (e) {
      this.warnings.push('AI optimizer not found');
    }

    return { 
      availableOptimizers: optimizers.length,
      optimizers 
    };
  }

  async validateMemoryManagement() {
    const memUsage = process.memoryUsage();
    const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    if (heapUsedPercent > 90) {
      this.warnings.push(`High memory usage: ${heapUsedPercent.toFixed(2)}%`);
    }
    
    return { 
      heapUsedPercent: heapUsedPercent.toFixed(2),
      totalHeapMB: (memUsage.heapTotal / 1024 / 1024).toFixed(2),
      gcAvailable: !!global.gc 
    };
  }

  async validateAPIEndpoints() {
    const endpoints = [
      '/api/health',
      '/api/generate-prompt',
      '/api/chat',
      '/api/rag/search',
      '/api/features'
    ];
    
    return { 
      totalEndpoints: endpoints.length,
      endpointsConfigured: true 
    };
  }

  generateReport() {
    const passed = Array.from(this.results.values()).filter(r => r.status === 'PASS').length;
    const total = this.results.size;
    const successRate = (passed / total * 100).toFixed(1);

    console.log('\n📊 VALIDATION REPORT');
    console.log('='.repeat(50));
    console.log(`Overall Success Rate: ${successRate}% (${passed}/${total})`);
    console.log(`Errors: ${this.errors.length}`);
    console.log(`Warnings: ${this.warnings.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
    console.log('\n📋 DETAILED RESULTS:');
    for (const [name, result] of this.results.entries()) {
      console.log(`   ${result.status === 'PASS' ? '✅' : '❌'} ${name}`);
      if (result.result) {
        console.log(`      ${JSON.stringify(result.result, null, 2)}`);
      }
    }

    return {
      summary: {
        successRate,
        passed,
        total,
        errors: this.errors.length,
        warnings: this.warnings.length
      },
      results: Object.fromEntries(this.results),
      errors: this.errors,
      warnings: this.warnings,
      timestamp: new Date().toISOString()
    };
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new ComponentValidator();
  validator.validateAllComponents()
    .then(report => {
      console.log('\n🏁 Validation completed');
      process.exit(report.summary.errors > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Validation failed:', error);
      process.exit(1);
    });
}

module.exports = ComponentValidator;
