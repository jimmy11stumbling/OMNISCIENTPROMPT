/**
 * Chat Interface for DeepSeek AI Platform
 * Real-time chat functionality with streaming responses
 */

class ChatInterface {
    constructor() {
        this.messages = [];
        this.isStreaming = false;
        this.currentStreamingMessage = null;
        this.sessionStartTime = Date.now();
        this.tokenCount = 0;
        this.messageCount = 0;
        
        this.initializeElements();
        this.setupEventListeners();
        this.startSessionTimer();
        this.checkApiStatus();
    }

    initializeElements() {
        // Core elements
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.chatForm = document.getElementById('chatForm');
        
        // Controls
        this.clearBtn = document.getElementById('clearChat');
        this.useReasoning = document.getElementById('useReasoning');
        this.contextPlatform = document.getElementById('contextPlatform');
        
        // Indicators
        this.streamingIndicator = document.getElementById('streamingIndicator');
        this.tokenCounter = document.getElementById('tokenCounter');
        this.charCounter = document.getElementById('charCounter');
        
        // Stats
        this.messageCountEl = document.getElementById('messageCount');
        this.tokenCountEl = document.getElementById('tokenCount');
        this.sessionTimeEl = document.getElementById('sessionTime');
        this.apiStatus = document.getElementById('apiStatus');
    }

    setupEventListeners() {
        // Form submission
        this.chatForm.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Input handling
        this.messageInput.addEventListener('input', () => this.updateCharCounter());
        this.messageInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Controls
        this.clearBtn.addEventListener('click', () => this.clearChat());
        
        // Quick actions
        document.querySelectorAll('.quick-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const prompt = e.target.dataset.prompt;
                this.messageInput.value = prompt;
                this.updateCharCounter();
                this.messageInput.focus();
            });
        });
    }

    handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSubmit(e);
        }
    }

    updateCharCounter() {
        const length = this.messageInput.value.length;
        this.charCounter.textContent = `${length}/4000`;
        
        if (length > 3500) {
            this.charCounter.className = 'text-xs text-red-400';
        } else if (length > 3000) {
            this.charCounter.className = 'text-xs text-yellow-400';
        } else {
            this.charCounter.className = 'text-xs text-gray-500';
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.isStreaming) return;
        
        const message = this.messageInput.value.trim();
        if (!message) return;
        
        // Add user message
        this.addMessage('user', message);
        this.messageInput.value = '';
        this.updateCharCounter();
        
        // Start streaming response
        await this.sendMessage(message);
    }

    async sendMessage(message) {
        this.isStreaming = true;
        this.updateSendButton(true);
        this.showStreamingIndicator();
        
        try {
            const platform = this.contextPlatform.value || null;
            const useReasoning = this.useReasoning.checked;
            
            // Create assistant message placeholder
            const assistantMessage = this.addMessage('assistant', '');
            this.currentStreamingMessage = assistantMessage;
            
            const response = await fetch('/api/chat/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: message }],
                    platform: platform,
                    reasoning: useReasoning
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            await this.handleStreamingResponse(response);
            
        } catch (error) {
            console.error('Chat error:', error);
            this.addMessage('system', `Error: ${error.message}`);
        } finally {
            this.isStreaming = false;
            this.updateSendButton(false);
            this.hideStreamingIndicator();
            this.currentStreamingMessage = null;
        }
    }

    async handleStreamingResponse(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let tokenCount = 0;

        while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    
                    if (data === '[DONE]') {
                        return;
                    }
                    
                    try {
                        const chunk = JSON.parse(data);
                        if (chunk.choices?.[0]?.delta?.content) {
                            const content = chunk.choices[0].delta.content;
                            this.appendToCurrentMessage(content);
                            tokenCount++;
                            this.updateTokenCounter(tokenCount);
                        }
                    } catch (e) {
                        // Handle non-JSON chunks
                        if (data.trim()) {
                            this.appendToCurrentMessage(data);
                            tokenCount++;
                            this.updateTokenCounter(tokenCount);
                        }
                    }
                }
            }
        }
    }

    addMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const roleColors = {
            user: 'bg-blue-900/30 border-blue-800',
            assistant: 'bg-gray-800 border-gray-700',
            system: 'bg-red-900/30 border-red-800'
        };
        
        const roleIcons = {
            user: '👤',
            assistant: '🤖',
            system: '⚠️'
        };
        
        messageDiv.innerHTML = `
            <div class="flex space-x-3 p-4 rounded-lg border ${roleColors[role]}">
                <div class="flex-shrink-0 text-lg">${roleIcons[role]}</div>
                <div class="flex-1">
                    <div class="font-medium text-sm mb-1 capitalize">${role}</div>
                    <div class="message-content text-gray-300 whitespace-pre-wrap">${this.escapeHtml(content)}</div>
                    <div class="text-xs text-gray-500 mt-2">${new Date().toLocaleTimeString()}</div>
                </div>
            </div>
        `;
        
        // Remove empty state if present
        const emptyState = this.messagesContainer.querySelector('.text-center');
        if (emptyState) {
            emptyState.remove();
        }
        
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Update stats
        if (role === 'user' || role === 'assistant') {
            this.messageCount++;
            this.updateStats();
        }
        
        return messageDiv.querySelector('.message-content');
    }

    appendToCurrentMessage(content) {
        if (this.currentStreamingMessage) {
            this.currentStreamingMessage.textContent += content;
            this.scrollToBottom();
        }
    }

    showStreamingIndicator() {
        this.streamingIndicator.classList.remove('hidden');
    }

    hideStreamingIndicator() {
        this.streamingIndicator.classList.add('hidden');
        this.tokenCounter.textContent = '';
    }

    updateTokenCounter(count) {
        this.tokenCounter.textContent = `${count} tokens`;
        this.tokenCount += count;
        this.updateStats();
    }

    updateSendButton(disabled) {
        this.sendBtn.disabled = disabled;
        this.sendBtn.textContent = disabled ? 'Sending...' : 'Send';
    }

    clearChat() {
        this.messages = [];
        this.messageCount = 0;
        this.tokenCount = 0;
        this.messagesContainer.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <div class="text-4xl mb-2">💬</div>
                <p>Start a conversation with DeepSeek AI</p>
                <p class="text-sm mt-1">Ask anything - from coding help to creative brainstorming</p>
            </div>
        `;
        this.updateStats();
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    updateStats() {
        this.messageCountEl.textContent = this.messageCount;
        this.tokenCountEl.textContent = this.tokenCount;
    }

    startSessionTimer() {
        setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.sessionStartTime) / 60000);
            this.sessionTimeEl.textContent = `${elapsed}m`;
        }, 60000);
    }

    async checkApiStatus() {
        try {
            const response = await fetch('/api/status');
            const status = await response.json();
            
            if (status.deepseek?.available) {
                this.apiStatus.className = 'px-2 py-1 rounded bg-green-600 text-white text-xs';
                this.apiStatus.textContent = 'API Ready';
            } else {
                this.apiStatus.className = 'px-2 py-1 rounded bg-yellow-600 text-white text-xs';
                this.apiStatus.textContent = 'Demo Mode';
            }
        } catch (error) {
            this.apiStatus.className = 'px-2 py-1 rounded bg-red-600 text-white text-xs';
            this.apiStatus.textContent = 'API Error';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize chat interface when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('messagesContainer')) {
        new ChatInterface();
    }
});