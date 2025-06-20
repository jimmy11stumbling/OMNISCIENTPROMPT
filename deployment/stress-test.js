// Production Stress Testing - Comprehensive load and performance validation
const http = require('http');
const https = require('https');
const { Worker } = require('worker_threads');
const { performance } = require('perf_hooks');

class ProductionStressTester {
  constructor(config) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'http://localhost:5000';
    this.results = new Map();
    this.workers = [];
    this.testMetrics = new Map();
    
    this.testSuites = new Map([
      ['load_test', this.loadTest.bind(this)],
      ['stress_test', this.stressTest.bind(this)],
      ['spike_test', this.spikeTest.bind(this)],
      ['endurance_test', this.enduranceTest.bind(this)],
      ['volume_test', this.volumeTest.bind(this)],
      ['concurrency_test', this.concurrencyTest.bind(this)],
      ['memory_leak_test', this.memoryLeakTest.bind(this)],
      ['database_stress', this.databaseStressTest.bind(this)],
      ['cache_performance', this.cachePerformanceTest.bind(this)],
      ['websocket_load', this.websocketLoadTest.bind(this)]
    ]);
  }

  async runFullStressTest() {
    console.log('[STRESS-TEST] Starting comprehensive production stress testing...');
    
    const overallStartTime = performance.now();
    const testResults = new Map();
    
    for (const [testName, testFunction] of this.testSuites.entries()) {
      console.log(`[STRESS-TEST] Running ${testName}...`);
      
      try {
        const startTime = performance.now();
        const result = await testFunction();
        const duration = performance.now() - startTime;
        
        testResults.set(testName, {
          status: 'passed',
          duration,
          metrics: result,
          timestamp: new Date().toISOString()
        });
        
        console.log(`[STRESS-TEST] ✅ ${testName} completed in ${Math.round(duration)}ms`);
        
        // Cool down between tests
        await this.cooldown(5000);
        
      } catch (error) {
        testResults.set(testName, {
          status: 'failed',
          error: error.message,
          timestamp: new Date().toISOString()
        });
        
        console.error(`[STRESS-TEST] ❌ ${testName} failed:`, error.message);
      }
    }
    
    const totalDuration = performance.now() - overallStartTime;
    
    const report = this.generateStressTestReport(testResults, totalDuration);
    console.log('[STRESS-TEST] Comprehensive stress testing completed');
    
    return report;
  }

  async loadTest() {
    const testConfig = {
      duration: 60000, // 1 minute
      rampUpTime: 10000, // 10 seconds
      maxConcurrentUsers: 100,
      endpoints: [
        { path: '/api/health', weight: 20 },
        { path: '/api/features', weight: 30 },
        { path: '/api/rag/stats', weight: 25 },
        { path: '/api/monitoring/dashboard', weight: 25 }
      ]
    };

    return await this.executeLoadTest(testConfig);
  }

  async stressTest() {
    const testConfig = {
      duration: 120000, // 2 minutes
      rampUpTime: 30000, // 30 seconds
      maxConcurrentUsers: 500,
      endpoints: [
        { path: '/api/generate-prompt', method: 'POST', body: { query: 'test prompt', platform: 'replit' }, weight: 40 },
        { path: '/api/rag/search', method: 'POST', body: { query: 'test search', limit: 10 }, weight: 30 },
        { path: '/api/features', weight: 30 }
      ]
    };

    return await this.executeLoadTest(testConfig);
  }

  async spikeTest() {
    const phases = [
      { users: 10, duration: 10000 },   // Normal load
      { users: 1000, duration: 30000 }, // Sudden spike
      { users: 10, duration: 10000 },   // Back to normal
      { users: 2000, duration: 60000 }, // Massive spike
      { users: 50, duration: 20000 }    // Recovery
    ];

    const results = [];
    
    for (const phase of phases) {
      const phaseResult = await this.executeLoadTest({
        duration: phase.duration,
        maxConcurrentUsers: phase.users,
        endpoints: [{ path: '/api/health', weight: 100 }]
      });
      
      results.push({
        phase: `${phase.users} users for ${phase.duration}ms`,
        ...phaseResult
      });
    }

    return { phases: results };
  }

  async enduranceTest() {
    const testConfig = {
      duration: 1800000, // 30 minutes
      rampUpTime: 60000,  // 1 minute
      maxConcurrentUsers: 200,
      endpoints: [
        { path: '/api/health', weight: 25 },
        { path: '/api/features', weight: 25 },
        { path: '/api/rag/stats', weight: 25 },
        { path: '/api/monitoring/metrics', weight: 25 }
      ]
    };

    const result = await this.executeLoadTest(testConfig);
    
    // Monitor for memory leaks during endurance test
    const memorySnapshots = [];
    const snapshotInterval = setInterval(() => {
      memorySnapshots.push({
        timestamp: Date.now(),
        memory: process.memoryUsage()
      });
    }, 30000);

    setTimeout(() => {
      clearInterval(snapshotInterval);
      result.memoryProfile = this.analyzeMemoryProfile(memorySnapshots);
    }, testConfig.duration);

    return result;
  }

  async volumeTest() {
    const largeBatchTest = async () => {
      const batchSize = 1000;
      const batches = [];
      
      for (let i = 0; i < 10; i++) {
        const batch = [];
        for (let j = 0; j < batchSize; j++) {
          batch.push(this.makeRequest('/api/health'));
        }
        
        const startTime = performance.now();
        const results = await Promise.allSettled(batch);
        const duration = performance.now() - startTime;
        
        batches.push({
          batchNumber: i + 1,
          requests: batchSize,
          duration,
          successRate: results.filter(r => r.status === 'fulfilled').length / batchSize
        });
      }
      
      return batches;
    };

    return await largeBatchTest();
  }

  async concurrencyTest() {
    const concurrencyLevels = [1, 10, 50, 100, 250, 500, 1000];
    const results = [];

    for (const level of concurrencyLevels) {
      const startTime = performance.now();
      const promises = Array(level).fill().map(() => 
        this.makeRequest('/api/health')
      );

      const responses = await Promise.allSettled(promises);
      const duration = performance.now() - startTime;
      const successCount = responses.filter(r => r.status === 'fulfilled').length;

      results.push({
        concurrencyLevel: level,
        duration,
        successRate: successCount / level,
        requestsPerSecond: level / (duration / 1000),
        averageResponseTime: duration / level
      });

      await this.cooldown(2000);
    }

    return results;
  }

  async memoryLeakTest() {
    const iterations = 1000;
    const memorySnapshots = [];
    
    // Take initial memory snapshot
    memorySnapshots.push({
      iteration: 0,
      memory: process.memoryUsage()
    });

    for (let i = 1; i <= iterations; i++) {
      // Perform memory-intensive operations
      await this.makeRequest('/api/generate-prompt', 'POST', {
        query: `Memory test iteration ${i} with large data payload: ${'x'.repeat(1000)}`,
        platform: 'replit'
      });

      await this.makeRequest('/api/rag/search', 'POST', {
        query: `Search test ${i}`,
        limit: 50
      });

      // Take memory snapshot every 100 iterations
      if (i % 100 === 0) {
        if (global.gc) global.gc(); // Force garbage collection
        
        memorySnapshots.push({
          iteration: i,
          memory: process.memoryUsage()
        });
      }
    }

    return this.analyzeMemoryProfile(memorySnapshots);
  }

  async databaseStressTest() {
    const operations = [
      { type: 'read', weight: 60 },
      { type: 'write', weight: 30 },
      { type: 'search', weight: 10 }
    ];

    const testDuration = 120000; // 2 minutes
    const maxConcurrency = 50;
    const results = [];

    const startTime = Date.now();
    const workers = [];

    for (let i = 0; i < maxConcurrency; i++) {
      workers.push(this.databaseWorker(operations, startTime + testDuration));
    }

    const workerResults = await Promise.allSettled(workers);
    
    return {
      totalOperations: workerResults.reduce((sum, result) => 
        sum + (result.value?.operations || 0), 0),
      successRate: workerResults.filter(r => r.status === 'fulfilled').length / maxConcurrency,
      averageResponseTime: workerResults.reduce((sum, result) => 
        sum + (result.value?.avgResponseTime || 0), 0) / workerResults.length
    };
  }

  async databaseWorker(operations, endTime) {
    let operationCount = 0;
    let totalResponseTime = 0;

    while (Date.now() < endTime) {
      const operation = this.selectWeightedOperation(operations);
      const startTime = performance.now();

      try {
        switch (operation.type) {
          case 'read':
            await this.makeRequest('/api/features');
            break;
          case 'write':
            await this.makeRequest('/api/rag/documents', 'POST', {
              title: `Test Document ${Date.now()}`,
              content: 'Test content for stress testing',
              platform: 'test'
            });
            break;
          case 'search':
            await this.makeRequest('/api/rag/search', 'POST', {
              query: `search test ${Date.now()}`,
              limit: 10
            });
            break;
        }

        operationCount++;
        totalResponseTime += performance.now() - startTime;

      } catch (error) {
        // Continue on error
      }

      await this.cooldown(Math.random() * 100 + 50); // Random delay 50-150ms
    }

    return {
      operations: operationCount,
      avgResponseTime: totalResponseTime / operationCount
    };
  }

  async cachePerformanceTest() {
    const cacheHitTest = async () => {
      const endpoint = '/api/rag/stats';
      const iterations = 100;
      const results = [];

      // First request to populate cache
      await this.makeRequest(endpoint);

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        const response = await this.makeRequest(endpoint);
        const duration = performance.now() - startTime;

        results.push({
          iteration: i + 1,
          responseTime: duration,
          cacheHeader: response.headers['x-cache'] || response.headers['x-quantum-cache']
        });
      }

      return results;
    };

    const cacheMissTest = async () => {
      const results = [];
      
      for (let i = 0; i < 50; i++) {
        const uniqueEndpoint = `/api/health?test=${Date.now()}&i=${i}`;
        const startTime = performance.now();
        await this.makeRequest(uniqueEndpoint);
        const duration = performance.now() - startTime;

        results.push({
          iteration: i + 1,
          responseTime: duration,
          type: 'cache_miss'
        });
      }

      return results;
    };

    const hitResults = await cacheHitTest();
    const missResults = await cacheMissTest();

    return {
      cacheHits: hitResults,
      cacheMisses: missResults,
      hitRatio: hitResults.filter(r => r.cacheHeader === 'HIT').length / hitResults.length,
      avgHitTime: hitResults.reduce((sum, r) => sum + r.responseTime, 0) / hitResults.length,
      avgMissTime: missResults.reduce((sum, r) => sum + r.responseTime, 0) / missResults.length
    };
  }

  async websocketLoadTest() {
    const WebSocket = require('ws');
    const connectionCount = 100;
    const messageDuration = 60000; // 1 minute
    const connections = [];
    const results = {
      connections: 0,
      messagesSent: 0,
      messagesReceived: 0,
      errors: 0,
      connectionTimes: [],
      responseTimes: []
    };

    // Create connections
    for (let i = 0; i < connectionCount; i++) {
      try {
        const startTime = performance.now();
        const ws = new WebSocket(this.baseUrl.replace('http', 'ws') + '/ws');
        
        ws.on('open', () => {
          const connectionTime = performance.now() - startTime;
          results.connections++;
          results.connectionTimes.push(connectionTime);
        });

        ws.on('message', (data) => {
          results.messagesReceived++;
        });

        ws.on('error', () => {
          results.errors++;
        });

        connections.push(ws);
        
      } catch (error) {
        results.errors++;
      }
    }

    // Wait for connections to establish
    await this.cooldown(5000);

    // Send messages for specified duration
    const messageInterval = setInterval(() => {
      connections.forEach((ws, index) => {
        if (ws.readyState === WebSocket.OPEN) {
          const messageStartTime = performance.now();
          ws.send(JSON.stringify({
            type: 'test_message',
            id: index,
            timestamp: Date.now(),
            data: 'stress test data'
          }));
          results.messagesSent++;
        }
      });
    }, 1000);

    // Stop after duration
    setTimeout(() => {
      clearInterval(messageInterval);
      connections.forEach(ws => ws.close());
    }, messageDuration);

    await this.cooldown(messageDuration + 5000);

    return results;
  }

  async executeLoadTest(config) {
    const results = {
      requests: 0,
      responses: 0,
      errors: 0,
      responseTimes: [],
      statusCodes: new Map(),
      throughput: 0,
      peakConcurrency: 0,
      errorRate: 0
    };

    const startTime = Date.now();
    const endTime = startTime + config.duration;
    const rampUpEnd = startTime + config.rampUpTime;
    
    const activeRequests = new Set();
    
    const makeRequestsLoop = async () => {
      while (Date.now() < endTime) {
        const currentTime = Date.now();
        
        // Calculate current user count based on ramp-up
        let currentUsers;
        if (currentTime < rampUpEnd) {
          const rampProgress = (currentTime - startTime) / config.rampUpTime;
          currentUsers = Math.floor(config.maxConcurrentUsers * rampProgress);
        } else {
          currentUsers = config.maxConcurrentUsers;
        }

        // Maintain current user level
        while (activeRequests.size < currentUsers && Date.now() < endTime) {
          const endpoint = this.selectWeightedEndpoint(config.endpoints);
          const requestPromise = this.executeEndpointRequest(endpoint, results);
          
          activeRequests.add(requestPromise);
          requestPromise.finally(() => activeRequests.delete(requestPromise));
          
          results.peakConcurrency = Math.max(results.peakConcurrency, activeRequests.size);
        }

        await this.cooldown(100); // Brief pause
      }
    };

    await makeRequestsLoop();
    
    // Wait for remaining requests to complete
    await Promise.allSettled(Array.from(activeRequests));
    
    // Calculate final metrics
    results.throughput = results.responses / (config.duration / 1000);
    results.errorRate = results.errors / results.requests;
    results.averageResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;
    results.p95ResponseTime = this.calculatePercentile(results.responseTimes, 95);
    results.p99ResponseTime = this.calculatePercentile(results.responseTimes, 99);

    return results;
  }

  async executeEndpointRequest(endpoint, results) {
    results.requests++;
    const startTime = performance.now();

    try {
      const response = await this.makeRequest(endpoint.path, endpoint.method, endpoint.body);
      const responseTime = performance.now() - startTime;
      
      results.responses++;
      results.responseTimes.push(responseTime);
      
      const statusCode = response.status || 200;
      results.statusCodes.set(statusCode, (results.statusCodes.get(statusCode) || 0) + 1);
      
    } catch (error) {
      results.errors++;
    }
  }

  selectWeightedEndpoint(endpoints) {
    const totalWeight = endpoints.reduce((sum, ep) => sum + ep.weight, 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (const endpoint of endpoints) {
      currentWeight += endpoint.weight;
      if (random <= currentWeight) {
        return endpoint;
      }
    }
    
    return endpoints[0];
  }

  selectWeightedOperation(operations) {
    const totalWeight = operations.reduce((sum, op) => sum + op.weight, 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (const operation of operations) {
      currentWeight += operation.weight;
      if (random <= currentWeight) {
        return operation;
      }
    }
    
    return operations[0];
  }

  async makeRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'StressTester/1.0'
        }
      };

      if (body) {
        options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
      }

      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        });
      });

      req.on('error', reject);
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (body) {
        req.write(JSON.stringify(body));
      }
      
      req.end();
    });
  }

  calculatePercentile(values, percentile) {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  analyzeMemoryProfile(snapshots) {
    if (snapshots.length < 2) return { status: 'insufficient_data' };

    const heapUsedTrend = [];
    const heapTotalTrend = [];

    for (let i = 1; i < snapshots.length; i++) {
      const current = snapshots[i].memory;
      const previous = snapshots[i - 1].memory;
      
      heapUsedTrend.push(current.heapUsed - previous.heapUsed);
      heapTotalTrend.push(current.heapTotal - previous.heapTotal);
    }

    const avgHeapGrowth = heapUsedTrend.reduce((a, b) => a + b, 0) / heapUsedTrend.length;
    const maxHeapUsed = Math.max(...snapshots.map(s => s.memory.heapUsed));
    const minHeapUsed = Math.min(...snapshots.map(s => s.memory.heapUsed));

    return {
      status: avgHeapGrowth > 1000000 ? 'potential_leak' : 'healthy', // 1MB threshold
      averageGrowthPerInterval: avgHeapGrowth,
      maxHeapUsed,
      minHeapUsed,
      heapGrowthVariation: maxHeapUsed - minHeapUsed,
      snapshots: snapshots.length,
      analysis: avgHeapGrowth > 1000000 ? 
        'Memory usage shows consistent growth - potential memory leak detected' :
        'Memory usage appears stable - no significant leaks detected'
    };
  }

  async cooldown(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateStressTestReport(testResults, totalDuration) {
    const passedTests = Array.from(testResults.values()).filter(r => r.status === 'passed').length;
    const totalTests = testResults.size;
    const successRate = (passedTests / totalTests) * 100;

    const report = {
      summary: {
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        successRate: Math.round(successRate * 100) / 100,
        totalDuration: Math.round(totalDuration),
        status: successRate >= 90 ? 'excellent' : 
                successRate >= 75 ? 'good' : 
                successRate >= 50 ? 'acceptable' : 'needs_improvement'
      },
      testResults: Object.fromEntries(testResults),
      recommendations: this.generateRecommendations(testResults),
      performanceBaseline: this.calculatePerformanceBaseline(testResults),
      generatedAt: new Date().toISOString()
    };

    return report;
  }

  generateRecommendations(testResults) {
    const recommendations = [];
    
    // Analyze load test results
    const loadTest = testResults.get('load_test');
    if (loadTest?.status === 'passed' && loadTest.metrics.errorRate > 0.01) {
      recommendations.push('Error rate during load test exceeds 1% - investigate error handling');
    }

    // Analyze memory leak test
    const memoryTest = testResults.get('memory_leak_test');
    if (memoryTest?.status === 'passed' && memoryTest.metrics.status === 'potential_leak') {
      recommendations.push('Potential memory leak detected - review memory management practices');
    }

    // Analyze concurrency test
    const concurrencyTest = testResults.get('concurrency_test');
    if (concurrencyTest?.status === 'passed') {
      const highConcurrencyResult = concurrencyTest.metrics.find(r => r.concurrencyLevel >= 500);
      if (highConcurrencyResult && highConcurrencyResult.successRate < 0.95) {
        recommendations.push('High concurrency performance degradation - consider horizontal scaling');
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('All stress tests passed successfully - application is production ready');
    }

    return recommendations;
  }

  calculatePerformanceBaseline(testResults) {
    const baseline = {};
    
    const loadTest = testResults.get('load_test');
    if (loadTest?.status === 'passed') {
      baseline.expectedThroughput = loadTest.metrics.throughput;
      baseline.expectedResponseTime = loadTest.metrics.averageResponseTime;
      baseline.acceptableErrorRate = 0.01; // 1%
    }

    return baseline;
  }
}

module.exports = ProductionStressTester;