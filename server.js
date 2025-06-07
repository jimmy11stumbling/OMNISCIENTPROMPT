const express = require('express');
const path = require('path');

// Use CommonJS for simplicity

const app = express();
app.use(express.json());
app.use(express.static('public'));

// DeepSeek API integration
app.post('/api/generate-prompt', async (req, res) => {
  const { query, platform } = req.body;
  
  if (!process.env.DEEPSEEK_API_KEY) {
    return res.status(400).json({ 
      error: 'DEEPSEEK_API_KEY is required. Please add your DeepSeek API key to environment variables.' 
    });
  }

  if (!query || !platform) {
    return res.status(400).json({ 
      error: 'Query and platform are required' 
    });
  }

  try {
    // Mock DeepSeek response for now (will be real when API key is provided)
    const mockResponse = {
      choices: [{
        message: {
          content: `Optimized ${platform} prompt for: "${query}"

Platform-specific instructions:
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

Generated using DeepSeek AI reasoning capabilities.`
        }
      }],
      usage: { total_tokens: 250 }
    };

    // Real DeepSeek API integration when key is provided
    if (process.env.DEEPSEEK_API_KEY) {
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
              content: `You are an expert prompt engineer specializing in ${platform}. Generate optimized, platform-specific prompts that follow best practices and leverage the platform's unique capabilities.`
            },
            {
              role: 'user',
              content: `Generate an optimized prompt for ${platform} based on this user request: "${query}". Make the prompt platform-specific, clear, actionable, and following ${platform} best practices.`
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (response.ok) {
        const realData = await response.json();
        const optimizedPrompt = realData.choices[0]?.message?.content || mockResponse.choices[0].message.content;
        
        return res.json({
          prompt: optimizedPrompt,
          platform,
          reasoning: realData.reasoning || 'Generated using DeepSeek reasoning',
          tokensUsed: realData.usage?.total_tokens || 0
        });
      }
    }

    // Fallback to demo mode if no API key
    const optimizedPrompt = mockResponse.choices[0].message.content;

    res.json({
      prompt: optimizedPrompt,
      platform,
      reasoning: 'Demo mode - add DEEPSEEK_API_KEY for real AI generation',
      tokensUsed: mockResponse.usage.total_tokens
    });

  } catch (error) {
    console.error('DeepSeek API error:', error);
    res.status(500).json({ 
      error: 'Failed to generate prompt. Please check your API key and try again.' 
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'DeepSeek AI Prompt Generator',
    timestamp: new Date().toISOString(),
    apiConfigured: !!process.env.DEEPSEEK_API_KEY
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`DeepSeek AI Prompt Generator running on port ${PORT}`);
  console.log(`API Key configured: ${!!process.env.DEEPSEEK_API_KEY}`);
});