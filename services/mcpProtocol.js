/**
 * Model Context Protocol (MCP) Implementation
 * Universal interface for AI agents to connect with external tools and data sources
 * Based on attached assets MCP Deep Dive specifications
 */

const EventEmitter = require('events');

class MCPProtocol extends EventEmitter {
  constructor() {
    super();
    this.servers = new Map();
    this.tools = new Map();
    this.resources = new Map();
    this.prompts = new Map();
    this.sessions = new Map();
    
    // MCP Protocol Standards from attached assets
    this.protocolVersion = '1.0';
    this.capabilities = {
      tools: true,
      resources: true,
      prompts: true,
      sampling: true
    };
    
    console.log('[MCP-PROTOCOL] Initialized with universal tool interface capabilities');
  }

  /**
   * Register MCP server with tools and resources
   */
  registerServer(serverId, serverConfig) {
    const server = {
      id: serverId,
      name: serverConfig.name,
      description: serverConfig.description,
      capabilities: serverConfig.capabilities || [],
      tools: serverConfig.tools || [],
      resources: serverConfig.resources || [],
      prompts: serverConfig.prompts || [],
      status: 'active',
      endpoint: serverConfig.endpoint,
      transport: serverConfig.transport || 'stdio',
      metadata: serverConfig.metadata || {}
    };

    this.servers.set(serverId, server);

    // Register tools from this server
    server.tools.forEach(tool => {
      this.registerTool(tool, serverId);
    });

    // Register resources from this server
    server.resources.forEach(resource => {
      this.registerResource(resource, serverId);
    });

    // Register prompts from this server
    server.prompts.forEach(prompt => {
      this.registerPrompt(prompt, serverId);
    });

    console.log(`[MCP-PROTOCOL] Server ${serverId} registered with ${server.tools.length} tools, ${server.resources.length} resources`);
    
    this.emit('server_registered', { serverId, server });
    return server;
  }

  /**
   * Register tool with MCP protocol
   */
  registerTool(toolDefinition, serverId) {
    const tool = {
      name: toolDefinition.name,
      description: toolDefinition.description,
      parameters: toolDefinition.parameters || {},
      serverId,
      inputSchema: toolDefinition.inputSchema,
      outputSchema: toolDefinition.outputSchema,
      metadata: toolDefinition.metadata || {}
    };

    this.tools.set(tool.name, tool);
    console.log(`[MCP-PROTOCOL] Tool registered: ${tool.name} (${serverId})`);
    
    return tool;
  }

  /**
   * Register resource with MCP protocol
   */
  registerResource(resourceDefinition, serverId) {
    const resource = {
      uri: resourceDefinition.uri,
      name: resourceDefinition.name,
      description: resourceDefinition.description,
      mimeType: resourceDefinition.mimeType,
      serverId,
      metadata: resourceDefinition.metadata || {}
    };

    this.resources.set(resource.uri, resource);
    console.log(`[MCP-PROTOCOL] Resource registered: ${resource.uri} (${serverId})`);
    
    return resource;
  }

  /**
   * Register prompt template with MCP protocol
   */
  registerPrompt(promptDefinition, serverId) {
    const prompt = {
      name: promptDefinition.name,
      description: promptDefinition.description,
      template: promptDefinition.template,
      arguments: promptDefinition.arguments || [],
      serverId,
      metadata: promptDefinition.metadata || {}
    };

    this.prompts.set(prompt.name, prompt);
    console.log(`[MCP-PROTOCOL] Prompt registered: ${prompt.name} (${serverId})`);
    
    return prompt;
  }

