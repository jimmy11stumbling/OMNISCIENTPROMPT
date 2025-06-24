# DeepSeek AI Platform - Replit Development Guide

## Overview

This is a comprehensive AI-powered prompt generation platform built specifically for development environments. The application combines DeepSeek AI reasoning capabilities with a sophisticated RAG (Retrieval-Augmented Generation) system to create optimized, platform-specific prompts for various development platforms including Replit, Lovable, Cursor, Windsurf, and Bolt.

## System Architecture

### Backend Architecture
- **Framework**: Node.js with Express.js
- **Database**: SQLite with better-sqlite3 (configured for PostgreSQL migration)
- **AI Integration**: DeepSeek API with fallback demo responses
- **Real-time Communication**: WebSocket server for live updates
- **Authentication**: JWT-based with bcrypt password hashing

### Frontend Architecture
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Vanilla JavaScript with real-time WebSocket integration
- **Progress Indicators**: Custom animated progress bars for AI processing
- **Responsive Design**: Mobile-first approach with dark theme

### Data Storage Solutions
- **Primary Database**: SQLite (better-sqlite3) with migration path to PostgreSQL
- **In-Memory Caching**: RAG document caching system
- **File Storage**: Local uploads directory for document management
- **Session Management**: JWT tokens with optional database sessions

## Key Components

### 1. DeepSeek AI Service (`services/deepseekService.js`)
- Handles AI prompt generation with reasoning capabilities
- Implements fallback demo responses when API is unavailable
- Manages token usage tracking and response time metrics
- Supports multiple model configurations

### 2. RAG System (`services/ragService.js`, `unified-rag-system.js`)
- Comprehensive knowledge base for 5+ development platforms
- Semantic search across platform documentation
- Smart document caching and synchronization
- Multi-source document retrieval (in-memory + database)

### 3. Database Layer (`database.js`)
- SQLite implementation with foreign key constraints
- Comprehensive user management with roles and API quotas
- Document storage for RAG system
- Usage analytics and logging tables

### 4. WebSocket Service (`services/websocketService.js`)
- Real-time communication for progress updates
- Connection management with heartbeat monitoring
- Channel-based messaging system
- Metrics tracking for active connections

### 5. Authentication System (`middlewares/authentication.js`)
- JWT token generation and validation
- Password strength requirements with bcrypt
- Role-based access control (user/admin)
- API key management for external access

### 6. Rate Limiting (`middlewares/rateLimiting.js`)
- Endpoint-specific rate limits
- Memory-based rate limit store with cleanup
- Different limits for auth, prompts, and chat endpoints

## Data Flow

1. **Prompt Generation Flow**:
   - User submits query and platform selection
   - RAG system searches relevant documentation
   - DeepSeek AI processes query with context
   - Response includes optimized prompt, reasoning, and metrics
   - Results cached and optionally saved to database

2. **RAG Search Flow**:
   - Query processed through semantic search
   - Multiple document sources (in-memory + database) searched
   - Results ranked by relevance score
   - Context snippets generated for AI consumption

3. **Real-time Updates**:
   - WebSocket connections established on page load
   - Progress updates sent during AI processing
   - System metrics broadcast to connected clients
   - Admin notifications for system events

## External Dependencies

### Core Dependencies
- **express**: Web framework
- **better-sqlite3**: Database ORM
- **bcryptjs**: Password hashing
- **jsonwebtoken**: Authentication tokens
- **ws**: WebSocket server
- **multer**: File upload handling
- **nodemailer**: Email services

### Development Dependencies
- **tailwindcss**: CSS framework
- **autoprefixer**: CSS processing
- **chart.js**: Analytics visualization

### Optional Integrations
- **DeepSeek API**: AI reasoning service
- **PostgreSQL**: Database upgrade path
- **Email Services**: User verification and notifications

## Deployment Strategy

### Replit Deployment
- **Primary Entry**: `deepseek-app.js`
- **Development**: `npm run dev` (uses deepseek-app.js)
- **Production**: `npm run start`
- **Port Configuration**: 5000 (mapped to external port 80)
- **Autoscale**: Configured for production deployment

### Docker Support
- Multi-stage build optimization
- Non-root user security
- Health check endpoints
- Memory optimization (512MB max)

### Environment Configuration
- Development/Production environment detection
- Feature flags for optional services
- Database connection management
- API key configuration

## Changelog
- June 24, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.