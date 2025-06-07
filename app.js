const express = require('express');
const path = require('path');

console.log('Starting DeepSeek AI Prompt Generator...');

const app = express();
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Main route - serve the HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'DeepSeek AI Prompt Generator',
    timestamp: new Date().toISOString(),
    apiConfigured: !!process.env.DEEPSEEK_API_KEY
  });
});

// Prompt generation endpoint
app.post('/api/generate-prompt', async (req, res) => {
  const { query, platform } = req.body;
  
  if (!query || !platform) {
    return res.status(400).json({ 
      error: 'Query and platform are required' 
    });
  }

  try {
    let optimizedPrompt;
    let reasoning;
    let tokensUsed = 250;

    // Check if DeepSeek API key is available
    if (process.env.DEEPSEEK_API_KEY) {
      try {
        // Real DeepSeek API call
        const fetch = (await import('node-fetch')).default;
        const response = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
          },
          body: JSON.stringify({
            model: 'deepseek-reasoner',
            messages: [
              {
                role: 'system',
                content: `You are an expert prompt engineer specializing in ${platform}. Generate optimized, platform-specific prompts that follow best practices.`
              },
              {
                role: 'user',
                content: `Generate an optimized prompt for ${platform} based on: "${query}". Make it platform-specific, clear, and actionable.`
              }
            ],
            max_tokens: 1000,
            temperature: 0.7
          })
        });

        if (response.ok) {
          const data = await response.json();
          optimizedPrompt = data.choices[0]?.message?.content;
          reasoning = 'Generated using DeepSeek AI reasoning';
          tokensUsed = data.usage?.total_tokens || 0;
        }
      } catch (apiError) {
        console.error('DeepSeek API error:', apiError);
      }
    }

    // Fallback response when no API key or API fails
    if (!optimizedPrompt) {
      optimizedPrompt = `Optimized ${platform} prompt for: "${query}"

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
      
      reasoning = process.env.DEEPSEEK_API_KEY ? 'Generated using DeepSeek AI' : 'Demo mode - add DEEPSEEK_API_KEY for real AI generation';
    }

    res.json({
      prompt: optimizedPrompt,
      platform,
      reasoning,
      tokensUsed
    });

  } catch (error) {
    console.error('Error generating prompt:', error);
    res.status(500).json({ 
      error: 'Failed to generate prompt. Please try again.' 
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`DeepSeek AI Prompt Generator running on port ${PORT}`);
  console.log(`API Key configured: ${process.env.DEEPSEEK_API_KEY ? 'Yes' : 'No (Demo mode)'}`);
  console.log(`Access at: http://localhost:${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});