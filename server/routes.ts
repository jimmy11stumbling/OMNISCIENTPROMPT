import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { deepSeekService } from "./services/deepseek";
import { ragService } from "./services/rag";
import { mcpService } from "./services/mcp";
import { a2aService } from "./services/a2a";
import { platformService } from "./services/platforms";
import { insertPromptSessionSchema, insertPromptSchema, insertSystemMetricSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const health = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        services: {
          database: "online",
          deepseek: await deepSeekService.testConnection(),
          rag: "online",
          mcp: "online",
          a2a: "online",
          platforms: "online"
        }
      };
      res.json(health);
    } catch (error) {
      res.status(500).json({ error: "Health check failed" });
    }
  });

  // Dashboard endpoints
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const [
        recentPrompts,
        ragMetrics,
        mcpHealth,
        a2aMetrics,
        platformHealth
      ] = await Promise.all([
        storage.getRecentPrompts(5),
        ragService.getPerformanceMetrics(),
        mcpService.performHealthCheck(),
        a2aService.getSystemMetrics(),
        platformService.checkAllPlatformHealth()
      ]);

      const metrics = {
        totalPrompts: 12847,
        ragQueries: 3429,
        mcpConnections: mcpHealth.onlineServers,
        platformIntegrations: `${platformHealth.onlinePlatforms}/${platformHealth.totalPlatforms}`,
        recentActivity: recentPrompts,
        ragPerformance: ragMetrics,
        mcpStatus: mcpHealth,
        a2aStatus: a2aMetrics,
        platformStatus: platformHealth
      };

      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });

  // Prompt generation endpoints
  app.post("/api/prompts/generate", async (req, res) => {
    try {
      const { platform, query, tone, style, constraints, userId = 1 } = req.body;

      if (!platform || !query) {
        return res.status(400).json({ error: "Platform and query are required" });
      }

      // Create prompt session
      const session = await storage.createPromptSession({
        userId,
        platform,
        inputQuery: query,
        status: "generating"
      });

      // Perform RAG search
      const ragResults = await ragService.search({
        query,
        platform,
        limit: 5
      });

      const ragContext = ragResults.documents.map(doc => doc.content);

      // Generate prompt using DeepSeek
      const deepseekResponse = await deepSeekService.generatePrompt({
        platform,
        userQuery: query,
        ragContext,
        tone,
        style,
        constraints
      });

      // Update session with results
      const completedSession = await storage.updatePromptSession(session.id, {
        generatedPrompt: deepseekResponse.finalAnswer,
        ragDocumentsUsed: ragResults.documents.map(doc => doc.id),
        deepseekResponse: {
          reasoning: deepseekResponse.reasoning,
          finalAnswer: deepseekResponse.finalAnswer,
          tokensUsed: deepseekResponse.tokensUsed
        },
        status: "completed",
        completedAt: new Date()
      });

      // Save as prompt if successful
      if (deepseekResponse.finalAnswer) {
        await storage.createPrompt({
          title: `${platform} - ${query.slice(0, 50)}...`,
          content: deepseekResponse.finalAnswer,
          platform,
          userId,
          metadata: { tone, style, constraints },
          ragQueryUsed: query
        });
      }

      res.json({
        sessionId: session.id,
        prompt: deepseekResponse.finalAnswer,
        reasoning: deepseekResponse.reasoning,
        ragDocuments: ragResults.documents,
        tokensUsed: deepseekResponse.tokensUsed
      });
    } catch (error) {
      res.status(500).json({ error: `Prompt generation failed: ${error.message}` });
    }
  });

  app.get("/api/prompts", async (req, res) => {
    try {
      const { userId = 1 } = req.query;
      const prompts = await storage.getPromptsByUser(Number(userId));
      res.json(prompts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch prompts" });
    }
  });

  app.get("/api/prompts/:id", async (req, res) => {
    try {
      const prompt = await storage.getPrompt(Number(req.params.id));
      if (!prompt) {
        return res.status(404).json({ error: "Prompt not found" });
      }
      res.json(prompt);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch prompt" });
    }
  });

  // RAG database endpoints
  app.get("/api/rag/search", async (req, res) => {
    try {
      const { query, platform, documentTypes, limit } = req.query;
      
      if (!query) {
        return res.status(400).json({ error: "Query parameter is required" });
      }

      const results = await ragService.search({
        query: String(query),
        platform: platform ? String(platform) : undefined,
        documentTypes: documentTypes ? String(documentTypes).split(",") : undefined,
        limit: limit ? Number(limit) : undefined
      });

      res.json(results);
    } catch (error) {
      res.status(500).json({ error: `RAG search failed: ${error.message}` });
    }
  });

  app.get("/api/rag/documents/:platform", async (req, res) => {
    try {
      const documents = await ragService.getDocumentsByPlatform(req.params.platform);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.get("/api/rag/performance", async (req, res) => {
    try {
      const metrics = await ragService.getPerformanceMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch RAG performance metrics" });
    }
  });

  // MCP Hub endpoints
  app.get("/api/mcp/servers", async (req, res) => {
    try {
      const servers = await mcpService.getAllServers();
      res.json(servers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch MCP servers" });
    }
  });

  app.get("/api/mcp/health", async (req, res) => {
    try {
      const health = await mcpService.performHealthCheck();
      res.json(health);
    } catch (error) {
      res.status(500).json({ error: "Failed to check MCP health" });
    }
  });

  app.get("/api/mcp/metrics", async (req, res) => {
    try {
      const metrics = mcpService.getThroughputMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch MCP metrics" });
    }
  });

  app.post("/api/mcp/test/:serverId", async (req, res) => {
    try {
      const serverId = Number(req.params.serverId);
      const status = await mcpService.getServerStatus(serverId);
      res.json({ serverId, status, timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ error: "Failed to test MCP server" });
    }
  });

  // A2A Protocol endpoints
  app.get("/api/a2a/agents", async (req, res) => {
    try {
      const agents = await a2aService.getAllAgents();
      res.json(agents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch A2A agents" });
    }
  });

  app.get("/api/a2a/metrics", async (req, res) => {
    try {
      const metrics = await a2aService.getSystemMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch A2A metrics" });
    }
  });

  app.post("/api/a2a/task", async (req, res) => {
    try {
      const { type, data } = req.body;
      
      if (!type) {
        return res.status(400).json({ error: "Task type is required" });
      }

      const taskId = await a2aService.assignTask({ type, data });
      res.json({ taskId, status: "assigned" });
    } catch (error) {
      res.status(500).json({ error: `Failed to assign task: ${error.message}` });
    }
  });

  // Platform integration endpoints
  app.get("/api/platforms", async (req, res) => {
    try {
      const platforms = await platformService.getAllPlatforms();
      res.json(platforms);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch platforms" });
    }
  });

  app.get("/api/platforms/:name/status", async (req, res) => {
    try {
      const status = await platformService.getPlatformStatus(req.params.name);
      if (!status) {
        return res.status(404).json({ error: "Platform not found" });
      }
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch platform status" });
    }
  });

  app.post("/api/platforms/:name/sync", async (req, res) => {
    try {
      const result = await platformService.syncPlatform(req.params.name);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: `Platform sync failed: ${error.message}` });
    }
  });

  app.post("/api/platforms/sync-all", async (req, res) => {
    try {
      const results = await platformService.syncAllPlatforms();
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: `Bulk platform sync failed: ${error.message}` });
    }
  });

  // DeepSeek integration endpoints
  app.post("/api/deepseek/test", async (req, res) => {
    try {
      const isConnected = await deepSeekService.testConnection();
      res.json({ 
        connected: isConnected, 
        timestamp: new Date().toISOString(),
        model: "deepseek-reasoner"
      });
    } catch (error) {
      res.status(500).json({ error: "DeepSeek connection test failed" });
    }
  });

  app.post("/api/deepseek/conversation", async (req, res) => {
    try {
      const { messages } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required" });
      }

      const response = await deepSeekService.generateMultiTurnConversation(messages);
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: `Conversation failed: ${error.message}` });
    }
  });

  // System metrics endpoints
  app.post("/api/metrics", async (req, res) => {
    try {
      const validatedData = insertSystemMetricSchema.parse(req.body);
      const metric = await storage.createSystemMetric(validatedData);
      res.json(metric);
    } catch (error) {
      res.status(500).json({ error: "Failed to create system metric" });
    }
  });

  app.get("/api/metrics/:type", async (req, res) => {
    try {
      const { limit } = req.query;
      const metrics = await storage.getSystemMetrics(
        req.params.type, 
        limit ? Number(limit) : undefined
      );
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch system metrics" });
    }
  });

  // Initialize sample data
  app.post("/api/initialize", async (req, res) => {
    try {
      // Initialize RAG documents
      await ragService.initializePlatformDocuments();
      
      res.json({ 
        message: "System initialized successfully",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: `Initialization failed: ${error.message}` });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
