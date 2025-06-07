import { useAppStore } from "@/store/app-store";
import { useWSConnection } from "@/lib/websocket";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Menu, 
  Bell, 
  Clock, 
  Server, 
  Wifi,
  WifiOff 
} from "lucide-react";

export default function Header() {
  const { 
    sidebarOpen, 
    setSidebarOpen, 
    setNotificationPanelOpen, 
    currentPage,
    unreadCount,
    wsConnected 
  } = useAppStore();
  
  const { isConnected } = useWSConnection();

  const formatPageTitle = (page: string) => {
    return page.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getPageDescription = (page: string) => {
    const descriptions: Record<string, string> = {
      'dashboard': 'AI-Powered Prompt Generation Platform',
      'prompt-generator': 'Generate optimized prompts for no-code platforms',
      'platforms': 'Manage platform integrations and status',
      'rag-database': 'RAG 2.0 database and documentation management',
      'mcp-hub': 'Model Context Protocol server management',
      'a2a-protocol': 'Agent-to-Agent communication protocols',
      'deepseek-integration': 'DeepSeek-reasoner AI integration',
      'analytics': 'System analytics and performance metrics',
      'monitoring': 'Real-time system monitoring and health',
      'admin-portal': 'Administrative controls and settings',
      'documentation': 'Platform documentation and guides',
    };
    
    return descriptions[page] || 'AI-Powered Enterprise Platform';
  };

  return (
    <header className="bg-dark-900 border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold text-white">
              {formatPageTitle(currentPage)}
            </h1>
            <p className="text-sm text-gray-400">
              {getPageDescription(currentPage)}
            </p>
          </div>
        </div>
        
        {/* System Status & Actions */}
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {isConnected || wsConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-400" />
                <span className="text-sm text-gray-300 hidden sm:inline">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-400" />
                <span className="text-sm text-gray-300 hidden sm:inline">Disconnected</span>
              </>
            )}
          </div>

          {/* System Uptime */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300 hidden md:inline">System Online</span>
          </div>
          
          {/* Uptime Stats */}
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-300 hidden lg:inline">99.9% Uptime</span>
          </div>
          
          {/* Active Connections */}
          <div className="flex items-center space-x-2">
            <Server className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-300 hidden xl:inline">24 Active</span>
          </div>
          
          {/* Notification Bell */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-gray-400 hover:text-white"
            onClick={() => setNotificationPanelOpen(true)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
