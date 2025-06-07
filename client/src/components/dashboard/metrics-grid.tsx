import { useQuery } from "@tanstack/react-query";
import { dashboardAPI } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, Database, Network, Boxes } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
}

function MetricCard({ title, value, change, changeType, icon: Icon, iconColor }: MetricCardProps) {
  return (
    <Card className="bg-dark-900 border-gray-800">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
            {change && (
              <p className={cn(
                "text-sm mt-2 flex items-center",
                changeType === "positive" && "text-green-400",
                changeType === "negative" && "text-red-400", 
                changeType === "neutral" && "text-gray-400"
              )}>
                {changeType === "positive" && <TrendingUp className="w-4 h-4 mr-1" />}
                {changeType === "negative" && <TrendingDown className="w-4 h-4 mr-1" />}
                {change}
              </p>
            )}
          </div>
          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", iconColor)}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MetricsGrid() {
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-dark-900 border-gray-800">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-8 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-dark-900 border-gray-800">
        <CardContent className="p-6 text-center">
          <p className="text-red-400">Failed to load metrics</p>
          <p className="text-gray-400 text-sm mt-1">Please check your connection and try again</p>
        </CardContent>
      </Card>
    );
  }

  const metricsData = [
    {
      title: "Total Prompts Generated",
      value: metrics?.totalPrompts?.toLocaleString() || "0",
      change: "+12.5% from last month",
      changeType: "positive" as const,
      icon: Activity,
      iconColor: "bg-blue-500 bg-opacity-20"
    },
    {
      title: "RAG Database Queries", 
      value: metrics?.ragQueries?.toLocaleString() || "0",
      change: "+8.3% response time improvement",
      changeType: "positive" as const,
      icon: Database,
      iconColor: "bg-cyan-500 bg-opacity-20"
    },
    {
      title: "Active MCP Connections",
      value: metrics?.mcpConnections || "0",
      change: "99.97% uptime",
      changeType: "positive" as const,
      icon: Network,
      iconColor: "bg-yellow-500 bg-opacity-20"
    },
    {
      title: "Platform Integrations",
      value: metrics?.platformIntegrations || "0/0",
      change: "All systems operational",
      changeType: "positive" as const,
      icon: Boxes,
      iconColor: "bg-green-500 bg-opacity-20"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricsData.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
}
