/**
 * Agent-User Interface (AG-UI) Protocol Implementation
 * Real-time interactive protocol for AI agent frontend communication
 * Based on attached assets AG-UI Protocol specifications
 */

const EventEmitter = require('events');

class AGUIProtocol extends EventEmitter {
  constructor(websocketManager) {
    super();
    this.wsManager = websocketManager;
    this.sessions = new Map();
    this.activeRuns = new Map();
    this.eventQueue = new Map();
    
    // AG-UI Protocol Standards from attached assets
    this.protocolVersion = '1.0';
    this.eventTypes = {
      // Lifecycle Events
      RUN_STARTED: 'run_started',
      RUN_FINISHED: 'run_finished',
      RUN_FAILED: 'run_failed',
      
      // State Management Events
      STATE_SNAPSHOT: 'state_snapshot',
      STATE_DELTA: 'state_delta',
      
      // Text Streaming Events
      TEXT_MESSAGE_START: 'text_message_start',
      TEXT_MESSAGE_CONTENT: 'text_message_content',
      TEXT_MESSAGE_END: 'text_message_end',
      TEXT_MESSAGE_CHUNK: 'text_message_chunk',
      
      // Tool Interaction Events
      TOOL_CALL_START: 'tool_call_start',
      TOOL_CALL_COMPLETE: 'tool_call_complete',
      TOOL_CALL_CHUNK: 'tool_call_chunk',
      
      // Media and UI Events
      MEDIA_FRAME: 'media_frame',
      UI_UPDATE: 'ui_update',
      USER_INPUT: 'user_input'
    };
    
    console.log('[AG-UI-PROTOCOL] Initialized with real-time UI event streaming');
  }

