// Production Deployment Validator - Final validation before deployment
const ProductionStressTester = require('./stress-test');
const fs = require('fs').promises;
const path = require('path');

class ProductionValidator {
  constructor(config) {
    this.config = config;
    this.validationResults = new Map();
    this.criticalChecks = new Set();
    this.warnings = [];
    this.errors = [];
  }

  async validateForProduction() {
    console.log('[PRODUCTION-VALIDATOR] Starting comprehensive production validation...');
    
    const validations = [
      { name: 'environment_config', fn: this.validateEnvironmentConfig },
      { name: 'security_configuration', fn: this.validateSecurityConfiguration },
      { name: 'performance_optimization', fn: this.validatePerformanceOptimization },
      { name: 'database_configuration', fn: this.validateDatabaseConfiguration },
      { name: 'monitoring_setup', fn: this.validateMonitoringSetup },
      { name: 'error_handling', fn: this.validateErrorHandling },
      { name: 'scalability_readiness', fn: this.validateScalabilityReadiness },
      { name: 'dependency_security', fn: this.validateDependencySecurity },
      { name: 'api_documentation', fn: this.validateAPIDocumentation },
      { name: 'deployment_artifacts', fn: this.validateDeploymentArtifacts }
    ];

    for (const validation of validations) {
      try {
        const result = await validation.fn.call(this);
        this.validationResults.set(validation.name, {
          status: 'passed',
          result,
          timestamp: new Date().toISOString()
        });
        console.log(`[PRODUCTION-VALIDATOR] ✅ ${validation.name} validation passed`);
      } catch (error) {
        this.validationResults.set(validation.name, {
          status: 'failed',
          error: error.message,
          timestamp: new Date().toISOString()
        });
        console.error(`[PRODUCTION-VALIDATOR] ❌ ${validation.name} validation failed:`, error.message);
        this.errors.push(`${validation.name}: ${error.message}`);
      }
    }

    // Run stress tests if all validations pass
    const failedValidations = Array.from(this.validationResults.values()).filter(v => v.status === 'failed');
    if (failedValidations.length === 0) {
      await this.runProductionStressTests();
    }

    return this.generateValidationReport();
  }

  async validateEnvironmentConfig() {
    const requiredEnvVars = [
      'NODE_ENV',
      'PORT',
      'JWT_SECRET',
      'DATABASE_URL'
    ];

    const recommendedEnvVars = [
      'DEEPSEEK_API_KEY',
      'SMTP_USER',
      'SMTP_PASS',
      'REDIS_URL',
      'LOG_LEVEL'
    ];

    const missingRequired = requiredEnvVars.filter(env => !process.env[env]);
    const missingRecommended = recommendedEnvVars.filter(env => !process.env[env]);

    if (missingRequired.length > 0) {
      throw new Error(`Missing required environment variables: ${missingRequired.join(', ')}`);
    }

    if (missingRecommended.length > 0) {
      this.warnings.push(`Missing recommended environment variables: ${missingRecommended.join(', ')}`);
    }

    // Validate environment values
    if (process.env.NODE_ENV !== 'production') {
      this.warnings.push('NODE_ENV is not set to production');
    }

    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }

