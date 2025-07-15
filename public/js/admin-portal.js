
class AdminPortal {
    constructor() {
        this.currentTab = 'dashboard';
        this.socket = null;
        this.init();
    }

    init() {
        this.connectWebSocket();
        this.loadDashboardData();
        this.setupEventListeners();
        this.startRealTimeUpdates();
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        this.socket = new WebSocket(wsUrl);
        
        this.socket.onopen = () => {
            console.log('[ADMIN] WebSocket connected');
            this.updateConnectionStatus('connected');
        };
        
        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleRealtimeUpdate(data);
        };
        
        this.socket.onclose = () => {
            console.log('[ADMIN] WebSocket disconnected');
            this.updateConnectionStatus('disconnected');
            // Reconnect after 5 seconds
            setTimeout(() => this.connectWebSocket(), 5000);
        };
    }

    handleRealtimeUpdate(data) {
        switch (data.type) {
            case 'user_activity':
                this.updateUserActivity(data.payload);
                break;
            case 'api_call':
                this.updateAPICallCount(data.payload);
                break;
            case 'system_metrics':
                this.updateSystemMetrics(data.payload);
                break;
            case 'error_log':
                this.addErrorLog(data.payload);
                break;
        }
    }

    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = status === 'connected' ? 'text-green-400' : 'text-red-400';
        }
    }

    setupEventListeners() {
        // Document upload handler
        const uploadInput = document.getElementById('documentUpload');
        if (uploadInput) {
            uploadInput.addEventListener('change', (e) => this.handleDocumentUpload(e));
        }

        // Tab switching
        window.switchTab = (tabName) => this.switchTab(tabName);
        
        // Auto-refresh every 30 seconds
        setInterval(() => this.refreshCurrentTab(), 30000);
    }

    switchTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.add('hidden');
        });
        
        // Show selected tab
        const selectedTab = document.getElementById(`${tabName}-tab`);
        if (selectedTab) {
            selectedTab.classList.remove('hidden');
        }
        
        // Update sidebar active state
        document.querySelectorAll('nav div').forEach(item => {
            item.classList.remove('bg-blue-600', 'text-white', 'border-r-4', 'border-blue-400');
            item.classList.add('text-gray-300');
        });
        
        // Set active tab in sidebar
        const activeTab = document.querySelector(`nav div[onclick="switchTab('${tabName}')"]`);
        if (activeTab) {
            activeTab.classList.add('bg-blue-600', 'text-white', 'border-r-4', 'border-blue-400');
            activeTab.classList.remove('text-gray-300');
        }
        
        this.currentTab = tabName;
        this.loadTabData(tabName);
    }

    async loadDashboardData() {
        try {
            const response = await fetch('/api/admin/dashboard');
            const data = await response.json();
            
            // Update dashboard stats
            document.getElementById('totalUsers').textContent = data.totalUsers || 0;
            document.getElementById('apiCalls').textContent = data.apiCalls24h || 0;
            document.getElementById('activeSessions').textContent = data.activeSessions || 0;
            document.getElementById('systemHealth').textContent = data.systemHealth || 'Good';
            
            // Update activity feed
            this.updateActivityFeed(data.recentActivity || []);
            
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    }

    updateActivityFeed(activities) {
        const feedElement = document.getElementById('activityFeed');
        if (!feedElement) return;
        
        feedElement.innerHTML = '';
        
        activities.forEach(activity => {
            const item = document.createElement('div');
            item.className = 'flex items-center space-x-3 p-3 bg-gray-700 rounded-lg';
            item.innerHTML = `
                <div class="w-2 h-2 bg-${activity.type === 'error' ? 'red' : 'green'}-400 rounded-full"></div>
                <div class="flex-1">
                    <p class="text-sm">${activity.message}</p>
                    <p class="text-xs text-gray-400">${new Date(activity.timestamp).toLocaleTimeString()}</p>
                </div>
            `;
            feedElement.appendChild(item);
        });
    }

    async loadTabData(tabName) {
        switch (tabName) {
            case 'users':
                await this.loadUserData();
                break;
            case 'documents':
                await this.loadDocumentData();
                break;
            case 'analytics':
                await this.loadAnalyticsData();
                break;
            case 'api-keys':
                await this.loadAPIKeysData();
                break;
            case 'system':
                await this.loadSystemData();
                break;
        }
    }

    async loadUserData() {
        try {
            const response = await fetch('/api/admin/users');
            const users = await response.json();
            
            const tableBody = document.getElementById('userTable');
            if (!tableBody) return;
            
            tableBody.innerHTML = '';
            
            users.forEach(user => {
                const row = document.createElement('tr');
                row.className = 'border-b border-gray-700 hover:bg-gray-700';
                row.innerHTML = `
                    <td class="py-3 px-4">${user.id}</td>
                    <td class="py-3 px-4">${user.email}</td>
                    <td class="py-3 px-4">
                        <span class="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                            ${user.role}
                        </span>
                    </td>
                    <td class="py-3 px-4">
                        <span class="px-2 py-1 bg-${user.status === 'active' ? 'green' : 'red'}-600 text-white text-xs rounded-full">
                            ${user.status}
                        </span>
                    </td>
                    <td class="py-3 px-4">${new Date(user.lastActive).toLocaleString()}</td>
                    <td class="py-3 px-4">
                        <button class="text-blue-400 hover:text-blue-300 mr-2" onclick="editUser('${user.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="text-red-400 hover:text-red-300" onclick="deleteUser('${user.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    }

    async loadDocumentData() {
        try {
            const response = await fetch('/api/admin/documents/stats');
            const stats = await response.json();
            
            document.getElementById('totalDocs').textContent = stats.total || 0;
            document.getElementById('platformDocs').textContent = stats.platform || 0;
            document.getElementById('customDocs').textContent = stats.custom || 0;
            document.getElementById('lastUpdated').textContent = stats.lastUpdated || 'Unknown';
            
        } catch (error) {
            console.error('Failed to load document data:', error);
        }
    }

    async loadAnalyticsData() {
        try {
            const response = await fetch('/api/admin/analytics');
            const analytics = await response.json();
            
            // Create usage chart
            this.createUsageChart(analytics.usage);
            
        } catch (error) {
            console.error('Failed to load analytics data:', error);
        }
    }

    createUsageChart(data) {
        const canvas = document.getElementById('usageChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Simple line chart implementation
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        data.forEach((point, index) => {
            const x = (index / (data.length - 1)) * canvas.width;
            const y = canvas.height - (point.value / 100) * canvas.height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
    }

    async loadAPIKeysData() {
        try {
            const response = await fetch('/api/admin/api-keys');
            const keys = await response.json();
            
            const keysList = document.getElementById('apiKeysList');
            if (!keysList) return;
            
            keysList.innerHTML = '';
            
            keys.forEach(key => {
                const keyItem = document.createElement('div');
                keyItem.className = 'flex items-center justify-between p-4 bg-gray-700 rounded-lg';
                keyItem.innerHTML = `
                    <div>
                        <p class="font-mono text-sm">${key.key.substring(0, 20)}...</p>
                        <p class="text-xs text-gray-400">Created: ${new Date(key.created).toLocaleString()}</p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="px-2 py-1 bg-${key.status === 'active' ? 'green' : 'red'}-600 text-white text-xs rounded-full">
                            ${key.status}
                        </span>
                        <button class="text-red-400 hover:text-red-300" onclick="revokeAPIKey('${key.id}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
                keysList.appendChild(keyItem);
            });
            
        } catch (error) {
            console.error('Failed to load API keys data:', error);
        }
    }

    async loadSystemData() {
        try {
            const response = await fetch('/api/admin/system');
            const system = await response.json();
            
            // Update system metrics would go here
            console.log('System data loaded:', system);
            
        } catch (error) {
            console.error('Failed to load system data:', error);
        }
    }

    async handleDocumentUpload(event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        
        const formData = new FormData();
        Array.from(files).forEach(file => {
            formData.append('documents', file);
        });
        
        try {
            const response = await fetch('/api/admin/documents/upload', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert(`Successfully uploaded ${result.uploaded} documents`);
                this.loadDocumentData(); // Refresh document stats
            } else {
                alert('Upload failed: ' + result.error);
            }
            
        } catch (error) {
            console.error('Document upload failed:', error);
            alert('Upload failed: ' + error.message);
        }
    }

    startRealTimeUpdates() {
        // Subscribe to real-time updates
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: 'subscribe',
                channel: 'admin_updates'
            }));
        }
    }

    refreshCurrentTab() {
        this.loadTabData(this.currentTab);
    }
}

// Global functions for button handlers
window.editUser = (userId) => {
    console.log('Edit user:', userId);
    // Implement user editing modal
};

window.deleteUser = (userId) => {
    if (confirm('Are you sure you want to delete this user?')) {
        console.log('Delete user:', userId);
        // Implement user deletion
    }
};

window.revokeAPIKey = (keyId) => {
    if (confirm('Are you sure you want to revoke this API key?')) {
        console.log('Revoke API key:', keyId);
        // Implement API key revocation
    }
};

// Initialize admin portal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AdminPortal();
});
