import { 
  users, prompts, ragDocuments, mcpServers, a2aAgents, systemMetrics, 
  platformIntegrations, promptSessions,
  type User, type InsertUser, type Prompt, type InsertPrompt,
  type RagDocument, type InsertRagDocument, type McpServer, type InsertMcpServer,
  type A2aAgent, type InsertA2aAgent, type SystemMetric, type InsertSystemMetric,
  type PlatformIntegration, type InsertPlatformIntegration,
  type PromptSession, type InsertPromptSession
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, ilike, inArray } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Prompts
  getPrompt(id: number): Promise<Prompt | undefined>;
  getPromptsByUser(userId: number): Promise<Prompt[]>;
  createPrompt(prompt: InsertPrompt): Promise<Prompt>;
  getRecentPrompts(limit?: number): Promise<Prompt[]>;

  // RAG Documents
  getRagDocument(id: number): Promise<RagDocument | undefined>;
  getRagDocumentsByPlatform(platform: string): Promise<RagDocument[]>;
  createRagDocument(document: InsertRagDocument): Promise<RagDocument>;
  searchRagDocuments(query: string, platform?: string): Promise<RagDocument[]>;
  updateRagDocument(id: number, updates: Partial<RagDocument>): Promise<RagDocument>;

  // MCP Servers
  getMcpServer(id: number): Promise<McpServer | undefined>;
  getAllMcpServers(): Promise<McpServer[]>;
  createMcpServer(server: InsertMcpServer): Promise<McpServer>;
  updateMcpServerStatus(id: number, status: string, lastHeartbeat?: Date): Promise<McpServer>;

  // A2A Agents
  getA2aAgent(id: number): Promise<A2aAgent | undefined>;
  getAllA2aAgents(): Promise<A2aAgent[]>;
  createA2aAgent(agent: InsertA2aAgent): Promise<A2aAgent>;
  updateA2aAgentStatus(id: number, status: string, currentTask?: string): Promise<A2aAgent>;

  // System Metrics
  createSystemMetric(metric: InsertSystemMetric): Promise<SystemMetric>;
  getSystemMetrics(metricType: string, limit?: number): Promise<SystemMetric[]>;
  getLatestSystemMetrics(): Promise<SystemMetric[]>;

  // Platform Integrations
  getPlatformIntegration(name: string): Promise<PlatformIntegration | undefined>;
  getAllPlatformIntegrations(): Promise<PlatformIntegration[]>;
  createPlatformIntegration(integration: InsertPlatformIntegration): Promise<PlatformIntegration>;
  updatePlatformIntegration(name: string, updates: Partial<PlatformIntegration>): Promise<PlatformIntegration>;

  // Prompt Sessions
  getPromptSession(id: number): Promise<PromptSession | undefined>;
  createPromptSession(session: InsertPromptSession): Promise<PromptSession>;
  updatePromptSession(id: number, updates: Partial<PromptSession>): Promise<PromptSession>;
  getPromptSessionsByUser(userId: number): Promise<PromptSession[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Prompts
  async getPrompt(id: number): Promise<Prompt | undefined> {
    const [prompt] = await db.select().from(prompts).where(eq(prompts.id, id));
    return prompt || undefined;
  }

  async getPromptsByUser(userId: number): Promise<Prompt[]> {
    return await db.select().from(prompts).where(eq(prompts.userId, userId)).orderBy(desc(prompts.generatedAt));
  }

  async createPrompt(prompt: InsertPrompt): Promise<Prompt> {
    const [newPrompt] = await db.insert(prompts).values([{
      ...prompt,
      metadata: prompt.metadata as any
    }]).returning();
    return newPrompt;
  }

  async getRecentPrompts(limit: number = 10): Promise<Prompt[]> {
    return await db.select().from(prompts).orderBy(desc(prompts.generatedAt)).limit(limit);
  }

  // RAG Documents
  async getRagDocument(id: number): Promise<RagDocument | undefined> {
    const [document] = await db.select().from(ragDocuments).where(eq(ragDocuments.id, id));
    return document || undefined;
  }

  async getRagDocumentsByPlatform(platform: string): Promise<RagDocument[]> {
    return await db.select().from(ragDocuments).where(eq(ragDocuments.platform, platform));
  }

  async createRagDocument(document: InsertRagDocument): Promise<RagDocument> {
    const [newDocument] = await db.insert(ragDocuments).values([{
      ...document,
      metadata: document.metadata as any
    }]).returning();
    return newDocument;
  }

  async searchRagDocuments(query: string, platform?: string): Promise<RagDocument[]> {
    let whereClause = ilike(ragDocuments.content, `%${query}%`);
    
    if (platform) {
      whereClause = and(whereClause, eq(ragDocuments.platform, platform)) as any;
    }

    return await db.select().from(ragDocuments).where(whereClause).limit(20);
  }

  async updateRagDocument(id: number, updates: Partial<RagDocument>): Promise<RagDocument> {
    const [updated] = await db.update(ragDocuments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(ragDocuments.id, id))
      .returning();
    return updated;
  }

  // MCP Servers
  async getMcpServer(id: number): Promise<McpServer | undefined> {
    const [server] = await db.select().from(mcpServers).where(eq(mcpServers.id, id));
    return server || undefined;
  }

  async getAllMcpServers(): Promise<McpServer[]> {
    return await db.select().from(mcpServers).orderBy(mcpServers.name);
  }

  async createMcpServer(server: InsertMcpServer): Promise<McpServer> {
    const [newServer] = await db.insert(mcpServers).values([{
      ...server,
      metadata: server.metadata as any,
      capabilities: (server.capabilities || []) as any
    }]).returning();
    return newServer;
  }

  async updateMcpServerStatus(id: number, status: string, lastHeartbeat?: Date): Promise<McpServer> {
    const updates: any = { status };
    if (lastHeartbeat) {
      updates.lastHeartbeat = lastHeartbeat;
    }

    const [updated] = await db.update(mcpServers)
      .set(updates)
      .where(eq(mcpServers.id, id))
      .returning();
    return updated;
  }

  // A2A Agents
  async getA2aAgent(id: number): Promise<A2aAgent | undefined> {
    const [agent] = await db.select().from(a2aAgents).where(eq(a2aAgents.id, id));
    return agent || undefined;
  }

  async getAllA2aAgents(): Promise<A2aAgent[]> {
    return await db.select().from(a2aAgents).orderBy(a2aAgents.name);
  }

  async createA2aAgent(agent: InsertA2aAgent): Promise<A2aAgent> {
    const [newAgent] = await db.insert(a2aAgents).values([{
      ...agent,
      metadata: agent.metadata as any,
      capabilities: agent.capabilities as any
    }]).returning();
    return newAgent;
  }

  async updateA2aAgentStatus(id: number, status: string, currentTask?: string): Promise<A2aAgent> {
    const updates: any = { status };
    if (currentTask !== undefined) {
      updates.currentTask = currentTask;
    }

    const [updated] = await db.update(a2aAgents)
      .set(updates)
      .where(eq(a2aAgents.id, id))
      .returning();
    return updated;
  }

  // System Metrics
  async createSystemMetric(metric: InsertSystemMetric): Promise<SystemMetric> {
    const [newMetric] = await db.insert(systemMetrics).values([{
      ...metric,
      metadata: metric.metadata as any
    }]).returning();
    return newMetric;
  }

  async getSystemMetrics(metricType: string, limit: number = 100): Promise<SystemMetric[]> {
    return await db.select().from(systemMetrics)
      .where(eq(systemMetrics.metricType, metricType))
      .orderBy(desc(systemMetrics.timestamp))
      .limit(limit);
  }

  async getLatestSystemMetrics(): Promise<SystemMetric[]> {
    return await db.select().from(systemMetrics)
      .orderBy(desc(systemMetrics.timestamp))
      .limit(50);
  }

  // Platform Integrations
  async getPlatformIntegration(name: string): Promise<PlatformIntegration | undefined> {
    const [integration] = await db.select().from(platformIntegrations).where(eq(platformIntegrations.name, name));
    return integration || undefined;
  }

  async getAllPlatformIntegrations(): Promise<PlatformIntegration[]> {
    return await db.select().from(platformIntegrations).orderBy(platformIntegrations.name);
  }

  async createPlatformIntegration(integration: InsertPlatformIntegration): Promise<PlatformIntegration> {
    const [newIntegration] = await db.insert(platformIntegrations).values([{
      ...integration,
      metadata: integration.metadata as any
    }]).returning();
    return newIntegration;
  }

  async updatePlatformIntegration(name: string, updates: Partial<PlatformIntegration>): Promise<PlatformIntegration> {
    const [updated] = await db.update(platformIntegrations)
      .set(updates)
      .where(eq(platformIntegrations.name, name))
      .returning();
    return updated;
  }

  // Prompt Sessions
  async getPromptSession(id: number): Promise<PromptSession | undefined> {
    const [session] = await db.select().from(promptSessions).where(eq(promptSessions.id, id));
    return session || undefined;
  }

  async createPromptSession(session: InsertPromptSession): Promise<PromptSession> {
    const [newSession] = await db.insert(promptSessions).values([{
      ...session,
      ragDocumentsUsed: (session.ragDocumentsUsed || []) as any,
      deepseekResponse: session.deepseekResponse as any
    }]).returning();
    return newSession;
  }

  async updatePromptSession(id: number, updates: Partial<PromptSession>): Promise<PromptSession> {
    const [updated] = await db.update(promptSessions)
      .set(updates)
      .where(eq(promptSessions.id, id))
      .returning();
    return updated;
  }

  async getPromptSessionsByUser(userId: number): Promise<PromptSession[]> {
    return await db.select().from(promptSessions)
      .where(eq(promptSessions.userId, userId))
      .orderBy(desc(promptSessions.createdAt));
  }
}

export const storage = new DatabaseStorage();
