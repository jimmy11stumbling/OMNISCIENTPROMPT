// Simple test to verify DeepSeek API integration
const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'DeepSeek AI-Powered Prompt Generator',
    status: 'running',
    features: [
      'DeepSeek API Integration',
      'RAG 2.0 Database',
      'MCP Protocol Support', 
      'A2A Communication',
      'Platform Integrations (Replit, Lovable, Bolt, Cursor, Windsurf)'
    ]
  });
});

app.post('/api/generate-prompt', (req, res) => {
  const { platform, query } = req.body;
  
  // Mock DeepSeek response for testing
  res.json({
    prompt: `Optimized prompt for ${platform}: ${query}`,
    platform,
    reasoning: 'Generated using DeepSeek AI reasoning capabilities',
    tokensUsed: 150
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`DeepSeek-powered application running on port ${PORT}`);
});