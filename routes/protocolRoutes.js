/**
 * Protocol Routes - API endpoints for A2A, MCP, and AG-UI protocols
 * Based on attached assets implementation specifications
 */

const express = require('express');
const router = express.Router();

function createProtocolRoutes(a2aProtocol, mcpProtocol, agUiProtocol) {
  
  // A2A Protocol Routes
  router.post('/a2a/register-agent', (req, res) => {
    try {
      const { agentId, agentCard } = req.body;
      const agent = a2aProtocol.registerAgent(agentId, agentCard);
      res.json({ success: true, agent });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.get('/a2a/discover-agents', (req, res) => {
    try {
      const { capabilities } = req.query;
      const requiredCapabilities = capabilities ? capabilities.split(',') : [];
      const agents = a2aProtocol.discoverAgents(requiredCapabilities);
      res.json({ agents });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.post('/a2a/create-task', (req, res) => {
    try {
      const { taskId, requestingAgent, targetAgent, taskDefinition } = req.body;
      const task = a2aProtocol.createTask(taskId, requestingAgent, targetAgent, taskDefinition);
      res.json({ success: true, task });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.post('/a2a/send-message', async (req, res) => {
    try {
      const { fromAgent, toAgent, messageType, payload, taskId } = req.body;
      const message = await a2aProtocol.sendMessage(fromAgent, toAgent, messageType, payload, taskId);
      res.json({ success: true, message });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.get('/a2a/metrics', (req, res) => {
    try {
      const metrics = a2aProtocol.getSystemMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // MCP Protocol Routes
  router.post('/mcp/register-server', (req, res) => {
    try {
      const { serverId, serverConfig } = req.body;
      const server = mcpProtocol.registerServer(serverId, serverConfig);
      res.json({ success: true, server });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.get('/mcp/tools/list', (req, res) => {
    try {
      const tools = mcpProtocol.listTools();
      res.json({ tools });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/mcp/tools/call', async (req, res) => {
    try {
      const { toolName, arguments_, sessionId } = req.body;
      const result = await mcpProtocol.callTool(toolName, arguments_, sessionId);
      res.json({ success: true, result });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.get('/mcp/resources/read', async (req, res) => {
    try {
      const { resourceUri, sessionId } = req.query;
      const resourceData = await mcpProtocol.readResource(resourceUri, sessionId);
      res.json({ success: true, resourceData });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.get('/mcp/prompts/get', async (req, res) => {
    try {
      const { promptName, sessionId } = req.query;
      const arguments_ = req.query.arguments ? JSON.parse(req.query.arguments) : {};
      const promptData = await mcpProtocol.getPrompt(promptName, arguments_, sessionId);
      res.json({ success: true, promptData });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.post('/mcp/session/create', (req, res) => {
    try {
      const { clientId, capabilities } = req.body;
      const session = mcpProtocol.createSession(clientId, capabilities);
      res.json({ success: true, session });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.get('/mcp/metrics', (req, res) => {
    try {
      const metrics = mcpProtocol.getSystemMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // AG-UI Protocol Routes
  router.post('/agui/session/create', (req, res) => {
    try {
      const { clientId } = req.body;
      const session = agUiProtocol.createSession(clientId);
      res.json({ success: true, session });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.post('/agui/run/start', (req, res) => {
    try {
      const { sessionId, runConfig } = req.body;
      const run = agUiProtocol.startRun(sessionId, runConfig);
      res.json({ success: true, run });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.post('/agui/message/stream', (req, res) => {
    try {
      const { sessionId, messageId, content, isComplete } = req.body;
      agUiProtocol.streamTextMessage(sessionId, messageId, content, isComplete);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.post('/agui/state/update', (req, res) => {
    try {
      const { sessionId, stateUpdate, isDelta } = req.body;
      agUiProtocol.updateState(sessionId, stateUpdate, isDelta);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.post('/agui/run/complete', (req, res) => {
    try {
      const { sessionId, runId, result } = req.body;
      agUiProtocol.completeRun(sessionId, runId, result);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.get('/agui/session/:sessionId/events', (req, res) => {
    try {
      const { sessionId } = req.params;
      const { limit } = req.query;
      const events = agUiProtocol.getSessionEvents(sessionId, limit ? parseInt(limit) : 50);
      res.json({ events });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.get('/agui/metrics', (req, res) => {
    try {
      const metrics = agUiProtocol.getSystemMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = { createProtocolRoutes };