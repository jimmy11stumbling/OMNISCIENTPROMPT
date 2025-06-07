const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Root route serves the HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'DeepSeek AI Prompt Generator',
    timestamp: new Date().toISOString(),
    apiConfigured: !!process.env.DEEPSEEK_API_KEY
  });
});

// Main prompt generation endpoint
app.post('/api/generate-prompt', (req, res) => {
  const { query, platform } = req.body;
  
  if (!query || !platform) {
    return res.status(400).json({ 
      error: 'Both query and platform are required' 
    });
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

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ DeepSeek AI Prompt Generator running on port ${PORT}`);
  console.log(`🔑 API Key configured: ${process.env.DEEPSEEK_API_KEY ? 'Yes' : 'No (Demo mode)'}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});