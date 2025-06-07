import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { NotificationItem, SystemMetrics, PlatformStatus, RecentActivity, RAGPerformance, SystemHealth, ActiveSession } from '@/types';

interface AppState {
  // UI State
  sidebarOpen: boolean;
  notificationPanelOpen: boolean;
  currentPage: string;
  
  // System State
  systemMetrics: SystemMetrics | null;
  platformStatuses: PlatformStatus[];
  recentActivity: RecentActivity[];
  ragPerformance: RAGPerformance | null;
  systemHealth: SystemHealth | null;
  activeSessions: ActiveSession[];
  
  // Notifications
  notifications: NotificationItem[];
  unreadCount: number;
  
  // WebSocket connection status
  wsConnected: boolean;
  
  // Loading states
  isLoading: boolean;
  loadingStates: Record<string, boolean>;
}

interface AppActions {
  // UI Actions
  setSidebarOpen: (open: boolean) => void;
  setNotificationPanelOpen: (open: boolean) => void;
  setCurrentPage: (page: string) => void;
  
  // System Actions
  setSystemMetrics: (metrics: SystemMetrics) => void;
  setPlatformStatuses: (statuses: PlatformStatus[]) => void;
  updatePlatformStatus: (name: string, status: Partial<PlatformStatus>) => void;
  setRecentActivity: (activity: RecentActivity[]) => void;
  addActivity: (activity: RecentActivity) => void;
  setRAGPerformance: (performance: RAGPerformance) => void;
  setSystemHealth: (health: SystemHealth) => void;
  setActiveSessions: (sessions: ActiveSession[]) => void;
  
  // Notification Actions
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  removeNotification: (id: string) => void;
  
  // WebSocket Actions
  setWSConnected: (connected: boolean) => void;
  
  // Loading Actions
  setLoading: (loading: boolean) => void;
  setLoadingState: (key: string, loading: boolean) => void;
  
  // Utility Actions
  refreshData: () => Promise<void>;
}

const initialState: AppState = {
  sidebarOpen: true,
  notificationPanelOpen: false,
  currentPage: 'dashboard',
  systemMetrics: null,
  platformStatuses: [],
  recentActivity: [],
  ragPerformance: null,
  systemHealth: null,
  activeSessions: [],
  notifications: [],
  unreadCount: 0,
  wsConnected: false,
  isLoading: false,
  loadingStates: {},
};

export const useAppStore = create<AppState & AppActions>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // UI Actions
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setNotificationPanelOpen: (open) => set({ notificationPanelOpen: open }),
      setCurrentPage: (page) => set({ currentPage: page }),
      
      // System Actions
      setSystemMetrics: (metrics) => set({ systemMetrics: metrics }),
      setPlatformStatuses: (statuses) => set({ platformStatuses: statuses }),
      updatePlatformStatus: (name, updates) => set((state) => ({
        platformStatuses: state.platformStatuses.map(platform =>
          platform.name === name ? { ...platform, ...updates } : platform
        )
      })),
      setRecentActivity: (activity) => set({ recentActivity: activity }),
      addActivity: (activity) => set((state) => ({
        recentActivity: [activity, ...state.recentActivity.slice(0, 9)] // Keep last 10
      })),
      setRAGPerformance: (performance) => set({ ragPerformance: performance }),
      setSystemHealth: (health) => set({ systemHealth: health }),
      setActiveSessions: (sessions) => set({ activeSessions: sessions }),
      
      // Notification Actions
      addNotification: (notification) => {
        const newNotification: NotificationItem = {
          ...notification,
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          read: false,
        };
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));
      },
      
      markNotificationRead: (id) => set((state) => {
        const notification = state.notifications.find(n => n.id === id);
        if (notification && !notification.read) {
          return {
            notifications: state.notifications.map(n =>
              n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          };
        }
        return state;
      }),
      
      markAllNotificationsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      })),
      
      removeNotification: (id) => set((state) => {
        const notification = state.notifications.find(n => n.id === id);
        return {
          notifications: state.notifications.filter(n => n.id !== id),
          unreadCount: notification && !notification.read 
            ? Math.max(0, state.unreadCount - 1) 
            : state.unreadCount,
        };
      }),
      
      // WebSocket Actions
      setWSConnected: (connected) => set({ wsConnected: connected }),
      
      // Loading Actions
      setLoading: (loading) => set({ isLoading: loading }),
      setLoadingState: (key, loading) => set((state) => ({
        loadingStates: { ...state.loadingStates, [key]: loading },
      })),
      
      // Utility Actions
      refreshData: async () => {
        const { setLoading } = get();
        setLoading(true);
        
        try {
          // Trigger data refresh
          // This would normally call the API functions to refresh all data
          console.log('Refreshing application data...');
          
          // Simulate refresh time
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error('Failed to refresh data:', error);
        } finally {
          setLoading(false);
        }
      },
    }),
    {
      name: 'app-store',
    }
  )
);

// Selector hooks for better performance
export const useSystemMetrics = () => useAppStore(state => state.systemMetrics);
export const usePlatformStatuses = () => useAppStore(state => state.platformStatuses);
export const useNotifications = () => useAppStore(state => ({
  notifications: state.notifications,
  unreadCount: state.unreadCount,
}));
export const useWSConnection = () => useAppStore(state => state.wsConnected);
export const useLoadingState = (key?: string) => useAppStore(state => 
  key ? state.loadingStates[key] || false : state.isLoading
);

// Provider component for app store
export const AppStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
