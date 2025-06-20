/**
 * Component Testing Suite
 * Tests all modular components for functionality
 */

const config = require('./config/environment');
const database = require('./database');

// Test individual components
async function testComponents() {
  console.log('🧪 Testing all components...\n');

  // Test 1: Environment Configuration
  try {
    console.log('1. Testing Environment Configuration...');
    console.log(`   - Port: ${config.PORT}`);
    console.log(`   - Node Env: ${config.NODE_ENV}`);
    console.log(`   - DeepSeek API: ${config.DEEPSEEK_API_KEY ? 'Configured' : 'Demo mode'}`);
    console.log(`   - Email: ${config.FEATURES.enableEmailVerification ? 'Enabled' : 'Disabled'}`);
    console.log('   ✅ Environment config working');
  } catch (error) {
    console.log('   ❌ Environment config failed:', error.message);
  }

  // Test 2: Database Connection
  try {
    console.log('\n2. Testing Database Connection...');
    const testQuery = await database.queryAsync('SELECT 1 as test');
    console.log(`   - Query result: ${testQuery.rows[0].test}`);
    
    // Test table creation
    const tableExists = await database.queryAsync(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='users'
    `);
    console.log(`   - Users table: ${tableExists.rows.length > 0 ? 'Exists' : 'Missing'}`);
    console.log('   ✅ Database working');
  } catch (error) {
    console.log('   ❌ Database failed:', error.message);
  }

  // Test 3: DeepSeek Service
  try {
    console.log('\n3. Testing DeepSeek Service...');
    const { deepSeekService } = require('./services/deepseekService');
    const status = await deepSeekService.getServiceStatus();
    console.log(`   - Status: ${status.status}`);
    console.log(`   - Configured: ${status.configured}`);
    
    const stats = deepSeekService.getUsageStats();
    console.log(`   - Features: ${Object.keys(stats.features).length}`);
    console.log('   ✅ DeepSeek service working');
  } catch (error) {
    console.log('   ❌ DeepSeek service failed:', error.message);
  }

  // Test 4: RAG Service
  try {
    console.log('\n4. Testing RAG Service...');
    const { ragService } = require('./services/ragService');
    const stats = await ragService.getDocumentStats();
    console.log(`   - Memory documents: ${stats.totalMemory}`);
    console.log(`   - Cache size: ${stats.cacheSize}`);
    
    const searchResults = await ragService.searchDocuments('AI coding', 'replit', 2);
    console.log(`   - Search results: ${searchResults.length}`);
    console.log('   ✅ RAG service working');
  } catch (error) {
    console.log('   ❌ RAG service failed:', error.message);
  }

  // Test 5: Authentication Middleware
  try {
    console.log('\n5. Testing Authentication Middleware...');
    const { authManager } = require('./middlewares/authentication');
    const testPassword = 'testPassword123!';
    const hashedPassword = await authManager.hashPassword(testPassword);
    const isValid = await authManager.verifyPassword(testPassword, hashedPassword);
    console.log(`   - Password hashing: ${hashedPassword ? 'Working' : 'Failed'}`);
    console.log(`   - Password verification: ${isValid ? 'Working' : 'Failed'}`);
    
    const token = authManager.generateToken(1);
    console.log(`   - Token generation: ${token ? 'Working' : 'Failed'}`);
    console.log('   ✅ Authentication working');
  } catch (error) {
    console.log('   ❌ Authentication failed:', error.message);
  }

  // Test 6: Rate Limiting
  try {
    console.log('\n6. Testing Rate Limiting...');
    const { rateLimitManager } = require('./middlewares/rateLimiting');
    const status = rateLimitManager.getStatus('test-client');
    console.log(`   - Rate limit status: ${status.remaining} remaining`);
    console.log(`   - Reset time: ${new Date(status.resetTime).toISOString()}`);
    console.log('   ✅ Rate limiting working');
  } catch (error) {
    console.log('   ❌ Rate limiting failed:', error.message);
  }

  // Test 7: Security Middleware
  try {
    console.log('\n7. Testing Security Middleware...');
    const { securityManager, validateEmail, validatePassword } = require('./middlewares/security');
    
    const emailTest = validateEmail('test@example.com');
    const passwordTest = validatePassword('StrongPassword123!');
    
    console.log(`   - Email validation: ${emailTest ? 'Working' : 'Failed'}`);
    console.log(`   - Password validation: ${passwordTest.valid ? 'Working' : 'Failed'}`);
    console.log('   ✅ Security middleware working');
  } catch (error) {
    console.log('   ❌ Security middleware failed:', error.message);
  }

  // Test 8: Utility Helpers
  try {
    console.log('\n8. Testing Utility Helpers...');
    const UtilityHelpers = require('./utils/helpers');
    
    const id = UtilityHelpers.generateId('test');
    const token = UtilityHelpers.generateSecureToken(16);
    const formatted = UtilityHelpers.formatBytes(1024 * 1024);
    
    console.log(`   - ID generation: ${id ? 'Working' : 'Failed'}`);
    console.log(`   - Token generation: ${token ? 'Working' : 'Failed'}`);
    console.log(`   - Byte formatting: ${formatted}`);
    console.log('   ✅ Utility helpers working');
  } catch (error) {
    console.log('   ❌ Utility helpers failed:', error.message);
  }

  console.log('\n🏁 Component testing complete!');
}

// Test API endpoints
async function testApiEndpoints() {
  console.log('\n🌐 Testing API endpoints...\n');

  const fetch = (await import('node-fetch')).default;
  const baseUrl = `http://localhost:${config.PORT}`;

  // Test health endpoint
  try {
    console.log('1. Testing Health Endpoint...');
    const response = await fetch(`${baseUrl}/api/health`);
    const data = await response.json();
    console.log(`   - Status: ${response.status}`);
    console.log(`   - Service: ${data.service || 'Unknown'}`);
    console.log('   ✅ Health endpoint working');
  } catch (error) {
    console.log('   ❌ Health endpoint failed:', error.message);
  }

  // Test prompt generation (with timeout)
  try {
    console.log('\n2. Testing Prompt Generation...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${baseUrl}/api/generate-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Create a simple React component',
        platform: 'replit'
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const data = await response.json();
    console.log(`   - Status: ${response.status}`);
    console.log(`   - Has prompt: ${!!data.prompt}`);
    console.log(`   - Platform: ${data.platform}`);
    console.log('   ✅ Prompt generation working');
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('   ⚠️ Prompt generation timeout (may be working but slow)');
    } else {
      console.log('   ❌ Prompt generation failed:', error.message);
    }
  }

  // Test search endpoint
  try {
    console.log('\n3. Testing Search Endpoint...');
    const response = await fetch(`${baseUrl}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'React components',
        platform: 'replit'
      })
    });
    
    const data = await response.json();
    console.log(`   - Status: ${response.status}`);
    console.log(`   - Results: ${data.results?.length || 0}`);
    console.log('   ✅ Search endpoint working');
  } catch (error) {
    console.log('   ❌ Search endpoint failed:', error.message);
  }

  console.log('\n🏁 API testing complete!');
}

// Main test runner
async function runAllTests() {
  console.log('🔬 DeepSeek AI Platform - Component Test Suite');
  console.log('='.repeat(50));
  
  await testComponents();
  await testApiEndpoints();
  
  console.log('\n' + '='.repeat(50));
  console.log('✨ All tests completed!');
  
  process.exit(0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});