import OpenAI from "openai";

const deepseek = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY || process.env.XAI_API_KEY || "default_key",
});

export interface DeepSeekResponse {
  reasoning?: string;
  finalAnswer: string;
  tokensUsed?: number;
}

export interface PromptGenerationRequest {
  platform: string;
  userQuery: string;
  ragContext: string[];
  tone?: string;
  style?: string;
  constraints?: string[];
}

export class DeepSeekService {
  async generatePrompt(request: PromptGenerationRequest): Promise<DeepSeekResponse> {
    const systemPrompt = this.buildSystemPrompt(request.platform);
    const userPrompt = this.buildUserPrompt(request);

    try {
      const response = await deepseek.chat.completions.create({
        model: "deepseek-reasoner",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const choice = response.choices[0];
      const reasoning = (choice.message as any).reasoning_content || "";
      const finalAnswer = choice.message.content || "";

      return {
        reasoning,
        finalAnswer,
        tokensUsed: response.usage?.total_tokens || 0,
      };
    } catch (error) {
      console.error("DeepSeek API error:", error);
      throw new Error(`DeepSeek generation failed: ${error.message}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await deepseek.chat.completions.create({
        model: "deepseek-reasoner",
        messages: [
          { role: "user", content: "Respond with 'OK' if you can process this request." }
        ],
        max_tokens: 10,
      });

      return response.choices[0].message.content?.includes("OK") || false;
    } catch (error) {
      console.error("DeepSeek connection test failed:", error);
      return false;
    }
  }

  private buildSystemPrompt(platform: string): string {
    return `You are an expert AI prompt engineer specializing in ${platform} platform optimization. 

Your task is to generate highly effective, platform-specific prompts that leverage the latest features and capabilities of ${platform}.

Key responsibilities:
1. Analyze the user's requirements and context
2. Incorporate relevant platform-specific documentation and best practices
3. Create prompts that are clear, actionable, and optimized for the target platform
4. Ensure prompts follow platform conventions and utilize available integrations
5. Consider performance, scalability, and best practices

Platform Focus: ${platform}
- Understand the platform's unique features and capabilities
- Reference specific APIs, tools, and workflows available
- Optimize for the platform's strengths and limitations
- Include relevant examples and use cases

Output Requirements:
- Generate a complete, ready-to-use prompt
- Include clear instructions and context
- Specify any required parameters or configurations
- Provide implementation guidance where appropriate

Reasoning Process:
- Think through the problem step by step
- Consider multiple approaches and select the best one
- Explain your reasoning for specific choices
- Identify potential challenges and solutions`;
  }

  private buildUserPrompt(request: PromptGenerationRequest): string {
    let prompt = `Platform: ${request.platform}\n\n`;
    prompt += `User Request: ${request.userQuery}\n\n`;

    if (request.ragContext && request.ragContext.length > 0) {
      prompt += `Relevant Documentation Context:\n`;
      request.ragContext.forEach((context, index) => {
        prompt += `${index + 1}. ${context}\n\n`;
      });
    }

    if (request.tone) {
      prompt += `Desired Tone: ${request.tone}\n`;
    }

    if (request.style) {
      prompt += `Desired Style: ${request.style}\n`;
    }

    if (request.constraints && request.constraints.length > 0) {
      prompt += `Constraints:\n`;
      request.constraints.forEach((constraint, index) => {
        prompt += `- ${constraint}\n`;
      });
    }

    prompt += `\nGenerate an optimized prompt that addresses the user's request while leveraging the provided platform documentation and following the specified requirements.`;

    return prompt;
  }

  async generateMultiTurnConversation(messages: { role: string; content: string }[]): Promise<DeepSeekResponse> {
    try {
      const response = await deepseek.chat.completions.create({
        model: "deepseek-reasoner",
        messages: messages as any,
        temperature: 0.7,
        max_tokens: 2000,
      });

      const choice = response.choices[0];
      const reasoning = (choice.message as any).reasoning_content || "";
      const finalAnswer = choice.message.content || "";

      return {
        reasoning,
        finalAnswer,
        tokensUsed: response.usage?.total_tokens || 0,
      };
    } catch (error) {
      console.error("DeepSeek multi-turn conversation error:", error);
      throw new Error(`DeepSeek conversation failed: ${error.message}`);
    }
  }
}

export const deepSeekService = new DeepSeekService();
