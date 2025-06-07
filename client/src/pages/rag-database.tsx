import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAppStore } from "@/store/app-store";
import { ragAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Database, 
  Search, 
  FileText, 
  Filter, 
  BarChart3,
  Clock,
  Loader2,
  BookOpen,
  Tag,
  Calendar
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const platforms = ["lovable", "bolt", "replit", "cursor", "windsurf"];
const documentTypes = ["guide", "feature", "api", "example"];

export default function RAGDatabase() {
  const { setCurrentPage } = useAppStore();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [selectedDocType, setSelectedDocType] = useState<string>("");
  const [activeTab, setActiveTab] = useState("search");

  useEffect(() => {
    setCurrentPage("rag-database");
  }, [setCurrentPage]);

  // Performance metrics query
  const { data: performance, isLoading: performanceLoading } = useQuery({
    queryKey: ["/api/rag/performance"],
    refetchInterval: 30000,
  });

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: ragAPI.search,
    onError: (error: any) => {
      toast({
        title: "Search Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search Query Required",
        description: "Please enter a search query to find documents.",
        variant: "destructive",
      });
      return;
    }

    searchMutation.mutate({
      query: searchQuery.trim(),
      platform: selectedPlatform || undefined,
      documentTypes: selectedDocType ? [selectedDocType] : undefined,
      limit: 20,
    });
  };

  const handleClearFilters = () => {
    setSelectedPlatform("");
    setSelectedDocType("");
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Unknown time";
    }
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      lovable: "bg-purple-500",
      bolt: "bg-yellow-500",
      replit: "bg-orange-500", 
      cursor: "bg-blue-500",
      windsurf: "bg-teal-500",
    };
    return colors[platform] || "bg-gray-500";
  };

  const getDocTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      guide: "bg-green-500",
      feature: "bg-blue-500",
      api: "bg-purple-500",
      example: "bg-orange-500",
    };
    return colors[type] || "bg-gray-500";
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">RAG Database</h1>
        <p className="text-gray-400 mt-2">
          Search and manage the RAG 2.0 documentation database with vector similarity search
        </p>
      </div>

      {/* Performance Overview */}
      <Card className="bg-dark-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Database Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {performanceLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="text-center animate-pulse">
                  <div className="h-8 bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-white">
                  {performance?.totalDocuments?.toLocaleString() || "0"}
                </div>
                <div className="text-gray-400 text-sm">Total Documents</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {performance?.avgRetrievalTime || 0}ms
                </div>
                <div className="text-gray-400 text-sm">Avg Retrieval Time</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">
                  {performance?.vectorDbSize || "0B"}
                </div>
                <div className="text-gray-400 text-sm">Database Size</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">
                  {performance?.successRate || 0}%
                </div>
                <div className="text-gray-400 text-sm">Success Rate</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-dark-800 border border-gray-700">
          <TabsTrigger value="search" className="data-[state=active]:bg-primary-600">
            <Search className="w-4 h-4 mr-2" />
            Document Search
          </TabsTrigger>
          <TabsTrigger value="browse" className="data-[state=active]:bg-primary-600">
            <Database className="w-4 h-4 mr-2" />
            Browse Database
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          {/* Search Interface */}
          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Search className="w-5 h-5 mr-2" />
                Vector Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search Input */}
              <div className="space-y-2">
                <label className="text-white text-sm font-medium">Search Query</label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter your search query..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="bg-dark-800 border-gray-700 text-white placeholder-gray-400"
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={searchMutation.isPending || !searchQuery.trim()}
                    className="bg-primary-600 hover:bg-primary-700"
                  >
                    {searchMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-white text-sm font-medium">Platform Filter</label>
                  <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                    <SelectTrigger className="bg-dark-800 border-gray-700 text-white">
                      <SelectValue placeholder="All platforms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All platforms</SelectItem>
                      {platforms.map((platform) => (
                        <SelectItem key={platform} value={platform}>
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-white text-sm font-medium">Document Type</label>
                  <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                    <SelectTrigger className="bg-dark-800 border-gray-700 text-white">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      {documentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={handleClearFilters}
                    variant="outline"
                    className="w-full border-gray-600"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Results */}
          {searchMutation.data && (
            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">
                    Search Results ({searchMutation.data.totalFound})
                  </CardTitle>
                  <Badge variant="outline" className="border-gray-600 text-gray-400">
                    {searchMutation.data.queryTime}ms
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {searchMutation.data.documents.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No documents found</p>
                    <p className="text-gray-500 text-sm mt-2">
                      Try adjusting your search query or filters
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {searchMutation.data.documents.map((doc: any, index: number) => (
                        <div key={index} className="bg-dark-800 rounded-lg p-4 border border-gray-700">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-white mb-1">{doc.title}</h4>
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge 
                                  className={`text-white text-xs ${getPlatformColor(doc.platform)}`}
                                >
                                  {doc.platform}
                                </Badge>
                                <Badge 
                                  className={`text-white text-xs ${getDocTypeColor(doc.documentType)}`}
                                >
                                  {doc.documentType}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right text-xs text-gray-400">
                              <div className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {formatTime(doc.updatedAt)}
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-gray-400 text-sm line-clamp-3 mb-3">
                            {doc.content.substring(0, 300)}...
                          </p>
                          
                          {doc.metadata?.keywords && (
                            <div className="flex items-center space-x-2">
                              <Tag className="w-3 h-3 text-gray-500" />
                              <div className="flex flex-wrap gap-1">
                                {doc.metadata.keywords.slice(0, 3).map((keyword: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-xs border-gray-600 text-gray-500">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="browse" className="space-y-6">
          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Database Browser
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">Database Browser</p>
                <p className="text-gray-500 text-sm mt-2">
                  Browse and manage documents by platform and category
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
