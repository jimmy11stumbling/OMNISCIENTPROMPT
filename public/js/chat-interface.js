
/**
 * Advanced Chat Interface for DeepSeek AI Platform
 * Features: Code formatting, copy buttons, reasoning display, and comprehensive chat management
 */

class AdvancedChatInterface {
    constructor() {
        this.messages = [];
        this.isStreaming = false;
        this.currentStreamingMessage = null;
        this.sessionStartTime = Date.now();
        this.tokenCount = 0;
        this.messageCount = 0;
        this.codeBlockCount = 0;
        this.responseTimes = [];
        this.currentResponseStart = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.startSessionTimer();
        this.checkApiStatus();
        this.loadUserPreferences();
    }

    initializeElements() {
        // Core elements
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.chatForm = document.getElementById('chatForm');
        
        // Controls
        this.clearBtn = document.getElementById('clearChat');
        this.useReasoning = document.getElementById('useReasoning');
        this.autoFormatCode = document.getElementById('autoFormatCode');
        this.enableSyntaxHighlight = document.getElementById('enableSyntaxHighlight');
        this.showTokenCount = document.getElementById('showTokenCount');
        this.contextPlatform = document.getElementById('contextPlatform');
        this.preferredLanguage = document.getElementById('preferredLanguage');
        
        // Indicators and counters
        this.streamingIndicator = document.getElementById('streamingIndicator');
        this.tokenCounter = document.getElementById('tokenCounter');
        this.responseTimer = document.getElementById('responseTimer');
        this.charCounter = document.getElementById('charCounter');
        this.wordCounter = document.getElementById('wordCounter');
        
        // Stats
        this.messageCountEl = document.getElementById('messageCount');
        this.tokenCountEl = document.getElementById('tokenCount');
        this.codeBlockCountEl = document.getElementById('codeBlockCount');
        this.sessionTimeEl = document.getElementById('sessionTime');
        this.avgResponseTimeEl = document.getElementById('avgResponseTime');
        this.apiStatus = document.getElementById('apiStatus');
        
        // Panels and modals
        this.reasoningPanel = document.getElementById('reasoningPanel');
        this.reasoningContent = document.getElementById('reasoningContent');
        this.settingsModal = document.getElementById('settingsModal');
        this.copyToast = document.getElementById('copyToast');
        
        // Buttons
        this.toggleReasoningView = document.getElementById('toggleReasoningView');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.exportChatBtn = document.getElementById('exportChatBtn');
        this.saveChatBtn = document.getElementById('saveChatBtn');
        this.loadChatBtn = document.getElementById('loadChatBtn');
        this.shareChatBtn = document.getElementById('shareChatBtn');
        
        // Input tools
        this.insertCodeBlock = document.getElementById('insertCodeBlock');
        this.insertQuote = document.getElementById('insertQuote');
        this.insertList = document.getElementById('insertList');
        this.voiceInput = document.getElementById('voiceInput');
    }

