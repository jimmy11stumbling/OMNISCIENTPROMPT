/**
 * Universal Settings Manager
 * Provides settings functionality across all pages
 */

class UniversalSettings {
    constructor() {
        this.settings = this.loadSettings();
        this.init();
    }

    init() {
        this.createSettingsModal();
        this.attachEventListeners();
        this.applySettings();
    }

    createSettingsModal() {
        // Check if modal already exists
        if (document.getElementById('universalSettingsModal')) return;

        const modal = document.createElement('div');
        modal.id = 'universalSettingsModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 hidden';
        modal.innerHTML = `
            <div class="flex items-center justify-center min-h-screen px-4">
                <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold">Platform Settings</h3>
                        <button id="closeUniversalSettings" class="text-gray-400 hover:text-white">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">Default Platform</label>
                            <select id="universalDefaultPlatform" class="w-full p-2 bg-gray-700 border border-gray-600 rounded">
                                <option value="">No Default</option>
                                <option value="replit">Replit</option>
                                <option value="lovable">Lovable</option>
                                <option value="bolt">Bolt</option>
                                <option value="cursor">Cursor</option>
                                <option value="windsurf">Windsurf</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="flex items-center">
                                <input type="checkbox" id="universalAutoSave" class="mr-2">
                                <span class="text-sm">Auto-save generated content</span>
                            </label>
                        </div>
                        
                        <div>
                            <label class="flex items-center">
                                <input type="checkbox" id="universalNotifications" class="mr-2" checked>
                                <span class="text-sm">Enable notifications</span>
                            </label>
                        </div>

                        <div>
                            <label class="flex items-center">
                                <input type="checkbox" id="universalReasoning" class="mr-2" checked>
                                <span class="text-sm">Enable reasoning mode by default</span>
                            </label>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Interface Theme</label>
                            <select id="universalTheme" class="w-full p-2 bg-gray-700 border border-gray-600 rounded">
                                <option value="dark">Dark Mode</option>
                                <option value="light">Light Mode</option>
                                <option value="auto">Auto (System)</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2">Streaming Speed</label>
                            <select id="universalStreamSpeed" class="w-full p-2 bg-gray-700 border border-gray-600 rounded">
                                <option value="slow">Slow (Easy to read)</option>
                                <option value="medium">Medium</option>
                                <option value="fast">Fast</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="flex space-x-3 mt-6">
                        <button id="saveUniversalSettings" class="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm">
                            Save Settings
                        </button>
                        <button id="resetUniversalSettings" class="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-sm">
                            Reset
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    attachEventListeners() {
        // Settings button click handler (works for any settings button on any page)
        document.addEventListener('click', (e) => {
            if (e.target.id === 'settingsBtn' || e.target.classList.contains('settings-btn')) {
                this.openSettings();
            }
        });

        // Modal event listeners
        const closeBtn = document.getElementById('closeUniversalSettings');
        const saveBtn = document.getElementById('saveUniversalSettings');
        const resetBtn = document.getElementById('resetUniversalSettings');
        const modal = document.getElementById('universalSettingsModal');

        if (closeBtn) closeBtn.addEventListener('click', () => this.closeSettings());
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveSettings());
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetSettings());

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeSettings();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSettings();
            }
            if (e.ctrlKey && e.key === ',') {
                e.preventDefault();
                this.openSettings();
            }
        });
    }

    loadSettings() {
        const defaultSettings = {
            defaultPlatform: '',
            autoSave: false,
            notifications: true,
            reasoning: true,
            theme: 'dark',
            streamSpeed: 'medium'
        };

        try {
            const saved = localStorage.getItem('deepseek_universal_settings');
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        } catch (error) {
            console.warn('Failed to load settings:', error);
            return defaultSettings;
        }
    }

    openSettings() {
        const modal = document.getElementById('universalSettingsModal');
        if (modal) {
            this.populateForm();
            modal.classList.remove('hidden');
        }
    }

    closeSettings() {
        const modal = document.getElementById('universalSettingsModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    populateForm() {
        const elements = {
            defaultPlatform: document.getElementById('universalDefaultPlatform'),
            autoSave: document.getElementById('universalAutoSave'),
            notifications: document.getElementById('universalNotifications'),
            reasoning: document.getElementById('universalReasoning'),
            theme: document.getElementById('universalTheme'),
            streamSpeed: document.getElementById('universalStreamSpeed')
        };

        Object.keys(elements).forEach(key => {
            const element = elements[key];
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = this.settings[key];
                } else {
                    element.value = this.settings[key];
                }
            }
        });
    }

    saveSettings() {
        const elements = {
            defaultPlatform: document.getElementById('universalDefaultPlatform'),
            autoSave: document.getElementById('universalAutoSave'),
            notifications: document.getElementById('universalNotifications'),
            reasoning: document.getElementById('universalReasoning'),
            theme: document.getElementById('universalTheme'),
            streamSpeed: document.getElementById('universalStreamSpeed')
        };

        Object.keys(elements).forEach(key => {
            const element = elements[key];
            if (element) {
                if (element.type === 'checkbox') {
                    this.settings[key] = element.checked;
                } else {
                    this.settings[key] = element.value;
                }
            }
        });

        try {
            localStorage.setItem('deepseek_universal_settings', JSON.stringify(this.settings));
            this.applySettings();
            this.showNotification('Settings saved successfully', 'success');
            this.closeSettings();
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.showNotification('Failed to save settings', 'error');
        }
    }

    resetSettings() {
        this.settings = {
            defaultPlatform: '',
            autoSave: false,
            notifications: true,
            reasoning: true,
            theme: 'dark',
            streamSpeed: 'medium'
        };

        localStorage.removeItem('deepseek_universal_settings');
        this.populateForm();
        this.applySettings();
        this.showNotification('Settings reset to defaults', 'info');
    }

    applySettings() {
        // Apply default platform across all platform selectors
        const platformSelectors = document.querySelectorAll('select[id*="platform"], select[id*="Platform"]');
        platformSelectors.forEach(select => {
            if (this.settings.defaultPlatform && select.value === '') {
                select.value = this.settings.defaultPlatform;
            }
        });

        // Apply reasoning mode to checkboxes
        const reasoningCheckboxes = document.querySelectorAll('input[id*="reasoning"], input[id*="Reasoning"]');
        reasoningCheckboxes.forEach(checkbox => {
            checkbox.checked = this.settings.reasoning;
        });

        // Apply theme
        document.body.setAttribute('data-theme', this.settings.theme);
        
        // Dispatch settings change event for other components
        window.dispatchEvent(new CustomEvent('settingsChanged', { detail: this.settings }));
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

    getSettings() {
        return this.settings;
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.universalSettings = new UniversalSettings();
});

// Export for global access
window.UniversalSettings = UniversalSettings;