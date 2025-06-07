import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Brain, 
  Gauge, 
  Wand2, 
  Boxes, 
  Database, 
  Network, 
  ArrowLeftRight, 
  Bot,
  BarChart3,
  Activity,
  Settings,
  BookOpen,
  User,
  MoreHorizontal,
  Menu,
  X
} from "lucide-react";

const navigationItems = [
  {
    section: "Main",
    items: [
      { path: "/dashboard", label: "Dashboard", icon: Gauge, active: true },
      { path: "/prompt-generator", label: "Prompt Generator", icon: Wand2 },
      { path: "/platforms", label: "Platforms", icon: Boxes },
      { path: "/rag-database", label: "RAG Database", icon: Database },
    ]
  },
  {
    section: "Protocols",
    items: [
      { path: "/mcp-hub", label: "MCP Hub", icon: Network, badge: "Active", badgeVariant: "success" },
      { path: "/a2a-protocol", label: "A2A Protocol", icon: ArrowLeftRight, badge: "Connected", badgeVariant: "success" },
      { path: "/deepseek-integration", label: "DeepSeek API", icon: Bot, badge: "Online", badgeVariant: "success" },
    ]
  },
  {
    section: "Management", 
    items: [
      { path: "/analytics", label: "Analytics", icon: BarChart3 },
      { path: "/monitoring", label: "System Monitoring", icon: Activity },
      { path: "/admin-portal", label: "Admin Portal", icon: Settings },
      { path: "/documentation", label: "Documentation Hub", icon: BookOpen },
    ]
  }
];

export default function Sidebar() {
  const [location] = useLocation();
  const { sidebarOpen, setSidebarOpen, setCurrentPage } = useAppStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleNavClick = (path: string, label: string) => {
    setCurrentPage(label.toLowerCase().replace(/\s+/g, '-'));
  };

  const getBadgeVariant = (variant?: string) => {
    switch (variant) {
      case "success": return "default";
      case "warning": return "secondary";
      case "error": return "destructive";
      default: return "outline";
    }
  };

  const getBadgeColor = (variant?: string) => {
    switch (variant) {
      case "success": return "bg-green-500 text-white";
      case "warning": return "bg-yellow-500 text-black";
      case "error": return "bg-red-500 text-white";
      default: return "";
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-50 h-full w-64 bg-dark-900 border-r border-gray-800 flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Close button for mobile */}
        <div className="flex items-center justify-between p-4 lg:hidden">
          <div className="text-lg font-semibold text-white">Menu</div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* App Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AI PromptGen</h1>
              <p className="text-xs text-gray-400">Enterprise Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto custom-scrollbar">
          {navigationItems.map((section) => (
            <div key={section.section} className="space-y-2">
              {section.section !== "Main" && (
                <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {section.section}
                </p>
              )}
              
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = location === item.path || (location === "/" && item.path === "/dashboard");
                  const Icon = item.icon;
                  
                  return (
                    <Tooltip key={item.path}>
                      <TooltipTrigger asChild>
                        <Link href={item.path}>
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full justify-start px-3 py-2 h-auto text-left transition-colors",
                              isActive 
                                ? "bg-primary-500 text-white hover:bg-primary-600" 
                                : "text-gray-300 hover:bg-gray-800 hover:text-white"
                            )}
                            onClick={() => handleNavClick(item.path, item.label)}
                          >
                            <Icon className="w-5 h-5 mr-3" />
                            <span className="flex-1">{item.label}</span>
                            {item.badge && (
                              <Badge 
                                variant={getBadgeVariant(item.badgeVariant)}
                                className={cn(
                                  "ml-auto px-2 py-1 text-xs",
                                  getBadgeColor(item.badgeVariant)
                                )}
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{item.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Admin User</p>
              <p className="text-xs text-gray-400">Enterprise Access</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white h-6 w-6"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
