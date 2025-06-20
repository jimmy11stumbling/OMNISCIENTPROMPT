/**
 * DeepSeek AI Platform - Main Application Entry Point
 * Production-ready modular application with comprehensive features
 */

const express = require('express');
const path = require('path');
const http = require('http');
const config = require('./config/environment');
const database = require('./database');

// Import middleware
const { requestLogger, errorLogger, performanceMonitor } = require('./middlewares/logging');
const { securityHeaders, contentSecurityPolicy, sanitizeInput, xssProtection, sqlInjectionProtection } = require('./middlewares/security');

// Import services
const { webSocketService } = require('./services/websocketService');

// Import routes
const apiRoutes = require('./routes/apiRoutes');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Apply security middleware first
app.use(securityHeaders);
app.use(contentSecurityPolicy);
app.use(sanitizeInput);
app.use(xssProtection);
app.use(sqlInjectionProtection);

// Request parsing and logging
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);
app.use(performanceMonitor);

// Static file serving
app.use(express.static('public'));

// Handle JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  next();
});

// API routes
app.use('/api', apiRoutes);

// Serve main application page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.NODE_ENV
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handling
app.use(errorLogger);

// Initialize WebSocket service
webSocketService.initialize(server);

// Graceful shutdown
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

function gracefulShutdown() {
  console.log('Shutting down gracefully...');
  
  server.close(() => {
    console.log('HTTP server closed');
    
    webSocketService.shutdown();
    
    if (database.db) {
      database.db.close();
      console.log('Database connection closed');
    }
    
    process.exit(0);
  });
  
  // Force exit after 10 seconds
  setTimeout(() => {
    console.log('Force exit');
    process.exit(1);
  }, 10000);
}

// Start server
const PORT = config.PORT;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ DeepSeek AI Platform running on port ${PORT}`);
  console.log(`🔑 API Key configured: ${config.DEEPSEEK_API_KEY ? 'Yes' : 'No (Demo mode)'}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
  console.log(`🔄 WebSocket server running at ws://localhost:${PORT}${config.WEBSOCKET.path}`);
  console.log(`📊 Real-time features: ${config.FEATURES.enableRealTimeValidation ? 'ACTIVE' : 'DISABLED'}`);
  console.log(`🤖 RAG System: ${config.FEATURES.enableAdvancedRAG ? 'ENABLED' : 'DISABLED'}`);
  console.log(`🔗 A2A Protocol: ${config.FEATURES.enableA2AProtocol ? 'READY' : 'DISABLED'}`);
  console.log(`🌉 MCP Integration: ${config.FEATURES.enableMCPIntegration ? 'ACTIVE' : 'DISABLED'}`);
});

module.exports = app;