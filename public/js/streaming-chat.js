/**
 * Real-time Streaming Chat Implementation for DeepSeek AI
 * Handles token-by-token streaming responses with proper error handling
 */

class StreamingChatHandler {
    constructor() {
        this.isStreaming = false;
        this.currentEventSource = null;
        this.abortController = null;
    }

    /**
     * Stream chat response with real-time token updates
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
                body: JSON.stringify({ messages }),
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
                const lines = buffer.split('\n');
                
                for (let i = 0; i < lines.length - 1; i++) {
                    const line = lines[i].trim();
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            
                            if (data.error) {
                                onError(new Error(data.error));
                                return;
                            }
                            
                            if (data.token) {
                                fullContent += data.token;
                                onToken(data.token);
                            }
                            
                            if (data.complete) {
                                onComplete(data.content || fullContent);
                                return;
                            }
                        } catch (parseError) {
                            console.warn('Failed to parse streaming data:', parseError);
                        }
                    }
                }
                
                buffer = lines[lines.length - 1];
            }
            
            // If we reach here without completion signal, complete with what we have
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
 * Enhanced Chat Interface with Streaming Support
 */
class DeepSeekStreamingChat {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.streamHandler = new StreamingChatHandler();
        this.messages = [];
        this.currentResponseElement = null;
        this.init();
    }

    init() {
        if (!this.container) {
            console.error('Chat container not found');
            return;
        }
        
        this.createChatInterface();
        this.setupEventListeners();
    }

    createChatInterface() {
        this.container.innerHTML = `
            <div class="streaming-chat-container bg-gray-800 rounded-lg p-6 h-96 flex flex-col">
                <div class="chat-header mb-4">
                    <h3 class="text-lg font-medium text-white">DeepSeek AI Assistant</h3>
                    <p class="text-sm text-gray-400">Real-time streaming responses</p>
                </div>
                
                <div id="chatMessages" class="chat-messages flex-1 overflow-y-auto bg-gray-900 rounded p-4 mb-4 space-y-3">
                    <div class="message assistant">
                        <div class="message-content text-gray-300">
                            Hello! I'm your DeepSeek AI assistant with access to comprehensive platform documentation. How can I help you build your application today?
                        </div>
                    </div>
                </div>
                
                <div class="chat-input-container">
                    <div class="flex space-x-2">
                        <input 
                            type="text" 
                            id="chatInput" 
                            placeholder="Ask about development, features, APIs, or anything else..."
                            class="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                        <button 
                            id="sendButton" 
                            class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-md font-medium text-white"
                        >
                            Send
                        </button>
                        <button 
                            id="cancelButton" 
                            class="bg-red-600 hover:bg-red-700 px-4 py-3 rounded-md font-medium text-white hidden"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const chatInput = this.container.querySelector('#chatInput');
        const sendButton = this.container.querySelector('#sendButton');
        const cancelButton = this.container.querySelector('#cancelButton');

        sendButton.addEventListener('click', () => this.sendMessage());
        cancelButton.addEventListener('click', () => this.cancelMessage());
        
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    async sendMessage() {
        const chatInput = this.container.querySelector('#chatInput');
        const sendButton = this.container.querySelector('#sendButton');
        const cancelButton = this.container.querySelector('#cancelButton');
        const messagesContainer = this.container.querySelector('#chatMessages');

        const message = chatInput.value.trim();
        if (!message || this.streamHandler.isCurrentlyStreaming()) return;

        // Add user message
        this.addMessage('user', message);
        this.messages.push({ role: 'user', content: message });

        // Clear input and update UI
        chatInput.value = '';
        sendButton.disabled = true;
        sendButton.textContent = 'Streaming...';
        cancelButton.classList.remove('hidden');

        // Create response message element
        this.currentResponseElement = this.addMessage('assistant', '', true);

        try {
            await this.streamHandler.streamChatResponse(
                this.messages,
                (token) => {
                    // Add token to current response
                    this.currentResponseElement.textContent += token;
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                },
                (fullContent) => {
                    // Complete response
                    this.messages.push({ role: 'assistant', content: fullContent });
                    this.resetUI();
                },
                (error) => {
                    // Handle error
                    this.currentResponseElement.textContent = `Error: ${error.message}`;
                    this.currentResponseElement.classList.add('text-red-400');
                    this.resetUI();
                }
            );
        } catch (error) {
            this.currentResponseElement.textContent = `Error: ${error.message}`;
            this.currentResponseElement.classList.add('text-red-400');
            this.resetUI();
        }
    }

    cancelMessage() {
        this.streamHandler.cancelStream();
        if (this.currentResponseElement) {
            this.currentResponseElement.textContent += ' [Cancelled]';
            this.currentResponseElement.classList.add('text-yellow-400');
        }
        this.resetUI();
    }

    addMessage(role, content, isStreaming = false) {
        const messagesContainer = this.container.querySelector('#chatMessages');
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = `message-content ${
            role === 'user' 
                ? 'bg-blue-600 text-white ml-8 p-3 rounded-lg' 
                : 'text-gray-300 mr-8 p-3'
        }`;
        
        if (isStreaming) {
            contentDiv.innerHTML = '<span class="typing-indicator">●●●</span>';
            setTimeout(() => {
                contentDiv.innerHTML = '';
            }, 300);
        } else {
            contentDiv.textContent = content;
        }
        
        messageDiv.appendChild(contentDiv);
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        return contentDiv;
    }

    resetUI() {
        const sendButton = this.container.querySelector('#sendButton');
        const cancelButton = this.container.querySelector('#cancelButton');
        
        sendButton.disabled = false;
        sendButton.textContent = 'Send';
        cancelButton.classList.add('hidden');
        this.currentResponseElement = null;
    }

    clearChat() {
        this.messages = [];
        const messagesContainer = this.container.querySelector('#chatMessages');
        messagesContainer.innerHTML = `
            <div class="message assistant">
                <div class="message-content text-gray-300">
                    Hello! I'm your DeepSeek AI assistant with access to comprehensive platform documentation. How can I help you build your application today?
                </div>
            </div>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Auto-initialize if streaming chat container exists
    const streamingChatContainer = document.getElementById('streamingChatContainer');
    if (streamingChatContainer) {
        window.deepSeekStreamingChat = new DeepSeekStreamingChat('streamingChatContainer');
    }
});

// Export for use in other files
window.StreamingChatHandler = StreamingChatHandler;
window.DeepSeekStreamingChat = DeepSeekStreamingChat;