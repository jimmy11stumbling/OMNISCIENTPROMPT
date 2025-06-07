import { storage } from "../storage";
import { type A2aAgent, type InsertA2aAgent } from "@shared/schema";
import { EventEmitter } from "events";

export interface A2AMessage {
  id: string;
  from: number; // agent id
  to: number; // agent id
  type: "task" | "response" | "status" | "error";
  payload: any;
  timestamp: Date;
  priority: "low" | "normal" | "high" | "urgent";
}

export interface A2ATask {
  id: string;
  type: string;
  data: any;
  assignedTo?: number;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: Date;
  completedAt?: Date;
}

export class A2AService extends EventEmitter {
  private agents: Map<number, A2AAgentProcess> = new Map();
  private messageQueue: A2AMessage[] = [];
  private taskQueue: A2ATask[] = [];
  private responseTimeTracker: number[] = [];

  constructor() {
    super();
    this.initializeDefaultAgents();
    this.startMessageProcessor();
    this.startPerformanceMonitoring();
  }

  async registerAgent(agentData: InsertA2aAgent): Promise<A2aAgent> {
    try {
      const agent = await storage.createA2aAgent(agentData);
      
      // Create agent process
      const agentProcess = new A2AAgentProcess(agent);
      this.agents.set(agent.id, agentProcess);

      // Start agent
      await agentProcess.start();
      await storage.updateA2aAgentStatus(agent.id, "idle");

      this.emit("agentRegistered", agent);
      return agent;
    } catch (error) {
      console.error("Error registering A2A agent:", error);
      throw new Error(`Failed to register agent: ${error.message}`);
    }
  }

  async getAllAgents(): Promise<A2aAgent[]> {
    return await storage.getAllA2aAgents();
  }

  async sendMessage(message: Omit<A2AMessage, "id" | "timestamp">): Promise<string> {
    const fullMessage: A2AMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    // Add to queue based on priority
    this.addToQueue(fullMessage);
    
    this.emit("messageQueued", fullMessage);
    return fullMessage.id;
  }

  async assignTask(task: Omit<A2ATask, "id" | "createdAt" | "status">): Promise<string> {
    const fullTask: A2ATask = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: "pending",
      createdAt: new Date()
    };

    // Find suitable agent
    const suitableAgent = await this.findSuitableAgent(task.type);
    if (suitableAgent) {
      fullTask.assignedTo = suitableAgent.id;
      fullTask.status = "processing";
      
      await storage.updateA2aAgentStatus(suitableAgent.id, "busy", fullTask.id);
      
      // Send task to agent
      await this.sendMessage({
        from: 0, // system
        to: suitableAgent.id,
        type: "task",
        payload: fullTask,
        priority: "normal"
      });
    }

