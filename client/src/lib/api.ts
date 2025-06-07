import { apiRequest } from "./queryClient";

export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

// Dashboard API
export const dashboardAPI = {
  getMetrics: async (): Promise<any> => {
    const response = await apiRequest("GET", "/api/dashboard/metrics");
    return response.json();
  },
};

// Prompt Generation API
export const promptAPI = {
  generate: async (data: {
    platform: string;
    query: string;
    tone?: string;
    style?: string;
    constraints?: string[];
  }): Promise<any> => {
    const response = await apiRequest("POST", "/api/prompts/generate", data);
    return response.json();
  },

  getPrompts: async (userId: number = 1): Promise<any> => {
    const response = await apiRequest("GET", `/api/prompts?userId=${userId}`);
    return response.json();
  },

  getPrompt: async (id: number): Promise<any> => {
    const response = await apiRequest("GET", `/api/prompts/${id}`);
    return response.json();
  },
};

// RAG Database API
export const ragAPI = {
  search: async (params: {
    query: string;
    platform?: string;
    documentTypes?: string[];
    limit?: number;
  }): Promise<any> => {
    const searchParams = new URLSearchParams();
    searchParams.append("query", params.query);
    if (params.platform) searchParams.append("platform", params.platform);
    if (params.documentTypes) searchParams.append("documentTypes", params.documentTypes.join(","));
    if (params.limit) searchParams.append("limit", params.limit.toString());

    const response = await apiRequest("GET", `/api/rag/search?${searchParams}`);
    return response.json();
  },

  getDocuments: async (platform: string): Promise<any> => {
    const response = await apiRequest("GET", `/api/rag/documents/${platform}`);
    return response.json();
  },

  getPerformance: async (): Promise<any> => {
    const response = await apiRequest("GET", "/api/rag/performance");
    return response.json();
  },
};

// MCP Hub API
export const mcpAPI = {
  getServers: async (): Promise<any> => {
    const response = await apiRequest("GET", "/api/mcp/servers");
    return response.json();
  },

  getHealth: async (): Promise<any> => {
    const response = await apiRequest("GET", "/api/mcp/health");
    return response.json();
  },

  getMetrics: async (): Promise<any> => {
    const response = await apiRequest("GET", "/api/mcp/metrics");
    return response.json();
  },

  testServer: async (serverId: number): Promise<any> => {
    const response = await apiRequest("POST", `/api/mcp/test/${serverId}`);
    return response.json();
  },
};

// A2A Protocol API
export const a2aAPI = {
  getAgents: async (): Promise<any> => {
    const response = await apiRequest("GET", "/api/a2a/agents");
    return response.json();
  },

  getMetrics: async (): Promise<any> => {
    const response = await apiRequest("GET", "/api/a2a/metrics");
    return response.json();
  },

  assignTask: async (data: { type: string; data: any }): Promise<any> => {
    const response = await apiRequest("POST", "/api/a2a/task", data);
    return response.json();
  },
};

// Platform Integration API
export const platformAPI = {
  getPlatforms: async (): Promise<any> => {
    const response = await apiRequest("GET", "/api/platforms");
    return response.json();
  },

  getPlatformStatus: async (name: string): Promise<any> => {
    const response = await apiRequest("GET", `/api/platforms/${name}/status`);
    return response.json();
  },

  syncPlatform: async (name: string): Promise<any> => {
    const response = await apiRequest("POST", `/api/platforms/${name}/sync`);
    return response.json();
  },

  syncAllPlatforms: async (): Promise<any> => {
    const response = await apiRequest("POST", "/api/platforms/sync-all");
    return response.json();
  },
};

// DeepSeek API
export const deepseekAPI = {
  test: async (): Promise<any> => {
    const response = await apiRequest("POST", "/api/deepseek/test");
    return response.json();
  },

  conversation: async (messages: Array<{ role: string; content: string }>): Promise<any> => {
    const response = await apiRequest("POST", "/api/deepseek/conversation", { messages });
    return response.json();
  },
};

// System API
export const systemAPI = {
  getHealth: async (): Promise<any> => {
    const response = await apiRequest("GET", "/api/health");
    return response.json();
  },

  initialize: async (): Promise<any> => {
    const response = await apiRequest("POST", "/api/initialize");
    return response.json();
  },

  createMetric: async (data: {
    metricType: string;
    value: number;
    unit: string;
    metadata?: any;
  }): Promise<any> => {
    const response = await apiRequest("POST", "/api/metrics", data);
    return response.json();
  },

  getMetrics: async (type: string, limit?: number): Promise<any> => {
    const url = limit ? `/api/metrics/${type}?limit=${limit}` : `/api/metrics/${type}`;
    const response = await apiRequest("GET", url);
    return response.json();
  },
};
