/**
 * Real DeepSeek Streaming Implementation
 * Direct integration with DeepSeek API using fetch streaming
 */

class RealDeepSeekStreaming {
  constructor() {
    this.isStreaming = false;
    this.currentController = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    const streamBtn = document.getElementById('startStreaming');
    const stopBtn = document.getElementById('stopStreaming');
    const clearBtn = document.getElementById('clearChat');
    const chatForm = document.getElementById('streamingChatForm');

    if (streamBtn) {
      streamBtn.addEventListener('click', () => this.startStreaming());
    }

    if (stopBtn) {
      stopBtn.addEventListener('click', () => this.stopStreaming());
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearChat());
    }

    if (chatForm) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleChatSubmission();
      });
    }
  }

  async handleChatSubmission() {
    const messageInput = document.getElementById('streamingMessageInput');
    const message = messageInput.value.trim();
    
    if (!message || this.isStreaming) return;

    this.addMessageToChat('user', message);
    messageInput.value = '';
    
    await this.streamChatResponse([{ role: 'user', content: message }]);
  }

  async streamChatResponse(messages) {
    if (this.isStreaming) return;

    this.isStreaming = true;
    this.updateStreamingStatus(true);

    const responseElement = this.addMessageToChat('assistant', '');
    const contentElement = responseElement.querySelector('.message-content');

    try {
      // Use the streaming implementation provided by the user
      await this.fetchStreamingResponse(messages, (token) => {
        contentElement.textContent += token;
        this.scrollToBottom();
      });

      console.log('[STREAMING] Response completed successfully');
      
    } catch (error) {
      console.error('[STREAMING] Error:', error);
      contentElement.textContent = `Error: ${error.message}`;
    } finally {
      this.isStreaming = false;
      this.updateStreamingStatus(false);
    }
  }

  async fetchStreamingResponse(messages, onToken) {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages,
        stream: true
      })
    });

    if (!response.body) throw new Error('No response stream');

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split('\n\n');
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i].trim();
        if (part.startsWith('data:')) {
          const jsonStr = part.slice(5).trim();
          if (jsonStr === '[DONE]') return;
          try {
            const parsed = JSON.parse(jsonStr);
            const token = parsed.choices?.[0]?.delta?.content;
            if (token) onToken(token);
          } catch (e) {
            console.warn('JSON parse error', e);
          }
        }
      }
      buffer = parts[parts.length - 1];
    }
  }

  addMessageToChat(role, content) {
    const chatContainer = document.getElementById('streamingChatContainer');
    if (!chatContainer) return null;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role === 'user' ? 'user-message' : 'assistant-message'} mb-4`;
    
    messageDiv.innerHTML = `
      <div class="flex ${role === 'user' ? 'justify-end' : 'justify-start'}">
        <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          role === 'user' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-700 text-gray-100'
        }">
          <div class="font-semibold text-sm mb-1">${role === 'user' ? 'You' : 'DeepSeek AI'}</div>
          <div class="message-content">${content}</div>
        </div>
      </div>
    `;

    chatContainer.appendChild(messageDiv);
    this.scrollToBottom();
    return messageDiv;
  }

  updateStreamingStatus(isActive) {
    const statusElement = document.getElementById('streamingStatus');
    const startBtn = document.getElementById('startStreaming');
    const stopBtn = document.getElementById('stopStreaming');

    if (statusElement) {
      statusElement.textContent = isActive ? 'Streaming...' : 'Ready';
      statusElement.className = isActive 
        ? 'text-green-400 animate-pulse' 
        : 'text-gray-400';
    }

    if (startBtn) startBtn.disabled = isActive;
    if (stopBtn) stopBtn.disabled = !isActive;
  }

  stopStreaming() {
    if (this.currentController) {
      this.currentController.abort();
      this.currentController = null;
    }
    this.isStreaming = false;
    this.updateStreamingStatus(false);
  }

  clearChat() {
    const chatContainer = document.getElementById('streamingChatContainer');
    if (chatContainer) {
      chatContainer.innerHTML = '';
    }
  }

  scrollToBottom() {
    const chatContainer = document.getElementById('streamingChatContainer');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  async startStreaming() {
    const testMessage = document.getElementById('streamingMessageInput')?.value || 
                       'Hello! Can you help me build an AI-powered application?';
    
    await this.streamChatResponse([{ role: 'user', content: testMessage }]);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.realStreaming = new RealDeepSeekStreaming();
  console.log('[REAL-STREAMING] Initialized with DeepSeek API integration');
});