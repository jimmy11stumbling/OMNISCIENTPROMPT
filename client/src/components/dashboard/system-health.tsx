import { useQuery } from "@tanstack/react-query";
import { systemAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Users, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

// Simulated system health data since we don't have real metrics endpoint
const useSystemHealth = () => {
  return useQuery({
    queryKey: ["/api/system/health"],
    queryFn: async () => {
      // Simulate system health data
      return {
        cpu: Math.floor(Math.random() * 30) + 15,
        memory: Math.floor(Math.random() * 20) + 60,
        disk: Math.floor(Math.random() * 30) + 30,
        network: Math.floor(Math.random() * 10) + 5,
      };
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });
};

// Simulated active sessions data
const useActiveSessions = () => {
  return useQuery({
    queryKey: ["/api/sessions/active"],
    queryFn: async () => {
      return [
        { user: "Admin User", location: "Dashboard", duration: "15 min", status: "active" },
        { user: "API Client", location: "RAG Query", duration: "2 min", status: "active" },
        { user: "MCP Server", location: "Protocol Sync", duration: "30s", status: "active" },
      ];
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });
};

function SystemMetric({ label, value, unit, status }: { 
  label: string; 
  value: number; 
  unit: string; 
  status: "good" | "warning" | "critical" 
}) {
  const getStatusColor = () => {
    switch (status) {
      case "good": return "text-green-400 bg-green-500";
      case "warning": return "text-yellow-400 bg-yellow-500";
      case "critical": return "text-red-400 bg-red-500";
      default: return "text-gray-400 bg-gray-500";
    }
  };

  const getMetricStatus = (value: number, type: string) => {
    if (type === "cpu" || type === "memory") {
      if (value < 60) return "good";
      if (value < 80) return "warning";
      return "critical";
    }
    if (type === "disk") {
      if (value < 70) return "good";
      if (value < 85) return "warning";
      return "critical";
    }
    if (type === "network") {
      if (value < 50) return "good";
      if (value < 100) return "warning";
      return "critical";
    }
    return "good";
  };

  return (
    <div className="text-center">
      <div className={cn(
        "w-16 h-16 mx-auto mb-2 bg-opacity-20 rounded-full flex items-center justify-center",
        getStatusColor().split(" ")[1] + " bg-opacity-20"
      )}>
        <span className={cn("text-2xl font-bold", getStatusColor().split(" ")[0])}>
          {value}{unit}
        </span>
      </div>
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  );
}

export default function SystemHealth() {
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useSystemHealth();
  const { data: sessions, isLoading: sessionsLoading } = useActiveSessions();

  const handleRefresh = () => {
    refetchHealth();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* System Health Monitor */}
      <div className="lg:col-span-2">
        <Card className="bg-dark-900 border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">System Health Monitor</CardTitle>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-400">All Systems Operational</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="text-primary-400 hover:text-primary-300 border-gray-600"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="text-center animate-pulse">
                    <div className="w-16 h-16 mx-auto mb-2 bg-gray-700 rounded-full"></div>
                    <div className="h-4 bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SystemMetric 
                  label="CPU Usage" 
                  value={health?.cpu || 0} 
                  unit="%" 
                  status="good"
                />
                <SystemMetric 
                  label="Memory" 
                  value={health?.memory || 0} 
                  unit="%" 
                  status="good"
                />
                <SystemMetric 
                  label="Storage" 
                  value={health?.disk || 0} 
                  unit="%" 
                  status="good"
                />
                <SystemMetric 
                  label="Network" 
                  value={health?.network || 0} 
                  unit="ms" 
                  status="good"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Sessions */}
      <Card className="bg-dark-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Active Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessionsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 bg-dark-800 rounded-lg">
                  <div className="animate-pulse flex-1">
                    <div className="h-4 bg-gray-700 rounded mb-1"></div>
                    <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {sessions?.map((session: any, index: number) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-dark-800 rounded-lg">
                  <div className={cn(
                    "w-2 h-2 rounded-full animate-pulse",
                    session.status === "active" ? "bg-green-500" : "bg-blue-500"
                  )}></div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{session.user}</p>
                    <p className="text-xs text-gray-400">{session.location} • {session.duration}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-6 pt-4 border-t border-gray-800">
            <Button
              variant="outline"
              className="w-full bg-dark-800 hover:bg-gray-700 text-white border-gray-600"
            >
              <Activity className="w-4 h-4 mr-2" />
              View All Sessions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
