/**
 * WebSocket Service
 * Real-time communication with advanced connection management
 */

const { WebSocketServer, WebSocket } = require('ws');
const config = require('../config/environment');
const { logManager } = require('../middlewares/logging');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.connections = new Map();
    this.channels = new Map();
    this.heartbeatInterval = null;
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      messagesSent: 0,
      messagesReceived: 0,
      errors: 0
    };
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: config.WEBSOCKET.path,
      maxPayload: 1024 * 1024 // 1MB max message size
    });

    this.setupEventHandlers();
    this.startHeartbeat();
    
    console.log(`WebSocket server initialized on ${config.WEBSOCKET.path}`);
  }

  /**
   * Setup WebSocket event handlers
   */
  setupEventHandlers() {
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
      this.metrics.errors++;
    });
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws, req) {
    const connectionId = this.generateConnectionId();
    const clientInfo = {
      id: connectionId,
      ws,
      ip: req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      connectedAt: new Date(),
      isAlive: true,
      userId: null,
      channels: new Set(),
      metadata: {}
    };

    this.connections.set(connectionId, clientInfo);
    this.metrics.totalConnections++;
    this.metrics.activeConnections++;

    console.log(`[WEBSOCKET] New connection: ${connectionId}`);

    // Send connection confirmation
    this.sendToClient(connectionId, {
      type: 'connection',
      status: 'connected',
      connectionId,
      timestamp: new Date().toISOString()
    });

    // Setup client event handlers
    ws.on('message', (data) => {
      this.handleMessage(connectionId, data);
    });

    ws.on('close', (code, reason) => {
      this.handleDisconnection(connectionId, code, reason);
    });

    ws.on('error', (error) => {
      console.error(`[WEBSOCKET] Client error ${connectionId}:`, error);
      this.metrics.errors++;
    });

    ws.on('pong', () => {
      const client = this.connections.get(connectionId);
      if (client) {
        client.isAlive = true;
      }
    });

    // Check connection limits
    if (this.metrics.activeConnections > config.WEBSOCKET.maxConnections) {
      console.warn(`[WEBSOCKET] Max connections exceeded: ${this.metrics.activeConnections}`);
    }
  }

  /**
   * Handle incoming messages
   */
  handleMessage(connectionId, data) {
    try {
      const client = this.connections.get(connectionId);
      if (!client) return;

      this.metrics.messagesReceived++;

      const message = JSON.parse(data);
      console.log(`[WEBSOCKET] Message from ${connectionId}:`, message.type);

      switch (message.type) {
        case 'authenticate':
          this.handleAuthentication(connectionId, message);
          break;

        case 'join_channel':
          this.joinChannel(connectionId, message.channel);
          break;

        case 'leave_channel':
          this.leaveChannel(connectionId, message.channel);
          break;

        case 'ping':
          this.sendToClient(connectionId, { type: 'pong', timestamp: new Date().toISOString() });
          break;

        case 'chat_message':
          this.handleChatMessage(connectionId, message);
          break;

        case 'rag_search':
          this.handleRagSearch(connectionId, message);
          break;

        case 'prompt_generation':
          this.handlePromptGeneration(connectionId, message);
          break;

        default:
          console.warn(`[WEBSOCKET] Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error(`[WEBSOCKET] Message parsing error:`, error);
      this.sendToClient(connectionId, {
        type: 'error',
        message: 'Invalid message format'
      });
    }
  }

  /**
   * Handle client authentication
   */
  async handleAuthentication(connectionId, message) {
    try {
      const client = this.connections.get(connectionId);
      if (!client) return;

      // Verify JWT token
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(message.token, config.JWT_SECRET);
      
      // Get user from database
      const database = require('../database');
      const userResult = await database.queryAsync(
        'SELECT * FROM users WHERE id = ? AND is_active = 1',
        [decoded.userId]
      );

      if (userResult.rows.length) {
        client.userId = decoded.userId;
        client.user = userResult.rows[0];
        
        this.sendToClient(connectionId, {
          type: 'authenticated',
          user: {
            id: client.user.id,
            username: client.user.username,
            role: client.user.role
          }
        });

        console.log(`[WEBSOCKET] User authenticated: ${client.user.username}`);
      } else {
        this.sendToClient(connectionId, {
          type: 'auth_error',
          message: 'Invalid user'
        });
      }
    } catch (error) {
      console.error('[WEBSOCKET] Authentication error:', error);
      this.sendToClient(connectionId, {
        type: 'auth_error',
        message: 'Authentication failed'
      });
    }
  }

  /**
   * Handle chat messages
   */
  handleChatMessage(connectionId, message) {
    const client = this.connections.get(connectionId);
    if (!client || !client.userId) {
      this.sendToClient(connectionId, {
        type: 'error',
        message: 'Authentication required'
      });
      return;
    }

    // Broadcast to channel or specific users
    const chatData = {
      type: 'chat_message',
      from: {
        id: client.user.id,
        username: client.user.username
      },
      message: message.content,
      timestamp: new Date().toISOString(),
      channel: message.channel
    };

    if (message.channel) {
      this.broadcastToChannel(message.channel, chatData, connectionId);
    } else {
      this.broadcast(chatData, [connectionId]);
    }
  }

  /**
   * Handle RAG search requests
   */
  handleRagSearch(connectionId, message) {
    const client = this.connections.get(connectionId);
    if (!client) return;

    // Send search started notification
    this.sendToClient(connectionId, {
      type: 'rag_search_started',
      query: message.query,
      platform: message.platform
    });

    // Perform search asynchronously
    setImmediate(async () => {
      try {
        const ragService = require('./ragService');
        const results = await ragService.searchDocuments(
          message.query,
          message.platform,
          message.limit || 5
        );

        this.sendToClient(connectionId, {
          type: 'rag_search_results',
          query: message.query,
          platform: message.platform,
          results,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        this.sendToClient(connectionId, {
          type: 'rag_search_error',
          error: error.message
        });
      }
    });
  }

  /**
   * Handle prompt generation requests
   */
  handlePromptGeneration(connectionId, message) {
    const client = this.connections.get(connectionId);
    if (!client) return;

    this.sendToClient(connectionId, {
      type: 'prompt_generation_started',
      query: message.query,
      platform: message.platform
    });

    setImmediate(async () => {
      try {
        const deepSeekService = require('./deepseekService');
        const result = await deepSeekService.generatePrompt(
          message.query,
          message.platform,
          message.options
        );

        this.sendToClient(connectionId, {
          type: 'prompt_generation_completed',
          ...result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        this.sendToClient(connectionId, {
          type: 'prompt_generation_error',
          error: error.message
        });
      }
    });
  }

  /**
   * Handle client disconnection
   */
  handleDisconnection(connectionId, code, reason) {
    const client = this.connections.get(connectionId);
    if (!client) return;

    console.log(`[WEBSOCKET] Client disconnected: ${connectionId} (${code})`);

    // Remove from all channels
    client.channels.forEach(channel => {
      this.removeFromChannel(channel, connectionId);
    });

    this.connections.delete(connectionId);
    this.metrics.activeConnections--;

    // Log disconnection
    logManager.logSecurityEvent('websocket_disconnect', {
      connectionId,
      code,
      reason: reason?.toString(),
      duration: Date.now() - client.connectedAt.getTime()
    }, { ip: client.ip, user: client.user });
  }

  /**
   * Send message to specific client
   */
  sendToClient(connectionId, data) {
    const client = this.connections.get(connectionId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      client.ws.send(JSON.stringify(data));
      this.metrics.messagesSent++;
      return true;
    } catch (error) {
      console.error(`[WEBSOCKET] Send error to ${connectionId}:`, error);
      return false;
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(data, excludeConnections = []) {
    let sent = 0;
    
    this.connections.forEach((client, connectionId) => {
      if (!excludeConnections.includes(connectionId)) {
        if (this.sendToClient(connectionId, data)) {
          sent++;
        }
      }
    });

    return sent;
  }

  /**
   * Join a channel
   */
  joinChannel(connectionId, channelName) {
    const client = this.connections.get(connectionId);
    if (!client) return false;

    if (!this.channels.has(channelName)) {
      this.channels.set(channelName, new Set());
    }

    this.channels.get(channelName).add(connectionId);
    client.channels.add(channelName);

    this.sendToClient(connectionId, {
      type: 'channel_joined',
      channel: channelName,
      memberCount: this.channels.get(channelName).size
    });

    console.log(`[WEBSOCKET] ${connectionId} joined channel: ${channelName}`);
    return true;
  }

  /**
   * Leave a channel
   */
  leaveChannel(connectionId, channelName) {
    const client = this.connections.get(connectionId);
    if (!client) return false;

    this.removeFromChannel(channelName, connectionId);

    this.sendToClient(connectionId, {
      type: 'channel_left',
      channel: channelName
    });

    return true;
  }

  /**
   * Remove connection from channel
   */
  removeFromChannel(channelName, connectionId) {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.delete(connectionId);
      if (channel.size === 0) {
        this.channels.delete(channelName);
      }
    }

    const client = this.connections.get(connectionId);
    if (client) {
      client.channels.delete(channelName);
    }
  }

  /**
   * Broadcast to channel
   */
  broadcastToChannel(channelName, data, excludeConnections = []) {
    const channel = this.channels.get(channelName);
    if (!channel) return 0;

    let sent = 0;
    channel.forEach(connectionId => {
      if (!excludeConnections.includes(connectionId)) {
        if (this.sendToClient(connectionId, data)) {
          sent++;
        }
      }
    });

    return sent;
  }

  /**
   * Send to authenticated users only
   */
  broadcastToAuthenticated(data, excludeConnections = []) {
    let sent = 0;
    
    this.connections.forEach((client, connectionId) => {
      if (client.userId && !excludeConnections.includes(connectionId)) {
        if (this.sendToClient(connectionId, data)) {
          sent++;
        }
      }
    });

    return sent;
  }

  /**
   * Start heartbeat mechanism
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.connections.forEach((client, connectionId) => {
        if (!client.isAlive) {
          console.log(`[WEBSOCKET] Terminating dead connection: ${connectionId}`);
          client.ws.terminate();
          this.handleDisconnection(connectionId, 1006, 'Heartbeat timeout');
          return;
        }

        client.isAlive = false;
        try {
          client.ws.ping();
        } catch (error) {
          console.error(`[WEBSOCKET] Ping error for ${connectionId}:`, error);
        }
      });
    }, config.WEBSOCKET.heartbeatInterval);
  }

  /**
   * Generate unique connection ID
   */
  generateConnectionId() {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get connection metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      channels: Array.from(this.channels.keys()).map(name => ({
        name,
        memberCount: this.channels.get(name).size
      })),
      uptime: process.uptime()
    };
  }

  /**
   * Get connection details
   */
  getConnectionDetails() {
    const connections = [];
    
    this.connections.forEach((client, connectionId) => {
      connections.push({
        id: connectionId,
        userId: client.userId,
        username: client.user?.username,
        ip: client.ip,
        connectedAt: client.connectedAt,
        channels: Array.from(client.channels),
        isAlive: client.isAlive
      });
    });

    return connections;
  }

  /**
   * Graceful shutdown
   */
  shutdown() {
    console.log('[WEBSOCKET] Shutting down...');
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Notify all clients of shutdown
    this.broadcast({
      type: 'server_shutdown',
      message: 'Server is shutting down',
      timestamp: new Date().toISOString()
    });

    // Close all connections
    this.connections.forEach((client, connectionId) => {
      client.ws.close(1001, 'Server shutdown');
    });

    if (this.wss) {
      this.wss.close();
    }

    console.log('[WEBSOCKET] Shutdown complete');
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

module.exports = {
  webSocketService,
  initialize: (server) => webSocketService.initialize(server),
  sendToClient: (id, data) => webSocketService.sendToClient(id, data),
  broadcast: (data, exclude) => webSocketService.broadcast(data, exclude),
  broadcastToChannel: (channel, data, exclude) => webSocketService.broadcastToChannel(channel, data, exclude),
  broadcastToAuthenticated: (data, exclude) => webSocketService.broadcastToAuthenticated(data, exclude),
  getMetrics: () => webSocketService.getMetrics(),
  getConnectionDetails: () => webSocketService.getConnectionDetails(),
  shutdown: () => webSocketService.shutdown()
};