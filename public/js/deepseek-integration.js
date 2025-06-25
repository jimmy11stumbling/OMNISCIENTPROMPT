/**
 * DeepSeek Integration Frontend
 * Handles comprehensive AI responses with reasoning display
 */

class DeepSeekIntegration {
    constructor() {
        this.currentSessionId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkApiStatus();
    }

    setupEventListeners() {
        const form = document.getElementById('promptForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.generatePrompt();
            });
        }

        const copyBtn = document.getElementById('copyBlueprint');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyToClipboard());
        }
    }

    async checkApiStatus() {
        try {
            const response = await fetch('/api/deepseek/stats');
            const data = await response.json();
            this.updateApiStatus(data.configured ? 'success' : 'warning');
        } catch (error) {
            this.updateApiStatus('error');
        }
    }

    async generatePrompt() {
        const queryInput = document.getElementById('query');
        const platformSelect = document.getElementById('platform');
        const useReasoning = document.getElementById('useReasoning');
        const generateBtn = document.getElementById('generateBtn');

        const query = queryInput.value.trim();
        const platform = platformSelect.value;
        const reasoning = useReasoning?.checked || true;

        if (!query) {
            this.showError('Please enter a query');
            return;
        }

        this.currentSessionId = this.generateSessionId();
        
        generateBtn.disabled = true;
        generateBtn.textContent = '🔄 Generating...';
        this.updateApiStatus('checking');

        try {
            const response = await fetch('/api/generate-prompt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    query, 
                    platform, 
                    useReasoning: reasoning,
                    sessionId: this.currentSessionId
                })
            });

            const data = await response.json();

            if (data.success) {
                this.displayComprehensiveResults(data);
                this.updateApiStatus('success');
            } else {
                throw new Error(data.error || 'Failed to generate prompt');
            }
        } catch (error) {
            console.error('Generation error:', error);
            this.showError('Failed to generate prompt: ' + error.message);
            this.updateApiStatus('error');
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = '🎯 Generate Master Blueprint';
        }
    }

    displayComprehensiveResults(data) {
        const resultSection = document.getElementById('resultSection');
        const promptResult = document.getElementById('promptResult');
        
        if (!resultSection || !promptResult) return;

        let resultsText = `# ${data.platform.toUpperCase()} Development Blueprint\n\n`;
        resultsText += `**Query:** ${data.query}\n\n`;
        
        // Main prompt
        resultsText += `## Generated Blueprint\n\n${data.prompt}\n\n`;
        
        // Reasoning (if available)
        if (data.reasoning) {
            resultsText += `## AI Reasoning Process\n\n`;
            if (data.reasoning.chain_of_thought) {
                resultsText += `### Chain of Thought:\n`;
                data.reasoning.chain_of_thought.forEach((step, i) => {
                    resultsText += `${i + 1}. ${step}\n`;
                });
                resultsText += `\n`;
            }
            if (data.reasoning.reasoning_summary) {
                resultsText += `### Summary:\n${data.reasoning.reasoning_summary}\n\n`;
            }
        }
        
        // Implementation steps
        if (data.implementation && data.implementation.length > 0) {
            resultsText += `## Implementation Steps\n\n`;
            data.implementation.forEach((step, i) => {
                resultsText += `${i + 1}. ${step}\n`;
            });
            resultsText += `\n`;
        }
        
        // Code examples
        if (data.codeExamples && Object.keys(data.codeExamples).length > 0) {
            resultsText += `## Code Examples\n\n`;
            Object.entries(data.codeExamples).forEach(([key, code]) => {
                resultsText += `### ${key.toUpperCase()}\n\`\`\`\n${code}\n\`\`\`\n\n`;
            });
        }
        
        // Best practices
        if (data.bestPractices && data.bestPractices.length > 0) {
            resultsText += `## Best Practices\n\n`;
            data.bestPractices.forEach(practice => {
                resultsText += `• ${practice}\n`;
            });
            resultsText += `\n`;
        }
        
        // Documentation context
        if (data.documentation && data.documentation.length > 0) {
            resultsText += `## Referenced Documentation\n\n`;
            data.documentation.forEach(doc => {
                resultsText += `### ${doc.title}\n**Type:** ${doc.type || 'general'}\n${doc.snippet || ''}\n\n`;
            });
        }
        
        // Metadata
        resultsText += `## Generation Details\n`;
        resultsText += `• Platform: ${data.platform}\n`;
        resultsText += `• Response Time: ${data.metadata?.responseTime || 'N/A'}ms\n`;
        resultsText += `• RAG Documents: ${data.ragContext || 0}\n`;
        resultsText += `• Model: ${data.metadata?.model || 'DeepSeek'}\n`;
        resultsText += `• Timestamp: ${new Date().toLocaleString()}\n`;
        
        promptResult.textContent = resultsText;
        resultSection.classList.remove('hidden');
        resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    async copyToClipboard() {
        const promptResult = document.getElementById('promptResult');
        if (!promptResult) return;

        try {
            await navigator.clipboard.writeText(promptResult.textContent);
            this.showSuccess('Blueprint copied to clipboard!');
        } catch (error) {
            console.error('Copy failed:', error);
            this.showError('Failed to copy to clipboard');
        }
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    updateApiStatus(status) {
        const statusElement = document.getElementById('apiStatus');
        if (!statusElement) return;

        switch (status) {
            case 'success':
                statusElement.textContent = 'API Connected';
                statusElement.className = 'px-2 py-1 rounded bg-green-600 text-white text-xs';
                break;
            case 'error':
                statusElement.textContent = 'API Error';
                statusElement.className = 'px-2 py-1 rounded bg-red-600 text-white text-xs';
                break;
            case 'warning':
                statusElement.textContent = 'Fallback Mode';
                statusElement.className = 'px-2 py-1 rounded bg-orange-600 text-white text-xs';
                break;
            case 'checking':
                statusElement.textContent = 'Processing...';
                statusElement.className = 'px-2 py-1 rounded bg-blue-600 text-white text-xs';
                break;
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        const colors = {
            success: 'bg-green-600',
            error: 'bg-red-600',
            info: 'bg-blue-600'
        };

        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-4 py-2 rounded-lg shadow-lg z-50 transform transition-transform duration-300 translate-x-full`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);

        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.deepSeekIntegration = new DeepSeekIntegration();
});