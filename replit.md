# DeepSeek AI Platform

## Overview

This is a comprehensive AI-powered prompt generation platform that leverages DeepSeek's reasoning capabilities to create optimized prompts for various development platforms. The application features a sophisticated RAG (Retrieval-Augmented Generation) system, real-time WebSocket communication, and a full-stack architecture with user authentication and analytics.

## System Architecture

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: SQLite with better-sqlite3 for local development, PostgreSQL support via Drizzle ORM for production
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Real-time Communication**: WebSocket server for live updates and notifications
- **File Storage**: Multer for file uploads with local storage

### Frontend Architecture
- **UI Framework**: Vanilla JavaScript with Tailwind CSS for styling
- **Real-time Updates**: WebSocket client for live data synchronization
- **Progressive Enhancement**: Chart.js for analytics visualization
- **Responsive Design**: Mobile-first approach with adaptive layouts

### AI Integration
- **Primary AI Service**: DeepSeek API integration with fallback to demo mode
- **RAG System**: Comprehensive document retrieval with semantic search
- **Multi-Platform Support**: Specialized knowledge bases for Replit, Lovable, Cursor, Bolt, and Windsurf

## Key Components

### Services Layer
1. **DeepSeek Service** (`services/deepseekService.js`)
   - AI prompt generation with advanced reasoning
   - Error handling and fallback mechanisms
   - Usage tracking and metrics

2. **RAG Service** (`services/ragService.js`)
   - Document retrieval and semantic search
   - Multi-platform knowledge integration
   - Caching and performance optimization

3. **WebSocket Service** (`services/websocketService.js`)
   - Real-time communication management
   - Connection pooling and heartbeat monitoring
   - Message broadcasting and channel management

### Data Storage
1. **SQLite Database** (`database.js`)
   - User management and authentication
   - Prompt history and analytics
   - RAG document storage
   - API usage logging

2. **Drizzle ORM Schema** (`shared/schema.ts`)
   - Type-safe database operations
   - Automated migrations
   - Relationship management

### Authentication & Security
- JWT token-based authentication
- Password hashing with bcrypt
- Rate limiting middleware
- Input sanitization and XSS protection
- SQL injection prevention

## Data Flow

1. **User Request**: Client submits prompt generation request
2. **Authentication**: JWT token validation and user authorization
3. **RAG Retrieval**: Semantic search across platform documentation
4. **AI Processing**: DeepSeek API call with retrieved context
5. **Response Generation**: Structured prompt with reasoning and metadata
6. **Real-time Updates**: WebSocket broadcast of generation progress
7. **Storage**: Persistent storage of generated prompts and analytics

## External Dependencies

### Core Dependencies
- `express`: Web application framework
- `better-sqlite3`: SQLite database interface
- `ws`: WebSocket implementation
- `jsonwebtoken`: JWT authentication
- `bcryptjs`: Password hashing
- `multer`: File upload handling

### AI & Data Processing
- `drizzle-orm`: Type-safe ORM
- `nodemailer`: Email notifications
- Custom RAG implementation with in-memory document storage

### Frontend Libraries
- `tailwindcss`: Utility-first CSS framework
- `chart.js`: Data visualization
- Custom WebSocket client for real-time features

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 18+
- **Database**: SQLite for local development
- **Port**: 5000 (configurable via environment)
- **Hot Reload**: Manual restart via npm scripts

### Production Configuration
- **Container**: Docker with multi-stage build
- **Health Checks**: Built-in health monitoring endpoints
- **Scaling**: Horizontal scaling support with session management
- **Security**: Non-root user execution and security headers
- **Database**: PostgreSQL with connection pooling

### Replit Deployment
- **Modules**: nodejs-20, web, postgresql-16
- **Autoscale**: Configured for dynamic scaling
- **Build Process**: npm run build → npm run start
- **Port Mapping**: Internal 5000 → External 80

## Changelog

```
Changelog:
- June 25, 2025 - Fixed critical AI service timeout issues
  - Resolved malformed JavaScript syntax causing server crashes
  - Fixed unhandled promise rejections and async/await errors
  - Implemented reliable prompt generation with immediate responses
  - Restored RAG system functionality and document search
  - Eliminated hanging endpoints and timeout problems
  - Created clean working server to restore AI services
  - Fixed all syntax errors preventing server startup
  - AI prompt generation now working with proper responses
  - Verified AI endpoint functionality with comprehensive prompt generation
  - DeepSeek AI Platform successfully generating platform-specific blueprints
- June 25, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```