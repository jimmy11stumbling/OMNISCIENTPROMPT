import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAppStore } from "@/store/app-store";
import { deepseekAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  MessageSquare, 
  Settings, 
  Activity, 
  CheckCircle, 
  XCircle,
  Play,
  RotateCcw,
  Loader2,
  Zap,
  Clock,
  Database,
  Send
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DeepSeekIntegration() {
  const { setCurrentPage } = useAppStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [conversationMessages, setConversationMessages] = useState<Array<{role: string, content: string}>>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    setCurrentPage("deepseek-integration");
  }, [setCurrentPage]);

  // Connection Test Query
  const { data: connectionStatus, isLoading: connectionLoading, refetch: refetchConnection } = useQuery({
    queryKey: ["/api/deepseek/test"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Test Connection Mutation
  const testConnectionMutation = useMutation({
    mutationFn: deepseekAPI.test,
    onSuccess: (data) => {
      toast({
        title: "Connection Test Successful",
        description: `DeepSeek API is ${data.connected ? "connected" : "disconnected"}.`,
        variant: data.connected ? "default" : "destructive",
      });
      refetchConnection();
    },
    onError: (error: any) => {
      toast({
        title: "Connection Test Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Conversation Mutation
  const conversationMutation = useMutation({
    mutationFn: deepseekAPI.conversation,
    onSuccess: (data) => {
      setConversationMessages(prev => [
        ...prev,
        { role: "assistant", content: data.finalAnswer }
      ]);
      setNewMessage("");
      toast({
        title: "Response Generated",
        description: "DeepSeek has generated a response.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Conversation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTestConnection = () => {
    testConnectionMutation.mutate();
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message to send.",
        variant: "destructive",
      });
      return;
    }

    const newMessages = [
      ...conversationMessages,
      { role: "user", content: newMessage.trim() }
    ];

    setConversationMessages(newMessages);
    conversationMutation.mutate(newMessages);
  };

  const clearConversation = () => {
    setConversationMessages([]);
    setNewMessage("");
  };

  const isConnected = connectionStatus?.connected || false;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">DeepSeek Integration</h1>
          <p className="text-gray-400 mt-2">
            DeepSeek-reasoner AI integration for advanced reasoning and prompt generation
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge 
            variant={isConnected ? "default" : "destructive"}
            className={isConnected ? "bg-green-500 text-white" : ""}
          >
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
          <Button
            onClick={handleTestConnection}
            disabled={testConnectionMutation.isPending}
            variant="outline"
            className="border-gray-600"
          >
            {testConnectionMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Test Connection
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-dark-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">API Status</p>
                <p className={cn(
                  "text-2xl font-bold mt-1",
                  isConnected ? "text-green-400" : "text-red-400"
                )}>
                  {isConnected ? "Online" : "Offline"}
                </p>
              </div>
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center",
                isConnected ? "bg-green-500 bg-opacity-20" : "bg-red-500 bg-opacity-20"
              )}>
                {isConnected ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Model Version</p>
                <p className="text-2xl font-bold text-white mt-1">v2.5</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Reasoning Quality</p>
                <p className="text-2xl font-bold text-green-400 mt-1">98.2%</p>
              </div>
              <div className="w-12 h-12 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Avg Response</p>
                <p className="text-2xl font-bold text-white mt-1">1.2s</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-dark-800 border border-gray-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary-600">
            <Activity className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="conversation" className="data-[state=active]:bg-primary-600">
            <MessageSquare className="w-4 h-4 mr-2" />
            Test Conversation
          </TabsTrigger>
          <TabsTrigger value="configuration" className="data-[state=active]:bg-primary-600">
            <Settings className="w-4 h-4 mr-2" />
            Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* API Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">API Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Endpoint</span>
                  <span className="text-white font-medium">api.deepseek.com</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Model</span>
                  <span className="text-white font-medium">deepseek-reasoner</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Version</span>
                  <span className="text-white font-medium">2.5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Authentication</span>
                  <Badge variant={isConnected ? "default" : "destructive"} className={isConnected ? "bg-green-500 text-white" : ""}>
                    {isConnected ? "Valid" : "Invalid"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Avg Response Time</span>
                  <span className="text-white font-medium">1.2s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Success Rate</span>
                  <span className="text-green-400 font-medium">98.2%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Reasoning Quality</span>
                  <span className="text-green-400 font-medium">Excellent</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Token Efficiency</span>
                  <span className="text-blue-400 font-medium">92%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Capabilities */}
          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">DeepSeek Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-dark-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center space-x-3 mb-3">
                    <Brain className="w-8 h-8 text-purple-400" />
                    <div>
                      <h4 className="font-medium text-white">Advanced Reasoning</h4>
                      <p className="text-sm text-gray-400">Chain-of-thought processing</p>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Multi-step logical reasoning with transparent thought processes and decision explanations.
                  </p>
                </div>

                <div className="bg-dark-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center space-x-3 mb-3">
                    <MessageSquare className="w-8 h-8 text-blue-400" />
                    <div>
                      <h4 className="font-medium text-white">Context Understanding</h4>
                      <p className="text-sm text-gray-400">Deep contextual analysis</p>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Superior understanding of complex contexts and nuanced requirements for prompt generation.
                  </p>
                </div>

                <div className="bg-dark-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center space-x-3 mb-3">
                    <Zap className="w-8 h-8 text-yellow-400" />
                    <div>
                      <h4 className="font-medium text-white">High Performance</h4>
                      <p className="text-sm text-gray-400">Optimized processing</p>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Fast response times with efficient token usage and consistent high-quality outputs.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversation" className="space-y-6">
          {/* Conversation Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="bg-dark-900 border-gray-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Test Conversation</CardTitle>
                    <Button
                      onClick={clearConversation}
                      variant="outline"
                      size="sm"
                      className="border-gray-600"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96 w-full mb-4">
                    <div className="space-y-4">
                      {conversationMessages.length === 0 ? (
                        <div className="text-center py-12">
                          <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                          <p className="text-gray-400">No conversation yet</p>
                          <p className="text-gray-500 text-sm mt-2">Start a conversation to test DeepSeek integration</p>
                        </div>
                      ) : (
                        conversationMessages.map((message, index) => (
                          <div 
                            key={index} 
                            className={cn(
                              "flex",
                              message.role === "user" ? "justify-end" : "justify-start"
                            )}
                          >
                            <div className={cn(
                              "max-w-[80%] rounded-lg p-4",
                              message.role === "user" 
                                ? "bg-primary-600 text-white" 
                                : "bg-dark-800 text-gray-300 border border-gray-700"
                            )}>
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                      {conversationMutation.isPending && (
                        <div className="flex justify-start">
                          <div className="bg-dark-800 text-gray-300 border border-gray-700 rounded-lg p-4">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="ml-2 text-sm">DeepSeek is thinking...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  
                  <div className="flex space-x-2">
                    <Textarea
                      placeholder="Enter your message to test DeepSeek reasoning..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="bg-dark-800 border-gray-700 text-white placeholder-gray-400 resize-none"
                      rows={3}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={conversationMutation.isPending || !newMessage.trim() || !isConnected}
                      className="bg-primary-600 hover:bg-primary-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Conversation Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{conversationMessages.length}</div>
                  <div className="text-gray-400 text-sm">Total Messages</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {conversationMessages.filter(m => m.role === "user").length}
                  </div>
                  <div className="text-gray-400 text-sm">User Messages</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {conversationMessages.filter(m => m.role === "assistant").length}
                  </div>
                  <div className="text-gray-400 text-sm">AI Responses</div>
                </div>
                
                {!isConnected && (
                  <div className="mt-4 p-3 bg-red-500 bg-opacity-20 rounded-lg border border-red-500">
                    <p className="text-red-400 text-sm">
                      DeepSeek API is not connected. Please check your configuration.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          {/* API Configuration */}
          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">API Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-white">API Endpoint</Label>
                  <Input 
                    value="https://api.deepseek.com"
                    disabled
                    className="bg-dark-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Model</Label>
                  <Input 
                    value="deepseek-reasoner"
                    disabled
                    className="bg-dark-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Temperature</Label>
                  <Input 
                    placeholder="0.7"
                    className="bg-dark-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Max Tokens</Label>
                  <Input 
                    placeholder="2000"
                    className="bg-dark-800 border-gray-700 text-white"
                  />
                </div>
              </div>
              
              <Button className="bg-primary-600 hover:bg-primary-700">
                Save Configuration
              </Button>
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Advanced Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg border border-gray-700">
                <div>
                  <h4 className="text-white font-medium">Enable Reasoning Output</h4>
                  <p className="text-gray-400 text-sm">Show step-by-step reasoning process</p>
                </div>
                <input 
                  type="checkbox" 
                  defaultChecked
                  className="w-4 h-4 text-primary-600 bg-dark-700 border-gray-600 rounded focus:ring-primary-500"
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg border border-gray-700">
                <div>
                  <h4 className="text-white font-medium">Auto-Retry on Failure</h4>
                  <p className="text-gray-400 text-sm">Automatically retry failed requests</p>
                </div>
                <input 
                  type="checkbox" 
                  defaultChecked
                  className="w-4 h-4 text-primary-600 bg-dark-700 border-gray-600 rounded focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg border border-gray-700">
                <div>
                  <h4 className="text-white font-medium">Token Usage Tracking</h4>
                  <p className="text-gray-400 text-sm">Monitor and log token consumption</p>
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
