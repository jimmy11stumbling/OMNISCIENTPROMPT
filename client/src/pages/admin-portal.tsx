import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/app-store";
import { systemAPI, platformAPI, mcpAPI, a2aAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  Users, 
  Database, 
  Shield, 
  Key, 
  Server,
  Activity,
  Trash2,
  Edit,
  Plus,
  Download,
  Upload,
  RefreshCw,
  Save,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Copy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface SystemConfig {
  apiKeys: {
    deepseek: string;
    openai?: string;
  };
  features: {
    autoRefresh: boolean;
    realTimeUpdates: boolean;
    debugMode: boolean;
    maintenanceMode: boolean;
  };
  performance: {
    cacheTimeout: number;
    maxConnections: number;
    requestTimeout: number;
  };
  security: {
    requireAuth: boolean;
    encryptLogs: boolean;
    auditTrail: boolean;
  };
}

// Simulated user management data
const useUsers = () => {
  return useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      return [
        {
          id: 1,
          username: "admin",
          role: "administrator",
          lastLogin: new Date(Date.now() - 3600000).toISOString(),
          status: "active",
          createdAt: new Date(Date.now() - 86400000 * 30).toISOString()
        },
        {
          id: 2,
          username: "api_user",
          role: "api_access",
          lastLogin: new Date(Date.now() - 1800000).toISOString(),
          status: "active",
          createdAt: new Date(Date.now() - 86400000 * 7).toISOString()
        }
      ];
    },
  });
};