    this.taskQueue.push(fullTask);
    this.emit("taskAssigned", fullTask);
    return fullTask.id;
  }

  async getAgentStatus(agentId: number): Promise<string> {
    const agentProcess = this.agents.get(agentId);
    if (!agentProcess) return "offline";

    return agentProcess.getStatus();
  }

  async getSystemMetrics(): Promise<{
    activeAgents: number;
    messageQueue: number;
    taskQueue: number;
    avgResponseTime: number;
    throughput: number;
  }> {
    const agents = await this.getAllAgents();
    const activeAgents = agents.filter(agent => 
      ["active", "busy"].includes(agent.status)
    ).length;

    const avgResponseTime = this.responseTimeTracker.length > 0
      ? this.responseTimeTracker.reduce((a, b) => a + b, 0) / this.responseTimeTracker.length
      : 0;

    return {
      activeAgents,
      messageQueue: this.messageQueue.length,
      taskQueue: this.taskQueue.filter(task => task.status === "pending").length,
      avgResponseTime: Math.round(avgResponseTime),
      throughput: this.calculateThroughput()
    };
  }

  private addToQueue(message: A2AMessage): void {
    // Priority queue implementation
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
    
    let insertIndex = this.messageQueue.length;
    for (let i = 0; i < this.messageQueue.length; i++) {
      if (priorityOrder[message.priority] < priorityOrder[this.messageQueue[i].priority]) {
        insertIndex = i;
        break;
      }
    }
    
    this.messageQueue.splice(insertIndex, 0, message);
  }

  private async processNextMessage(): Promise<void> {
    if (this.messageQueue.length === 0) return;

    const message = this.messageQueue.shift()!;
    const startTime = Date.now();

    try {
      const targetAgent = this.agents.get(message.to);
      if (!targetAgent) {
        console.error(`Target agent ${message.to} not found`);
        return;
      }

      await targetAgent.processMessage(message);
      
      const responseTime = Date.now() - startTime;
      this.trackResponseTime(responseTime);
      
      this.emit("messageProcessed", message, responseTime);
    } catch (error) {
      console.error("Error processing message:", error);
      this.emit("messageError", message, error);
    }
  }

  private startMessageProcessor(): void {
    setInterval(async () => {
      await this.processNextMessage();
    }, 100); // Process messages every 100ms
  }

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      // Clear old response times (keep last 100)
      if (this.responseTimeTracker.length > 100) {
        this.responseTimeTracker = this.responseTimeTracker.slice(-100);
      }
    }, 60000); // Every minute
  }

  private trackResponseTime(time: number): void {
    this.responseTimeTracker.push(time);
  }

  private calculateThroughput(): number {
    // Calculate messages processed in the last minute
    const oneMinuteAgo = Date.now() - 60000;
    const recentMessages = this.responseTimeTracker.length;
    return Math.round(recentMessages / 60); // messages per second
  }

  private async findSuitableAgent(taskType: string): Promise<A2aAgent | null> {
    const agents = await this.getAllAgents();
    
    // Find agents that can handle this task type and are available
    const suitableAgents = agents.filter(agent => 
      agent.capabilities?.includes(taskType) && 
      ["idle", "active"].includes(agent.status)
    );

    if (suitableAgents.length === 0) return null;

    // Return the least busy agent
    return suitableAgents.reduce((least, current) => 
      current.status === "idle" ? current : least
    );
  }

  private async initializeDefaultAgents(): Promise<void> {
    const defaultAgents = [
      {
        name: "Prompt Generator Agent",
        type: "prompt-generator",
        capabilities: ["generate_prompt", "optimize_prompt", "validate_prompt"],
        metadata: {
          description: "Handles prompt generation tasks",
          maxConcurrentTasks: 5
        }
      },
      {
        name: "RAG Retriever Agent",
        type: "rag-retriever",
        capabilities: ["search_documents", "index_document", "update_embeddings"],
        metadata: {
          description: "Manages RAG database operations",
          maxConcurrentTasks: 10
        }
      },
      {
        name: "MCP Coordinator Agent",
        type: "mcp-coordinator",
        capabilities: ["coordinate_servers", "manage_protocols", "monitor_health"],
        metadata: {
          description: "Coordinates MCP server communications",
          maxConcurrentTasks: 20
        }
      },
      {
        name: "Platform Sync Agent",
        type: "platform-sync",
        capabilities: ["sync_documentation", "validate_apis", "update_status"],
        metadata: {
          description: "Synchronizes platform integrations",
          maxConcurrentTasks: 3
        }
      },
      {
        name: "Analytics Agent",
        type: "analytics",
        capabilities: ["process_metrics", "generate_reports", "track_performance"],
        metadata: {
          description: "Processes system analytics and metrics",
          maxConcurrentTasks: 15
        }
      }
    ];

    for (const agentData of defaultAgents) {
      try {
        const existingAgents = await storage.getAllA2aAgents();
        const exists = existingAgents.some(a => a.name === agentData.name);
        
        if (!exists) {
          await this.registerAgent(agentData);
        }
      } catch (error) {
        console.error(`Failed to initialize agent ${agentData.name}:`, error);
      }
    }
  }
}

class A2AAgentProcess {
  private agent: A2aAgent;
  private currentTasks: Set<string> = new Set();
  private isRunning: boolean = false;

  constructor(agent: A2aAgent) {
    this.agent = agent;
  }

  async start(): Promise<void> {
    this.isRunning = true;
    console.log(`Agent ${this.agent.name} started`);
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    console.log(`Agent ${this.agent.name} stopped`);
  }

  async processMessage(message: A2AMessage): Promise<void> {
    if (!this.isRunning) {
      throw new Error(`Agent ${this.agent.name} is not running`);
    }

    try {
      switch (message.type) {
        case "task":
          await this.handleTask(message.payload);
          break;
        case "status":
          await this.handleStatusRequest(message);
          break;
        default:
          console.log(`Agent ${this.agent.name} received ${message.type} message`);
      }
    } catch (error) {
      console.error(`Agent ${this.agent.name} error processing message:`, error);
      throw error;
    }
  }

  private async handleTask(task: A2ATask): Promise<void> {
    this.currentTasks.add(task.id);
    
    try {
      // Simulate task processing
      const processingTime = Math.random() * 1000 + 500; // 500-1500ms
      await new Promise(resolve => setTimeout(resolve, processingTime));
      
      // Mark task as completed
      task.status = "completed";
      task.completedAt = new Date();
      
      console.log(`Agent ${this.agent.name} completed task ${task.id}`);
    } catch (error) {
      task.status = "failed";
      console.error(`Agent ${this.agent.name} failed task ${task.id}:`, error);
    } finally {
      this.currentTasks.delete(task.id);
    }
  }

  private async handleStatusRequest(message: A2AMessage): Promise<void> {
    // Send status response back to requester
    console.log(`Agent ${this.agent.name} status requested by agent ${message.from}`);
  }

  getStatus(): string {
    if (!this.isRunning) return "offline";
    if (this.currentTasks.size === 0) return "idle";
    return "busy";
  }

  getAgent(): A2aAgent {
    return this.agent;
  }
}

export const a2aService = new A2AService();
