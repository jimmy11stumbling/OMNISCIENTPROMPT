import { WebSocketMessage } from "@/types";

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private isConnected = false;

  constructor() {
    this.connect();
  }

  private connect(): void {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("WebSocket connected");
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.onConnect();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      this.ws.onclose = () => {
        console.log("WebSocket disconnected");
        this.isConnected = false;
        this.onDisconnect();
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval * this.reconnectAttempts);
    } else {
      console.error("Max reconnection attempts reached");
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message.data);
    } else {
      console.log("Unhandled WebSocket message type:", message.type);
    }
  }

  private onConnect(): void {
    // Subscribe to real-time updates
    this.send({
      type: "subscribe",
      data: {
        topics: [
          "system_metrics",
          "platform_status", 
          "mcp_status",
          "a2a_status",
          "prompt_generation",
          "rag_performance"
        ]
      }
    });
  }

  private onDisconnect(): void {
    // Handle disconnect logic
    this.messageHandlers.forEach((handler, type) => {
      if (type.includes("status")) {
        handler({ connected: false });
      }
    });
  }

  public send(message: { type: string; data: any }): void {
    if (this.ws && this.isConnected) {
      const wsMessage: WebSocketMessage = {
        ...message,
        timestamp: new Date().toISOString()
      };
      this.ws.send(JSON.stringify(wsMessage));
    } else {
      console.warn("WebSocket not connected, message not sent:", message);
    }
  }

  public subscribe(messageType: string, handler: (data: any) => void): () => void {
    this.messageHandlers.set(messageType, handler);
    
    // Return unsubscribe function
    return () => {
      this.messageHandlers.delete(messageType);
    };
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Create singleton instance
export const wsManager = new WebSocketManager();

// Helper hooks for React components
export const useWebSocket = () => {
  return {
    subscribe: wsManager.subscribe.bind(wsManager),
    send: wsManager.send.bind(wsManager),
    isConnected: wsManager.getConnectionStatus(),
  };
};

export const useWSConnection = () => {
  return {
    isConnected: wsManager.getConnectionStatus(),
    send: wsManager.send.bind(wsManager),
    subscribe: wsManager.subscribe.bind(wsManager),
  };
};

export const useRealTimeMetrics = (callback: (metrics: any) => void) => {
  const unsubscribe = wsManager.subscribe("system_metrics", callback);
  return unsubscribe;
};

export const usePlatformStatus = (callback: (status: any) => void) => {
  const unsubscribe = wsManager.subscribe("platform_status", callback);
  return unsubscribe;
};

export const useMCPStatus = (callback: (status: any) => void) => {
  const unsubscribe = wsManager.subscribe("mcp_status", callback);
  return unsubscribe;
};

export const useA2AStatus = (callback: (status: any) => void) => {
  const unsubscribe = wsManager.subscribe("a2a_status", callback);
  return unsubscribe;
};