export default function AdminPortal() {
  const { setCurrentPage } = useAppStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    apiKeys: {
      deepseek: "sk-****"
    },
    features: {
      autoRefresh: true,
      realTimeUpdates: true,
      debugMode: false,
      maintenanceMode: false
    },
    performance: {
      cacheTimeout: 300,
      maxConnections: 100,
      requestTimeout: 30
    },
    security: {
      requireAuth: true,
      encryptLogs: true,
      auditTrail: true
    }
  });

  useEffect(() => {
    setCurrentPage("admin-portal");
  }, [setCurrentPage]);

  // System health query
  const { data: systemHealth } = useQuery({
    queryKey: ["/api/health"],
    refetchInterval: 30000,
  });

  // Users query
  const { data: users, isLoading: usersLoading } = useUsers();

  // System metrics query
  const { data: metrics } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
    refetchInterval: 30000,
  });

  // Initialize system mutation
  const initializeMutation = useMutation({
    mutationFn: systemAPI.initialize,
    onSuccess: () => {
      toast({
        title: "System Initialized",
        description: "System has been initialized with sample data.",
      });
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      toast({
        title: "Initialization Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Platform sync mutation
  const syncAllMutation = useMutation({
    mutationFn: platformAPI.syncAllPlatforms,
    onSuccess: (results) => {
      const successful = results.filter((r: any) => r.errors.length === 0).length;
      toast({
        title: "Bulk Sync Completed",
        description: `${successful} platforms synced successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/platforms"] });
    },
    onError: (error: any) => {
      toast({
        title: "Bulk Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveConfig = () => {
    // In a real implementation, this would save to the backend
    toast({
      title: "Configuration Saved",
      description: "System configuration has been updated successfully.",
    });
  };

  const handleInitializeSystem = () => {
    initializeMutation.mutate();
  };

  const handleSyncAllPlatforms = () => {
    syncAllMutation.mutate();
  };

  const handleExportConfig = () => {
    const config = {
      timestamp: new Date().toISOString(),
      systemConfig,
      metrics,
      systemHealth
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `system-config-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Configuration Exported",
      description: "System configuration has been exported successfully.",
    });
  };

  const updateConfig = (section: keyof SystemConfig, key: string, value: any) => {
    setSystemConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: `${label} has been copied to your clipboard.`,
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Portal</h1>
          <p className="text-gray-400 mt-2">
            Administrative controls and system configuration management
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge 
            variant={systemHealth?.services?.database === "online" ? "default" : "destructive"}
            className={systemHealth?.services?.database === "online" ? "bg-green-500 text-white" : ""}
          >
            {systemHealth?.services?.database === "online" ? "System Online" : "System Issues"}
          </Badge>
          <Button 
            onClick={handleExportConfig}
            variant="outline" 
            className="border-gray-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Config
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-dark-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Users</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {users?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Active Services</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {Object.values(systemHealth?.services || {}).filter(s => s === "online").length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                <Server className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">System Uptime</p>
                <p className="text-2xl font-bold text-white mt-1">99.97%</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Security Status</p>
                <p className="text-2xl font-bold text-green-400 mt-1">Secure</p>
              </div>
              <div className="w-12 h-12 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-dark-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={handleInitializeSystem}
              disabled={initializeMutation.isPending}
              className="flex flex-col items-center p-4 h-auto bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Database className="w-6 h-6 mb-2" />
              <span className="font-semibold">Initialize System</span>
              <span className="text-xs opacity-90">Setup sample data</span>
            </Button>

            <Button
              onClick={handleSyncAllPlatforms}
              disabled={syncAllMutation.isPending}
              className="flex flex-col items-center p-4 h-auto bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              <RefreshCw className={cn("w-6 h-6 mb-2", syncAllMutation.isPending && "animate-spin")} />
              <span className="font-semibold">Sync Platforms</span>
              <span className="text-xs opacity-90">Update all platforms</span>
            </Button>

            <Button
              onClick={() => setSystemConfig(prev => ({ ...prev, features: { ...prev.features, maintenanceMode: !prev.features.maintenanceMode } }))}
              variant="outline"
              className="flex flex-col items-center p-4 h-auto border-gray-600"
            >
              <Settings className="w-6 h-6 mb-2" />
              <span className="font-semibold">Maintenance</span>
              <span className="text-xs opacity-90">
                {systemConfig.features.maintenanceMode ? "Exit" : "Enter"} maintenance
              </span>
            </Button>

            <Button
              onClick={handleExportConfig}
              variant="outline"
              className="flex flex-col items-center p-4 h-auto border-gray-600"
            >
              <Download className="w-6 h-6 mb-2" />
              <span className="font-semibold">Export Data</span>
              <span className="text-xs opacity-90">Download config</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-dark-800 border border-gray-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary-600">
            <Activity className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-primary-600">
            <Users className="w-4 h-4 mr-2" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-primary-600">
            <Settings className="w-4 h-4 mr-2" />
            System Config
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-primary-600">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="data-[state=active]:bg-primary-600">
            <Server className="w-4 h-4 mr-2" />
            Maintenance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* System Status */}
          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">System Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-white">Service Health</h4>
                  {Object.entries(systemHealth?.services || {}).map(([service, status]) => (
                    <div key={service} className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                      <div className="flex items-center space-x-2">
                        {status === "online" ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                        <span className="text-white capitalize">{service}</span>
                      </div>
                      <Badge 
                        variant={status === "online" ? "default" : "destructive"}
                        className={status === "online" ? "bg-green-500 text-white" : ""}
                      >
                        {status}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-white">System Features</h4>
                  {Object.entries(systemConfig.features).map(([feature, enabled]) => (
                    <div key={feature} className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                      <span className="text-white capitalize">{feature.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <Badge variant={enabled ? "default" : "outline"} className={enabled ? "bg-green-500 text-white" : "border-gray-600"}>
                        {enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Recent Administrative Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-dark-800 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                    <Settings className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">System configuration updated</p>
                    <p className="text-sm text-gray-400">Security settings modified • {formatDistanceToNow(new Date(Date.now() - 300000), { addSuffix: true })}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-dark-800 rounded-lg">
                  <div className="w-8 h-8 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">User access granted</p>
                    <p className="text-sm text-gray-400">API access enabled for new user • {formatDistanceToNow(new Date(Date.now() - 1800000), { addSuffix: true })}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-dark-800 rounded-lg">
                  <div className="w-8 h-8 bg-purple-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                    <Database className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">System backup completed</p>
                    <p className="text-sm text-gray-400">Automated backup successful • {formatDistanceToNow(new Date(Date.now() - 3600000), { addSuffix: true })}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* User Management */}
          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">User Management</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-primary-600 hover:bg-primary-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-dark-900 border-gray-800">
                    <DialogHeader>
                      <DialogTitle className="text-white">Add New User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-white">Username</Label>
                        <Input 
                          placeholder="Enter username..."
                          className="bg-dark-800 border-gray-700 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Role</Label>
                        <Select>
                          <SelectTrigger className="bg-dark-800 border-gray-700 text-white">
                            <SelectValue placeholder="Select role..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="administrator">Administrator</SelectItem>
                            <SelectItem value="user">Standard User</SelectItem>
                            <SelectItem value="api_access">API Access</SelectItem>
                            <SelectItem value="readonly">Read Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Password</Label>
                        <Input 
                          type="password"
                          placeholder="Enter password..."
                          className="bg-dark-800 border-gray-700 text-white"
                        />
                      </div>
                      <Button className="w-full bg-primary-600 hover:bg-primary-700">
                        Create User
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-4 p-3 bg-dark-800 rounded-lg">
                      <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-700 rounded mb-2"></div>
                        <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-400">Username</TableHead>
                      <TableHead className="text-gray-400">Role</TableHead>
                      <TableHead className="text-gray-400">Last Login</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user: any) => (
                      <TableRow key={user.id} className="border-gray-800">
                        <TableCell className="text-white">{user.username}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-gray-600 text-gray-400 capitalize">
                            {user.role.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.status === "active" ? "default" : "destructive"}
                            className={user.status === "active" ? "bg-green-500 text-white" : ""}
                          >
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" className="border-gray-600">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="border-gray-600 text-red-400 hover:text-red-300">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          {/* System Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">API Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">DeepSeek API Key</Label>
                  <div className="flex space-x-2">
                    <Input 
                      type={showApiKeys ? "text" : "password"}
                      value={systemConfig.apiKeys.deepseek}
                      onChange={(e) => updateConfig("apiKeys", "deepseek", e.target.value)}
                      className="bg-dark-800 border-gray-700 text-white flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowApiKeys(!showApiKeys)}
                      className="border-gray-600"
                    >
                      {showApiKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(systemConfig.apiKeys.deepseek, "API Key")}
                      className="border-gray-600"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">OpenAI API Key (Optional)</Label>
                  <div className="flex space-x-2">
                    <Input 
                      type={showApiKeys ? "text" : "password"}
                      value={systemConfig.apiKeys.openai || ""}
                      onChange={(e) => updateConfig("apiKeys", "openai", e.target.value)}
                      placeholder="sk-..."
                      className="bg-dark-800 border-gray-700 text-white flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-gray-600"
                      disabled={!systemConfig.apiKeys.openai}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Performance Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Cache Timeout (seconds)</Label>
                  <Input 
                    type="number"
                    value={systemConfig.performance.cacheTimeout}
                    onChange={(e) => updateConfig("performance", "cacheTimeout", parseInt(e.target.value))}
                    className="bg-dark-800 border-gray-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Max Connections</Label>
                  <Input 
                    type="number"
                    value={systemConfig.performance.maxConnections}
                    onChange={(e) => updateConfig("performance", "maxConnections", parseInt(e.target.value))}
                    className="bg-dark-800 border-gray-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Request Timeout (seconds)</Label>
                  <Input 
                    type="number"
                    value={systemConfig.performance.requestTimeout}
                    onChange={(e) => updateConfig("performance", "requestTimeout", parseInt(e.target.value))}
                    className="bg-dark-800 border-gray-700 text-white"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feature Toggles */}
          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Feature Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(systemConfig.features).map(([feature, enabled]) => (
                  <div key={feature} className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
                    <div>
                      <h4 className="text-white font-medium capitalize">
                        {feature.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      <p className="text-gray-400 text-sm">
                        {feature === "autoRefresh" && "Automatically refresh data"}
                        {feature === "realTimeUpdates" && "Enable real-time WebSocket updates"}
                        {feature === "debugMode" && "Show detailed debug information"}
                        {feature === "maintenanceMode" && "Put system in maintenance mode"}
                      </p>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => updateConfig("features", feature, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Save Configuration */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSaveConfig}
              className="bg-primary-600 hover:bg-primary-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {/* Security Settings */}
          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Security Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(systemConfig.security).map(([setting, enabled]) => (
                  <div key={setting} className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
                    <div>
                      <h4 className="text-white font-medium capitalize">
                        {setting.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      <p className="text-gray-400 text-sm">
                        {setting === "requireAuth" && "Require authentication for all API endpoints"}
                        {setting === "encryptLogs" && "Encrypt system logs and audit trails"}
                        {setting === "auditTrail" && "Maintain detailed audit logs for all actions"}
                      </p>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => updateConfig("security", setting, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Security Status */}
          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Security Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-dark-800 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <h4 className="font-medium text-white">SSL/TLS</h4>
                  <p className="text-sm text-green-400">Enabled</p>
                </div>

                <div className="text-center p-4 bg-dark-800 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <h4 className="font-medium text-white">Authentication</h4>
                  <p className="text-sm text-green-400">Active</p>
                </div>

                <div className="text-center p-4 bg-dark-800 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <h4 className="font-medium text-white">Audit Logging</h4>
                  <p className="text-sm text-green-400">Enabled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          {/* Maintenance Tools */}
          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">System Maintenance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-white">Database Operations</h4>
                  <div className="space-y-2">
                    <Button 
                      onClick={handleInitializeSystem}
                      disabled={initializeMutation.isPending}
                      variant="outline" 
                      className="w-full border-gray-600"
                    >
                      <Database className="w-4 h-4 mr-2" />
                      Initialize Sample Data
                    </Button>
                    <Button variant="outline" className="w-full border-gray-600">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Optimize Database
                    </Button>
                    <Button variant="outline" className="w-full border-gray-600">
                      <Download className="w-4 h-4 mr-2" />
                      Create Backup
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-white">System Operations</h4>
                  <div className="space-y-2">
                    <Button 
                      onClick={handleSyncAllPlatforms}
                      disabled={syncAllMutation.isPending}
                      variant="outline" 
                      className="w-full border-gray-600"
                    >
                      <RefreshCw className={cn("w-4 h-4 mr-2", syncAllMutation.isPending && "animate-spin")} />
                      Sync All Platforms
                    </Button>
                    <Button variant="outline" className="w-full border-gray-600">
                      <Activity className="w-4 h-4 mr-2" />
                      Clear Cache
                    </Button>
                    <Button variant="outline" className="w-full border-gray-600 text-yellow-400 hover:text-yellow-300">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Restart Services
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Status */}
          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Maintenance Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
                  <div>
                    <h4 className="text-white font-medium">Maintenance Mode</h4>
                    <p className="text-gray-400 text-sm">
                      {systemConfig.features.maintenanceMode 
                        ? "System is currently in maintenance mode" 
                        : "System is operational"}
                    </p>
                  </div>
                  <Badge 
                    variant={systemConfig.features.maintenanceMode ? "destructive" : "default"}
                    className={!systemConfig.features.maintenanceMode ? "bg-green-500 text-white" : ""}
                  >
                    {systemConfig.features.maintenanceMode ? "Maintenance" : "Operational"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-white">99.97%</div>
                    <div className="text-gray-400 text-sm">Uptime</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">2.4GB</div>
                    <div className="text-gray-400 text-sm">Database Size</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">15,847</div>
                    <div className="text-gray-400 text-sm">Total Records</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{formatDistanceToNow(new Date(Date.now() - 86400000))}</div>
                    <div className="text-gray-400 text-sm">Last Backup</div>
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
