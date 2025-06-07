import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const prompts = pgTable("prompts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  platform: text("platform").notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  metadata: jsonb("metadata").$type<{
    tone?: string;
    style?: string;
    constraints?: string[];
    tags?: string[];
  }>(),
  ragQueryUsed: text("rag_query_used"),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  isPublic: boolean("is_public").default(false),
});

export const ragDocuments = pgTable("rag_documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  platform: text("platform").notNull(),
  documentType: text("document_type").notNull(), // 'api', 'guide', 'example', 'feature'
  embedding: real("embedding").array(),
  metadata: jsonb("metadata").$type<{
    version?: string;
    lastUpdated?: string;
    source?: string;
    category?: string;
    keywords?: string[];
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const mcpServers = pgTable("mcp_servers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  endpoint: text("endpoint").notNull(),
  status: text("status").notNull().default("offline"), // 'online', 'offline', 'error'
  protocolVersion: text("protocol_version").notNull().default("2.0"),
  capabilities: jsonb("capabilities").$type<string[]>(),
  lastHeartbeat: timestamp("last_heartbeat"),
  metadata: jsonb("metadata").$type<{
    description?: string;
    maintainer?: string;
    connectionCount?: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const a2aAgents = pgTable("a2a_agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'prompt-generator', 'rag-retriever', 'mcp-coordinator'
  status: text("status").notNull().default("idle"), // 'active', 'idle', 'busy', 'error'
  currentTask: text("current_task"),
  capabilities: jsonb("capabilities").$type<string[]>(),
  metadata: jsonb("metadata").$type<{
    lastActivity?: string;
    tasksCompleted?: number;
    avgResponseTime?: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const systemMetrics = pgTable("system_metrics", {
  id: serial("id").primaryKey(),
  metricType: text("metric_type").notNull(), // 'cpu', 'memory', 'disk', 'network', 'rag_query', 'prompt_generation'
  value: real("value").notNull(),
  unit: text("unit").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: jsonb("metadata").$type<{
    source?: string;
    additional_data?: Record<string, any>;
  }>(),
});

export const platformIntegrations = pgTable("platform_integrations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // 'lovable', 'bolt', 'replit', 'cursor', 'windsurf'
  displayName: text("display_name").notNull(),
  status: text("status").notNull().default("offline"), // 'online', 'offline', 'syncing', 'error'
  apiEndpoint: text("api_endpoint"),
  lastSync: timestamp("last_sync"),
  docsLastUpdated: timestamp("docs_last_updated"),
  documentCount: integer("document_count").default(0),
  metadata: jsonb("metadata").$type<{
    icon?: string;
    color?: string;
    features?: string[];
    version?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const promptSessions = pgTable("prompt_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  platform: text("platform").notNull(),
  inputQuery: text("input_query").notNull(),
  generatedPrompt: text("generated_prompt"),
  ragDocumentsUsed: jsonb("rag_documents_used").$type<number[]>(),
  deepseekResponse: jsonb("deepseek_response").$type<{
    reasoning?: string;
    finalAnswer?: string;
    tokensUsed?: number;
  }>(),
  status: text("status").notNull().default("pending"), // 'pending', 'generating', 'completed', 'error'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  prompts: many(prompts),
  promptSessions: many(promptSessions),
}));

export const promptsRelations = relations(prompts, ({ one }) => ({
  user: one(users, {
    fields: [prompts.userId],
    references: [users.id],
  }),
}));

export const promptSessionsRelations = relations(promptSessions, ({ one }) => ({
  user: one(users, {
    fields: [promptSessions.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertPromptSchema = createInsertSchema(prompts).omit({ id: true, generatedAt: true });
export const insertRagDocumentSchema = createInsertSchema(ragDocuments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMcpServerSchema = createInsertSchema(mcpServers).omit({ id: true, createdAt: true });
export const insertA2aAgentSchema = createInsertSchema(a2aAgents).omit({ id: true, createdAt: true });
export const insertSystemMetricSchema = createInsertSchema(systemMetrics).omit({ id: true, timestamp: true });
export const insertPlatformIntegrationSchema = createInsertSchema(platformIntegrations).omit({ id: true, createdAt: true });
export const insertPromptSessionSchema = createInsertSchema(promptSessions).omit({ id: true, createdAt: true, completedAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Prompt = typeof prompts.$inferSelect;
export type InsertPrompt = z.infer<typeof insertPromptSchema>;
export type RagDocument = typeof ragDocuments.$inferSelect;
export type InsertRagDocument = z.infer<typeof insertRagDocumentSchema>;
export type McpServer = typeof mcpServers.$inferSelect;
export type InsertMcpServer = z.infer<typeof insertMcpServerSchema>;
export type A2aAgent = typeof a2aAgents.$inferSelect;
export type InsertA2aAgent = z.infer<typeof insertA2aAgentSchema>;
export type SystemMetric = typeof systemMetrics.$inferSelect;
export type InsertSystemMetric = z.infer<typeof insertSystemMetricSchema>;
export type PlatformIntegration = typeof platformIntegrations.$inferSelect;
export type InsertPlatformIntegration = z.infer<typeof insertPlatformIntegrationSchema>;
export type PromptSession = typeof promptSessions.$inferSelect;
export type InsertPromptSession = z.infer<typeof insertPromptSessionSchema>;
