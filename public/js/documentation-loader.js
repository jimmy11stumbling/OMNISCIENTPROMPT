// Documentation Loader - Handles platform documentation loading without errors
class DocumentationLoader {
    constructor() {
        this.platforms = ['replit', 'lovable', 'bolt', 'cursor', 'windsurf'];
        this.documentationCache = new Map();
        this.loadingPromises = new Map();
    }

    async loadPlatformDocumentation(platform) {
        // Check cache first
        if (this.documentationCache.has(platform)) {
            return this.documentationCache.get(platform);
        }

        // Check if already loading
        if (this.loadingPromises.has(platform)) {
            return this.loadingPromises.get(platform);
        }

        // Create loading promise
        const loadingPromise = this.fetchDocumentation(platform);
        this.loadingPromises.set(platform, loadingPromise);

        try {
            const docs = await loadingPromise;
            this.documentationCache.set(platform, docs);
            this.loadingPromises.delete(platform);
            return docs;
        } catch (error) {
            this.loadingPromises.delete(platform);
            // Return fallback documentation structure
            return this.getFallbackDocumentation(platform);
        }
    }

    async fetchDocumentation(platform) {
        try {
            const response = await fetch(`/api/rag/platform/${platform}`);
            if (!response.ok) {
                throw new Error(`Documentation not available for ${platform}`);
            }
            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    getFallbackDocumentation(platform) {
        // Return basic platform info if documentation fails to load
        const fallbackDocs = {
            replit: {
                count: 4,
                platform: 'replit',
                description: 'AI-powered development environment',
                status: 'fallback'
            },
            lovable: {
                count: 3,
                platform: 'lovable',
                description: 'Full-stack AI application builder',
                status: 'fallback'
            },
            bolt: {
                count: 3,
                platform: 'bolt',
                description: 'AI-powered development platform',
                status: 'fallback'
            },
            cursor: {
                count: 3,
                platform: 'cursor',
                description: 'AI-enhanced code editor',
                status: 'fallback'
            },
            windsurf: {
                count: 3,
                platform: 'windsurf',
                description: 'Collaborative development environment',
                status: 'fallback'
            }
        };

        return fallbackDocs[platform] || { count: 0, platform, status: 'unknown' };
    }

    async loadAllPlatforms() {
        const results = await Promise.allSettled(
            this.platforms.map(platform => this.loadPlatformDocumentation(platform))
        );

        const loaded = {};
        results.forEach((result, index) => {
            const platform = this.platforms[index];
            if (result.status === 'fulfilled') {
                loaded[platform] = result.value;
            } else {
                loaded[platform] = this.getFallbackDocumentation(platform);
            }
        });

        return loaded;
    }

    getTotalDocumentCount(platformData = null) {
        if (!platformData) {
            let total = 0;
            for (const docs of this.documentationCache.values()) {
                total += docs.count || 0;
            }
            return total;
        }

        return Object.values(platformData).reduce((sum, platform) => sum + (platform.count || 0), 0);
    }

    clearCache() {
        this.documentationCache.clear();
        this.loadingPromises.clear();
    }
}

// Create global instance
window.DocumentationLoader = new DocumentationLoader();