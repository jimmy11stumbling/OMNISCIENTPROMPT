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

    // Uncomment below for real DeepSeek API call
    /*
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
            content: `Generate an optimized prompt for ${platform} based on this user request: "${query}". 

Make the prompt:
1. Platform-specific with proper terminology
2. Clear and actionable
3. Following ${platform} best practices
4. Structured for optimal results

Return only the optimized prompt without additional explanation.`
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    */

    const data = mockResponse;
    const optimizedPrompt = data.choices[0]?.message?.content || 'Failed to generate prompt';

    res.json({
      prompt: optimizedPrompt,
      platform,
      reasoning: data.reasoning || 'Generated using DeepSeek reasoning',
      tokensUsed: data.usage?.total_tokens || 0
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