  /**
   * Create AG-UI session for client
   */
  createSession(clientId, websocket = null) {
    const sessionId = `agui_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session = {
      id: sessionId,
      clientId,
      websocket,
      created: new Date(),
      lastActivity: new Date(),
      runs: new Set(),
      state: {},
      eventHistory: [],
      status: 'active'
    };

    this.sessions.set(sessionId, session);
    this.eventQueue.set(sessionId, []);
    
    console.log(`[AG-UI-PROTOCOL] Session ${sessionId} created for client ${clientId}`);
    
    this.emit('session_created', session);
    return session;
  }

  /**
   * Start agent run with AG-UI event streaming
   */
  startRun(sessionId, runConfig) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const run = {
      id: runId,
      sessionId,
      config: runConfig,
      status: 'running',
      started: new Date(),
      events: [],
      state: {},
      metadata: runConfig.metadata || {}
    };

    this.activeRuns.set(runId, run);
    session.runs.add(runId);
    session.lastActivity = new Date();

    // Send RUN_STARTED event
    this.sendEvent(sessionId, this.eventTypes.RUN_STARTED, {
      runId,
      config: runConfig,
      timestamp: run.started
    });

    console.log(`[AG-UI-PROTOCOL] Run ${runId} started for session ${sessionId}`);
    
    this.emit('run_started', run);
    return run;
  }

  /**
   * Stream text message with chunked delivery
   */
  streamTextMessage(sessionId, messageId, content, isComplete = false) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Send TEXT_MESSAGE_START if this is the beginning
    if (!session.state[`message_${messageId}`]) {
      this.sendEvent(sessionId, this.eventTypes.TEXT_MESSAGE_START, {
        messageId,
        timestamp: new Date()
      });
      session.state[`message_${messageId}`] = { started: true, content: '' };
    }

    // Send TEXT_MESSAGE_CONTENT with chunk
    this.sendEvent(sessionId, this.eventTypes.TEXT_MESSAGE_CONTENT, {
      messageId,
      content,
      chunk: true,
      timestamp: new Date()
    });

    // Update session state
    session.state[`message_${messageId}`].content += content;
    session.lastActivity = new Date();

    // Send TEXT_MESSAGE_END if complete
    if (isComplete) {
      this.sendEvent(sessionId, this.eventTypes.TEXT_MESSAGE_END, {
        messageId,
        finalContent: session.state[`message_${messageId}`].content,
        timestamp: new Date()
      });
    }

    console.log(`[AG-UI-PROTOCOL] Text streamed to session ${sessionId}, message ${messageId}`);
  }

  /**
   * Send tool call events
   */
  sendToolCallEvent(sessionId, eventType, toolCallData) {
    const validToolEvents = [
      this.eventTypes.TOOL_CALL_START,
      this.eventTypes.TOOL_CALL_COMPLETE,
      this.eventTypes.TOOL_CALL_CHUNK
    ];

    if (!validToolEvents.includes(eventType)) {
      throw new Error(`Invalid tool call event type: ${eventType}`);
    }

    this.sendEvent(sessionId, eventType, {
      ...toolCallData,
      timestamp: new Date()
    });

    console.log(`[AG-UI-PROTOCOL] Tool call event ${eventType} sent to session ${sessionId}`);
  }

  /**
   * Update session state with delta or snapshot
   */
  updateState(sessionId, stateUpdate, isDelta = true) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    if (isDelta) {
      // Apply delta update
      Object.assign(session.state, stateUpdate);
      
      this.sendEvent(sessionId, this.eventTypes.STATE_DELTA, {
        delta: stateUpdate,
        timestamp: new Date()
      });
    } else {
      // Full state snapshot
      session.state = { ...stateUpdate };
      
      this.sendEvent(sessionId, this.eventTypes.STATE_SNAPSHOT, {
        state: session.state,
        timestamp: new Date()
      });
    }

    session.lastActivity = new Date();
    console.log(`[AG-UI-PROTOCOL] State ${isDelta ? 'delta' : 'snapshot'} sent to session ${sessionId}`);
  }

  /**
   * Send UI update event
   */
  sendUIUpdate(sessionId, uiData) {
    this.sendEvent(sessionId, this.eventTypes.UI_UPDATE, {
      ...uiData,
      timestamp: new Date()
    });

    console.log(`[AG-UI-PROTOCOL] UI update sent to session ${sessionId}`);
  }

  /**
   * Complete agent run
   */
  completeRun(sessionId, runId, result = null) {
    const run = this.activeRuns.get(runId);
    if (!run) return;

    run.status = 'completed';
    run.completed = new Date();
    run.result = result;

    // Send RUN_FINISHED event
    this.sendEvent(sessionId, this.eventTypes.RUN_FINISHED, {
      runId,
      result,
      duration: run.completed - run.started,
      timestamp: run.completed
    });

    console.log(`[AG-UI-PROTOCOL] Run ${runId} completed for session ${sessionId}`);
    
    this.emit('run_completed', run);
  }

  /**
   * Fail agent run
   */
  failRun(sessionId, runId, error) {
    const run = this.activeRuns.get(runId);
    if (!run) return;

    run.status = 'failed';
    run.completed = new Date();
    run.error = error;

    // Send RUN_FAILED event
    this.sendEvent(sessionId, this.eventTypes.RUN_FAILED, {
      runId,
      error: error.message || error,
      timestamp: run.completed
    });

    console.log(`[AG-UI-PROTOCOL] Run ${runId} failed for session ${sessionId}:`, error);
    
    this.emit('run_failed', run);
  }

  /**
   * Send event to client via WebSocket or queue for later
   */
  sendEvent(sessionId, eventType, eventData) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const event = {
      type: eventType,
      data: eventData,
      sessionId,
      timestamp: new Date(),
      protocol: 'AG-UI/1.0'
    };

    // Add to session event history
    session.eventHistory.push(event);
    
    // Keep only last 100 events per session
    if (session.eventHistory.length > 100) {
      session.eventHistory = session.eventHistory.slice(-100);
    }

    // Send via WebSocket if available
    if (session.websocket && this.wsManager) {
      try {
        this.wsManager.sendToConnection(session.websocket, {
          type: 'ag_ui_event',
          event
        });
      } catch (error) {
        console.error(`[AG-UI-PROTOCOL] Failed to send event to session ${sessionId}:`, error);
        // Queue event for retry
        this.eventQueue.get(sessionId).push(event);
      }
    } else {
      // Queue event if no WebSocket available
      this.eventQueue.get(sessionId).push(event);
    }

    this.emit('event_sent', event);
  }

  /**
   * Handle user input from frontend
   */
  handleUserInput(sessionId, inputData) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const inputEvent = {
      type: this.eventTypes.USER_INPUT,
      data: inputData,
      sessionId,
      timestamp: new Date()
    };

    session.eventHistory.push(inputEvent);
    session.lastActivity = new Date();

    console.log(`[AG-UI-PROTOCOL] User input received for session ${sessionId}`);
    
    this.emit('user_input', inputEvent);
    return inputEvent;
  }

  /**
   * Get session event history
   */
  getSessionEvents(sessionId, limit = 50) {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    return session.eventHistory.slice(-limit);
  }

  /**
   * Get comprehensive AG-UI system metrics
   */
  getSystemMetrics() {
    const activeSessions = Array.from(this.sessions.values()).filter(s => s.status === 'active');
    const activeRuns = Array.from(this.activeRuns.values()).filter(r => r.status === 'running');

    return {
      sessions: {
        total: this.sessions.size,
        active: activeSessions.length
      },
      runs: {
        total: this.activeRuns.size,
        active: activeRuns.length,
        completed: Array.from(this.activeRuns.values()).filter(r => r.status === 'completed').length,
        failed: Array.from(this.activeRuns.values()).filter(r => r.status === 'failed').length
      },
      events: {
        totalQueued: Array.from(this.eventQueue.values()).reduce((sum, queue) => sum + queue.length, 0),
        totalSent: this.listenerCount('event_sent')
      },
      protocol: {
        version: this.protocolVersion,
        supportedEvents: Object.keys(this.eventTypes).length
      }
    };
  }

  /**
   * Clean up inactive sessions and completed runs
   */
  cleanup() {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    // Clean up inactive sessions
    for (const [sessionId, session] of this.sessions) {
      if ((now - session.lastActivity) > maxAge) {
        this.sessions.delete(sessionId);
        this.eventQueue.delete(sessionId);
        console.log(`[AG-UI-PROTOCOL] Cleaned up inactive session ${sessionId}`);
      }
    }

    // Clean up old completed runs
    for (const [runId, run] of this.activeRuns) {
      if (run.status !== 'running' && run.completed && (now - run.completed) > maxAge) {
        this.activeRuns.delete(runId);
        console.log(`[AG-UI-PROTOCOL] Cleaned up completed run ${runId}`);
      }
    }
  }
}

module.exports = { AGUIProtocol };