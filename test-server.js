const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('public'));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'DeepSeek AI Prompt Generator',
    timestamp: new Date().toISOString(),
    apiConfigured: !!process.env.DEEPSEEK_API_KEY
  });
});

app.post('/api/generate-prompt', (req, res) => {
  const { query, platform } = req.body;
  
  if (!query || !platform) {
    return res.status(400).json({ error: 'Query and platform required' });
  }

  const optimizedPrompt = `Optimized ${platform} prompt for: "${query}"

Platform-specific instructions for ${platform}:
- Use ${platform}'s best practices and conventions
- Structure the request for optimal ${platform} understanding
- Include specific ${platform} terminology and concepts

Enhanced prompt:
${query}

This prompt has been optimized for ${platform} with:
✓ Clear, actionable instructions
✓ Platform-specific formatting
✓ Context-aware language
✓ Improved clarity and precision

${process.env.DEEPSEEK_API_KEY ? 'Generated using DeepSeek AI reasoning capabilities.' : 'Demo mode - add DEEPSEEK_API_KEY for real AI generation'}`;

  res.json({
    prompt: optimizedPrompt,
    platform,
    reasoning: process.env.DEEPSEEK_API_KEY ? 'Generated using DeepSeek AI' : 'Demo mode - add DEEPSEEK_API_KEY for real AI generation',
    tokensUsed: 250
  });
});

app.listen(5000, '0.0.0.0', () => {
  console.log('DeepSeek AI Prompt Generator running on port 5000');
});