  /**
   * List all available tools
   */
  listTools() {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
      serverId: tool.serverId
    }));
  }

  /**
   * Call tool through MCP protocol
   */
  async callTool(toolName, arguments_, sessionId = null) {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }

    const server = this.servers.get(tool.serverId);
    if (!server || server.status !== 'active') {
      throw new Error(`Server ${tool.serverId} not available`);
    }

    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const toolCall = {
      id: callId,
      tool: toolName,
      arguments: arguments_,
      serverId: tool.serverId,
      sessionId,
      timestamp: new Date(),
      status: 'executing'
    };

    console.log(`[MCP-PROTOCOL] Calling tool ${toolName} with call ID ${callId}`);
    
    this.emit('tool_call_start', toolCall);

    try {
      // Simulate tool execution (in real implementation, this would call the actual server)
      const result = await this.executeTool(tool, arguments_);
      
      toolCall.status = 'completed';
      toolCall.result = result;
      toolCall.completedAt = new Date();

      console.log(`[MCP-PROTOCOL] Tool call ${callId} completed successfully`);
      
      this.emit('tool_call_complete', toolCall);
      return result;

    } catch (error) {
      toolCall.status = 'failed';
      toolCall.error = error.message;
      toolCall.completedAt = new Date();

      console.error(`[MCP-PROTOCOL] Tool call ${callId} failed:`, error.message);
      
      this.emit('tool_call_failed', toolCall);
      throw error;
    }
  }

  /**
   * Read resource through MCP protocol
   */
  async readResource(resourceUri, sessionId = null) {
    const resource = this.resources.get(resourceUri);
    if (!resource) {
      throw new Error(`Resource ${resourceUri} not found`);
    }

    const server = this.servers.get(resource.serverId);
    if (!server || server.status !== 'active') {
      throw new Error(`Server ${resource.serverId} not available`);
    }

    console.log(`[MCP-PROTOCOL] Reading resource ${resourceUri}`);
    
    this.emit('resource_read_start', { resourceUri, sessionId });

    try {
      // Simulate resource reading (in real implementation, this would call the actual server)
      const content = await this.fetchResource(resource);
      
      const resourceData = {
        uri: resourceUri,
        content,
        mimeType: resource.mimeType,
        size: content.length,
        lastModified: new Date()
      };

      console.log(`[MCP-PROTOCOL] Resource ${resourceUri} read successfully`);
      
      this.emit('resource_read_complete', resourceData);
      return resourceData;

    } catch (error) {
      console.error(`[MCP-PROTOCOL] Resource read failed for ${resourceUri}:`, error.message);
      
      this.emit('resource_read_failed', { resourceUri, error: error.message });
      throw error;
    }
  }

  /**
   * Get prompt with arguments
   */
  async getPrompt(promptName, arguments_ = {}, sessionId = null) {
    const prompt = this.prompts.get(promptName);
    if (!prompt) {
      throw new Error(`Prompt ${promptName} not found`);
    }

    console.log(`[MCP-PROTOCOL] Getting prompt ${promptName}`);
    
    try {
      // Process prompt template with arguments
      let processedTemplate = prompt.template;
      
      for (const [key, value] of Object.entries(arguments_)) {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        processedTemplate = processedTemplate.replace(placeholder, value);
      }

      const promptData = {
        name: promptName,
        description: prompt.description,
        processed: processedTemplate,
        arguments: arguments_,
        serverId: prompt.serverId
      };

      console.log(`[MCP-PROTOCOL] Prompt ${promptName} processed successfully`);
      
      this.emit('prompt_get_complete', promptData);
      return promptData;

    } catch (error) {
      console.error(`[MCP-PROTOCOL] Prompt processing failed for ${promptName}:`, error.message);
      throw error;
    }
  }

  /**
   * Create client session
   */
  createSession(clientId, capabilities = {}) {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session = {
      id: sessionId,
      clientId,
      capabilities,
      created: new Date(),
      lastActivity: new Date(),
      toolCalls: [],
      resourceReads: [],
      status: 'active'
    };

    this.sessions.set(sessionId, session);
    
    console.log(`[MCP-PROTOCOL] Session ${sessionId} created for client ${clientId}`);
    
    this.emit('session_created', session);
    return session;
  }

  /**
   * Execute tool (simulation - real implementation would call actual server)
   */
  async executeTool(tool, arguments_) {
    // Simulate different tool types based on name patterns
    if (tool.name.includes('database')) {
      return {
        type: 'database_result',
        data: `Database query executed with arguments: ${JSON.stringify(arguments_)}`,
        rows: Math.floor(Math.random() * 100),
        executionTime: Math.floor(Math.random() * 1000)
      };
    }
    
    if (tool.name.includes('file')) {
      return {
        type: 'file_operation',
        path: arguments_.path || '/default/path',
        operation: arguments_.operation || 'read',
        success: true,
        content: `File content for ${arguments_.path || 'default'}`
      };
    }
    
    if (tool.name.includes('api')) {
      return {
        type: 'api_response',
        endpoint: arguments_.endpoint,
        method: arguments_.method || 'GET',
        statusCode: 200,
        data: { message: 'API call successful', timestamp: new Date() }
      };
    }

    // Default tool execution
    return {
      type: 'generic_result',
      tool: tool.name,
      arguments: arguments_,
      success: true,
      timestamp: new Date()
    };
  }

  /**
   * Fetch resource (simulation - real implementation would call actual server)
   */
  async fetchResource(resource) {
    // Simulate different resource types
    if (resource.mimeType === 'application/json') {
      return JSON.stringify({
        resource: resource.uri,
        data: 'Sample JSON data',
        timestamp: new Date()
      });
    }
    
    if (resource.mimeType === 'text/plain') {
      return `Sample text content for resource ${resource.uri}\nGenerated at ${new Date()}`;
    }
    
    return `Binary content for ${resource.uri}`;
  }

  /**
   * Get comprehensive MCP system metrics
   */
  getSystemMetrics() {
    const activeServers = Array.from(this.servers.values()).filter(s => s.status === 'active');
    const activeSessions = Array.from(this.sessions.values()).filter(s => s.status === 'active');

    return {
      servers: {
        total: this.servers.size,
        active: activeServers.length
      },
      tools: {
        total: this.tools.size,
        byServer: this.getToolsByServer()
      },
      resources: {
        total: this.resources.size,
        byServer: this.getResourcesByServer()
      },
      prompts: {
        total: this.prompts.size
      },
      sessions: {
        total: this.sessions.size,
        active: activeSessions.length
      },
      protocol: {
        version: this.protocolVersion,
        capabilities: this.capabilities
      }
    };
  }

  /**
   * Get tools organized by server
   */
  getToolsByServer() {
    const toolsByServer = {};
    for (const tool of this.tools.values()) {
      if (!toolsByServer[tool.serverId]) {
        toolsByServer[tool.serverId] = [];
      }
      toolsByServer[tool.serverId].push(tool.name);
    }
    return toolsByServer;
  }

  /**
   * Get resources organized by server
   */
  getResourcesByServer() {
    const resourcesByServer = {};
    for (const resource of this.resources.values()) {
      if (!resourcesByServer[resource.serverId]) {
        resourcesByServer[resource.serverId] = [];
      }
      resourcesByServer[resource.serverId].push(resource.uri);
    }
    return resourcesByServer;
  }
}

module.exports = { MCPProtocol };