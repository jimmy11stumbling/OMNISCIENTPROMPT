import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import { useQuery } from "@tanstack/react-query";
import { dashboardAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Settings, RefreshCw } from "lucide-react";
import MetricsGrid from "@/components/dashboard/metrics-grid";
import PlatformStatus from "@/components/dashboard/platform-status";
import RecentActivity from "@/components/dashboard/recent-activity";
import RAGPerformance from "@/components/dashboard/rag-performance";
import SystemHealth from "@/components/dashboard/system-health";
import { Link } from "wouter";

export default function Dashboard() {
  const { setCurrentPage, addNotification } = useAppStore();

  useEffect(() => {
    setCurrentPage("dashboard");
  }, [setCurrentPage]);

  // Real-time dashboard metrics
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleRefreshData = async () => {
    // Manually trigger a refresh of all dashboard data
    window.location.reload();
  };

  const quickActions = [
    {
      title: "Generate New Prompt",
      description: "Create AI-optimized prompts",
      icon: Plus,
      href: "/prompt-generator",
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      title: "Query RAG Database", 
      description: "Search documentation",
      icon: Search,
      href: "/rag-database",
      color: "bg-cyan-600 hover:bg-cyan-700",
    },
    {
      title: "MCP Hub Settings",
      description: "Configure protocols",
      icon: Settings,
      href: "/mcp-hub",
      color: "bg-yellow-600 hover:bg-yellow-700",
    },
  ];

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 mt-2">AI-Powered Prompt Generation Platform</p>
          </div>
          <Button onClick={handleRefreshData} variant="outline" className="border-gray-600">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Card className="bg-dark-900 border-gray-800">
          <CardContent className="p-6 text-center">
            <p className="text-red-400 text-lg">Failed to load dashboard data</p>
            <p className="text-gray-400 mt-2">Please check your connection and try again</p>
            <Button onClick={handleRefreshData} className="mt-4" variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-2">AI-Powered Prompt Generation Platform</p>
        </div>
        <Button onClick={handleRefreshData} variant="outline" className="border-gray-600">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Key Metrics */}
      <MetricsGrid />

      {/* Quick Actions */}
      <Card className="bg-dark-900 border-gray-800">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Button
                  className={`flex items-center p-4 h-auto text-left w-full ${action.color} text-white transition-colors`}
                  variant="default"
                >
                  <action.icon className="w-6 h-6 mr-3" />
                  <div>
                    <p className="font-semibold">{action.title}</p>
                    <p className="text-sm opacity-90">{action.description}</p>
                  </div>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Platform Status */}
      <PlatformStatus />

      {/* Activity and Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />
        <RAGPerformance />
      </div>

      {/* System Health */}
      <SystemHealth />
    </div>
  );
}
