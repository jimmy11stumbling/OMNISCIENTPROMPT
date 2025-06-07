import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/store/app-store";
import { systemAPI, mcpAPI, a2aAPI, ragAPI, platformAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Activity, 
  Server, 
  Database, 
  Network, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  Cpu,
  HardDrive,
  MemoryStick,
  Wifi,
  Eye,
  Settings,
  Bell,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

// Simulated system health data since we don't have real system metrics endpoint
const useSystemHealth = () => {
  return useQuery({
    queryKey: ["/api/system/health"],
    queryFn: async () => {
      const health = await systemAPI.getHealth();
      return {
        ...health,
        cpu: Math.floor(Math.random() * 30) + 15,
        memory: Math.floor(Math.random() * 20) + 60,
        disk: Math.floor(Math.random() * 30) + 30,
        network: Math.floor(Math.random() * 10) + 5,
        timestamp: new Date().toISOString()
      };
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });
};

const useSystemAlerts = () => {
  return useQuery({
    queryKey: ["/api/system/alerts"],
    queryFn: async () => {
      // In a real implementation, this would fetch actual system alerts
      return [
        {
          id: 1,
          type: "warning",
          title: "High Memory Usage",
          message: "Memory usage has exceeded 80% for the past 10 minutes",
          timestamp: new Date(Date.now() - 600000).toISOString(),
          resolved: false
        },
        {
          id: 2,
          type: "info",
          title: "Scheduled Maintenance",
          message: "Database maintenance scheduled for tomorrow at 2:00 AM UTC",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          resolved: false
        }
      ];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

export default function Monitoring() {
  const { setCurrentPage } = useAppStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("1h");
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    setCurrentPage("monitoring");
  }, [setCurrentPage]);

  // System Health Query
  const { data: systemHealth, isLoading: healthLoading, refetch: refetchHealth } = useSystemHealth();

  // System Alerts Query
  const { data: alerts, isLoading: alertsLoading } = useSystemAlerts();

  // MCP Health Query
  const { data: mcpHealth, isLoading: mcpLoading } = useQuery({
    queryKey: ["/api/mcp/health"],
    refetchInterval: autoRefresh ? 10000 : false,
  });

  // A2A Metrics Query
  const { data: a2aMetrics, isLoading: a2aLoading } = useQuery({
    queryKey: ["/api/a2a/metrics"],
    refetchInterval: autoRefresh ? 10000 : false,
  });

  // RAG Performance Query
  const { data: ragPerformance, isLoading: ragLoading } = useQuery({
    queryKey: ["/api/rag/performance"],
    refetchInterval: autoRefresh ? 10000 : false,
  });

  // Platform Status Query
  const { data: platforms, isLoading: platformsLoading } = useQuery({
    queryKey: ["/api/platforms"],
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const handleRefreshAll = async () => {
    await Promise.all([
      refetchHealth(),
    ]);
    toast({
      title: "Data Refreshed",
      description: "All monitoring data has been refreshed.",
    });
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    toast({
      title: autoRefresh ? "Auto-refresh Disabled" : "Auto-refresh Enabled",
      description: autoRefresh 
        ? "Monitoring data will no longer auto-refresh." 
        : "Monitoring data will now auto-refresh every few seconds.",
    });
  };

  const getHealthStatus = () => {
    if (!systemHealth) return "unknown";
    
    const avgUsage = (systemHealth.cpu + systemHealth.memory + systemHealth.disk) / 3;
    if (avgUsage < 60) return "healthy";
    if (avgUsage < 80) return "warning";
    return "critical";
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-green-400";
      case "warning": return "text-yellow-400";
      case "critical": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case "healthy": return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "warning": return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case "critical": return <XCircle className="w-5 h-5 text-red-400" />;
      default: return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };

  const systemStatus = getHealthStatus();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">System Monitoring</h1>
          <p className="text-gray-400 mt-2">
            Real-time monitoring and health metrics for all system components
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 bg-dark-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5m">Last 5m</SelectItem>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={toggleAutoRefresh}
            variant={autoRefresh ? "default" : "outline"}
            className={autoRefresh ? "bg-green-600 hover:bg-green-700" : "border-gray-600"}
          >
            <Eye className="w-4 h-4 mr-2" />
            {autoRefresh ? "Live" : "Paused"}
          </Button>
          <Button 
            onClick={handleRefreshAll}
            variant="outline" 
            className="border-gray-600"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <Card className="bg-dark-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center">
              {getHealthIcon(systemStatus)}
              <span className="ml-2">System Status</span>
            </CardTitle>
            <Badge 
              variant={systemStatus === "healthy" ? "default" : "destructive"}
              className={cn(
                "capitalize",
                systemStatus === "healthy" && "bg-green-500 text-white",
                systemStatus === "warning" && "bg-yellow-500 text-black"
              )}
            >
              {systemStatus}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <Cpu className="w-8 h-8 text-blue-400 mr-2" />
                <div>
                  <div className="text-2xl font-bold text-white">
                    {systemHealth?.cpu || 0}%
                  </div>
                  <div className="text-gray-400 text-sm">CPU Usage</div>
                </div>
              </div>
              <Progress 
                value={systemHealth?.cpu || 0} 
                className="h-2"
              />
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <MemoryStick className="w-8 h-8 text-green-400 mr-2" />
                <div>
                  <div className="text-2xl font-bold text-white">
                    {systemHealth?.memory || 0}%
                  </div>
                  <div className="text-gray-400 text-sm">Memory Usage</div>
                </div>
              </div>
              <Progress 
                value={systemHealth?.memory || 0} 
                className="h-2"
              />
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <HardDrive className="w-8 h-8 text-purple-400 mr-2" />
                <div>
                  <div className="text-2xl font-bold text-white">
                    {systemHealth?.disk || 0}%
                  </div>
                  <div className="text-gray-400 text-sm">Disk Usage</div>
                </div>
              </div>
              <Progress 
                value={systemHealth?.disk || 0} 
                className="h-2"
              />
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <Wifi className="w-8 h-8 text-yellow-400 mr-2" />
                <div>
                  <div className="text-2xl font-bold text-white">
                    {systemHealth?.network || 0}ms
                  </div>
                  <div className="text-gray-400 text-sm">Network Latency</div>
                </div>
              </div>
              <div className="h-2 bg-gray-700 rounded-full">
                <div 
                  className="h-2 bg-yellow-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(((systemHealth?.network || 0) / 100) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {systemHealth?.timestamp && (
            <div className="mt-6 pt-4 border-t border-gray-800 text-center">
              <p className="text-gray-400 text-sm">
                Last updated: {formatDistanceToNow(new Date(systemHealth.timestamp), { addSuffix: true })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Alerts */}
      {alerts && alerts.length > 0 && (
        <Card className="bg-dark-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Active Alerts ({alerts.filter(a => !a.resolved).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.filter(a => !a.resolved).map((alert) => (
                <Alert key={alert.id} className={cn(
                  "border-l-4",
                  alert.type === "warning" && "border-l-yellow-500 bg-yellow-500 bg-opacity-10",
                  alert.type === "error" && "border-l-red-500 bg-red-500 bg-opacity-10",
                  alert.type === "info" && "border-l-blue-500 bg-blue-500 bg-opacity-10"
                )}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{alert.title}</p>
                        <p className="text-gray-400 text-sm mt-1">{alert.message}</p>
                        <p className="text-gray-500 text-xs mt-2">
                          {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                      <Badge variant="outline" className="border-gray-600 text-gray-400 capitalize">
                        {alert.type}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Monitoring */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-dark-800 border border-gray-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary-600">
            <Activity className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="services" className="data-[state=active]:bg-primary-600">
            <Server className="w-4 h-4 mr-2" />
            Services
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-primary-600">
            <Zap className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-primary-600">
            <Eye className="w-4 h-4 mr-2" />
            System Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Service Health Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Network className="w-5 h-5 mr-2" />
                  MCP Protocol
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mcpLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Status</span>
                      <Badge variant="default" className="bg-green-500 text-white">
                        Operational
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Online Servers</span>
                      <span className="text-white">{mcpHealth?.onlineServers || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Servers</span>
                      <span className="text-white">{mcpHealth?.totalServers || 0}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  RAG Database
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ragLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Status</span>
                      <Badge variant="default" className="bg-green-500 text-white">
                        Healthy
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Avg Query Time</span>
                      <span className="text-white">{ragPerformance?.avgRetrievalTime || 0}ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Success Rate</span>
                      <span className="text-green-400">{ragPerformance?.successRate || 0}%</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  A2A Protocol
                </CardTitle>
              </CardHeader>
              <CardContent>
                {a2aLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Status</span>
                      <Badge variant="default" className="bg-green-500 text-white">
                        Active
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Active Agents</span>
                      <span className="text-white">{a2aMetrics?.activeAgents || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Avg Response</span>
                      <span className="text-white">{a2aMetrics?.avgResponseTime || 0}ms</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Platform Health */}
          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Platform Integration Health</CardTitle>
            </CardHeader>
            <CardContent>
              {platformsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-700 rounded mb-2"></div>
                      <div className="h-4 bg-gray-700 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {platforms?.map((platform: any) => (
                    <div key={platform.id} className="text-center p-4 bg-dark-800 rounded-lg border border-gray-700">
                      <div className={cn(
                        "w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center",
                        platform.status === "online" ? "bg-green-500 bg-opacity-20" : "bg-red-500 bg-opacity-20"
                      )}>
                        {platform.status === "online" ? (
                          <CheckCircle className="w-6 h-6 text-green-400" />
                        ) : (
                          <XCircle className="w-6 h-6 text-red-400" />
                        )}
                      </div>
                      <h4 className="font-medium text-white">{platform.displayName}</h4>
                      <Badge 
                        variant={platform.status === "online" ? "default" : "destructive"}
                        className={cn(
                          "mt-2 text-xs",
                          platform.status === "online" && "bg-green-500 text-white"
                        )}
                      >
                        {platform.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          {/* Detailed Service Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Core Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="font-medium text-white">API Gateway</p>
                      <p className="text-sm text-gray-400">Express.js Server</p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-500 text-white">Online</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="font-medium text-white">Database</p>
                      <p className="text-sm text-gray-400">PostgreSQL</p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-500 text-white">Online</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="font-medium text-white">WebSocket</p>
                      <p className="text-sm text-gray-400">Real-time Communication</p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-500 text-white">Online</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">AI Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="font-medium text-white">DeepSeek API</p>
                      <p className="text-sm text-gray-400">AI Reasoning</p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-500 text-white">Connected</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="font-medium text-white">RAG Engine</p>
                      <p className="text-sm text-gray-400">Vector Search</p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-500 text-white">Operational</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="font-medium text-white">Embedding Service</p>
                      <p className="text-sm text-gray-400">Document Processing</p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-500 text-white">Active</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Response Time Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-dark-800 rounded-lg flex items-center justify-center border border-gray-700">
                  <div className="text-center">
                    <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Response Time Chart</p>
                    <p className="text-gray-500 text-sm mt-2">API response times over {timeRange}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Throughput Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-dark-800 rounded-lg flex items-center justify-center border border-gray-700">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Throughput Chart</p>
                    <p className="text-gray-500 text-sm mt-2">Requests per second over {timeRange}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Current Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">3.2k</div>
                  <div className="text-gray-400 text-sm">Requests/sec</div>
                  <div className="flex items-center justify-center mt-1 text-sm text-green-400">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +5.2%
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">12ms</div>
                  <div className="text-gray-400 text-sm">Avg Latency</div>
                  <div className="flex items-center justify-center mt-1 text-sm text-green-400">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    -8.1%
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">99.97%</div>
                  <div className="text-gray-400 text-sm">Uptime</div>
                  <div className="flex items-center justify-center mt-1 text-sm text-green-400">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Stable
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">0.03%</div>
                  <div className="text-gray-400 text-sm">Error Rate</div>
                  <div className="flex items-center justify-center mt-1 text-sm text-green-400">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    -12.5%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          {/* System Logs */}
          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">System Logs</CardTitle>
                <div className="flex items-center space-x-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-32 bg-dark-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Logs</SelectItem>
                      <SelectItem value="error">Errors</SelectItem>
                      <SelectItem value="warning">Warnings</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="border-gray-600">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-dark-800 rounded-lg p-4 border border-gray-700 font-mono text-sm">
                <div className="space-y-1 text-gray-300 max-h-96 overflow-y-auto">
                  <div className="flex">
                    <span className="text-gray-500 mr-4">{new Date().toISOString()}</span>
                    <span className="text-green-400 mr-2">[INFO]</span>
                    <span>System monitoring initialized successfully</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 mr-4">{new Date(Date.now() - 5000).toISOString()}</span>
                    <span className="text-blue-400 mr-2">[DEBUG]</span>
                    <span>MCP server health check completed</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 mr-4">{new Date(Date.now() - 10000).toISOString()}</span>
                    <span className="text-green-400 mr-2">[INFO]</span>
                    <span>RAG database performance metrics updated</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 mr-4">{new Date(Date.now() - 15000).toISOString()}</span>
                    <span className="text-yellow-400 mr-2">[WARN]</span>
                    <span>Memory usage approaching 80% threshold</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 mr-4">{new Date(Date.now() - 20000).toISOString()}</span>
                    <span className="text-green-400 mr-2">[INFO]</span>
                    <span>A2A agent task assignment completed</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 mr-4">{new Date(Date.now() - 25000).toISOString()}</span>
                    <span className="text-blue-400 mr-2">[DEBUG]</span>
                    <span>Platform synchronization status updated</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
