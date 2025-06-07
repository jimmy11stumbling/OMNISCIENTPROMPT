import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/app-store";
import { platformAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Boxes, 
  RefreshCw, 
  FolderSync, 
  Heart, 
  Zap, 
  Terminal, 
  MousePointer, 
  Wind,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const platformIcons = {
  lovable: { icon: Heart, color: "text-purple-400", bg: "bg-purple-500" },
  bolt: { icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500" },
  replit: { icon: Terminal, color: "text-orange-400", bg: "bg-orange-500" },
  cursor: { icon: MousePointer, color: "text-blue-400", bg: "bg-blue-500" },
  windsurf: { icon: Wind, color: "text-teal-400", bg: "bg-teal-500" },
};

export default function Platforms() {
  const { setCurrentPage } = useAppStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    setCurrentPage("platforms");
  }, [setCurrentPage]);

  const { data: platforms, isLoading, error } = useQuery({
    queryKey: ["/api/platforms"],
    refetchInterval: 60000, // Refresh every minute
  });

  const syncMutation = useMutation({
    mutationFn: platformAPI.syncPlatform,
    onSuccess: (data, platformName) => {
      toast({
        title: "FolderSync Completed",
        description: `${platformName} synchronization completed successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/platforms"] });
    },
    onError: (error: any, platformName) => {
      toast({
        title: "FolderSync Failed",
        description: `Failed to sync ${platformName}: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const syncAllMutation = useMutation({
    mutationFn: platformAPI.syncAllPlatforms,
    onSuccess: (results) => {
      const successful = results.filter((r: any) => r.errors.length === 0).length;
      const failed = results.length - successful;
      
      toast({
        title: "Bulk FolderSync Completed",
        description: `${successful} platforms synced successfully${failed > 0 ? `, ${failed} failed` : ""}.`,
        variant: failed > 0 ? "destructive" : "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/platforms"] });
    },
    onError: (error: any) => {
      toast({
        title: "Bulk FolderSync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSync = (platformName: string) => {
    syncMutation.mutate(platformName);
  };

  const handleSyncAll = () => {
    syncAllMutation.mutate();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online": return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "syncing": return <RefreshCw className="w-5 h-5 text-yellow-400 animate-spin" />;
      case "error": return <XCircle className="w-5 h-5 text-red-400" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "text-green-400";
      case "offline": return "text-gray-400";
      case "syncing": return "text-yellow-400";
      case "error": return "text-red-400";
      default: return "text-gray-400";
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

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-white">Platform Integrations</h1>
          <p className="text-gray-400 mt-2">Manage and monitor no-code platform integrations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="bg-dark-900 border-gray-800">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-white">Platform Integrations</h1>
          <p className="text-gray-400 mt-2">Manage and monitor no-code platform integrations</p>
        </div>

        <Card className="bg-dark-900 border-gray-800">
          <CardContent className="p-6 text-center">
            <p className="text-red-400">Failed to load platform data</p>
            <p className="text-gray-400 text-sm mt-1">Please check your connection and try again</p>
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
          <h1 className="text-3xl font-bold text-white">Platform Integrations</h1>
          <p className="text-gray-400 mt-2">
            Manage and monitor no-code platform integrations and documentation synchronization
          </p>
        </div>
        <Button
          onClick={handleSyncAll}
          disabled={syncAllMutation.isPending}
          className="bg-primary-600 hover:bg-primary-700"
        >
          {syncAllMutation.isPending ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FolderSync className="w-4 h-4 mr-2" />
          )}
          FolderSync All Platforms
        </Button>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platforms?.map((platform: any) => {
          const iconConfig = platformIcons[platform.name as keyof typeof platformIcons];
          const Icon = iconConfig?.icon || Boxes;
          
          return (
            <Card key={platform.id} className="bg-dark-900 border-gray-800 hover:border-gray-700 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center",
                      iconConfig?.bg || "bg-gray-500"
                    )}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white">{platform.displayName}</CardTitle>
                      <p className="text-sm text-gray-400">{platform.name}</p>
                    </div>
                  </div>
                  {getStatusIcon(platform.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status Information */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Status</span>
                    <Badge
                      variant={platform.status === "online" ? "default" : "destructive"}
                      className={cn(
                        "capitalize",
                        platform.status === "online" && "bg-green-500 text-white",
                        platform.status === "syncing" && "bg-yellow-500 text-black",
                        platform.status === "error" && "bg-red-500 text-white"
                      )}
                    >
                      {platform.status}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Last FolderSync</span>
                    <span className="text-gray-300">{formatTime(platform.lastSync)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Docs Updated</span>
                    <span className="text-gray-300">{formatTime(platform.docsLastUpdated)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Documents</span>
                    <span className="text-gray-300">{platform.documentCount}</span>
                  </div>

                  {platform.metadata?.version && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Version</span>
                      <span className="text-gray-300">v{platform.metadata.version}</span>
                    </div>
                  )}
                </div>

                {/* Features */}
                {platform.metadata?.features && (
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Features</p>
                    <div className="flex flex-wrap gap-1">
                      {platform.metadata.features.slice(0, 3).map((feature: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs border-gray-600 text-gray-400">
                          {feature.replace(/-/g, ' ')}
                        </Badge>
                      ))}
                      {platform.metadata.features.length > 3 && (
                        <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                          +{platform.metadata.features.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <Button
                    onClick={() => handleSync(platform.name)}
                    disabled={syncMutation.isPending || platform.status === "syncing"}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-gray-600"
                  >
                    {syncMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <FolderSync className="w-4 h-4 mr-1" />
                    )}
                    FolderSync
                  </Button>
                  
                  {platform.apiEndpoint && (
                    <Button variant="outline" size="sm" className="border-gray-600">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Platform Statistics */}
      <Card className="bg-dark-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Platform Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-white">
                {platforms?.length || 0}
              </div>
              <div className="text-gray-400 text-sm">Total Platforms</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">
                {platforms?.filter((p: any) => p.status === "online").length || 0}
              </div>
              <div className="text-gray-400 text-sm">Online</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">
                {platforms?.reduce((sum: number, p: any) => sum + (p.documentCount || 0), 0) || 0}
              </div>
              <div className="text-gray-400 text-sm">Total Documents</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">
                {platforms?.filter((p: any) => p.status === "syncing").length || 0}
              </div>
              <div className="text-gray-400 text-sm">Syncing</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
