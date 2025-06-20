/**
 * Quick Component Test
 * Fast tests without network calls
 */

async function quickTest() {
  console.log('Testing components individually...\n');

  // Test 1: DeepSeek Service (no API call)
  try {
    const { deepSeekService } = require('./services/deepseekService');
    const stats = deepSeekService.getUsageStats();
    console.log('✅ DeepSeek Service: Loaded successfully');
    console.log(`   Configured: ${stats.configured}`);
  } catch (error) {
    console.log('❌ DeepSeek Service failed:', error.message);
  }

  // Test 2: RAG Service
  try {
    const { ragService } = require('./services/ragService');
    const results = await ragService.searchDocuments('React', 'replit', 2);
    console.log('✅ RAG Service: Working');
    console.log(`   Search results: ${results.length}`);
  } catch (error) {
    console.log('❌ RAG Service failed:', error.message);
  }

  // Test 3: Authentication
  try {
    const { hashPassword } = require('./middlewares/authentication');
    const hash = await hashPassword('test123');
    console.log('✅ Authentication: Working');
  } catch (error) {
    console.log('❌ Authentication failed:', error.message);
  }

  // Test 4: Database tables
  try {
    const database = require('./database');
    const tables = await database.queryAsync(`
      SELECT name FROM sqlite_master WHERE type='table'
    `);
    console.log('✅ Database: Working');
    console.log(`   Tables: ${tables.rows.map(r => r.name).join(', ')}`);
  } catch (error) {
    console.log('❌ Database failed:', error.message);
  }

  process.exit(0);
}

quickTest();