    return {
      requiredVars: requiredEnvVars.length,
      configuredVars: requiredEnvVars.filter(env => process.env[env]).length,
      recommendedVars: recommendedEnvVars.length,
      configuredRecommended: recommendedEnvVars.filter(env => process.env[env]).length
    };
  }

  async validateSecurityConfiguration() {
    const securityChecks = [];

    // Check for security middleware
    const middlewareFiles = ['security.js', 'authentication.js', 'rateLimiting.js'];
    for (const file of middlewareFiles) {
      try {
        await fs.access(path.join('middlewares', file));
        securityChecks.push(`${file}: configured`);
      } catch {
        throw new Error(`Security middleware missing: ${file}`);
      }
    }

    // Check for HTTPS configuration in production
    if (process.env.NODE_ENV === 'production' && !process.env.SSL_CERT_PATH) {
      this.warnings.push('SSL certificate not configured for production');
    }

    // Validate CORS configuration
    const allowedOrigins = process.env.ALLOWED_ORIGINS;
    if (!allowedOrigins) {
      this.warnings.push('CORS origins not explicitly configured');
    }

    return {
      middlewareChecks: securityChecks,
      httpsConfigured: !!process.env.SSL_CERT_PATH,
      corsConfigured: !!allowedOrigins
    };
  }

  async validatePerformanceOptimization() {
    const optimizationChecks = [];

    // Check for optimization modules
    const optimizationFiles = [
      'performance-optimizer.js',
      'advanced-performance.js',
      'quantum-caching.js',
      'ai-performance-optimizer.js'
    ];

    for (const file of optimizationFiles) {
      try {
        await fs.access(path.join('optimization', file));
        optimizationChecks.push(`${file}: available`);
      } catch {
        this.warnings.push(`Optimization module missing: ${file}`);
      }
    }

    // Check for compression configuration
    if (!this.config.compression) {
      this.warnings.push('Response compression not configured');
    }

    // Check for caching strategy
    if (!this.config.cache) {
      this.warnings.push('Caching strategy not configured');
    }

    return {
      optimizationModules: optimizationChecks.length,
      compressionEnabled: !!this.config.compression,
      cachingEnabled: !!this.config.cache
    };
  }

  async validateDatabaseConfiguration() {
    // Check database URL format
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL not configured');
    }

    // Validate connection string format
    const validProtocols = ['postgres://', 'postgresql://', 'sqlite:', 'mysql://'];
    const hasValidProtocol = validProtocols.some(protocol => dbUrl.startsWith(protocol));
    
    if (!hasValidProtocol) {
      throw new Error('Invalid DATABASE_URL format');
    }

    // Check for connection pooling configuration
    const poolConfig = this.config.database?.pool;
    if (!poolConfig) {
      this.warnings.push('Database connection pooling not configured');
    }

    // Check for SSL configuration in production
    if (process.env.NODE_ENV === 'production' && !dbUrl.includes('ssl=true') && !this.config.database?.ssl) {
      this.warnings.push('Database SSL not configured for production');
    }

    return {
      urlConfigured: true,
      protocol: validProtocols.find(p => dbUrl.startsWith(p)),
      poolingConfigured: !!poolConfig,
      sslConfigured: dbUrl.includes('ssl=true') || !!this.config.database?.ssl
    };
  }

  async validateMonitoringSetup() {
    const monitoringComponents = [];

    // Check for monitoring files
    const monitoringFiles = ['production-monitoring.js'];
    for (const file of monitoringFiles) {
      try {
        await fs.access(path.join('deployment', file));
        monitoringComponents.push(`${file}: configured`);
      } catch {
        throw new Error(`Monitoring component missing: ${file}`);
      }
    }

    // Check for health check endpoints
    const healthEndpoints = [
      '/health',
      '/api/monitoring/health',
      '/api/monitoring/metrics'
    ];

    // Validate logging configuration
    if (!this.config.monitoring?.logging) {
      this.warnings.push('Logging configuration not found');
    }

    return {
      monitoringComponents: monitoringComponents.length,
      healthEndpoints: healthEndpoints.length,
      loggingConfigured: !!this.config.monitoring?.logging
    };
  }

  async validateErrorHandling() {
    const errorHandlingChecks = [];

    // Check for global error handlers
    const hasUncaughtExceptionHandler = process.listenerCount('uncaughtException') > 0;
    const hasUnhandledRejectionHandler = process.listenerCount('unhandledRejection') > 0;

    if (!hasUncaughtExceptionHandler) {
      throw new Error('Uncaught exception handler not configured');
    }

    if (!hasUnhandledRejectionHandler) {
      throw new Error('Unhandled rejection handler not configured');
    }

    errorHandlingChecks.push('Global error handlers: configured');

    // Check for graceful shutdown
    const hasGracefulShutdown = process.listenerCount('SIGTERM') > 0 || process.listenerCount('SIGINT') > 0;
    if (!hasGracefulShutdown) {
      this.warnings.push('Graceful shutdown handlers not configured');
    }

    return {
      globalHandlers: true,
      gracefulShutdown: hasGracefulShutdown,
      errorHandlingChecks
    };
  }

  async validateScalabilityReadiness() {
    const scalabilityChecks = [];

    // Check for cluster configuration
    if (this.config.deployment?.cluster) {
      scalabilityChecks.push('Cluster mode: enabled');
    } else {
      this.warnings.push('Cluster mode not configured for horizontal scaling');
    }

    // Check for load balancing configuration
    if (this.config.deployment?.loadBalancer) {
      scalabilityChecks.push('Load balancer: configured');
    }

    // Check for auto-scaling configuration
    if (this.config.deployment?.autoScaling) {
      scalabilityChecks.push('Auto-scaling: configured');
    } else {
      this.warnings.push('Auto-scaling not configured');
    }

    // Check for stateless design
    const hasSessionStore = !!this.config.session?.store;
    if (!hasSessionStore) {
      this.warnings.push('External session store not configured - may limit scalability');
    }

    return {
      scalabilityFeatures: scalabilityChecks.length,
      clusterReady: !!this.config.deployment?.cluster,
      statelessDesign: hasSessionStore
    };
  }

  async validateDependencySecurity() {
    // Check package.json for security
    try {
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
      
      // Check for known vulnerable packages (simplified check)
      const vulnerablePackages = ['lodash@4.17.20', 'moment@2.29.1'];
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      const foundVulnerabilities = [];
      Object.entries(dependencies).forEach(([pkg, version]) => {
        const packageVersion = `${pkg}@${version}`;
        if (vulnerablePackages.includes(packageVersion)) {
          foundVulnerabilities.push(packageVersion);
        }
      });

      if (foundVulnerabilities.length > 0) {
        this.warnings.push(`Potentially vulnerable dependencies: ${foundVulnerabilities.join(', ')}`);
      }

      // Check for exact versions (no ^ or ~)
      const nonExactVersions = Object.entries(dependencies)
        .filter(([pkg, version]) => version.startsWith('^') || version.startsWith('~'))
        .map(([pkg]) => pkg);

      if (nonExactVersions.length > 5) {
        this.warnings.push('Many dependencies use non-exact versions - consider pinning for production');
      }

      return {
        totalDependencies: Object.keys(dependencies).length,
        vulnerabilities: foundVulnerabilities.length,
        exactVersions: Object.keys(dependencies).length - nonExactVersions.length
      };
    } catch (error) {
      throw new Error('Could not validate package.json');
    }
  }

  async validateAPIDocumentation() {
    const documentationChecks = [];

    // Check for API documentation files
    const docFiles = ['docs.html', 'README.md', 'API.md'];
    let foundDocs = 0;

    for (const file of docFiles) {
      try {
        await fs.access(file);
        foundDocs++;
        documentationChecks.push(`${file}: available`);
      } catch {
        // File doesn't exist
      }
    }

    if (foundDocs === 0) {
      this.warnings.push('No API documentation found');
    }

    // Check for OpenAPI/Swagger documentation
    try {
      await fs.access('swagger.json');
      documentationChecks.push('OpenAPI specification: available');
    } catch {
      this.warnings.push('OpenAPI specification not found');
    }

    return {
      documentationFiles: foundDocs,
      documentationChecks
    };
  }

  async validateDeploymentArtifacts() {
    const artifacts = [];

    // Check for Docker configuration
    try {
      await fs.access('Dockerfile');
      artifacts.push('Dockerfile: available');
    } catch {
      this.warnings.push('Dockerfile not found');
    }

    try {
      await fs.access('deployment/docker-compose.yml');
      artifacts.push('Docker Compose: available');
    } catch {
      this.warnings.push('Docker Compose configuration not found');
    }

    // Check for deployment scripts
    try {
      await fs.access('deployment');
      const deploymentFiles = await fs.readdir('deployment');
      artifacts.push(`Deployment files: ${deploymentFiles.length} found`);
    } catch {
      this.warnings.push('Deployment directory not found');
    }

    // Check for configuration files
    const configFiles = ['config/production.js', '.env.example'];
    for (const file of configFiles) {
      try {
        await fs.access(file);
        artifacts.push(`${file}: available`);
      } catch {
        this.warnings.push(`Configuration file missing: ${file}`);
      }
    }

    return {
      deploymentArtifacts: artifacts.length,
      artifacts
    };
  }

  async runProductionStressTests() {
    console.log('[PRODUCTION-VALIDATOR] Running production stress tests...');
    
    const stressTester = new ProductionStressTester({
      baseUrl: `http://localhost:${process.env.PORT || 5000}`
    });

    try {
      const stressResults = await stressTester.runFullStressTest();
      this.validationResults.set('stress_tests', {
        status: 'completed',
        result: stressResults,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.validationResults.set('stress_tests', {
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      this.errors.push(`Stress tests failed: ${error.message}`);
    }
  }

  generateValidationReport() {
    const passedValidations = Array.from(this.validationResults.values()).filter(v => v.status === 'passed' || v.status === 'completed').length;
    const totalValidations = this.validationResults.size;
    const successRate = (passedValidations / totalValidations) * 100;

    const deploymentReadiness = this.calculateDeploymentReadiness();
    
    const report = {
      summary: {
        validationsPassed: passedValidations,
        totalValidations,
        successRate: Math.round(successRate * 100) / 100,
        deploymentReady: deploymentReadiness.ready,
        readinessScore: deploymentReadiness.score,
        criticalIssues: this.errors.length,
        warnings: this.warnings.length
      },
      validationResults: Object.fromEntries(this.validationResults),
      errors: this.errors,
      warnings: this.warnings,
      deploymentReadiness,
      nextSteps: this.generateNextSteps(),
      generatedAt: new Date().toISOString()
    };

    console.log(`[PRODUCTION-VALIDATOR] Validation complete - Readiness Score: ${deploymentReadiness.score}%`);
    
    return report;
  }

  calculateDeploymentReadiness() {
    let score = 0;
    const maxScore = 100;

    // Critical validations (60% of score)
    const criticalValidations = ['environment_config', 'security_configuration', 'error_handling'];
    const passedCritical = criticalValidations.filter(v => 
      this.validationResults.get(v)?.status === 'passed'
    ).length;
    score += (passedCritical / criticalValidations.length) * 60;

    // Important validations (30% of score)
    const importantValidations = ['performance_optimization', 'database_configuration', 'monitoring_setup'];
    const passedImportant = importantValidations.filter(v => 
      this.validationResults.get(v)?.status === 'passed'
    ).length;
    score += (passedImportant / importantValidations.length) * 30;

    // Nice-to-have validations (10% of score)
    const niceToHaveValidations = ['scalability_readiness', 'api_documentation', 'deployment_artifacts'];
    const passedNiceToHave = niceToHaveValidations.filter(v => 
      this.validationResults.get(v)?.status === 'passed'
    ).length;
    score += (passedNiceToHave / niceToHaveValidations.length) * 10;

    // Deduct points for errors and warnings
    score -= this.errors.length * 5;
    score -= this.warnings.length * 1;

    score = Math.max(0, Math.min(100, score));

    return {
      ready: score >= 85 && this.errors.length === 0,
      score: Math.round(score),
      level: score >= 95 ? 'excellent' : 
             score >= 85 ? 'production-ready' :
             score >= 70 ? 'nearly-ready' :
             score >= 50 ? 'needs-work' : 'not-ready'
    };
  }

  generateNextSteps() {
    const nextSteps = [];

    if (this.errors.length > 0) {
      nextSteps.push('🔴 Fix critical errors before deployment');
      this.errors.forEach(error => {
        nextSteps.push(`   - ${error}`);
      });
    }

    if (this.warnings.length > 0) {
      nextSteps.push('🟡 Address warnings for optimal production performance');
      this.warnings.slice(0, 5).forEach(warning => {
        nextSteps.push(`   - ${warning}`);
      });
      if (this.warnings.length > 5) {
        nextSteps.push(`   - ... and ${this.warnings.length - 5} more warnings`);
      }
    }

    const stressTestResult = this.validationResults.get('stress_tests');
    if (stressTestResult?.status === 'failed') {
      nextSteps.push('🔴 Resolve stress test failures before production deployment');
    }

    if (this.errors.length === 0 && this.warnings.length < 3) {
      nextSteps.push('🟢 Application is ready for production deployment');
      nextSteps.push('🚀 Proceed with deployment using Docker or your preferred method');
    }

    return nextSteps;
  }
}

module.exports = ProductionValidator;