    setupEventListeners() {
        // Form submission
        this.chatForm.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Input handling
        this.messageInput.addEventListener('input', () => this.updateCounters());
        this.messageInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Control buttons
        this.clearBtn.addEventListener('click', () => this.clearChat());
        this.stopBtn.addEventListener('click', () => this.stopStreaming());
        this.toggleReasoningView.addEventListener('click', () => this.toggleReasoningPanel());
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.exportChatBtn.addEventListener('click', () => this.exportChat());
        this.saveChatBtn.addEventListener('click', () => this.saveChat());
        this.loadChatBtn.addEventListener('click', () => this.loadChat());
        this.shareChatBtn.addEventListener('click', () => this.shareChat());
        
        // Input tools
        this.insertCodeBlock.addEventListener('click', () => this.insertTemplate('```\n// Your code here\n```'));
        this.insertQuote.addEventListener('click', () => this.insertTemplate('> '));
        this.insertList.addEventListener('click', () => this.insertTemplate('1. \n2. \n3. '));
        this.voiceInput.addEventListener('click', () => this.startVoiceInput());
        
        // Settings modal
        document.getElementById('cancelSettings').addEventListener('click', () => this.closeSettings());
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
        
        // Quick actions
        document.querySelectorAll('.quick-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const prompt = e.target.dataset.prompt;
                this.messageInput.value = prompt;
                this.updateCounters();
                this.messageInput.focus();
            });
        });
        
        // Checkbox preferences
        [this.useReasoning, this.autoFormatCode, this.enableSyntaxHighlight, this.showTokenCount].forEach(checkbox => {
            checkbox.addEventListener('change', () => this.saveUserPreferences());
        });
        
        // Platform and language selection
        this.contextPlatform.addEventListener('change', () => this.saveUserPreferences());
        this.preferredLanguage.addEventListener('change', () => this.saveUserPreferences());
    }

    handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSubmit(e);
        } else if (e.key === 'Tab') {
            e.preventDefault();
            // Simple autocomplete suggestions could go here
        }
    }

    updateCounters() {
        const text = this.messageInput.value;
        const charLength = text.length;
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        
        this.charCounter.textContent = `${charLength}/8000`;
        this.wordCounter.textContent = `${wordCount} words`;
        
        // Update character counter color
        if (charLength > 7000) {
            this.charCounter.className = 'text-xs text-red-400';
        } else if (charLength > 6000) {
            this.charCounter.className = 'text-xs text-yellow-400';
        } else {
            this.charCounter.className = 'text-xs text-gray-500';
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.isStreaming) {
            this.stopStreaming();
            return;
        }
        
        const message = this.messageInput.value.trim();
        if (!message) return;
        
        // Add user message
        this.addMessage('user', message);
        this.messageInput.value = '';
        this.updateCounters();
        
        // Start streaming response
        await this.sendMessage(message);
    }

    async sendMessage(message) {
        this.isStreaming = true;
        this.currentResponseStart = Date.now();
        this.updateSendButton(true);
        this.showStreamingIndicator();
        
        try {
            const platform = this.contextPlatform.value || null;
            const useReasoning = this.useReasoning.checked;
            const language = this.preferredLanguage.value || null;
            
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
                    reasoning: useReasoning,
                    language: language,
                    preferences: this.getUserPreferences()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            await this.handleStreamingResponse(response);
            
        } catch (error) {
            console.error('Chat error:', error);
            this.addMessage('system', `❌ Error: ${error.message}`);
        } finally {
            this.isStreaming = false;
            this.updateSendButton(false);
            this.hideStreamingIndicator();
            this.currentStreamingMessage = null;
            this.recordResponseTime();
        }
    }

    async handleStreamingResponse(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let tokenCount = 0;
        let fullContent = '';

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
                        this.finalizeMessage(fullContent);
                        return;
                    }
                    
                    try {
                        const chunk = JSON.parse(data);
                        if (chunk.choices?.[0]?.delta?.content) {
                            const content = chunk.choices[0].delta.content;
                            this.appendToCurrentMessage(content);
                            fullContent += content;
                            tokenCount++;
                            this.updateTokenCounter(tokenCount);
                        }
                        
                        // Handle reasoning content
                        if (chunk.choices?.[0]?.message?.reasoning_content && this.useReasoning.checked) {
                            this.updateReasoningDisplay(chunk.choices[0].message.reasoning_content);
                        }
                    } catch (e) {
                        // Handle non-JSON chunks
                        if (data.trim()) {
                            this.appendToCurrentMessage(data);
                            fullContent += data;
                            tokenCount++;
                            this.updateTokenCounter(tokenCount);
                        }
                    }
                }
            }
        }
    }

    finalizeMessage(content) {
        if (this.autoFormatCode.checked) {
            this.formatCodeInMessage(this.currentStreamingMessage);
        }
        
        if (this.enableSyntaxHighlight.checked) {
            this.applySyntaxHighlighting(this.currentStreamingMessage);
        }
        
        this.addCopyButtons(this.currentStreamingMessage);
    }

    addMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role} mb-4`;
        
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
        
        const timestamp = new Date().toLocaleTimeString();
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        messageDiv.innerHTML = `
            <div class="flex space-x-3 p-4 rounded-lg border ${roleColors[role]}" data-message-id="${messageId}">
                <div class="flex-shrink-0 text-lg">${roleIcons[role]}</div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-2">
                        <div class="font-medium text-sm capitalize">${role}</div>
                        <div class="flex items-center space-x-2">
                            <span class="text-xs text-gray-500">${timestamp}</span>
                            ${role === 'assistant' ? `
                                <button class="copy-message-btn text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded" 
                                        data-copy-target="${messageId}">
                                    📋 Copy
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    <div class="message-content text-gray-300" data-content-id="${messageId}">${this.escapeHtml(content)}</div>
                    ${role === 'assistant' && this.showTokenCount.checked ? `
                        <div class="token-info text-xs text-gray-500 mt-2">
                            <span class="token-count">Tokens: 0</span>
                        </div>
                    ` : ''}
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
        
        // Add copy button event listener
        const copyBtn = messageDiv.querySelector('.copy-message-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyMessage(messageId));
        }
        
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

    formatCodeInMessage(messageElement) {
        if (!messageElement) return;
        
        let content = messageElement.textContent;
        const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
        let match;
        let formattedContent = content;
        
        while ((match = codeBlockRegex.exec(content)) !== null) {
            const [fullMatch, language, code] = match;
            const lang = language || 'text';
            const codeId = `code_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const formattedCode = `
                <div class="code-block my-4 bg-gray-900 rounded-lg border border-gray-600">
                    <div class="flex items-center justify-between bg-gray-800 px-4 py-2 rounded-t-lg border-b border-gray-600">
                        <span class="text-sm font-medium text-gray-300">${lang.toUpperCase()}</span>
                        <button class="copy-code-btn bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs text-white" 
                                data-code-id="${codeId}">
                            📋 Copy Code
                        </button>
                    </div>
                    <pre class="p-4 overflow-x-auto"><code class="language-${lang}" id="${codeId}">${this.escapeHtml(code.trim())}</code></pre>
                </div>
            `;
            
            formattedContent = formattedContent.replace(fullMatch, formattedCode);
            this.codeBlockCount++;
        }
        
        // Handle inline code
        formattedContent = formattedContent.replace(/`([^`]+)`/g, '<code class="bg-gray-700 px-1 py-0.5 rounded text-sm">$1</code>');
        
        messageElement.innerHTML = formattedContent;
        
        // Add copy button event listeners for code blocks
        messageElement.querySelectorAll('.copy-code-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const codeId = e.target.dataset.codeId;
                this.copyCode(codeId);
            });
        });
        
        this.updateStats();
    }

    applySyntaxHighlighting(messageElement) {
        if (!messageElement || !window.hljs) return;
        
        messageElement.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    }

    addCopyButtons(messageElement) {
        // Additional copy buttons for specific content types
        const tables = messageElement.querySelectorAll('table');
        tables.forEach((table, index) => {
            const tableId = `table_${Date.now()}_${index}`;
            table.id = tableId;
            
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-table-btn bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs text-white mt-2';
            copyBtn.textContent = '📊 Copy Table';
            copyBtn.addEventListener('click', () => this.copyTable(tableId));
            
            table.parentNode.insertBefore(copyBtn, table.nextSibling);
        });
    }

    async copyMessage(messageId) {
        const messageContent = document.querySelector(`[data-content-id="${messageId}"]`);
        if (!messageContent) return;
        
        try {
            await navigator.clipboard.writeText(messageContent.textContent);
            this.showCopyToast('Message copied to clipboard!');
        } catch (error) {
            console.error('Copy failed:', error);
            this.showCopyToast('Failed to copy message', 'error');
        }
    }

    async copyCode(codeId) {
        const codeElement = document.getElementById(codeId);
        if (!codeElement) return;
        
        try {
            await navigator.clipboard.writeText(codeElement.textContent);
            this.showCopyToast('Code copied to clipboard!');
        } catch (error) {
            console.error('Copy failed:', error);
            this.showCopyToast('Failed to copy code', 'error');
        }
    }

    async copyTable(tableId) {
        const table = document.getElementById(tableId);
        if (!table) return;
        
        try {
            // Convert table to CSV format
            const csv = this.tableToCSV(table);
            await navigator.clipboard.writeText(csv);
            this.showCopyToast('Table copied as CSV!');
        } catch (error) {
            console.error('Copy failed:', error);
            this.showCopyToast('Failed to copy table', 'error');
        }
    }

    tableToCSV(table) {
        const rows = Array.from(table.querySelectorAll('tr'));
        return rows.map(row => {
            const cells = Array.from(row.querySelectorAll('td, th'));
            return cells.map(cell => `"${cell.textContent.replace(/"/g, '""')}"`).join(',');
        }).join('\n');
    }

    showCopyToast(message, type = 'success') {
        this.copyToast.textContent = message;
        this.copyToast.className = `fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
            type === 'error' ? 'bg-red-600' : 'bg-green-600'
        } text-white`;
        this.copyToast.classList.remove('hidden');
        
        setTimeout(() => {
            this.copyToast.classList.add('hidden');
        }, 3000);
    }

    updateReasoningDisplay(reasoning) {
        if (this.reasoningContent) {
            this.reasoningContent.innerHTML = `<pre class="whitespace-pre-wrap text-sm">${this.escapeHtml(reasoning)}</pre>`;
        }
    }

    toggleReasoningPanel() {
        const isVisible = !this.reasoningPanel.classList.contains('hidden');
        if (isVisible) {
            this.reasoningPanel.classList.add('hidden');
            this.toggleReasoningView.textContent = 'Show Reasoning';
        } else {
            this.reasoningPanel.classList.remove('hidden');
            this.toggleReasoningView.textContent = 'Hide Reasoning';
        }
    }

    showStreamingIndicator() {
        this.streamingIndicator.classList.remove('hidden');
        this.startResponseTimer();
    }

    hideStreamingIndicator() {
        this.streamingIndicator.classList.add('hidden');
        this.stopResponseTimer();
        this.tokenCounter.textContent = '';
        this.responseTimer.textContent = '';
    }

    startResponseTimer() {
        this.responseInterval = setInterval(() => {
            const elapsed = Date.now() - this.currentResponseStart;
            this.responseTimer.textContent = `${(elapsed / 1000).toFixed(1)}s`;
        }, 100);
    }

    stopResponseTimer() {
        if (this.responseInterval) {
            clearInterval(this.responseInterval);
            this.responseInterval = null;
        }
    }

    recordResponseTime() {
        if (this.currentResponseStart) {
            const responseTime = Date.now() - this.currentResponseStart;
            this.responseTimes.push(responseTime);
            this.updateStats();
        }
    }

    updateTokenCounter(count) {
        this.tokenCounter.textContent = `${count} tokens`;
        
        // Update token count in current message
        if (this.currentStreamingMessage && this.showTokenCount.checked) {
            const messageContainer = this.currentStreamingMessage.closest('[data-message-id]');
            const tokenInfo = messageContainer?.querySelector('.token-count');
            if (tokenInfo) {
                tokenInfo.textContent = `Tokens: ${count}`;
            }
        }
        
        this.tokenCount += count;
        this.updateStats();
    }

    updateSendButton(disabled) {
        this.sendBtn.disabled = disabled;
        this.sendBtn.textContent = disabled ? 'Sending...' : 'Send';
        
        if (disabled) {
            this.stopBtn.classList.remove('hidden');
        } else {
            this.stopBtn.classList.add('hidden');
        }
    }

    stopStreaming() {
        this.isStreaming = false;
        this.updateSendButton(false);
        this.hideStreamingIndicator();
        
        if (this.currentStreamingMessage) {
            this.finalizeMessage(this.currentStreamingMessage.textContent);
        }
        
        this.currentStreamingMessage = null;
    }

    clearChat() {
        if (confirm('Are you sure you want to clear the chat? This cannot be undone.')) {
            this.messages = [];
            this.messageCount = 0;
            this.tokenCount = 0;
            this.codeBlockCount = 0;
            this.responseTimes = [];
            
            this.messagesContainer.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <div class="text-4xl mb-2">🧠</div>
                    <p>Start an advanced conversation with DeepSeek AI</p>
                    <p class="text-sm mt-1">Features: Reasoning display, code formatting, copy functions, and more</p>
                </div>
            `;
            this.updateStats();
        }
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    updateStats() {
        this.messageCountEl.textContent = this.messageCount;
        this.tokenCountEl.textContent = this.tokenCount.toLocaleString();
        this.codeBlockCountEl.textContent = this.codeBlockCount;
        
        if (this.responseTimes.length > 0) {
            const avgTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
            this.avgResponseTimeEl.textContent = `${Math.round(avgTime)}ms`;
        }
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

    insertTemplate(template) {
        const cursorPos = this.messageInput.selectionStart;
        const textBefore = this.messageInput.value.substring(0, cursorPos);
        const textAfter = this.messageInput.value.substring(this.messageInput.selectionEnd);
        
        this.messageInput.value = textBefore + template + textAfter;
        this.messageInput.focus();
        this.messageInput.setSelectionRange(cursorPos + template.length, cursorPos + template.length);
        this.updateCounters();
    }

    startVoiceInput() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';
            
            recognition.onstart = () => {
                this.voiceInput.textContent = '🎤 Listening...';
                this.voiceInput.className = 'bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs';
            };
            
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.messageInput.value += transcript;
                this.updateCounters();
            };
            
            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.showCopyToast('Voice input failed', 'error');
            };
            
            recognition.onend = () => {
                this.voiceInput.textContent = '🎤 Voice';
                this.voiceInput.className = 'bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-xs';
            };
            
            recognition.start();
        } else {
            this.showCopyToast('Voice input not supported', 'error');
        }
    }

    openSettings() {
        this.settingsModal.classList.remove('hidden');
    }

    closeSettings() {
        this.settingsModal.classList.add('hidden');
    }

    saveSettings() {
        this.saveUserPreferences();
        this.closeSettings();
        this.showCopyToast('Settings saved!');
    }

    saveUserPreferences() {
        const preferences = {
            useReasoning: this.useReasoning.checked,
            autoFormatCode: this.autoFormatCode.checked,
            enableSyntaxHighlight: this.enableSyntaxHighlight.checked,
            showTokenCount: this.showTokenCount.checked,
            contextPlatform: this.contextPlatform.value,
            preferredLanguage: this.preferredLanguage.value,
            responseStyle: document.getElementById('responseStyle')?.value || 'detailed',
            codeStyle: document.getElementById('codeStyle')?.value || 'modern'
        };
        
        localStorage.setItem('chatPreferences', JSON.stringify(preferences));
    }

    loadUserPreferences() {
        try {
            const preferences = JSON.parse(localStorage.getItem('chatPreferences') || '{}');
            
            if (preferences.useReasoning !== undefined) this.useReasoning.checked = preferences.useReasoning;
            if (preferences.autoFormatCode !== undefined) this.autoFormatCode.checked = preferences.autoFormatCode;
            if (preferences.enableSyntaxHighlight !== undefined) this.enableSyntaxHighlight.checked = preferences.enableSyntaxHighlight;
            if (preferences.showTokenCount !== undefined) this.showTokenCount.checked = preferences.showTokenCount;
            if (preferences.contextPlatform) this.contextPlatform.value = preferences.contextPlatform;
            if (preferences.preferredLanguage) this.preferredLanguage.value = preferences.preferredLanguage;
            
            const responseStyle = document.getElementById('responseStyle');
            const codeStyle = document.getElementById('codeStyle');
            if (responseStyle && preferences.responseStyle) responseStyle.value = preferences.responseStyle;
            if (codeStyle && preferences.codeStyle) codeStyle.value = preferences.codeStyle;
        } catch (error) {
            console.error('Failed to load preferences:', error);
        }
    }

    getUserPreferences() {
        return {
            responseStyle: document.getElementById('responseStyle')?.value || 'detailed',
            codeStyle: document.getElementById('codeStyle')?.value || 'modern',
            autoFormat: this.autoFormatCode.checked,
            syntaxHighlight: this.enableSyntaxHighlight.checked
        };
    }

    async exportChat() {
        const chatData = {
            messages: this.messages,
            stats: {
                messageCount: this.messageCount,
                tokenCount: this.tokenCount,
                codeBlockCount: this.codeBlockCount,
                sessionTime: Math.floor((Date.now() - this.sessionStartTime) / 60000),
                avgResponseTime: this.responseTimes.length > 0 ? 
                    Math.round(this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length) : 0
            },
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `deepseek-chat-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showCopyToast('Chat exported successfully!');
    }

    async saveChat() {
        // This would integrate with a backend API to save chats
        this.showCopyToast('Chat save functionality coming soon!');
    }

    async loadChat() {
        // This would integrate with a backend API to load chats
        this.showCopyToast('Chat load functionality coming soon!');
    }

    async shareChat() {
        // This would generate a shareable link
        this.showCopyToast('Chat sharing functionality coming soon!');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize advanced chat interface when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('messagesContainer')) {
        window.chatInterface = new AdvancedChatInterface();
    }
});
