/**
 * DeepSeek Real-Time Streaming Integration
 * Complete implementation with token-by-token delivery
 */

class DeepSeekStreaming {
  constructor() {
    this.isStreaming = false;
    this.currentController = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // Chat form submission
    const chatForm = document.getElementById('chatForm');
    if (chatForm) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleChatSubmission();
      });
    }

    // Stop streaming button
    const stopButton = document.getElementById('stopStreaming');
    if (stopButton) {
      stopButton.addEventListener('click', () => {
        this.stopStreaming();
      });
    }
  }

  async handleChatSubmission() {
    const messageInput = document.getElementById('messageInput');
    const chatContainer = document.getElementById('chatContainer');
    
    if (!messageInput || !chatContainer) return;

    const message = messageInput.value.trim();
    if (!message) return;

    // Add user message to chat
    this.addMessageToChat('user', message);
    messageInput.value = '';

    // Start streaming response
    await this.streamChatResponse(message);
  }

  async streamChatResponse(message) {
    if (this.isStreaming) return;

    this.isStreaming = true;
    this.updateStreamingStatus(true);

    const responseElement = this.addMessageToChat('assistant', '');
    const contentElement = responseElement.querySelector('.message-content');

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response stream available');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (this.isStreaming) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Process complete lines, keep partial line in buffer
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              this.isStreaming = false;
              break;
            }

            try {
              const parsed = JSON.parse(data);
              const token = parsed.choices?.[0]?.delta?.content;
              
              if (token) {
                this.appendTokenToMessage(contentElement, token);
              }
            } catch (e) {
              console.warn('JSON parse error:', e);
            }
          }
        }
        
        buffer = lines[lines.length - 1];
      }

      this.retryCount = 0;
    } catch (error) {
      console.error('Streaming error:', error);
      this.handleStreamingError(contentElement, error);
    } finally {
      this.isStreaming = false;
      this.updateStreamingStatus(false);
    }
  }

  addMessageToChat(role, content) {
    const chatContainer = document.getElementById('chatContainer');
    if (!chatContainer) return null;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message mb-4 p-4 rounded-lg`;
    messageDiv.innerHTML = `
      <div class="message-header flex items-center mb-2">
        <div class="avatar w-8 h-8 rounded-full mr-3 ${role === 'user' ? 'bg-blue-600' : 'bg-green-600'} flex items-center justify-center">
          <span class="text-white text-sm font-bold">${role === 'user' ? 'U' : 'AI'}</span>
        </div>
        <span class="font-medium text-gray-300">${role === 'user' ? 'You' : 'DeepSeek AI'}</span>
        <span class="text-xs text-gray-500 ml-auto">${new Date().toLocaleTimeString()}</span>
      </div>
      <div class="message-content text-gray-100 whitespace-pre-wrap">${content}</div>
    `;

    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return messageDiv;
  }

  appendTokenToMessage(contentElement, token) {
    if (!contentElement) return;
    
    contentElement.textContent += token;
    
    // Auto-scroll to bottom
    const chatContainer = document.getElementById('chatContainer');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  handleStreamingError(contentElement, error) {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      if (contentElement) {
        contentElement.textContent = `Connection issue, retrying... (${this.retryCount}/${this.maxRetries})`;
      }
      
      setTimeout(() => {
        const lastMessage = this.getLastUserMessage();
        if (lastMessage) {
          this.streamChatResponse(lastMessage);
        }
      }, 2000 * this.retryCount);
    } else {
      if (contentElement) {
        contentElement.textContent = `Sorry, I'm having trouble connecting to the AI service. Please try again later. Error: ${error.message}`;
      }
      this.retryCount = 0;
    }
  }

  stopStreaming() {
    this.isStreaming = false;
    if (this.currentController) {
      this.currentController.abort();
      this.currentController = null;
    }
    this.updateStreamingStatus(false);
  }

  updateStreamingStatus(isStreaming) {
    const stopButton = document.getElementById('stopStreaming');
    const sendButton = document.getElementById('sendMessage');
    const statusIndicator = document.getElementById('streamingStatus');

    if (stopButton) {
      stopButton.style.display = isStreaming ? 'block' : 'none';
    }

    if (sendButton) {
      sendButton.disabled = isStreaming;
      sendButton.textContent = isStreaming ? 'Streaming...' : 'Send';
    }

    if (statusIndicator) {
      statusIndicator.textContent = isStreaming ? 'AI is responding...' : 'Ready';
      statusIndicator.className = isStreaming ? 'text-yellow-400' : 'text-green-400';
    }
  }

  getLastUserMessage() {
    const userMessages = document.querySelectorAll('.user-message .message-content');
    return userMessages.length > 0 ? userMessages[userMessages.length - 1].textContent : null;
  }

  clearChat() {
    const chatContainer = document.getElementById('chatContainer');
    if (chatContainer) {
      chatContainer.innerHTML = '';
    }
  }
}

// Initialize streaming when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.deepSeekStreaming = new DeepSeekStreaming();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DeepSeekStreaming;
}