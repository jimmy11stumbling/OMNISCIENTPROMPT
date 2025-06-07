import { useQuery } from "@tanstack/react-query";
import { platformAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Heart, Zap, Terminal, MousePointer, Wind } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const platformIcons = {
  lovable: Heart,
  bolt: Zap,
  replit: Terminal,
  cursor: MousePointer,
  windsurf: Wind,
};

const platformColors = {
  lovable: "bg-purple-500",
  bolt: "bg-yellow-500", 
  replit: "bg-orange-500",
  cursor: "bg-blue-500",
  windsurf: "bg-teal-500",
};

export default function PlatformStatus() {
  const { data: platforms, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/platforms"],
    refetchInterval: 60000, // Refresh every minute
  });

  const handleRefresh = async () => {
    await refetch();
  };

  if (isLoading) {
    return (
      <Card className="bg-dark-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Platform Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-dark-800 rounded-lg p-4 border border-gray-700">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-700 rounded mb-2"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-700 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-dark-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Platform Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-400 text-center">Failed to load platform status</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "offline": return "bg-red-500";
      case "syncing": return "bg-yellow-500";
      case "error": return "bg-red-600";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "online": return "Online";
      case "offline": return "Offline";
      case "syncing": return "Syncing";
      case "error": return "Error";
      default: return "Unknown";
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "Never";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Unknown";
    }
  };

  return (
    <Card className="bg-dark-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Platform Integration Status</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="text-primary-400 hover:text-primary-300 border-gray-600"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh Status
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {platforms?.map((platform: any) => {
            const Icon = platformIcons[platform.name as keyof typeof platformIcons] || Terminal;
            const bgColor = platformColors[platform.name as keyof typeof platformColors] || "bg-gray-500";
            
            return (
              <div key={platform.id} className="bg-dark-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", bgColor)}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold text-white">{platform.displayName}</span>
                  </div>
                  <div className={cn("w-2 h-2 rounded-full", getStatusColor(platform.status))}></div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">API Status</span>
                    <Badge variant={platform.status === "online" ? "default" : "destructive"} className="text-xs">
                      {getStatusText(platform.status)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Sync</span>
                    <span className="text-gray-300">{formatTime(platform.lastSync)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Docs Updated</span>
                    <span className="text-gray-300">{formatTime(platform.docsLastUpdated)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Documents</span>
                    <span className="text-gray-300">{platform.documentCount}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
