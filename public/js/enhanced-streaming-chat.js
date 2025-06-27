/**
 * Enhanced Real-time Streaming Chat for DeepSeek AI
 * Implements proper DeepSeek API streaming format with token-by-token delivery
 */

class EnhancedStreamingChatHandler {
    constructor() {
        this.isStreaming = false;
        this.abortController = null;
    }

    /**
     * Stream chat response using DeepSeek API format
     * @param {Array} messages - Chat messages array
     * @param {Function} onToken - Callback for each token
     * @param {Function} onComplete - Callback when streaming completes
     * @param {Function} onError - Callback for errors
     */
    async streamChatResponse(messages, onToken, onComplete, onError) {
        if (this.isStreaming) {
            throw new Error('Already streaming a response');
        }

        this.isStreaming = true;
        this.abortController = new AbortController();

        try {
            const response = await fetch('/api/chat/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    messages: messages,
                    model: 'deepseek-chat',
                    temperature: 0.7,
                    stream: true
                }),
                signal: this.abortController.signal
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
            let fullContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const parts = buffer.split('\n\n');

                for (let i = 0; i < parts.length - 1; i++) {
                    const part = parts[i].trim();
                    if (part.startsWith('data:')) {
                        const jsonStr = part.slice(5).trim();
                        if (jsonStr === '[DONE]') {
                            onComplete(fullContent);
                            return;
                        }
                        
                        try {
                            const parsed = JSON.parse(jsonStr);
                            const token = parsed.choices?.[0]?.delta?.content;
                            if (token) {
                                fullContent += token;
                                onToken(token);
                            }
                        } catch (e) {
                            console.warn('JSON parse error:', e);
                        }
                    }
                }
                buffer = parts[parts.length - 1];
            }

            // Complete with accumulated content if no [DONE] signal
            onComplete(fullContent);

        } catch (error) {
            if (error.name === 'AbortError') {
                onError(new Error('Stream was cancelled'));
            } else {
                onError(error);
            }
        } finally {
            this.isStreaming = false;
            this.abortController = null;
        }
    }

    /**
     * Cancel ongoing stream
     */
    cancelStream() {
        if (this.isStreaming && this.abortController) {
            this.abortController.abort();
        }
    }

    /**
     * Check if currently streaming
     */
    isCurrentlyStreaming() {
        return this.isStreaming;
    }
}

/**
 * Enhanced DeepSeek Chat Interface with Real-time Streaming
 */
