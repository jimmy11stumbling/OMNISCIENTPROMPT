/**
 * Master Prompt Generator with Real-time Streaming
 * Single comprehensive interface for DeepSeek AI prompt generation
 */

class MasterPromptGenerator {
    constructor() {
        this.isGenerating = false;
        this.abortController = null;
        this.currentPromptData = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeRealTimeConnection();
    }

    setupEventListeners() {
        const form = document.getElementById('promptForm');
        const generateBtn = document.getElementById('generateBtn');
        const copyBtn = document.getElementById('copyBtn');
        const saveBtn = document.getElementById('saveBtn');
        const copyBlueprint = document.getElementById('copyBlueprint');

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.generatePrompt();
            });
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyToClipboard());
        }

        if (copyBlueprint) {
            copyBlueprint.addEventListener('click', () => this.copyToClipboard());
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.savePrompt());
        }
    }

    async generatePrompt() {
        if (this.isGenerating) return;

        const platform = document.getElementById('platform').value;
        const query = document.getElementById('query').value.trim();
        const options = this.getSelectedOptions();

        if (!query) {
            this.showError('Please enter a description for your application');
            return;
        }

        this.isGenerating = true;
        this.abortController = new AbortController();
        this.updateUI('generating');
        this.clearResults();

        try {
            // Use streaming for real-time response
            await this.streamPromptGeneration({ query, platform, options });
        } catch (error) {
            console.error('Generation error:', error);
            this.showError(error.message || 'Failed to generate prompt');
        } finally {
            this.isGenerating = false;
            this.updateUI('idle');
        }
    }

    async streamPromptGeneration(requestData) {
        const response = await fetch('/api/generate-prompt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
            signal: this.abortController.signal
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.success) {
            this.displayResult(data);
            this.currentPromptData = data;
            this.showSuccess('Master blueprint generated successfully');
        } else {
            throw new Error(data.error || 'Generation failed');
        }
    }

    getSelectedOptions() {
        const options = {};
        
        // Get reasoning preference
        const reasoningToggle = document.getElementById('reasoningToggle');
        if (reasoningToggle) {
            options.useReasoning = reasoningToggle.checked;
        }

        // Get any other options from the form
        const optionsElements = document.querySelectorAll('[data-option]');
        optionsElements.forEach(element => {
            const optionName = element.dataset.option;
            if (element.type === 'checkbox') {
                options[optionName] = element.checked;
            } else {
                options[optionName] = element.value;
            }
        });

        return options;
    }

    displayResult(data) {
        const resultSection = document.getElementById('resultSection');
        const promptResult = document.getElementById('promptResult');
        
        if (resultSection && promptResult) {
            promptResult.textContent = data.prompt || '';
            resultSection.classList.remove('hidden');
            
            // Scroll to result
            resultSection.scrollIntoView({ behavior: 'smooth' });
        }

        // Display additional information if available
        this.displayMetadata(data);
    }

    displayMetadata(data) {
        // Update RAG context info if available
        if (data.ragContext > 0) {
            this.showInfo(`Used ${data.ragContext} relevant documentation sources`);
        }

        // Update token usage info if available
        if (data.metadata && data.metadata.usage) {
            const tokens = data.metadata.usage.total_tokens;
            if (tokens) {
                this.updateTokenDisplay(tokens);
            }
        }
    }

    updateTokenDisplay(tokens) {
        const tokenDisplay = document.getElementById('tokenUsage');
        if (tokenDisplay) {
            tokenDisplay.textContent = `Tokens used: ${tokens}`;
            tokenDisplay.classList.remove('hidden');
        }
    }

    clearResults() {
        const resultSection = document.getElementById('resultSection');
        const promptResult = document.getElementById('promptResult');
        const errorSection = document.getElementById('errorSection');
        
        if (resultSection) resultSection.classList.add('hidden');
        if (promptResult) promptResult.textContent = '';
        if (errorSection) errorSection.classList.add('hidden');
        
        this.hideNotifications();
    }

    updateUI(state) {
        const generateBtn = document.getElementById('generateBtn');
        const streamingIndicator = document.getElementById('streamingIndicator');
        
        if (generateBtn) {
            switch (state) {
                case 'generating':
                    generateBtn.disabled = true;
                    generateBtn.innerHTML = '<span class="animate-spin">⚡</span> Generating Blueprint...';
                    break;
                case 'idle':
                default:
                    generateBtn.disabled = false;
                    generateBtn.innerHTML = '⚡ Generate Master Blueprint';
                    break;
            }
        }

        if (streamingIndicator) {
            if (state === 'generating') {
                streamingIndicator.classList.remove('hidden');
            } else {
                streamingIndicator.classList.add('hidden');
            }
        }
    }

    async copyToClipboard() {
        const promptResult = document.getElementById('promptResult');
        if (!promptResult || !promptResult.textContent) {
            this.showError('No content to copy');
            return;
        }

        try {
            await navigator.clipboard.writeText(promptResult.textContent);
            this.showSuccess('Blueprint copied to clipboard');
        } catch (error) {
            console.error('Copy failed:', error);
            this.showError('Failed to copy to clipboard');
        }
    }

    async savePrompt() {
        if (!this.currentPromptData) {
            this.showError('No prompt to save');
            return;
        }

        try {
            const response = await fetch('/api/prompts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: this.generateTitle(),
                    originalQuery: document.getElementById('query').value,
                    platform: document.getElementById('platform').value,
                    generatedPrompt: this.currentPromptData.prompt,
                    reasoning: this.currentPromptData.reasoning,
                    ragContext: this.currentPromptData.ragContext || 0,
                    tokensUsed: this.currentPromptData.metadata?.usage?.total_tokens || 0,
                    responseTime: this.currentPromptData.metadata?.responseTime || 0
                })
            });

            if (response.ok) {
                this.showSuccess('Prompt saved successfully');
            } else {
                throw new Error('Failed to save prompt');
            }
        } catch (error) {
            console.error('Save error:', error);
            this.showError('Failed to save prompt');
        }
    }

    generateTitle() {
        const query = document.getElementById('query').value;
        const platform = document.getElementById('platform').value;
        const words = query.split(' ').slice(0, 5).join(' ');
        return `${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${words}`;
    }

    showError(message) {
        const errorSection = document.getElementById('errorSection');
        const errorMessage = document.getElementById('errorMessage');
        
        if (errorSection && errorMessage) {
            errorMessage.textContent = message;
            errorSection.classList.remove('hidden');
            setTimeout(() => errorSection.classList.add('hidden'), 5000);
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        // Create notification element if it doesn't exist
        let notification = document.getElementById('notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            notification.className = 'fixed top-4 right-4 px-4 py-2 rounded-md text-white text-sm z-50';
            document.body.appendChild(notification);
        }

        const colors = {
            success: 'bg-green-600',
            error: 'bg-red-600',
            info: 'bg-blue-600'
        };

        notification.className = `fixed top-4 right-4 px-4 py-2 rounded-md text-white text-sm z-50 ${colors[type] || colors.info}`;
        notification.textContent = message;
        notification.classList.remove('hidden');

        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }

    hideNotifications() {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.classList.add('hidden');
        }
    }

    initializeRealTimeConnection() {
        // Initialize WebSocket connection for real-time updates
        if (window.RealTimeValidator) {
            try {
                const validator = new window.RealTimeValidator();
                console.log('Real-time connection established');
            } catch (error) {
                console.warn('Real-time connection failed:', error);
            }
        }
    }

    cancelGeneration() {
        if (this.abortController) {
            this.abortController.abort();
            this.showInfo('Generation cancelled');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.masterGenerator = new MasterPromptGenerator();
});

// Export for global use
window.MasterPromptGenerator = MasterPromptGenerator;