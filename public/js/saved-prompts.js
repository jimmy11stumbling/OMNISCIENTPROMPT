/**
 * Saved Prompts Manager
 * Handles all functionality for the saved prompts interface
 */

class SavedPromptsManager {
    constructor() {
        this.prompts = [];
        this.filteredPrompts = [];
        this.currentPage = 1;
        this.pageSize = 10;
        this.init();
    }

    init() {
        this.loadPrompts();
        this.attachEventListeners();
        this.updateStats();
        this.renderPrompts();
    }

    attachEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchPrompts(e.target.value));
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.searchPrompts(e.target.value);
            });
        }

        // Refresh button
        window.refreshPrompts = () => this.refreshPrompts();
        
        // Search button
        window.searchPrompts = (query) => {
            const searchInput = document.getElementById('searchInput');
            this.searchPrompts(query || searchInput?.value || '');
        };
    }

    async loadPrompts() {
        try {
            // Load from localStorage first
            const localPrompts = this.loadLocalPrompts();
            
            // Try to fetch from server
            const response = await fetch('/api/prompts');
            if (response.ok) {
                const serverPrompts = await response.json();
                this.prompts = [...localPrompts, ...serverPrompts.prompts || []];
            } else {
                this.prompts = localPrompts;
            }
            
            this.filteredPrompts = [...this.prompts];
            this.updateStats();
            this.renderPrompts();
        } catch (error) {
            console.warn('Failed to load server prompts, using local only:', error);
            this.prompts = this.loadLocalPrompts();
            this.filteredPrompts = [...this.prompts];
            this.updateStats();
            this.renderPrompts();
        }
    }

    loadLocalPrompts() {
        try {
            const stored = localStorage.getItem('deepseek_saved_prompts');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('Failed to load local prompts:', error);
            return [];
        }
    }

    saveLocalPrompts() {
        try {
            localStorage.setItem('deepseek_saved_prompts', JSON.stringify(this.prompts));
        } catch (error) {
            console.warn('Failed to save prompts locally:', error);
        }
    }

    searchPrompts(query) {
        if (!query || query.trim() === '') {
            this.filteredPrompts = [...this.prompts];
        } else {
            const lowerQuery = query.toLowerCase();
            this.filteredPrompts = this.prompts.filter(prompt => 
                prompt.title?.toLowerCase().includes(lowerQuery) ||
                prompt.content?.toLowerCase().includes(lowerQuery) ||
                prompt.platform?.toLowerCase().includes(lowerQuery) ||
                prompt.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
            );
        }
        
        this.currentPage = 1;
        this.renderPrompts();
        this.updateStats();
    }

    async refreshPrompts() {
        const refreshBtn = document.querySelector('button[onclick="refreshPrompts()"]');
        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = `
                <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                <span>Refreshing...</span>
            `;
        }

        await this.loadPrompts();

        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                <span>Refresh</span>
            `;
        }
    }

    updateStats() {
        const totalPromptsEl = document.getElementById('totalPrompts');
        const totalPlatformsEl = document.getElementById('totalPlatforms');
        const avgTokensEl = document.getElementById('avgTokens');
        const recentActivityEl = document.getElementById('recentActivity');

        if (totalPromptsEl) {
            totalPromptsEl.textContent = this.filteredPrompts.length;
        }

        if (totalPlatformsEl) {
            const platforms = new Set(this.prompts.map(p => p.platform).filter(Boolean));
            totalPlatformsEl.textContent = platforms.size;
        }

        if (avgTokensEl) {
            const avgTokens = this.prompts.length > 0 
                ? Math.round(this.prompts.reduce((sum, p) => sum + (p.tokens || 0), 0) / this.prompts.length)
                : 0;
            avgTokensEl.textContent = avgTokens;
        }

        if (recentActivityEl) {
            const recentCount = this.prompts.filter(p => {
                const created = new Date(p.createdAt || p.timestamp);
                const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                return created > dayAgo;
            }).length;
            recentActivityEl.textContent = recentCount;
        }
    }

    renderPrompts() {
        const container = document.getElementById('promptsList');
        if (!container) return;

        if (this.filteredPrompts.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-6xl mb-4">📝</div>
                    <h3 class="text-xl font-medium mb-2">No prompts found</h3>
                    <p class="text-gray-400 mb-4">Start by generating some prompts in the Master Generator</p>
                    <a href="/" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg inline-block">
                        Generate Prompts
                    </a>
                </div>
            `;
            return;
        }

        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pagePrompts = this.filteredPrompts.slice(startIndex, endIndex);

        container.innerHTML = pagePrompts.map(prompt => this.renderPromptCard(prompt)).join('');
        this.renderPagination();
    }

    renderPromptCard(prompt) {
        const createdAt = new Date(prompt.createdAt || prompt.timestamp || Date.now());
        const platformColors = {
            replit: 'bg-orange-900 text-orange-200',
            lovable: 'bg-pink-900 text-pink-200',
            bolt: 'bg-yellow-900 text-yellow-200',
            cursor: 'bg-blue-900 text-blue-200',
            windsurf: 'bg-green-900 text-green-200'
        };

        return `
            <div class="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold mb-2">${this.escapeHtml(prompt.title || 'Untitled Prompt')}</h3>
                        <div class="flex items-center space-x-3 text-sm text-gray-400">
                            ${prompt.platform ? `<span class="px-2 py-1 rounded text-xs ${platformColors[prompt.platform] || 'bg-gray-700 text-gray-300'}">${prompt.platform}</span>` : ''}
                            <span>${createdAt.toLocaleDateString()}</span>
                            ${prompt.tokens ? `<span>${prompt.tokens} tokens</span>` : ''}
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="viewPrompt('${prompt.id}')" class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">
                            View
                        </button>
                        <button onclick="copyPrompt('${prompt.id}')" class="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm">
                            Copy
                        </button>
                        <button onclick="deletePrompt('${prompt.id}')" class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm">
                            Delete
                        </button>
                    </div>
                </div>
                <div class="text-gray-300 text-sm line-clamp-3">
                    ${this.escapeHtml(prompt.content?.substring(0, 200) || 'No content')}...
                </div>
                ${prompt.tags ? `
                    <div class="mt-3 flex flex-wrap gap-2">
                        ${prompt.tags.map(tag => `<span class="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">${this.escapeHtml(tag)}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredPrompts.length / this.pageSize);
        if (totalPages <= 1) return;

        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;

        let pagination = '<div class="flex items-center justify-center space-x-2 mt-8">';
        
        // Previous button
        pagination += `<button onclick="changePage(${this.currentPage - 1})" ${this.currentPage <= 1 ? 'disabled' : ''} class="px-3 py-1 rounded ${this.currentPage <= 1 ? 'bg-gray-700 text-gray-500' : 'bg-gray-600 hover:bg-gray-500 text-white'}">Previous</button>`;
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                pagination += `<button class="px-3 py-1 rounded bg-blue-600 text-white">${i}</button>`;
            } else {
                pagination += `<button onclick="changePage(${i})" class="px-3 py-1 rounded bg-gray-600 hover:bg-gray-500 text-white">${i}</button>`;
            }
        }
        
        // Next button
        pagination += `<button onclick="changePage(${this.currentPage + 1})" ${this.currentPage >= totalPages ? 'disabled' : ''} class="px-3 py-1 rounded ${this.currentPage >= totalPages ? 'bg-gray-700 text-gray-500' : 'bg-gray-600 hover:bg-gray-500 text-white'}">Next</button>`;
        
        pagination += '</div>';
        paginationContainer.innerHTML = pagination;
    }

    changePage(page) {
        const totalPages = Math.ceil(this.filteredPrompts.length / this.pageSize);
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.renderPrompts();
    }

    viewPrompt(id) {
        const prompt = this.prompts.find(p => p.id === id);
        if (!prompt) return;

        // Create modal to view prompt
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50';
        modal.innerHTML = `
            <div class="flex items-center justify-center min-h-screen px-4">
                <div class="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-96 overflow-y-auto">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold">${this.escapeHtml(prompt.title || 'Untitled Prompt')}</h3>
                        <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="bg-gray-900 p-4 rounded-lg">
                        <pre class="whitespace-pre-wrap text-sm text-gray-300">${this.escapeHtml(prompt.content || 'No content')}</pre>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    copyPrompt(id) {
        const prompt = this.prompts.find(p => p.id === id);
        if (!prompt) return;

        navigator.clipboard.writeText(prompt.content || '').then(() => {
            this.showNotification('Prompt copied to clipboard', 'success');
        }).catch(() => {
            this.showNotification('Failed to copy prompt', 'error');
        });
    }

    deletePrompt(id) {
        if (!confirm('Are you sure you want to delete this prompt?')) return;

        this.prompts = this.prompts.filter(p => p.id !== id);
        this.filteredPrompts = this.filteredPrompts.filter(p => p.id !== id);
        this.saveLocalPrompts();
        this.updateStats();
        this.renderPrompts();
        this.showNotification('Prompt deleted', 'info');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
        
        const colors = {
            success: 'bg-green-600 text-white',
            error: 'bg-red-600 text-white',
            info: 'bg-blue-600 text-white'
        };

        notification.className += ` ${colors[type] || colors.info}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.remove('translate-x-full'), 100);
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Global functions for button handlers
window.viewPrompt = (id) => window.savedPromptsManager?.viewPrompt(id);
window.copyPrompt = (id) => window.savedPromptsManager?.copyPrompt(id);
window.deletePrompt = (id) => window.savedPromptsManager?.deletePrompt(id);
window.changePage = (page) => window.savedPromptsManager?.changePage(page);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.savedPromptsManager = new SavedPromptsManager();
});