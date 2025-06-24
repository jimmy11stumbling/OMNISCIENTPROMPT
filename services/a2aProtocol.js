/**
 * Agent-to-Agent (A2A) Communication Protocol Implementation
 * Based on attached assets analysis for multi-agent system coordination
 */

const EventEmitter = require('events');

class A2AProtocol extends EventEmitter {
  constructor() {
    super();
    this.agents = new Map();
    this.tasks = new Map();
    this.connections = new Map();
    this.capabilities = new Set();
    
    // A2A Protocol Standards from attached assets
    this.protocolVersion = '1.0';
    this.messageTypes = {
      DISCOVER: 'discover',
      REGISTER: 'register',
      TASK_REQUEST: 'task_request',
      TASK_RESPONSE: 'task_response',
      CAPABILITY_QUERY: 'capability_query',
      COORDINATION: 'coordination',
      HANDOFF: 'handoff'
    };
    
    console.log('[A2A-PROTOCOL] Initialized with multi-agent coordination capabilities');
  }

  /**
   * Register agent with capabilities based on A2A protocol specification
   */
  registerAgent(agentId, agentCard) {
    const agent = {
      id: agentId,
      card: agentCard,
      capabilities: agentCard.capabilities || [],
      status: 'active',
      lastSeen: new Date(),
      tasks: new Set(),
      metadata: agentCard.metadata || {}
    };

    this.agents.set(agentId, agent);
    
    // Add capabilities to global registry
    agent.capabilities.forEach(cap => this.capabilities.add(cap));
    
    console.log(`[A2A-PROTOCOL] Agent ${agentId} registered with capabilities:`, agent.capabilities);
    
    this.emit('agent_registered', { agentId, agent });
    return agent;
  }

  /**
   * Discover agents with specific capabilities
   */
  discoverAgents(requiredCapabilities = []) {
    const matchingAgents = [];
    
    for (const [agentId, agent] of this.agents) {
      if (agent.status !== 'active') continue;
      
      const hasCapabilities = requiredCapabilities.every(cap => 
        agent.capabilities.includes(cap)
      );
      
      if (hasCapabilities || requiredCapabilities.length === 0) {
        matchingAgents.push({
          id: agentId,
          card: agent.card,
          capabilities: agent.capabilities,
          availability: this.getAgentAvailability(agentId)
        });
      }
    }
    
    console.log(`[A2A-PROTOCOL] Discovered ${matchingAgents.length} agents for capabilities:`, requiredCapabilities);
    return matchingAgents;
  }

  /**
   * Create task for agent coordination
   */
  createTask(taskId, requestingAgent, targetAgent, taskDefinition) {
    const task = {
      id: taskId,
      requestingAgent,
      targetAgent,
      definition: taskDefinition,
      status: 'pending',
      created: new Date(),
      messages: [],
      context: taskDefinition.context || {},
      priority: taskDefinition.priority || 'normal'
    };

    this.tasks.set(taskId, task);
    
    // Add task to both agents
    if (this.agents.has(requestingAgent)) {
      this.agents.get(requestingAgent).tasks.add(taskId);
    }
    if (this.agents.has(targetAgent)) {
      this.agents.get(targetAgent).tasks.add(taskId);
    }

    console.log(`[A2A-PROTOCOL] Task ${taskId} created: ${requestingAgent} -> ${targetAgent}`);
    
    this.emit('task_created', task);
    return task;
  }

  /**
   * Send message between agents using A2A protocol
   */
  async sendMessage(fromAgent, toAgent, messageType, payload, taskId = null) {
    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: fromAgent,
      to: toAgent,
      type: messageType,
      payload,
      taskId,
      timestamp: new Date(),
      protocol: 'A2A/1.0'
    };

    // Store message in task if applicable
    if (taskId && this.tasks.has(taskId)) {
      this.tasks.get(taskId).messages.push(message);
    }

    console.log(`[A2A-PROTOCOL] Message ${message.id}: ${fromAgent} -> ${toAgent} (${messageType})`);
    
    this.emit('message_sent', message);
    this.emit(`message_${toAgent}`, message);
    
    return message;
  }

  /**
   * Coordinate task execution between agents
   */
  async coordinateTask(taskId, coordinationData) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.status = 'coordinating';
    task.coordination = coordinationData;
    task.updated = new Date();

    console.log(`[A2A-PROTOCOL] Coordinating task ${taskId}:`, coordinationData.type);
    
    this.emit('task_coordinating', { task, coordinationData });
    
    return task;
  }

  /**
   * Handle task handoff between agents
   */
  async handoffTask(taskId, fromAgent, toAgent, handoffReason) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Update task assignment
    task.targetAgent = toAgent;
    task.handoffHistory = task.handoffHistory || [];
    task.handoffHistory.push({
      from: fromAgent,
      to: toAgent,
      reason: handoffReason,
      timestamp: new Date()
    });

    // Update agent task assignments
    if (this.agents.has(fromAgent)) {
      this.agents.get(fromAgent).tasks.delete(taskId);
    }
    if (this.agents.has(toAgent)) {
      this.agents.get(toAgent).tasks.add(taskId);
    }

    console.log(`[A2A-PROTOCOL] Task ${taskId} handed off: ${fromAgent} -> ${toAgent}`);
    
    this.emit('task_handoff', { task, fromAgent, toAgent, handoffReason });
    
    return task;
  }

  /**
   * Get agent availability and load
   */
  getAgentAvailability(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) return null;

    const activeTasks = Array.from(agent.tasks).filter(taskId => {
      const task = this.tasks.get(taskId);
      return task && ['pending', 'active', 'coordinating'].includes(task.status);
    });

    return {
      status: agent.status,
      activeTasks: activeTasks.length,
      capacity: agent.card.capacity || 10,
      load: activeTasks.length / (agent.card.capacity || 10),
      lastSeen: agent.lastSeen
    };
  }

  /**
   * Get comprehensive A2A system metrics
   */
  getSystemMetrics() {
    const activeAgents = Array.from(this.agents.values()).filter(a => a.status === 'active');
    const activeTasks = Array.from(this.tasks.values()).filter(t => 
      ['pending', 'active', 'coordinating'].includes(t.status)
    );

    return {
      agents: {
        total: this.agents.size,
        active: activeAgents.length,
        capabilities: Array.from(this.capabilities)
      },
      tasks: {
        total: this.tasks.size,
        active: activeTasks.length,
        pending: activeTasks.filter(t => t.status === 'pending').length,
        coordinating: activeTasks.filter(t => t.status === 'coordinating').length
      },
      protocol: {
        version: this.protocolVersion,
        uptime: process.uptime(),
        messagesSent: this.listenerCount('message_sent')
      }
    };
  }

  /**
   * Clean up completed tasks and inactive agents
   */
  cleanup() {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    // Clean up old completed tasks
    for (const [taskId, task] of this.tasks) {
      if (task.status === 'completed' && (now - task.updated) > maxAge) {
        this.tasks.delete(taskId);
        console.log(`[A2A-PROTOCOL] Cleaned up completed task ${taskId}`);
      }
    }

    // Update agent last seen and mark inactive
    for (const [agentId, agent] of this.agents) {
      if ((now - agent.lastSeen) > maxAge) {
        agent.status = 'inactive';
        console.log(`[A2A-PROTOCOL] Marked agent ${agentId} as inactive`);
      }
    }
  }
}

module.exports = { A2AProtocol };