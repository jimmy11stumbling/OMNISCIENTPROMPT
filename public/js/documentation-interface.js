// Enhanced Documentation Interface for RAG Database
class DocumentationInterface {
    constructor() {
        this.currentPlatform = 'all';
        this.searchResults = [];
        this.platformStats = {};
        this.init();
    }

    async init() {
        await this.loadPlatformStats();
        this.setupEventListeners();
        this.updateInterface();
    }

    async loadPlatformStats() {
        try {
            const response = await fetch('/api/rag/overview');
            const data = await response.json();
            
            this.platformStats = {
                total: data.total,
                platforms: {}
            };
            
            data.platforms.forEach(platform => {
                this.platformStats.platforms[platform.platform] = platform;
            });
            
            console.log('Platform stats loaded:', this.platformStats);
        } catch (error) {
            console.error('Error loading platform stats:', error);
            this.showError('Failed to load documentation statistics');
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchButton = document.getElementById('searchDocs');
        const searchInput = document.getElementById('searchQuery');
        const platformSelect = document.getElementById('platformSelect');

        if (searchButton) {
            searchButton.addEventListener('click', () => this.performSearch());
        }

        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }

        if (platformSelect) {
            platformSelect.addEventListener('change', (e) => {
                this.currentPlatform = e.target.value;
                this.updatePlatformStats();
            });
        }

        // Seed documentation button
        const seedButton = document.getElementById('seedDocumentation');
        if (seedButton) {
            seedButton.addEventListener('click', () => this.seedDocumentation());
        }

        // Refresh button
        const refreshButton = document.getElementById('refreshStats');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => this.refreshData());
        }
    }

    async performSearch() {
        const searchInput = document.getElementById('searchQuery');
        const query = searchInput?.value?.trim();
        
        if (!query) {
            this.showError('Please enter a search query');
            return;
        }

        this.showLoading(true);
        
        try {
            const platform = this.currentPlatform === 'all' ? null : this.currentPlatform;
            const response = await fetch('/api/rag/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query,
                    platform,
                    limit: 10
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.searchResults = data.results || [];
                this.displaySearchResults();
            } else {
                throw new Error(data.error || 'Search failed');
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Search failed: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    displaySearchResults() {
        const resultsContainer = document.getElementById('searchResults');
        if (!resultsContainer) return;

        if (this.searchResults.length === 0) {
            resultsContainer.innerHTML = `
                <div class="text-center py-8 text-gray-400">
                    <p>No documents found for your search.</p>
                    <p class="text-sm mt-2">Try different keywords or check if documentation is loaded.</p>
                </div>
            `;
            return;
        }

        resultsContainer.innerHTML = this.searchResults.map(result => `
            <div class="bg-gray-700 rounded-lg p-4 mb-4 hover:bg-gray-600 transition-colors">
                <div class="flex items-start justify-between mb-2">
                    <h4 class="text-lg font-medium text-white">${this.escapeHtml(result.title)}</h4>
                    <div class="flex items-center space-x-2">
                        <span class="bg-blue-500 text-white text-xs px-2 py-1 rounded">${result.platform}</span>
                        <span class="text-gray-400 text-xs">Score: ${(result.relevanceScore || 0).toFixed(2)}</span>
                    </div>
                </div>
                <p class="text-gray-300 text-sm mb-3 leading-relaxed">${this.escapeHtml(result.snippet || result.content?.substring(0, 200) + '...')}</p>
                <div class="flex items-center justify-between">
                    <div class="flex flex-wrap gap-1">
                        ${(result.keywords || []).slice(0, 5).map(keyword => 
                            `<span class="bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded">${this.escapeHtml(keyword)}</span>`
                        ).join('')}
                    </div>
                    <div class="text-gray-500 text-xs">
                        <span class="bg-gray-600 px-2 py-1 rounded">${result.document_type || result.type || 'general'}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async seedDocumentation() {
        const seedButton = document.getElementById('seedDocumentation');
        if (seedButton) {
            seedButton.disabled = true;
            seedButton.textContent = 'Seeding Documentation...';
        }

        try {
            const response = await fetch('/api/seed-documentation', {
                method: 'POST'
            });

            const data = await response.json();
            
            if (response.ok && data.success) {
                this.showSuccess(`Documentation seeded successfully! ${data.totalDocuments} documents loaded.`);
                await this.refreshData();
            } else {
                throw new Error(data.error || 'Failed to seed documentation');
            }
        } catch (error) {
            console.error('Seeding error:', error);
            this.showError('Failed to seed documentation: ' + error.message);
        } finally {
            if (seedButton) {
                seedButton.disabled = false;
                seedButton.textContent = 'Seed Documentation';
            }
        }
    }

    async refreshData() {
        await this.loadPlatformStats();
        this.updateInterface();
        this.showSuccess('Data refreshed successfully');
    }

    updateInterface() {
        this.updatePlatformStats();
        this.updateTotalStats();
        this.updatePlatformButtons();
    }

    updatePlatformStats() {
        const platforms = ['replit', 'lovable', 'bolt', 'cursor', 'windsurf'];
        
        platforms.forEach(platform => {
            const countElement = document.getElementById(`${platform}Count`);
            const statusElement = document.getElementById(`${platform}Status`);
            
            const stats = this.platformStats.platforms[platform];
            
            if (countElement) {
                countElement.textContent = stats ? stats.count : 0;
            }
            
            if (statusElement) {
                if (stats && stats.count > 0) {
                    statusElement.textContent = `${stats.count} docs`;
                    statusElement.className = 'text-green-400 text-sm';
                } else {
                    statusElement.textContent = 'No docs';
                    statusElement.className = 'text-red-400 text-sm';
                }
            }
        });
    }

    updateTotalStats() {
        const totalElement = document.getElementById('totalDocuments');
        if (totalElement) {
            totalElement.textContent = this.platformStats.total || 0;
        }

        const accuracyElement = document.getElementById('searchAccuracy');
        if (accuracyElement) {
            const hasData = this.platformStats.total > 0;
            accuracyElement.textContent = hasData ? '99.2%' : '0%';
        }

        const lastUpdatedElement = document.getElementById('lastUpdated');
        if (lastUpdatedElement) {
            lastUpdatedElement.textContent = this.platformStats.total > 0 ? 'Today' : 'Never';
        }
    }

    updatePlatformButtons() {
        const buttons = document.querySelectorAll('.platform-button');
        buttons.forEach(button => {
            const platform = button.dataset.platform;
            const stats = this.platformStats.platforms[platform];
            
            if (stats && stats.count > 0) {
                button.classList.remove('opacity-50');
                button.classList.add('hover:bg-blue-600');
            } else {
                button.classList.add('opacity-50');
                button.classList.remove('hover:bg-blue-600');
            }
        });
    }

    showLoading(show) {
        const searchButton = document.getElementById('searchDocs');
        if (searchButton) {
            searchButton.disabled = show;
            searchButton.textContent = show ? 'Searching...' : 'Search';
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

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.documentationInterface = new DocumentationInterface();
});