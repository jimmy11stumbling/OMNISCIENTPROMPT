// Real-time WebSocket client for interface updates and validation
class RealTimeClient {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.callbacks = new Map();
        
        this.connect();
    }

    connect() {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws`;
            
            console.log('[REAL-TIME] Connecting to:', wsUrl);
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('[REAL-TIME] Connected to validation server');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.updateConnectionStatus(true);
                
                // Show connection notification
                this.showNotification('Real-time monitoring connected', 'success');
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('[REAL-TIME] Error parsing message:', error);
                }
            };

            this.ws.onclose = () => {
                console.log('[REAL-TIME] Connection closed');
                this.isConnected = false;
                this.updateConnectionStatus(false);
                this.attemptReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('[REAL-TIME] WebSocket error:', error);
                this.isConnected = false;
                this.updateConnectionStatus(false);
            };

        } catch (error) {
            console.error('[REAL-TIME] Connection failed:', error);
            this.attemptReconnect();
        }
    }

    handleMessage(data) {
        console.log('[REAL-TIME] Received:', data.type, data);
        
        switch (data.type) {
            case 'connection':
                this.handleConnection(data);
                break;
            case 'metrics':
                this.handleMetrics(data.data);
                break;
            case 'rag_search':
                this.handleRagSearch(data.data);
                break;
            case 'chat_start':
                this.handleChatStart(data.data);
                break;
            case 'chat_response':
                this.handleChatResponse(data.data);
                break;
            case 'chat_error':
                this.handleChatError(data.data);
                break;
            case 'chat_fallback':
                this.handleChatFallback(data.data);
                break;
            case 'prompt_generation_start':
                this.handlePromptStart(data.data);
                break;
            case 'prompt_generated':
                this.handlePromptGenerated(data.data);
                break;
            case 'prompt_error':
                this.handlePromptError(data.data);
                break;
            default:
                console.log('[REAL-TIME] Unknown message type:', data.type);
        }
        
        // Trigger registered callbacks
        if (this.callbacks.has(data.type)) {
            this.callbacks.get(data.type).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('[REAL-TIME] Callback error:', error);
                }
            });
        }
    }

    handleConnection(data) {
        console.log('[REAL-TIME] Connection confirmed:', data);
        this.showNotification('Real-time validation active', 'success');
    }

    handleMetrics(metrics) {
        // Update dashboard metrics in real-time
        if (document.getElementById('totalPrompts')) {
            document.getElementById('totalPrompts').textContent = metrics.apiCalls || 0;
        }
        if (document.getElementById('ragQueries')) {
            document.getElementById('ragQueries').textContent = metrics.ragQueries || 0;
        }
        if (document.getElementById('successRate')) {
            document.getElementById('successRate').textContent = 
                `${((metrics.successRate || 0) * 100).toFixed(1)}%`;
        }
        if (document.getElementById('avgResponseTime')) {
            document.getElementById('avgResponseTime').textContent = 
                `${Math.round(metrics.avgResponseTime || 0)}ms`;
        }
    }

    handleRagSearch(data) {
        console.log('[RAG-VALIDATION] Search completed:', data);
        this.showNotification(
            `RAG search: ${data.resultsCount} results in ${data.searchTime}ms`, 
            'info'
        );
        
        // Update RAG context display if available
        if (document.getElementById('ragContext')) {
            const ragElement = document.getElementById('ragContext');
            ragElement.innerHTML = `
                <div class="text-xs font-medium text-gray-400 mb-2">Latest RAG Query:</div>
                <div class="text-xs text-green-400">✓ "${data.query}" → ${data.resultsCount} results (${data.searchTime}ms)</div>
            `;
        }
    }

    handleChatStart(data) {
        console.log('[CHAT-VALIDATION] Session started:', data);
        this.showActivityIndicator('Processing chat message...');
    }

    handleChatResponse(data) {
        console.log('[CHAT-VALIDATION] Response received:', data);
        this.hideActivityIndicator();
        this.showNotification(
            `Chat response: ${data.tokensUsed} tokens in ${data.responseTime}ms`, 
            'success'
        );
        
        // Update chat metrics
        this.updateChatMetrics(data);
    }

    handleChatError(data) {
        console.error('[CHAT-VALIDATION] Error:', data);
        this.hideActivityIndicator();
        this.showNotification(`Chat error: ${data.error}`, 'error');
    }

    handleChatFallback(data) {
        console.log('[CHAT-VALIDATION] Fallback mode:', data);
        this.hideActivityIndicator();
        this.showNotification(
            `Fallback response in ${data.responseTime}ms`, 
            'warning'
        );
    }

    handlePromptStart(data) {
        console.log('[PROMPT-VALIDATION] Generation started:', data);
        this.showActivityIndicator('Generating comprehensive prompt...');
    }

    handlePromptGenerated(data) {
        console.log('[PROMPT-VALIDATION] Generated successfully:', data);
        this.hideActivityIndicator();
        this.showNotification(
            `Prompt generated: ${data.tokensUsed} tokens in ${data.apiTime}ms`, 
            'success'
        );
        
        // Update generation metrics
        this.updatePromptMetrics(data);
    }

    handlePromptError(data) {
        console.error('[PROMPT-VALIDATION] Error:', data);
        this.hideActivityIndicator();
        this.showNotification(`Prompt generation error: ${data.error}`, 'error');
    }

    updateConnectionStatus(connected) {
        const indicators = document.querySelectorAll('#connectionStatus, #connectionIndicator');
        indicators.forEach(indicator => {
            if (indicator) {
                const dot = indicator.querySelector('div');
                const text = indicator.querySelector('span');
                
                if (dot && text) {
                    if (connected) {
                        dot.className = 'w-2 h-2 bg-green-500 rounded-full animate-pulse';
                        text.textContent = 'Connected';
                    } else {
                        dot.className = 'w-2 h-2 bg-red-500 rounded-full animate-pulse';
                        text.textContent = 'Disconnected';
                    }
                }
            }
        });
    }

    showActivityIndicator(message) {
        // Create or update activity indicator
        let indicator = document.getElementById('activityIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'activityIndicator';
            indicator.className = 'fixed top-20 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center space-x-2';
            document.body.appendChild(indicator);
        }
        
        indicator.innerHTML = `
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>${message}</span>
        `;
        indicator.style.display = 'flex';
    }

    hideActivityIndicator() {
        const indicator = document.getElementById('activityIndicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    showNotification(message, type = 'info') {
        const colors = {
            success: 'bg-green-600',
            error: 'bg-red-600',
            warning: 'bg-yellow-600',
            info: 'bg-blue-600'
        };
        
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-4 py-2 rounded-lg shadow-lg z-50 transform transition-all duration-300`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    updateChatMetrics(data) {
        // Update chat-specific metrics in the interface
        if (window.chatMetrics) {
            window.chatMetrics.push(data);
            
            // Keep only last 100 entries
            if (window.chatMetrics.length > 100) {
                window.chatMetrics = window.chatMetrics.slice(-100);
            }
        } else {
            window.chatMetrics = [data];
        }
    }

    updatePromptMetrics(data) {
        // Update prompt generation metrics
        if (window.promptMetrics) {
            window.promptMetrics.push(data);
            
            // Keep only last 100 entries
            if (window.promptMetrics.length > 100) {
                window.promptMetrics = window.promptMetrics.slice(-100);
            }
        } else {
            window.promptMetrics = [data];
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`[REAL-TIME] Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            
            setTimeout(() => {
                if (!this.isConnected) {
                    this.connect();
                }
            }, this.reconnectDelay * this.reconnectAttempts);
        } else {
            console.error('[REAL-TIME] Max reconnection attempts reached');
            this.showNotification('Real-time monitoring disconnected', 'error');
        }
    }

    // Subscribe to specific message types
    on(messageType, callback) {
        if (!this.callbacks.has(messageType)) {
            this.callbacks.set(messageType, []);
        }
        this.callbacks.get(messageType).push(callback);
    }

    // Unsubscribe from message types
    off(messageType, callback) {
        if (this.callbacks.has(messageType)) {
            const callbacks = this.callbacks.get(messageType);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    // Send message if connected
    send(data) {
        if (this.isConnected && this.ws) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.warn('[REAL-TIME] Cannot send message - not connected');
        }
    }
}

// Initialize real-time client when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.realTimeClient = new RealTimeClient();
    
    // Global metrics arrays for tracking
    window.chatMetrics = [];
    window.promptMetrics = [];
    
    console.log('[REAL-TIME] Client initialized and validation system active');
});