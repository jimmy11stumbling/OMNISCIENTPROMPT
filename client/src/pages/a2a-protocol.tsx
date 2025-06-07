import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/app-store";
import { a2aAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeftRight, 
  Users, 
  Activity, 
  Clock, 
  MessageSquare,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Plus,
  Bot,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const taskTypes = [
  "generate_prompt",
  "search_documents", 
  "coordinate_servers",
  "sync_documentation",
  "process_metrics"
];

export default function A2AProtocol() {
  const { setCurrentPage } = useAppStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("agents");
  const [newTaskType, setNewTaskType] = useState("");
  const [newTaskData, setNewTaskData] = useState("");

  useEffect(() => {
    setCurrentPage("a2a-protocol");
  }, [setCurrentPage]);

  // A2A Agents Query
  const { data: agents, isLoading: agentsLoading, error: agentsError } = useQuery({
    queryKey: ["/api/a2a/agents"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // A2A Metrics Query
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/a2a/metrics"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Assign Task Mutation
  const assignTaskMutation = useMutation({
    mutationFn: a2aAPI.assignTask,
    onSuccess: (data) => {
      toast({
        title: "Task Assigned",
        description: `Task ${data.taskId} has been assigned successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/a2a/metrics"] });
      setNewTaskType("");
      setNewTaskData("");
    },
    onError: (error: any) => {
      toast({
        title: "Task Assignment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAssignTask = () => {
    if (!newTaskType) {
      toast({
        title: "Task Type Required",
        description: "Please select a task type.",
        variant: "destructive",
      });
      return;
    }

    let taskData = {};
    try {
      taskData = newTaskData ? JSON.parse(newTaskData) : {};
    } catch (error) {
      toast({
        title: "Invalid Task Data",
        description: "Please provide valid JSON data for the task.",
        variant: "destructive",
      });
      return;
    }

    assignTaskMutation.mutate({
      type: newTaskType,
      data: taskData
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "busy": return <Activity className="w-4 h-4 text-yellow-400" />;
      case "idle": return <Clock className="w-4 h-4 text-blue-400" />;
      case "error": return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <XCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-green-400";
      case "busy": return "text-yellow-400";
      case "idle": return "text-blue-400";
      case "error": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  const getAgentTypeIcon = (type: string) => {
    switch (type) {
      case "prompt-generator": return "🎯";
      case "rag-retriever": return "📚";
      case "mcp-coordinator": return "🔗";
      case "platform-sync": return "🔄";
      case "analytics": return "📊";
      default: return "🤖";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">A2A Protocol</h1>
          <p className="text-gray-400 mt-2">
            Agent-to-Agent communication protocol for coordinated AI operations
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge 
            variant={metrics?.activeAgents > 0 ? "default" : "destructive"}
            className={metrics?.activeAgents > 0 ? "bg-green-500 text-white" : ""}
          >
            {metrics?.activeAgents || 0} Active Agents
          </Badge>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary-600 hover:bg-primary-700">
                <Plus className="w-4 h-4 mr-2" />
                Assign Task
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-dark-900 border-gray-800">
              <DialogHeader>
                <DialogTitle className="text-white">Assign New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Task Type</Label>
                  <Select value={newTaskType} onValueChange={setNewTaskType}>
                    <SelectTrigger className="bg-dark-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select task type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {taskTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace(/_/g, " ").toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Task Data (JSON)</Label>
                  <Textarea
                    placeholder='{"parameter": "value"}'
                    value={newTaskData}
                    onChange={(e) => setNewTaskData(e.target.value)}
                    className="bg-dark-800 border-gray-700 text-white min-h-[100px]"
                  />
                </div>
                <Button 
                  onClick={handleAssignTask}
                  disabled={assignTaskMutation.isPending}
                  className="w-full bg-primary-600 hover:bg-primary-700"
                >
                  {assignTaskMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Assigning Task...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Assign Task
                    </>
                  )}
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
                <p className="text-gray-400 text-sm font-medium">Active Agents</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {metrics?.activeAgents || 0}
                </p>
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
                <p className="text-gray-400 text-sm font-medium">Message Queue</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {metrics?.messageQueue || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Task Queue</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {metrics?.taskQueue || 0}
                </p>
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
                <p className="text-gray-400 text-sm font-medium">Avg Response</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {metrics?.avgResponseTime || 0}ms
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-dark-800 border border-gray-700">
          <TabsTrigger value="agents" className="data-[state=active]:bg-primary-600">
            <Bot className="w-4 h-4 mr-2" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="data-[state=active]:bg-primary-600">
            <Activity className="w-4 h-4 mr-2" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="communication" className="data-[state=active]:bg-primary-600">
            <ArrowLeftRight className="w-4 h-4 mr-2" />
            Communication
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-6">
          {/* Agents List */}
          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">A2A Agents</CardTitle>
            </CardHeader>
            <CardContent>
              {agentsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
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
              ) : agentsError ? (
                <div className="text-center py-8">
                  <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <p className="text-red-400">Failed to load A2A agents</p>
                  <p className="text-gray-400 text-sm mt-1">Please check your connection and try again</p>
                </div>
              ) : agents?.length === 0 ? (
                <div className="text-center py-12">
                  <Bot className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No A2A agents available</p>
                  <p className="text-gray-500 text-sm mt-2">Agents will appear here when they are registered</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {agents?.map((agent: any) => (
                    <div key={agent.id} className="bg-dark-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">{getAgentTypeIcon(agent.type)}</span>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-medium text-white">{agent.name}</h3>
                              {getStatusIcon(agent.status)}
                            </div>
                            <p className="text-sm text-gray-400 capitalize">{agent.type.replace(/-/g, " ")}</p>
                            {agent.currentTask && (
                              <p className="text-xs text-yellow-400 mt-1">
                                Current Task: {agent.currentTask}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge 
                            variant={agent.status === "active" ? "default" : "destructive"}
                            className={cn(
                              "capitalize",
                              agent.status === "active" && "bg-green-500 text-white",
                              agent.status === "busy" && "bg-yellow-500 text-black",
                              agent.status === "idle" && "bg-blue-500 text-white"
                            )}
                          >
                            {agent.status}
                          </Badge>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" className="border-gray-600">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {agent.capabilities && agent.capabilities.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-700">
                          <p className="text-gray-400 text-sm mb-2">Capabilities</p>
                          <div className="flex flex-wrap gap-2">
                            {agent.capabilities.map((capability: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs border-gray-600 text-gray-400">
                                {capability.replace(/_/g, " ")}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {agent.metadata && (
                        <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                          {agent.metadata.tasksCompleted && (
                            <div className="text-center">
                              <div className="text-white font-medium">{agent.metadata.tasksCompleted}</div>
                              <div className="text-gray-400 text-xs">Tasks Completed</div>
                            </div>
                          )}
                          {agent.metadata.avgResponseTime && (
                            <div className="text-center">
                              <div className="text-white font-medium">{agent.metadata.avgResponseTime}ms</div>
                              <div className="text-gray-400 text-xs">Avg Response</div>
                            </div>
                          )}
                          <div className="text-center">
                            <div className="text-white font-medium">{formatDistanceToNow(new Date(agent.createdAt))}</div>
                            <div className="text-gray-400 text-xs">Active Since</div>
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
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Communication Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Messages Sent</span>
                  <span className="text-white font-medium">{metrics?.messageQueue || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Tasks Queued</span>
                  <span className="text-white font-medium">{metrics?.taskQueue || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Avg Response Time</span>
                  <span className="text-white font-medium">{metrics?.avgResponseTime || 0}ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Throughput</span>
                  <span className="text-white font-medium">{metrics?.throughput || 0}/sec</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Agent Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Active Agents</span>
                  <span className="text-green-400 font-medium">{metrics?.activeAgents || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Idle Agents</span>
                  <span className="text-blue-400 font-medium">
                    {agents?.filter((a: any) => a.status === "idle").length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Busy Agents</span>
                  <span className="text-yellow-400 font-medium">
                    {agents?.filter((a: any) => a.status === "busy").length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Error Agents</span>
                  <span className="text-red-400 font-medium">
                    {agents?.filter((a: any) => a.status === "error").length || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart */}
          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Communication Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-dark-800 rounded-lg flex items-center justify-center border border-gray-700">
                <div className="text-center">
                  <ArrowLeftRight className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Real-time Communication Chart</p>
                  <p className="text-gray-500 text-sm mt-2">Agent communication patterns and response times</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication" className="space-y-6">
          {/* Protocol Settings */}
          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Protocol Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-white">Message Priority Levels</Label>
                  <Input 
                    value="4"
                    disabled
                    className="bg-dark-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Max Concurrent Tasks</Label>
                  <Input 
                    placeholder="50"
                    className="bg-dark-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Task Timeout (ms)</Label>
                  <Input 
                    placeholder="30000"
                    className="bg-dark-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Retry Attempts</Label>
                  <Input 
                    placeholder="3"
                    className="bg-dark-800 border-gray-700 text-white"
                  />
                </div>
              </div>
              
              <Button className="bg-primary-600 hover:bg-primary-700">
                Save Configuration
              </Button>
            </CardContent>
          </Card>

          {/* Message Flow */}
          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Message Flow Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg border border-gray-700">
                <div>
                  <h4 className="text-white font-medium">Enable Load Balancing</h4>
                  <p className="text-gray-400 text-sm">Distribute tasks evenly across agents</p>
                </div>
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-primary-600 bg-dark-700 border-gray-600 rounded focus:ring-primary-500"
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg border border-gray-700">
                <div>
                  <h4 className="text-white font-medium">Priority Queue</h4>
                  <p className="text-gray-400 text-sm">Process high-priority tasks first</p>
                </div>
                <input 
                  type="checkbox" 
                  defaultChecked
                  className="w-4 h-4 text-primary-600 bg-dark-700 border-gray-600 rounded focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg border border-gray-700">
                <div>
                  <h4 className="text-white font-medium">Auto-Retry Failed Tasks</h4>
                  <p className="text-gray-400 text-sm">Automatically retry failed task assignments</p>
                </div>
                <input 
                  type="checkbox" 
                  defaultChecked
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
