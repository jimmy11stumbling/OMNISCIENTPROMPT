/**
 * Universal Settings Management System
 * Handles all application configuration and user preferences
 */

class UniversalSettings {
  constructor() {
    this.settings = {
      theme: 'dark',
      language: 'en',
      autoSave: true,
      notifications: true,
      apiTimeout: 30000,
      maxTokens: 8192,
      temperature: 0.7,
      defaultPlatform: 'replit',
      streamingEnabled: true,
      reasoningEnabled: true,
      ragSearchLimit: 10,
      analyticsEnabled: true,
      debugMode: false
    };

    this.observers = [];
    this.init();
  }

  init() {
    this.loadSettings();
    this.setupEventListeners();
    this.applySettings();
  }

  loadSettings() {
    const saved = localStorage.getItem('deepseek_settings');
    if (saved) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      } catch (error) {
        console.warn('Failed to load settings:', error);
      }
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('deepseek_settings', JSON.stringify(this.settings));
      this.notifyObservers('settings_saved', this.settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  get(key) {
    return this.settings[key];
  }

  set(key, value) {
    const oldValue = this.settings[key];
    this.settings[key] = value;
    this.saveSettings();
    this.applySettings();
    this.notifyObservers('setting_changed', { key, value, oldValue });
  }

  update(updates) {
    Object.assign(this.settings, updates);
    this.saveSettings();
    this.applySettings();
    this.notifyObservers('settings_updated', updates);
  }

  reset() {
    const defaults = {
      theme: 'dark',
      language: 'en',
      autoSave: true,
      notifications: true,
      apiTimeout: 30000,
      maxTokens: 8192,
      temperature: 0.7,
      defaultPlatform: 'replit',
      streamingEnabled: true,
      reasoningEnabled: true,
      ragSearchLimit: 10,
      analyticsEnabled: true,
      debugMode: false
    };

    this.settings = { ...defaults };
    this.saveSettings();
    this.applySettings();
    this.notifyObservers('settings_reset', this.settings);
  }

  applySettings() {
    // Apply theme
    document.documentElement.setAttribute('data-theme', this.settings.theme);

    // Apply debug mode
    if (this.settings.debugMode) {
      window.debugMode = true;
      console.log('[DEBUG] Debug mode enabled');
    }

    // Update UI elements
    this.updateUI();
  }

  updateUI() {
    // Update settings controls if they exist
    const controls = [
      { id: 'theme-select', value: this.settings.theme },
      { id: 'language-select', value: this.settings.language },
      { id: 'auto-save-toggle', checked: this.settings.autoSave },
      { id: 'notifications-toggle', checked: this.settings.notifications },
      { id: 'streaming-toggle', checked: this.settings.streamingEnabled },
      { id: 'reasoning-toggle', checked: this.settings.reasoningEnabled },
      { id: 'analytics-toggle', checked: this.settings.analyticsEnabled },
      { id: 'debug-toggle', checked: this.settings.debugMode },
      { id: 'api-timeout-input', value: this.settings.apiTimeout },
      { id: 'max-tokens-input', value: this.settings.maxTokens },
      { id: 'temperature-input', value: this.settings.temperature },
      { id: 'default-platform-select', value: this.settings.defaultPlatform },
      { id: 'rag-search-limit-input', value: this.settings.ragSearchLimit }
    ];

    controls.forEach(control => {
      const element = document.getElementById(control.id);
      if (element) {
        if (control.hasOwnProperty('checked')) {
          element.checked = control.checked;
        } else {
          element.value = control.value;
        }
      }
    });
  }

  setupEventListeners() {
    // Listen for settings changes from UI
    document.addEventListener('change', (event) => {
      const element = event.target;

      if (element.id === 'theme-select') {
        this.set('theme', element.value);
      } else if (element.id === 'language-select') {
        this.set('language', element.value);
      } else if (element.id === 'auto-save-toggle') {
        this.set('autoSave', element.checked);
      } else if (element.id === 'notifications-toggle') {
        this.set('notifications', element.checked);
      } else if (element.id === 'streaming-toggle') {
        this.set('streamingEnabled', element.checked);
      } else if (element.id === 'reasoning-toggle') {
        this.set('reasoningEnabled', element.checked);
      } else if (element.id === 'analytics-toggle') {
        this.set('analyticsEnabled', element.checked);
      } else if (element.id === 'debug-toggle') {
        this.set('debugMode', element.checked);
      } else if (element.id === 'api-timeout-input') {
        this.set('apiTimeout', parseInt(element.value));
      } else if (element.id === 'max-tokens-input') {
        this.set('maxTokens', parseInt(element.value));
      } else if (element.id === 'temperature-input') {
        this.set('temperature', parseFloat(element.value));
      } else if (element.id === 'default-platform-select') {
        this.set('defaultPlatform', element.value);
      } else if (element.id === 'rag-search-limit-input') {
        this.set('ragSearchLimit', parseInt(element.value));
      }
    });
  }

  // Observer pattern for settings changes
  subscribe(callback) {
    this.observers.push(callback);
  }

  unsubscribe(callback) {
    this.observers = this.observers.filter(obs => obs !== callback);
  }

  notifyObservers(event, data) {
    this.observers.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Observer callback error:', error);
      }
    });
  }

  // Export/Import functionality
  export() {
    return JSON.stringify(this.settings, null, 2);
  }

  import(settingsJson) {
    try {
      const imported = JSON.parse(settingsJson);
      this.update(imported);
      return true;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  }

  // Advanced settings validation
  validate() {
    const issues = [];

    if (this.settings.apiTimeout < 5000) {
      issues.push('API timeout too low (minimum 5 seconds)');
    }

    if (this.settings.maxTokens < 100 || this.settings.maxTokens > 8192) {
      issues.push('Max tokens must be between 100 and 8192');
    }

    if (this.settings.temperature < 0 || this.settings.temperature > 2) {
      issues.push('Temperature must be between 0 and 2');
    }

    if (this.settings.ragSearchLimit < 1 || this.settings.ragSearchLimit > 50) {
      issues.push('RAG search limit must be between 1 and 50');
    }

    return issues;
  }

  // Performance optimization settings
  getPerformanceSettings() {
    return {
      streamingEnabled: this.settings.streamingEnabled,
      ragSearchLimit: this.settings.ragSearchLimit,
      analyticsEnabled: this.settings.analyticsEnabled,
      debugMode: this.settings.debugMode
    };
  }

  // API configuration
  getAPISettings() {
    return {
      timeout: this.settings.apiTimeout,
      maxTokens: this.settings.maxTokens,
      temperature: this.settings.temperature,
      defaultPlatform: this.settings.defaultPlatform,
      reasoningEnabled: this.settings.reasoningEnabled
    };
  }
}

// Global settings instance
window.universalSettings = new UniversalSettings();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UniversalSettings;
}