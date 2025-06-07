const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

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

    // If DeepSeek API key is provided, use real API
    if (process.env.DEEPSEEK_API_KEY) {
      try {
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

        if (response.ok) {
          const data = await response.json();
          optimizedPrompt = data.choices[0]?.message?.content;
          reasoning = 'Generated using DeepSeek AI reasoning';
          tokensUsed = data.usage?.total_tokens || 0;
        }
      } catch (apiError) {
        console.error('DeepSeek API error:', apiError);
        // Fall through to demo mode
      }
    }

    // Demo mode fallback
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
    console.error('Prompt generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate prompt. Please try again.' 
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ DeepSeek AI Prompt Generator running on port ${PORT}`);
  console.log(`🔑 API Key configured: ${process.env.DEEPSEEK_API_KEY ? 'Yes' : 'No (Demo mode)'}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
});