class DeepSeekStudioChat {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.streamHandler = new EnhancedStreamingChatHandler();
        this.messages = [];
        this.currentResponseElement = null;
        this.typingIndicator = null;
        this.init();
    }

    init() {
        if (!this.container) {
            console.error('Chat container not found');
            return;
        }
        
        this.createChatInterface();
        this.setupEventListeners();
        this.addWelcomeMessage();
    }

    createChatInterface() {
        this.container.innerHTML = `
            <div class="deepseek-chat-container bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl h-[600px] flex flex-col border border-gray-700">
                <!-- Header -->
                <div class="chat-header bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-t-xl">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-xl font-bold text-white">DeepSeek Studio</h3>
                            <p class="text-blue-100 text-sm">Real-time AI Assistant with Platform Knowledge</p>
                        </div>
                        <div class="flex items-center space-x-2">
                            <div class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                            <span class="text-white text-xs">Live</span>
                        </div>
                    </div>
                </div>
                
                <!-- Messages Area -->
                <div id="chatMessages" class="chat-messages flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                    <!-- Messages will be added here -->
                </div>
                
                <!-- Typing Indicator -->
                <div id="typingIndicator" class="typing-indicator-container px-4 hidden">
                    <div class="flex items-center space-x-2 text-gray-400">
                        <div class="flex space-x-1">
                            <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                            <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                            <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                        </div>
                        <span class="text-sm">DeepSeek is thinking...</span>
                    </div>
                </div>
                
                <!-- Input Area -->
                <div class="chat-input-area p-4 bg-gray-800 rounded-b-xl border-t border-gray-700">
                    <div class="flex space-x-3">
                        <div class="flex-1 relative">
                            <textarea 
                                id="chatInput" 
                                placeholder="Ask about development, APIs, features, or get code examples..."
                                class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                rows="1"
                            ></textarea>
                        </div>
                        <button 
                            id="sendButton" 
                            class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 flex items-center space-x-2"
                        >
                            <span>Send</span>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                            </svg>
                        </button>
                        <button 
                            id="cancelButton" 
                            class="bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg font-medium text-white transition-all duration-200 hidden"
                        >
                            Cancel
                        </button>
                    </div>
                    
                    <!-- Quick Actions -->
                    <div class="flex space-x-2 mt-3">
                        <button class="quick-action-btn" data-prompt="Create a React component with TypeScript">React + TS</button>
                        <button class="quick-action-btn" data-prompt="Set up user authentication">Auth Setup</button>
                        <button class="quick-action-btn" data-prompt="Build a REST API with Express">Express API</button>
                        <button class="quick-action-btn" data-prompt="Configure database with Drizzle ORM">Database</button>
                    </div>
                </div>
            </div>
        `;

        // Add CSS for quick action buttons
        const style = document.createElement('style');
        style.textContent = `
            .quick-action-btn {
                background: linear-gradient(135deg, #374151 0%, #4B5563 100%);
                color: #D1D5DB;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 12px;
                border: 1px solid #6B7280;
                transition: all 0.2s;
                cursor: pointer;
            }
            .quick-action-btn:hover {
                background: linear-gradient(135deg, #4B5563 0%, #6B7280 100%);
                color: white;
                border-color: #9CA3AF;
            }
            .message-content pre {
                background: #1F2937;
                padding: 12px;
                border-radius: 8px;
                overflow-x: auto;
                border: 1px solid #374151;
            }
            .message-content code {
                background: #374151;
                padding: 2px 6px;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        const chatInput = this.container.querySelector('#chatInput');
        const sendButton = this.container.querySelector('#sendButton');
        const cancelButton = this.container.querySelector('#cancelButton');
        const quickActionBtns = this.container.querySelectorAll('.quick-action-btn');

        sendButton.addEventListener('click', () => this.sendMessage());
        cancelButton.addEventListener('click', () => this.cancelMessage());
        
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        chatInput.addEventListener('input', () => {
            chatInput.style.height = 'auto';
            chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
        });

        // Quick action buttons
        quickActionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                chatInput.value = btn.dataset.prompt;
                chatInput.focus();
            });
        });
    }

    addWelcomeMessage() {
        this.addMessage('assistant', 
            'Hello! I\'m your DeepSeek AI assistant with access to comprehensive platform documentation for Replit, Lovable, Cursor, Bolt, and Windsurf.\n\n' +
            'I can help you with:\n' +
            '• Code generation and debugging\n' +
            '• API integration and setup\n' +
            '• Architecture and best practices\n' +
            '• Platform-specific features\n\n' +
            'Try the quick actions below or ask me anything!'
        );
    }

    async sendMessage() {
        const chatInput = this.container.querySelector('#chatInput');
        const sendButton = this.container.querySelector('#sendButton');
        const cancelButton = this.container.querySelector('#cancelButton');
        const messagesContainer = this.container.querySelector('#chatMessages');
        const typingIndicator = this.container.querySelector('#typingIndicator');

        const message = chatInput.value.trim();
        if (!message || this.streamHandler.isCurrentlyStreaming()) return;

        // Add user message
        this.addMessage('user', message);
        this.messages.push({ role: 'user', content: message });

        // Clear input and update UI
        chatInput.value = '';
        chatInput.style.height = 'auto';
        sendButton.disabled = true;
        sendButton.innerHTML = '<span>Streaming...</span><div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>';
        cancelButton.classList.remove('hidden');

        // Show typing indicator
        typingIndicator.classList.remove('hidden');

        // Create response message element
        this.currentResponseElement = this.addMessage('assistant', '', true);

        try {
            await this.streamHandler.streamChatResponse(
                this.messages,
                (token) => {
                    // Hide typing indicator on first token
                    if (typingIndicator.classList.contains('hidden') === false) {
                        typingIndicator.classList.add('hidden');
                    }
                    
                    // Add token to current response
                    this.currentResponseElement.textContent += token;
                    this.formatMessageContent(this.currentResponseElement);
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                },
                (fullContent) => {
                    // Complete response
                    this.messages.push({ role: 'assistant', content: fullContent });
                    this.formatMessageContent(this.currentResponseElement);
                    this.resetUI();
                },
                (error) => {
                    // Handle error
                    this.currentResponseElement.innerHTML = `
                        <div class="text-red-400 bg-red-900/20 p-3 rounded border border-red-500">
                            <strong>Error:</strong> ${error.message}
                        </div>
                    `;
                    typingIndicator.classList.add('hidden');
                    this.resetUI();
                }
            );
        } catch (error) {
            this.currentResponseElement.innerHTML = `
                <div class="text-red-400 bg-red-900/20 p-3 rounded border border-red-500">
                    <strong>Error:</strong> ${error.message}
                </div>
            `;
            typingIndicator.classList.add('hidden');
            this.resetUI();
        }
    }

    cancelMessage() {
        this.streamHandler.cancelStream();
        const typingIndicator = this.container.querySelector('#typingIndicator');
        
        if (this.currentResponseElement) {
            this.currentResponseElement.innerHTML += `
                <div class="text-yellow-400 mt-2 font-italic">
                    [Stream cancelled by user]
                </div>
            `;
        }
        
        typingIndicator.classList.add('hidden');
        this.resetUI();
    }

    addMessage(role, content, isStreaming = false) {
        const messagesContainer = this.container.querySelector('#chatMessages');
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role} flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = `message-content max-w-[80%] p-4 rounded-lg ${
            role === 'user' 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white ml-8' 
                : 'bg-gray-700 text-gray-100 mr-8 border border-gray-600'
        }`;
        
        if (isStreaming) {
            contentDiv.innerHTML = '<span class="animate-pulse">●●●</span>';
        } else {
            contentDiv.textContent = content;
            this.formatMessageContent(contentDiv);
        }
        
        messageDiv.appendChild(contentDiv);
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        return contentDiv;
    }

    formatMessageContent(element) {
        let content = element.textContent;
        
        // Format code blocks
        content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code class="language-${lang || 'text'}">${this.escapeHtml(code.trim())}</code></pre>`;
        });
        
        // Format inline code
        content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Format bold text
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Format bullet points
        content = content.replace(/^• (.+)$/gm, '<li>$1</li>');
        if (content.includes('<li>')) {
            content = content.replace(/(<li>.*<\/li>)/s, '<ul class="list-disc list-inside space-y-1 mt-2">$1</ul>');
        }
        
        // Convert newlines to breaks
        content = content.replace(/\n/g, '<br>');
        
        element.innerHTML = content;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    resetUI() {
        const sendButton = this.container.querySelector('#sendButton');
        const cancelButton = this.container.querySelector('#cancelButton');
        const typingIndicator = this.container.querySelector('#typingIndicator');
        
        sendButton.disabled = false;
        sendButton.innerHTML = '<span>Send</span><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>';
        cancelButton.classList.add('hidden');
        typingIndicator.classList.add('hidden');
        this.currentResponseElement = null;
    }

    clearChat() {
        this.messages = [];
        const messagesContainer = this.container.querySelector('#chatMessages');
        messagesContainer.innerHTML = '';
        this.addWelcomeMessage();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const enhancedChatContainer = document.getElementById('enhancedStreamingChat');
    if (enhancedChatContainer) {
        window.deepSeekStudioChat = new DeepSeekStudioChat('enhancedStreamingChat');
    }
});

// Export for global use
window.EnhancedStreamingChatHandler = EnhancedStreamingChatHandler;
window.DeepSeekStudioChat = DeepSeekStudioChat;