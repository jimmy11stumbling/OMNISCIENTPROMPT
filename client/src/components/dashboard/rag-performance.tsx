import { useQuery } from "@tanstack/react-query";
import { ragAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Database } from "lucide-react";

export default function RAGPerformance() {
  const { data: performance, isLoading, error } = useQuery({
    queryKey: ["/api/rag/performance"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card className="bg-dark-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">RAG 2.0 Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-32 bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-dark-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">RAG 2.0 Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-400 text-center">Failed to load RAG performance data</p>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      label: "Average Retrieval Time",
      value: `${performance?.avgRetrievalTime || 0}ms`,
      status: "optimal"
    },
    {
      label: "Vector Database Size", 
      value: performance?.vectorDbSize || "0B",
      status: "normal"
    },
    {
      label: "Indexed Documents",
      value: performance?.totalDocuments?.toLocaleString() || "0",
      status: "normal"
    },
    {
      label: "Query Success Rate",
      value: `${performance?.successRate || 0}%`,
      status: "optimal"
    }
  ];

  return (
    <Card className="bg-dark-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">RAG 2.0 Performance</CardTitle>
          <div className="flex items-center space-x-2 text-sm text-green-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Optimal</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Performance Metrics */}
        <div className="space-y-4 mb-6">
          {metrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-gray-400">{metric.label}</span>
              <span className={`font-medium ${
                metric.status === "optimal" ? "text-green-400" : "text-white"
              }`}>
                {metric.value}
              </span>
            </div>
          ))}
        </div>

        {/* Performance Chart Placeholder */}
        <div className="h-32 bg-dark-800 rounded-lg flex items-center justify-center border border-gray-700">
          <div className="text-center">
            <TrendingUp className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Performance Chart</p>
            <p className="text-xs text-gray-500">Real-time retrieval metrics</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 pt-4 border-t border-gray-800">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-white">
                {performance?.totalDocuments?.toLocaleString() || "0"}
              </div>
              <div className="text-gray-400">Total Documents</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">
                {performance?.successRate || 0}%
              </div>
              <div className="text-gray-400">Success Rate</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
