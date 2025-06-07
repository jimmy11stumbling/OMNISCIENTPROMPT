export interface SystemMetrics {
  totalPrompts: number;
  ragQueries: number;
  mcpConnections: number;
  platformIntegrations: string;
  promptsGrowth: string;
  ragGrowth: string;
  mcpUptime: string;
}

export interface PlatformStatus {
  name: string;
  displayName: string;
  status: "online" | "offline" | "syncing" | "error";
  lastSync: string;
  docsUpdated: string;
  apiHealth: boolean;
  documentCount: number;
  color: string;
  icon: string;
}

export interface RecentActivity {
  id: number;
  title: string;
  platform: string;
  status: "success" | "error" | "pending";
  timestamp: string;
}

export interface RAGPerformance {
  avgRetrievalTime: number;
  vectorDbSize: string;
  indexedDocs: number;
  successRate: number;
}

export interface SystemHealth {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
}

export interface ActiveSession {
  user: string;
  location: string;
  duration: string;
  status: "active" | "idle";
}

export interface MCPServer {
  id: number;
  name: string;
  endpoint: string;
  status: "online" | "offline" | "error";
  protocolVersion: string;
  capabilities: string[];
  lastHeartbeat: string | null;
  connectionCount?: number;
}

export interface A2AAgent {
  id: number;
  name: string;
  type: string;
  status: "active" | "idle" | "busy" | "error";
  currentTask: string | null;
  capabilities: string[];
  tasksCompleted?: number;
  avgResponseTime?: number;
}

export interface DeepSeekMetrics {
  modelVersion: string;
  reasoningQuality: number;
  connected: boolean;
  apiStatus: "online" | "offline" | "error";
}

export interface PromptGenerationRequest {
  platform: string;
  query: string;
  tone?: string;
  style?: string;
  constraints?: string[];
}

export interface PromptGenerationResponse {
  sessionId: number;
  prompt: string;
  reasoning?: string;
  ragDocuments: RAGDocument[];
  tokensUsed: number;
}

export interface RAGDocument {
  id: number;
  title: string;
  content: string;
  platform: string;
  documentType: string;
  metadata?: {
    version?: string;
    lastUpdated?: string;
    source?: string;
    category?: string;
    keywords?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface RAGSearchResult {
  documents: RAGDocument[];
  totalFound: number;
  queryTime: number;
}

export interface PlatformIntegration {
  id: number;
  name: string;
  displayName: string;
  status: "online" | "offline" | "syncing" | "error";
  apiEndpoint?: string;
  lastSync: string | null;
  docsLastUpdated: string | null;
  documentCount: number;
  metadata?: {
    icon?: string;
    color?: string;
    features?: string[];
    version?: string;
  };
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: string;
  read: boolean;
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}
