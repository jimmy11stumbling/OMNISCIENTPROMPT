// Real-time notification system
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.isVisible = false;
        this.container = null;
        this.bell = null;
        this.badge = null;
        this.authToken = localStorage.getItem('authToken');
        
        this.init();
        this.loadNotifications();
        
        // Connect to real-time updates
        if (window.RealTimeClient) {
            this.realTimeClient = new RealTimeClient();
            this.setupRealTimeListeners();
        }
    }

    init() {
        this.createNotificationUI();
        this.requestPermission();
        
        // Auto-refresh notifications every 30 seconds (only if not on analytics page)
        setInterval(() => {
            if (!window.location.pathname.includes('analytics.html')) {
                this.loadNotifications();
            }
        }, 30000);
    }

    createNotificationUI() {
        // Create notification bell icon
        this.bell = document.createElement('div');
        this.bell.className = 'relative cursor-pointer';
        this.bell.innerHTML = `
            <svg class="w-6 h-6 text-gray-300 hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
            </svg>
        `;

        // Create notification badge
        this.badge = document.createElement('span');
        this.badge.className = 'absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center hidden';
        this.bell.appendChild(this.badge);

        // Create notification panel
        this.container = document.createElement('div');
        this.container.className = 'absolute top-12 right-0 w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-lg hidden z-50';
        this.container.innerHTML = `
            <div class="p-4 border-b border-gray-700 flex justify-between items-center">
                <h3 class="text-lg font-semibold text-white">Notifications</h3>
                <button id="markAllRead" class="text-blue-400 hover:text-blue-300 text-sm">Mark all read</button>
            </div>
            <div id="notificationList" class="max-h-96 overflow-y-auto">
                <div class="p-4 text-center text-gray-400">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    Loading notifications...
                </div>
            </div>
            <div class="p-3 border-t border-gray-700 text-center">
                <a href="/notifications.html" class="text-blue-400 hover:text-blue-300 text-sm">View all notifications</a>
            </div>
        `;

        // Add click handlers
        this.bell.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePanel();
        });

        document.addEventListener('click', () => {
            this.hidePanel();
        });

        this.container.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Add mark all read functionality
        this.container.querySelector('#markAllRead').addEventListener('click', () => {
            this.markAllRead();
        });

        // Find navigation and add notification bell
        const nav = document.querySelector('nav .flex.items-center.space-x-4:last-child');
        if (nav) {
            const wrapper = document.createElement('div');
            wrapper.className = 'relative';
            wrapper.appendChild(this.bell);
            wrapper.appendChild(this.container);
            nav.insertBefore(wrapper, nav.firstChild);
        }
    }

    async requestPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }

    async loadNotifications() {
        if (!this.authToken) return;

        try {
            const response = await fetch('/api/notifications?limit=20', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.notifications = data.notifications;
                this.unreadCount = data.unreadCount;
                this.updateUI();
            }
        } catch (error) {
            // Silently handle notification loading errors to prevent console spam
            if (window.location.pathname.includes('analytics.html')) {
                return;
            }
            console.error('Failed to load notifications:', error);
        }
    }

    updateUI() {
        // Update badge
        if (this.unreadCount > 0) {
            this.badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
            this.badge.classList.remove('hidden');
        } else {
            this.badge.classList.add('hidden');
        }

        // Update notification list
        const list = this.container.querySelector('#notificationList');
        if (this.notifications.length === 0) {
            list.innerHTML = '<div class="p-4 text-center text-gray-400">No notifications</div>';
            return;
        }

        list.innerHTML = this.notifications.map(notification => `
            <div class="notification-item p-3 border-b border-gray-700 ${!notification.is_read ? 'bg-gray-750' : ''} hover:bg-gray-700 cursor-pointer"
                 data-id="${notification.id}" data-read="${notification.is_read}">
                <div class="flex items-start space-x-3">
                    <div class="notification-icon ${this.getIconClass(notification.type)}">
                        ${this.getIcon(notification.type)}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-white">${notification.title}</p>
                        <p class="text-sm text-gray-400 mt-1">${notification.message}</p>
                        <p class="text-xs text-gray-500 mt-1">${this.formatTime(notification.created_at)}</p>
                    </div>
                    ${!notification.is_read ? '<div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>' : ''}
                </div>
            </div>
        `).join('');

        // Add click handlers for notifications
        list.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                const isRead = item.dataset.read === 'true';
                
                if (!isRead) {
                    this.markAsRead(id);
                }

                // Handle action URL if present
                const notification = this.notifications.find(n => n.id == id);
                if (notification.action_url) {
                    window.location.href = notification.action_url;
                }
            });
        });
    }

    getIconClass(type) {
        const classes = {
            success: 'text-green-400',
            error: 'text-red-400',
            warning: 'text-yellow-400',
            info: 'text-blue-400'
        };
        return classes[type] || 'text-gray-400';
    }

    getIcon(type) {
        const icons = {
            success: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>',
            error: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>',
            warning: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>',
            info: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>'
        };
        return icons[type] || icons.info;
    }

    formatTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return time.toLocaleDateString();
    }

    togglePanel() {
        this.isVisible = !this.isVisible;
        if (this.isVisible) {
            this.container.classList.remove('hidden');
            this.loadNotifications();
        } else {
            this.container.classList.add('hidden');
        }
    }

    hidePanel() {
        this.isVisible = false;
        this.container.classList.add('hidden');
    }

    async markAsRead(id) {
        try {
            const response = await fetch(`/api/notifications/${id}/read`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                // Update local notification
                const notification = this.notifications.find(n => n.id == id);
                if (notification) {
                    notification.is_read = true;
                    this.unreadCount = Math.max(0, this.unreadCount - 1);
                    this.updateUI();
                }
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }

    async markAllRead() {
        try {
            const response = await fetch('/api/notifications/read-all', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                this.notifications.forEach(n => n.is_read = true);
                this.unreadCount = 0;
                this.updateUI();
            }
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    }

    setupRealTimeListeners() {
        // Listen for new notifications
        this.realTimeClient.on('admin_broadcast', (data) => {
            this.showBrowserNotification(data.title, data.message, data.type);
            this.loadNotifications();
        });

        this.realTimeClient.on('document_uploaded', (data) => {
            this.showBrowserNotification(
                'Document Uploaded',
                `New document "${data.title}" uploaded to ${data.platform}`,
                'info'
            );
            this.loadNotifications();
        });

        this.realTimeClient.on('chat_response', (data) => {
            this.showBrowserNotification(
                'Chat Response',
                `Response ready for ${data.platform} chat`,
                'success'
            );
        });

        this.realTimeClient.on('prompt_generated', (data) => {
            this.showBrowserNotification(
                'Prompt Generated',
                `New prompt generated for ${data.platform}`,
                'success'
            );
        });
    }

    showBrowserNotification(title, message, type = 'info') {
        // Show browser notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body: message,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: 'deepseek-ai',
                requireInteraction: false,
                silent: false
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            setTimeout(() => notification.close(), 5000);
        }

        // Show in-app toast notification
        this.showToast(title, message, type);
    }

    showToast(title, message, type = 'info') {
        const colors = {
            success: 'bg-green-600',
            error: 'bg-red-600',
            warning: 'bg-yellow-600',
            info: 'bg-blue-600'
        };

        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 ${colors[type]} text-white p-4 rounded-lg shadow-lg z-50 max-w-sm transform transition-all duration-300 translate-x-full`;
        toast.innerHTML = `
            <div class="flex items-start space-x-3">
                <div class="flex-shrink-0">
                    ${this.getIcon(type)}
                </div>
                <div class="flex-1">
                    <p class="font-medium">${title}</p>
                    <p class="text-sm opacity-90 mt-1">${message}</p>
                </div>
                <button class="flex-shrink-0 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                </button>
            </div>
        `;

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 10);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.parentElement.removeChild(toast);
                }
            }, 300);
        }, 5000);
    }

    // Method to manually add a notification (for testing)
    addNotification(title, message, type = 'info') {
        this.showBrowserNotification(title, message, type);
        this.loadNotifications();
    }
}

// Initialize notification manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('authToken')) {
        window.notificationManager = new NotificationManager();
    }
});

// Export for use in other scripts
window.NotificationManager = NotificationManager;