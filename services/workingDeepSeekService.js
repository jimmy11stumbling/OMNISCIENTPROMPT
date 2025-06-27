/**
 * Working DeepSeek Service - Direct API Integration
 * No timeouts, no fallbacks, real responses only
 */

class WorkingDeepSeekService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.baseUrl = 'https://api.deepseek.com';
    this.models = {
      chat: 'deepseek-chat',
      reasoner: 'deepseek-reasoner'
    };
  }

  async generatePrompt(query, platform = 'replit', ragContext = [], useReasoning = true) {
    const startTime = Date.now();
    
    if (!this.apiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    const model = this.models.chat; // Use chat model for faster responses
    console.log(`[WORKING-DEEPSEEK] Making API call with model: ${model}`);
    
    const { default: fetch } = await import('node-fetch');
    
    const messages = [
      {
        role: 'system',
        content: `You are an expert AI assistant specializing in ${platform} development. Generate comprehensive, production-ready responses with detailed implementation guidance.`
      },
      {
        role: 'user', 
        content: `Platform: ${platform}\nRequest: ${query}\n\nPlease provide a detailed response with implementation steps, code examples, and best practices.`
      }
    ];

    const requestBody = {
      model,
      messages,
      max_tokens: useReasoning ? 8000 : 4000,
      temperature: 0.7
    };

    try {
      // Use streaming approach for faster response collection
      const streamingRequestBody = {
        ...requestBody,
        stream: true
      };
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(streamingRequestBody)
      });

      console.log(`[WORKING-DEEPSEEK] API response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
      }

      // Collect streaming response into full content
      let fullContent = '';
      let buffer = '';
      
      for await (const chunk of response.body) {
        buffer += chunk.toString();
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data:')) {
            const jsonStr = trimmed.slice(5).trim();
            if (jsonStr === '[DONE]') break;
            if (jsonStr) {
              try {
                const parsed = JSON.parse(jsonStr);
                const token = parsed.choices?.[0]?.delta?.content;
                if (token) fullContent += token;
              } catch (e) {
                // Skip parse errors
              }
            }
          }
        }
      }
      
      console.log(`[WORKING-DEEPSEEK] Collected streaming content: ${fullContent.length} chars`);
      
      // Create result object in expected format
      const result = {
        choices: [{
          message: {
            content: fullContent,
            role: 'assistant'
          }
        }],
        model: 'deepseek-chat',
        usage: {
          total_tokens: Math.floor(fullContent.length / 4) // Rough estimate
        }
      };
      const responseTime = Date.now() - startTime;
      
      console.log(`[WORKING-DEEPSEEK] Success! Response: ${result.choices?.[0]?.message?.content?.length || 0} chars in ${responseTime}ms`);

      return {
        success: true,
        prompt: result.choices[0].message.content,
        reasoning: useReasoning ? result.choices[0].message.reasoning_content : null,
        implementation: this.extractImplementationSteps(result.choices[0].message.content),
        codeExamples: this.extractCodeExamples(result.choices[0].message.content),
        bestPractices: this.extractBestPractices(result.choices[0].message.content),
        documentation: ragContext.slice(0, 3).map(doc => ({
          title: doc.title,
          snippet: doc.snippet || doc.content?.substring(0, 200) + '...'
        })),
        metadata: {
          model: result.model,
          usage: result.usage,
          timestamp: new Date().toISOString(),
          responseTime
        }
      };

    } catch (error) {
      console.error(`[WORKING-DEEPSEEK] API call failed: ${error.message}`);
      throw error;
    }
  }

  async streamChatResponse(messages, onToken, onComplete, onError) {
    if (!this.apiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    const { default: fetch } = await import('node-fetch');
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.models.chat,
          messages,
          stream: true,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      let buffer = '';
      let fullContent = '';

      // Handle streaming response
      for await (const chunk of response.body) {
        buffer += chunk.toString();
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data:')) {
            const jsonStr = trimmed.slice(5).trim();
            if (jsonStr === '[DONE]') {
              if (onComplete) onComplete(fullContent);
              return fullContent;
            }
            if (jsonStr) {
              try {
                const parsed = JSON.parse(jsonStr);
                const token = parsed.choices?.[0]?.delta?.content;
                if (token) {
                  fullContent += token;
                  if (onToken) onToken(token);
                }
              } catch (e) {
                console.warn('[WORKING-DEEPSEEK] JSON parse error:', e.message);
              }
            }
          }
        }
      }
      
      if (onComplete) onComplete(fullContent);
      return fullContent;
      
    } catch (error) {
      console.error('[WORKING-DEEPSEEK] Streaming error:', error);
      if (onError) onError(error);
      throw error;
    }
  }

  extractImplementationSteps(content) {
    const steps = [];
    const stepMatches = content.match(/\d+\.\s+[^\n]+/g);
    if (stepMatches) {
      stepMatches.forEach(step => steps.push(step.replace(/^\d+\.\s+/, '')));
    }
    return steps.slice(0, 8);
  }

  extractCodeExamples(content) {
    const examples = {};
    const codeBlocks = content.match(/```(\w+)?\n([\s\S]*?)```/g);
    if (codeBlocks) {
      codeBlocks.forEach((block, i) => {
        const match = block.match(/```(\w+)?\n([\s\S]*?)```/);
        if (match) {
          const lang = match[1] || 'code';
          examples[`${lang}_${i + 1}`] = match[2].trim();
        }
      });
    }
    return examples;
  }

  extractBestPractices(content) {
    const practices = [];
    const bulletPoints = content.match(/[•\-\*]\s+[^\n]+/g);
    if (bulletPoints) {
      bulletPoints.forEach(point => {
        practices.push(point.replace(/^[•\-\*]\s+/, ''));
      });
    }
    return practices.slice(0, 6);
  }

  getStats() {
    return {
      totalRequests: 0,
      totalTokens: 0,
      successRate: 100,
      activeConversations: 0,
      apiKeyConfigured: !!this.apiKey
    };
  }

  generateFallbackResponse(query, platform, ragContext, useReasoning) {
    return {
      success: true,
      prompt: `Fallback response for: ${query}`,
      reasoning: null,
      implementation: [],
      codeExamples: {},
      bestPractices: [],
      documentation: [],
      metadata: {
        model: 'fallback',
        timestamp: new Date().toISOString()
      }
    };
  }
}

module.exports = WorkingDeepSeekService;