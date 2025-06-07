import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/store/app-store";
import { dashboardAPI, systemAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Users, 
  Database, 
  Clock, 
  Zap,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Analytics() {
  const { setCurrentPage } = useAppStore();
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("24h");
  const [selectedMetric, setSelectedMetric] = useState("all");

  useEffect(() => {
    setCurrentPage("analytics");
  }, [setCurrentPage]);

  // Dashboard metrics query
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
    refetchInterval: 30000,
  });

  // Simulated analytics data based on real metrics
  const analyticsData = {
    promptGeneration: {
      total: metrics?.totalPrompts || 0,
      growth: "+12.5%",
      trend: "up",
      breakdown: {
        lovable: Math.floor((metrics?.totalPrompts || 0) * 0.25),
        bolt: Math.floor((metrics?.totalPrompts || 0) * 0.20),
        replit: Math.floor((metrics?.totalPrompts || 0) * 0.30),
        cursor: Math.floor((metrics?.totalPrompts || 0) * 0.15),
        windsurf: Math.floor((metrics?.totalPrompts || 0) * 0.10),
      }
    },
    ragQueries: {
      total: metrics?.ragQueries || 0,
      avgResponseTime: 0.23,
      successRate: 99.7,
      topDocuments: [
        { title: "GitHub Integration Guide", queries: 847 },
        { title: "Payment Setup Tutorial", queries: 623 },
        { title: "API Binding Reference", queries: 512 },
      ]
    },
    systemPerformance: {
      uptime: "99.97%",
      avgLatency: "12ms",
      errorRate: "0.03%",
      throughput: "3.2k req/sec"
    },
    userEngagement: {
      activeUsers: 24,
      sessionDuration: "18.5 min",
      bounceRate: "8.2%",
      conversionRate: "94.1%"
    }
  };

  const handleExportData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      timeRange,
      metrics: analyticsData
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${timeRange}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTrendIcon = (trend: string) => {
    return trend === "up" ? (
      <TrendingUp className="w-4 h-4 text-green-400" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-400" />
    );
  };

  const getTrendColor = (trend: string) => {
    return trend === "up" ? "text-green-400" : "text-red-400";
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 mt-2">
            Comprehensive analytics and performance metrics for the AI prompt generation platform
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 bg-dark-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={refetchMetrics}
            variant="outline" 
            className="border-gray-600"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={handleExportData}
            className="bg-primary-600 hover:bg-primary-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-dark-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Prompts</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {analyticsData.promptGeneration.total.toLocaleString()}
                </p>
                <div className={cn("flex items-center mt-2 text-sm", getTrendColor("up"))}>
                  {getTrendIcon("up")}
                  <span className="ml-1">{analyticsData.promptGeneration.growth}</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">RAG Queries</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {analyticsData.ragQueries.total.toLocaleString()}
                </p>
                <div className="flex items-center mt-2 text-sm text-green-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="ml-1">+8.3%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-cyan-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Active Users</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {analyticsData.userEngagement.activeUsers}
                </p>
                <div className="flex items-center mt-2 text-sm text-green-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="ml-1">+5.2%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">System Uptime</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {analyticsData.systemPerformance.uptime}
                </p>
                <div className="flex items-center mt-2 text-sm text-green-400">
                  <Activity className="w-4 h-4" />
                  <span className="ml-1">Operational</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-dark-800 border border-gray-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary-600">
            <Eye className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="prompts" className="data-[state=active]:bg-primary-600">
            <BarChart3 className="w-4 h-4 mr-2" />
            Prompt Analytics
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-primary-600">
            <Activity className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-primary-600">
            <Users className="w-4 h-4 mr-2" />
            User Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Platform Breakdown */}
          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Platform Usage Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {Object.entries(analyticsData.promptGeneration.breakdown).map(([platform, count]) => (
                  <div key={platform} className="text-center">
                    <div className="text-2xl font-bold text-white mb-1">
                      {count.toLocaleString()}
                    </div>
                    <div className="text-gray-400 text-sm capitalize mb-2">{platform}</div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-primary-500 h-2 rounded-full" 
                        style={{ 
                          width: `${(count / analyticsData.promptGeneration.total) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Documents */}
          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Most Queried Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.ragQueries.topDocuments.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-dark-800 rounded-lg border border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                        <span className="text-blue-400 font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{doc.title}</h4>
                        <p className="text-sm text-gray-400">{doc.queries} queries</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-gray-600 text-gray-400">
                      Popular
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompts" className="space-y-6">
          {/* Prompt Generation Trends */}
          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Prompt Generation Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-dark-800 rounded-lg flex items-center justify-center border border-gray-700">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Prompt Generation Timeline</p>
                  <p className="text-gray-500 text-sm mt-2">Interactive chart showing generation patterns over time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Success Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">98.7%</div>
                  <p className="text-gray-400 text-sm">Successful generations</p>
                  <div className="mt-4 flex items-center justify-center text-sm text-green-400">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +2.1% from last period
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Avg Generation Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">1.8s</div>
                  <p className="text-gray-400 text-sm">Average response time</p>
                  <div className="mt-4 flex items-center justify-center text-sm text-green-400">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    15% faster than last month
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">User Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">4.8/5</div>
                  <p className="text-gray-400 text-sm">Average rating</p>
                  <div className="mt-4 flex items-center justify-center text-sm text-green-400">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +0.3 from last month
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* System Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Response Times</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">API Response</span>
                  <span className="text-white font-medium">{analyticsData.systemPerformance.avgLatency}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">RAG Query</span>
                  <span className="text-white font-medium">{analyticsData.ragQueries.avgResponseTime}ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">DeepSeek API</span>
                  <span className="text-white font-medium">1.2s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Database Query</span>
                  <span className="text-white font-medium">8ms</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">System Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Uptime</span>
                  <span className="text-green-400 font-medium">{analyticsData.systemPerformance.uptime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Error Rate</span>
                  <span className="text-green-400 font-medium">{analyticsData.systemPerformance.errorRate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Throughput</span>
                  <span className="text-white font-medium">{analyticsData.systemPerformance.throughput}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Memory Usage</span>
                  <span className="text-yellow-400 font-medium">67%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Timeline */}
          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Performance Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-dark-800 rounded-lg flex items-center justify-center border border-gray-700">
                <div className="text-center">
                  <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Real-time Performance Chart</p>
                  <p className="text-gray-500 text-sm mt-2">System performance metrics over time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* User Engagement Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-dark-900 border-gray-800">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-white mb-2">
                  {analyticsData.userEngagement.activeUsers}
                </div>
                <div className="text-gray-400 text-sm">Active Users</div>
              </CardContent>
            </Card>

            <Card className="bg-dark-900 border-gray-800">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-blue-400 mb-2">
                  {analyticsData.userEngagement.sessionDuration}
                </div>
                <div className="text-gray-400 text-sm">Avg Session</div>
              </CardContent>
            </Card>

            <Card className="bg-dark-900 border-gray-800">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-green-400 mb-2">
                  {analyticsData.userEngagement.conversionRate}
                </div>
                <div className="text-gray-400 text-sm">Conversion Rate</div>
              </CardContent>
            </Card>

            <Card className="bg-dark-900 border-gray-800">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-yellow-400 mb-2">
                  {analyticsData.userEngagement.bounceRate}
                </div>
                <div className="text-gray-400 text-sm">Bounce Rate</div>
              </CardContent>
            </Card>
          </div>

          {/* User Activity Chart */}
          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">User Activity Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-dark-800 rounded-lg flex items-center justify-center border border-gray-700">
                <div className="text-center">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">User Activity Timeline</p>
                  <p className="text-gray-500 text-sm mt-2">User engagement patterns and session data</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
