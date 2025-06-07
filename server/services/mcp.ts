import { storage } from "../storage";
import { type McpServer, type InsertMcpServer } from "@shared/schema";
import { EventEmitter } from "events";

export interface MCPMessage {
  id: string;
  type: "request" | "response" | "notification";
  method?: string;
  params?: any;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPServerCapabilities {
  tools?: string[];
  resources?: string[];
  prompts?: string[];
}

export class MCPService extends EventEmitter {
  private servers: Map<number, MCPServerConnection> = new Map();
  private messageQueue: MCPMessage[] = [];
  private throughputCounter = 0;
  private lastThroughputReset = Date.now();

  constructor() {
    super();
    this.initializeDefaultServers();
    this.startPerformanceMonitoring();
  }

  async registerServer(serverData: InsertMcpServer): Promise<McpServer> {
    try {
      const server = await storage.createMcpServer(serverData);
      
      // Create connection
      const connection = new MCPServerConnection(server);
      this.servers.set(server.id, connection);

      // Test connection
      const isOnline = await connection.testConnection();
      if (isOnline) {
        await storage.updateMcpServerStatus(server.id, "online", new Date());
        this.emit("serverOnline", server);
      }

      return server;
    } catch (error) {
      console.error("Error registering MCP server:", error);
      throw new Error(`Failed to register server: ${error.message}`);
    }
  }

  async getAllServers(): Promise<McpServer[]> {
    return await storage.getAllMcpServers();
  }

  async getServerStatus(serverId: number): Promise<string> {
    const connection = this.servers.get(serverId);
    if (!connection) return "offline";

    const isOnline = await connection.testConnection();
    const status = isOnline ? "online" : "offline";
    
    await storage.updateMcpServerStatus(serverId, status, new Date());
    return status;
  }

  async sendMessage(serverId: number, message: MCPMessage): Promise<MCPMessage> {
    const connection = this.servers.get(serverId);
    if (!connection) {
      throw new Error(`No connection found for server ${serverId}`);
    }

    try {
      this.incrementThroughput();
      const response = await connection.sendMessage(message);
      this.emit("messageProcessed", { serverId, message, response });
      return response;
    } catch (error) {
      console.error(`Error sending message to server ${serverId}:`, error);
      throw new Error(`Message failed: ${error.message}`);
    }
  }

  async broadcastMessage(message: MCPMessage): Promise<MCPMessage[]> {
    const responses: MCPMessage[] = [];
    const activeServers = Array.from(this.servers.entries());

    await Promise.allSettled(
      activeServers.map(async ([serverId, connection]) => {
        try {
          const response = await connection.sendMessage(message);
          responses.push(response);
        } catch (error) {
          console.error(`Broadcast failed for server ${serverId}:`, error);
        }
      })
    );

    return responses;
  }

  async performHealthCheck(): Promise<{
    totalServers: number;
    onlineServers: number;
    offlineServers: number;
    errorServers: number;
  }> {
    const servers = await this.getAllServers();
    let onlineCount = 0;
    let offlineCount = 0;
    let errorCount = 0;

    await Promise.allSettled(
      servers.map(async (server) => {
        try {
          const status = await this.getServerStatus(server.id);
          if (status === "online") onlineCount++;
          else if (status === "offline") offlineCount++;
          else errorCount++;
        } catch (error) {
          errorCount++;
        }
      })
    );

    return {
      totalServers: servers.length,
      onlineServers: onlineCount,
      offlineServers: offlineCount,
      errorServers: errorCount
    };
  }

  getThroughputMetrics(): {
    messagesPerSecond: number;
    totalMessages: number;
    queueSize: number;
  } {
    const now = Date.now();
    const timeDiff = (now - this.lastThroughputReset) / 1000;
    const messagesPerSecond = timeDiff > 0 ? this.throughputCounter / timeDiff : 0;

    return {
      messagesPerSecond: Math.round(messagesPerSecond),
      totalMessages: this.throughputCounter,
      queueSize: this.messageQueue.length
    };
  }

  private incrementThroughput(): void {
    this.throughputCounter++;
  }

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.lastThroughputReset = Date.now();
      this.throughputCounter = 0;
    }, 60000); // Reset every minute
  }

  private async initializeDefaultServers(): Promise<void> {
    const defaultServers = [
      {
        name: "RAG Coordinator",
        endpoint: "ws://localhost:8001/mcp",
        capabilities: ["search", "index", "update"],
        metadata: {
          description: "Manages RAG database operations",
          maintainer: "system"
        }
      },
      {
        name: "Prompt Generator",
        endpoint: "ws://localhost:8002/mcp",
        capabilities: ["generate", "optimize", "validate"],
        metadata: {
          description: "Handles prompt generation requests",
          maintainer: "system"
        }
      },
      {
        name: "Platform Sync",
        endpoint: "ws://localhost:8003/mcp",
        capabilities: ["sync", "validate", "monitor"],
        metadata: {
          description: "Synchronizes platform documentation",
          maintainer: "system"
        }
      },
      {
        name: "Analytics Processor",
        endpoint: "ws://localhost:8004/mcp",
        capabilities: ["process", "aggregate", "report"],
        metadata: {
          description: "Processes system analytics",
          maintainer: "system"
        }
      }
    ];

    for (const serverData of defaultServers) {
      try {
        const existingServers = await storage.getAllMcpServers();
        const exists = existingServers.some(s => s.name === serverData.name);
        
        if (!exists) {
          await this.registerServer(serverData);
        }
      } catch (error) {
        console.error(`Failed to initialize server ${serverData.name}:`, error);
      }
    }
  }
}

class MCPServerConnection {
  private server: McpServer;
  private lastPing: number = 0;
  private isConnected: boolean = false;

  constructor(server: McpServer) {
    this.server = server;
  }

  async testConnection(): Promise<boolean> {
    try {
      // Simulate connection test
      // In a real implementation, this would attempt to connect to the WebSocket endpoint
      this.lastPing = Date.now();
      this.isConnected = Math.random() > 0.1; // 90% success rate for simulation
      return this.isConnected;
    } catch (error) {
      console.error(`Connection test failed for ${this.server.name}:`, error);
      this.isConnected = false;
      return false;
    }
  }

  async sendMessage(message: MCPMessage): Promise<MCPMessage> {
    if (!this.isConnected) {
      throw new Error(`Server ${this.server.name} is not connected`);
    }

    try {
      // Simulate message processing
      const response: MCPMessage = {
        id: `response_${Date.now()}`,
        type: "response",
        result: {
          status: "success",
          data: `Processed ${message.type} message`,
          timestamp: new Date().toISOString()
        }
      };

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10));

      return response;
    } catch (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  getServer(): McpServer {
    return this.server;
  }

  isOnline(): boolean {
    return this.isConnected && (Date.now() - this.lastPing) < 30000; // 30 second timeout
  }
}

export const mcpService = new MCPService();
