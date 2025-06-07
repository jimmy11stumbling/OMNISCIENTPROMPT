import { useQuery } from "@tanstack/react-query";
import { promptAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const platformIcons = {
  lovable: "💜",
  bolt: "⚡", 
  replit: "🔧",
  cursor: "🎯",
  windsurf: "🌊",
};

export default function RecentActivity() {
  const { data: prompts, isLoading, error } = useQuery({
    queryKey: ["/api/prompts"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card className="bg-dark-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Prompt Generation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-3 bg-dark-800 rounded-lg">
                <div className="animate-pulse flex-1">
                  <div className="h-4 bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-2/3"></div>
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
          <CardTitle className="text-white">Recent Prompt Generation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-400 text-center">Failed to load recent activity</p>
        </CardContent>
      </Card>
    );
  }

  const recentPrompts = prompts?.slice(0, 5) || [];

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Unknown time";
    }
  };

  const getPlatformIcon = (platform: string) => {
    return platformIcons[platform as keyof typeof platformIcons] || "🔧";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "pending": return "bg-yellow-500";
      case "error": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <Card className="bg-dark-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Recent Prompt Generation</CardTitle>
          <Button variant="outline" size="sm" className="text-primary-400 hover:text-primary-300 border-gray-600">
            <ExternalLink className="w-4 h-4 mr-1" />
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {recentPrompts.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No recent prompt generation activity</p>
            <p className="text-gray-500 text-sm mt-1">Generated prompts will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentPrompts.map((prompt: any) => (
              <div key={prompt.id} className="flex items-center space-x-4 p-3 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors">
                <div className="w-10 h-10 bg-primary-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                  <span className="text-lg">{getPlatformIcon(prompt.platform)}</span>
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium line-clamp-1">{prompt.title}</p>
                  <p className="text-sm text-gray-400">
                    Platform: {prompt.platform.charAt(0).toUpperCase() + prompt.platform.slice(1)} • 
                    Generated: {formatTime(prompt.generatedAt)}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="default" className="bg-green-500 text-white">
                    Success
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
