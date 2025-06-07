import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/app-store";
import { mcpAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Network, 
  Server, 
  Activity, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Monitor,
  Zap,
  Clock,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export default function MCPHub() {
  const { setCurrentPage } = useAppStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("servers");

  useEffect(() => {
    setCurrentPage("mcp-hub");
  }, [setCurrentPage]);

  // MCP Servers Query
  const { data: servers, isLoading: serversLoading, error: serversError } = useQuery({
    queryKey: ["/api/mcp/servers"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // MCP Health Query
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ["/api/mcp/health"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // MCP Metrics Query
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/mcp/metrics"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Test Server Mutation
  const testServerMutation = useMutation({
    mutationFn: mcpAPI.testServer,
    onSuccess: (data, serverId) => {
      toast({
        title: "Server Test Completed",
        description: `Server ${serverId} test completed successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mcp/servers"] });
    },
    onError: (error: any, serverId) => {
      toast({
        title: "Server Test Failed",
        description: `Failed to test server ${serverId}: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleTestServer = (serverId: number) => {
    testServerMutation.mutate(serverId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online": return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "offline": return <XCircle className="w-4 h-4 text-red-400" />;
      case "error": return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default: return <XCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "text-green-400";
      case "offline": return "text-red-400";
      case "error": return "text-yellow-400";
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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">MCP Hub</h1>
          <p className="text-gray-400 mt-2">
            Model Context Protocol server management and communication hub
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge 
            variant={health?.onlineServers > 0 ? "default" : "destructive"}
            className={health?.onlineServers > 0 ? "bg-green-500 text-white" : ""}
          >
            {health?.onlineServers || 0}/{health?.totalServers || 0} Online
          </Badge>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary-600 hover:bg-primary-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Server
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-dark-900 border-gray-800">
              <DialogHeader>
                <DialogTitle className="text-white">Add MCP Server</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Server Name</Label>
                  <Input 
                    placeholder="Enter server name..."
                    className="bg-dark-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Endpoint URL</Label>
                  <Input 
                    placeholder="ws://localhost:8001/mcp"
                    className="bg-dark-800 border-gray-700 text-white"
                  />
                </div>
                <Button className="w-full bg-primary-600 hover:bg-primary-700">
                  Add Server
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-dark-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Servers</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {health?.totalServers || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                <Server className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Online Servers</p>
                <p className="text-2xl font-bold text-green-400 mt-1">
                  {health?.onlineServers || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Messages/Sec</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {metrics?.messagesPerSecond || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Queue Size</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {metrics?.queueSize || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-dark-800 border border-gray-700">
          <TabsTrigger value="servers" className="data-[state=active]:bg-primary-600">
            <Server className="w-4 h-4 mr-2" />
            Servers
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="data-[state=active]:bg-primary-600">
            <Monitor className="w-4 h-4 mr-2" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="configuration" className="data-[state=active]:bg-primary-600">
            <Settings className="w-4 h-4 mr-2" />
            Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="servers" className="space-y-6">
          {/* Server List */}
          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">MCP Servers</CardTitle>
            </CardHeader>
            <CardContent>
              {serversLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-dark-800 rounded-lg p-4 border border-gray-700">
                      <div className="animate-pulse flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-700 rounded-lg"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-700 rounded mb-2"></div>
                          <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : serversError ? (
                <div className="text-center py-8">
                  <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <p className="text-red-400">Failed to load MCP servers</p>
                  <p className="text-gray-400 text-sm mt-1">Please check your connection and try again</p>
                </div>
              ) : servers?.length === 0 ? (
                <div className="text-center py-12">
                  <Network className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No MCP servers configured</p>
                  <p className="text-gray-500 text-sm mt-2">Add servers to start managing MCP communications</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {servers?.map((server: any) => (
                    <div key={server.id} className="bg-dark-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                            <Network className="w-6 h-6 text-blue-400" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-medium text-white">{server.name}</h3>
                              {getStatusIcon(server.status)}
                            </div>
                            <p className="text-sm text-gray-400">{server.endpoint}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>Protocol: v{server.protocolVersion}</span>
                              <span>Last Heartbeat: {formatTime(server.lastHeartbeat)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge 
                            variant={server.status === "online" ? "default" : "destructive"}
                            className={cn(
                              "capitalize",
                              server.status === "online" && "bg-green-500 text-white"
                            )}
                          >
                            {server.status}
                          </Badge>
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => handleTestServer(server.id)}
                              disabled={testServerMutation.isPending}
                              variant="outline"
                              size="sm"
                              className="border-gray-600"
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="border-gray-600">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {server.capabilities && server.capabilities.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-700">
                          <p className="text-gray-400 text-sm mb-2">Capabilities</p>
                          <div className="flex flex-wrap gap-2">
                            {server.capabilities.map((capability: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs border-gray-600 text-gray-400">
                                {capability}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          {/* Real-time Monitoring */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Protocol Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Messages</span>
                  <span className="text-white font-medium">{metrics?.totalMessages || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Messages/Second</span>
                  <span className="text-white font-medium">{metrics?.messagesPerSecond || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Queue Size</span>
                  <span className="text-white font-medium">{metrics?.queueSize || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Protocol Version</span>
                  <span className="text-white font-medium">2.0</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Server Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Online Servers</span>
                  <span className="text-green-400 font-medium">{health?.onlineServers || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Offline Servers</span>
                  <span className="text-red-400 font-medium">{health?.offlineServers || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Error Servers</span>
                  <span className="text-yellow-400 font-medium">{health?.errorServers || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Overall Health</span>
                  <Badge 
                    variant={health?.onlineServers === health?.totalServers ? "default" : "destructive"}
                    className={health?.onlineServers === health?.totalServers ? "bg-green-500 text-white" : ""}
                  >
                    {health?.onlineServers === health?.totalServers ? "Healthy" : "Issues"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart Placeholder */}
          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Performance Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-dark-800 rounded-lg flex items-center justify-center border border-gray-700">
                <div className="text-center">
                  <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Real-time Performance Chart</p>
                  <p className="text-gray-500 text-sm mt-2">Message throughput and response times</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          {/* Protocol Configuration */}
          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Protocol Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-white">Protocol Version</Label>
                  <Input 
                    value="2.0"
                    disabled
                    className="bg-dark-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Max Connections</Label>
                  <Input 
                    placeholder="100"
                    className="bg-dark-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Heartbeat Interval (ms)</Label>
                  <Input 
                    placeholder="30000"
                    className="bg-dark-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Message Timeout (ms)</Label>
                  <Input 
                    placeholder="5000"
                    className="bg-dark-800 border-gray-700 text-white"
                  />
                </div>
              </div>
              
              <Button className="bg-primary-600 hover:bg-primary-700">
                Save Configuration
              </Button>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg border border-gray-700">
                <div>
                  <h4 className="text-white font-medium">Enable SSL/TLS</h4>
                  <p className="text-gray-400 text-sm">Encrypt all MCP communications</p>
                </div>
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-primary-600 bg-dark-700 border-gray-600 rounded focus:ring-primary-500"
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg border border-gray-700">
                <div>
                  <h4 className="text-white font-medium">Require Authentication</h4>
                  <p className="text-gray-400 text-sm">Validate server credentials</p>
                </div>
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-primary-600 bg-dark-700 border-gray-600 rounded focus:ring-primary-500"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
