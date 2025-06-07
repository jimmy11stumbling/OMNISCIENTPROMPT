// Test script to validate DeepSeek API prompt generation quality
const testQueries = [
  "social media platform with real-time messaging",
  "e-commerce marketplace with vendor management", 
  "task management app with team collaboration",
  "food delivery app with driver tracking",
  "blogging platform with content moderation"
];

const platforms = ["replit", "lovable", "bolt", "cursor", "windsurf"];

async function testPromptGeneration() {
  console.log('🧪 Testing DeepSeek AI Prompt Generation Quality\n');
  
  for (const query of testQueries.slice(0, 2)) { // Test first 2 queries
    console.log(`📋 Testing: "${query}"`);
    
    try {
      const response = await fetch('http://localhost:5000/api/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, platform: 'replit' })
      });
      
      const data = await response.json();
      
      console.log('✅ Response received');
      console.log(`📊 Tokens used: ${data.tokensUsed}`);
      console.log(`⏱️  Response time: ${data.responseTime}ms`);
      console.log(`🧠 Has reasoning: ${!!data.reasoning}`);
      
      // Check for specificity indicators
      const prompt = data.prompt || '';
      const hasSpecificFiles = prompt.includes('.tsx') || prompt.includes('.js');
      const hasSpecificTables = prompt.includes('CREATE TABLE');
      const hasSpecificEndpoints = prompt.includes('/api/');
      const hasSpecificDependencies = prompt.includes('package.json');
      
      console.log('🔍 Specificity Analysis:');
      console.log(`   - Specific file structures: ${hasSpecificFiles ? '✅' : '❌'}`);
      console.log(`   - Database schemas: ${hasSpecificTables ? '✅' : '❌'}`);
      console.log(`   - API endpoints: ${hasSpecificEndpoints ? '✅' : '❌'}`);
      console.log(`   - Dependencies: ${hasSpecificDependencies ? '✅' : '❌'}`);
      
      const specificityScore = [hasSpecificFiles, hasSpecificTables, hasSpecificEndpoints, hasSpecificDependencies]
        .filter(Boolean).length;
      
      console.log(`📈 Specificity Score: ${specificityScore}/4`);
      console.log('─'.repeat(60));
      
    } catch (error) {
      console.error(`❌ Error testing "${query}":`, error.message);
    }
  }
}

testPromptGeneration().catch(console.error);