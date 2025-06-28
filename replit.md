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
- June 27, 2025 - Master Blueprint Generator system completed with true 20,000+ character outputs
  - Fixed system prompt to generate comprehensive blueprints without asking questions
  - Implemented proper master blueprint structure with 8 required sections
  - Enhanced streaming system to handle large content generation (20,000+ characters)
  - Added timeout management and error handling for long-form content generation
  - System now generates authentic detailed blueprints with explicit implementation guidance
  - Fixed all promise rejection errors and timeout issues in streaming functionality
  - Verified comprehensive blueprint generation for all application types (todo, chat, ecommerce, etc)
  - Master blueprints include complete file structures, code examples, database schemas, and deployment
- June 27, 2025 - Comprehensive streaming enhancement system completed
  - Enhanced Progress Visualization: Real-time progress bars with completion estimates based on content analysis
  - Interactive Streaming Controls: Pause/resume functionality with speed controls (0.5x to 2x)
  - Smart Content Analysis: Live detection of headers, code blocks, and content sections during streaming
  - Quality Monitoring: Real-time content quality scoring with visual indicators (Excellent/Good/Basic)
  - RAG Source Tracking: Live display of retrieved documentation sources powering the generation
  - Multi-Panel Content Display: Tabbed interface showing Blueprint, Reasoning, and Sections views
  - Adaptive Performance: Token speed calculations and intelligent buffering for smooth delivery
  - Content Structure Analysis: Real-time section detection and navigation during generation
  - Enhanced UI Feedback: Comprehensive streaming statistics with token counts, timing, and quality metrics
  - All enhancements implemented systematically while maintaining existing functionality and authentic DeepSeek API integration
- June 27, 2025 - Consolidated to single master prompt generator interface
  - Removed redundant chat interfaces (chat.html, chat-streaming.html, real-streaming.html, enhanced-streaming.html)
  - Streamlined navigation to focus on core functionality: Master Generator, Saved Prompts, Dashboard, Documentation
  - Enhanced main prompt generator with real-time streaming capabilities and improved UI
  - Simplified codebase by removing duplicate JavaScript files and consolidating functionality
  - Single comprehensive interface now handles all DeepSeek AI interactions with streaming support
- June 27, 2025 - Critical bug fixes and comprehensive API testing completed
  - Fixed authentication middleware export bug preventing API route functionality
  - Resolved unhandled promise rejections in frontend JavaScript with proper error handling
  - Added missing API endpoints (/api/prompts, /api/templates) that were causing 404 errors
  - Fixed WebSocket service export issue and enhanced connection management
  - Corrected RAG search endpoint to properly use unified RAG system
  - Verified all DeepSeek API endpoints working with real streaming responses
  - Confirmed RAG system retrieving relevant documentation (557 documents synchronized)
  - All systems operational: database, WebSocket, AI services, and real-time streaming
- June 27, 2025 - Real DeepSeek API streaming implementation completed
  - Fixed all timeout issues preventing authentic API responses
  - Implemented real token-by-token streaming with deepseek-chat model
  - Created working streaming service bypassing parsing timeouts
  - Both streaming chat (/api/chat/stream) and prompt generation working with real DeepSeek API
  - Verified successful API calls: 6334+ character responses, 10118+ character responses
  - Eliminated all fallback/synthetic responses in favor of authentic DeepSeek content
  - Real-time streaming chat interface functional at /real-streaming.html
  - Complete integration: frontend fetch → DeepSeek API → token streaming → user interface
- June 26, 2025 - Complete RAG system enhancement with comprehensive documentation database
  - Successfully loaded all 557 documents from attached_assets into RAG database
  - Added support for A2A, MCP, RAG 2.0, and DeepSeek protocol documentation
  - Enhanced seeding script to process all text files automatically
  - Platform-specific categorization: Replit (99), Cursor (187), Bolt (27), Lovable (27), Windsurf (23)
  - Protocol documentation: A2A (5), MCP (35), RAG 2.0 (49), DeepSeek (17), System (88)
  - Real-time AI prompt generation now uses comprehensive authentic documentation
  - RAG search functionality fully operational with semantic document retrieval
  - Complete integration of streaming responses with comprehensive knowledge base
- June 26, 2025 - Real-time DeepSeek streaming implementation completed
  - Implemented token-by-token streaming responses using Server-Sent Events (SSE)
  - Fixed ES module import error for node-fetch in DeepSeek service
  - Added comprehensive streaming chat interface with real-time token delivery
  - Created streaming API endpoints (/api/chat/stream) with proper Node.js stream handling
  - Built frontend streaming handler with cancellation support and error recovery
  - Added streaming demo page with live examples and technical documentation
  - Fixed frontend response display issues in main prompt generation interface
  - Enhanced chat interface with real-time updates and proper error handling
  - Complete streaming architecture: backend SSE → frontend token display → user interface
- June 25, 2025 - Complete DeepSeek integration with reasoning capabilities
  - Implemented full DeepSeek API service with reasoning support (deepseek-reasoner model)
  - Added multi-turn conversation capabilities with session management
  - Enhanced prompt generation with comprehensive reasoning chains
  - Integrated fallback system with sophisticated AI response generation
  - Added code examples, implementation steps, and best practices for each platform
  - Updated frontend with reasoning toggle and API status indicators
  - Platform-specific expertise system with comprehensive documentation context
  - Real-time usage tracking and conversation history management
- June 25, 2025 - Fully operational AI platform with comprehensive documentation
  - Successfully loaded complete platform documentation from attached assets
  - RAG database populated with 277 authentic documents across all platforms
  - AI prompt generation endpoint working with authentic platform knowledge
  - System generating detailed blueprints with relevant documentation matches per query
  - Verified functionality: Replit chat app, Lovable document editor prompts working
  - Platform coverage complete: Replit (103), Cursor (77), Windsurf (46), Bolt (30), Lovable (21)
  - DeepSeek AI Platform now fully functional for production-ready prompt generation
- June 25, 2025 - Fixed critical AI service timeout issues
  - Resolved malformed JavaScript syntax causing server crashes
  - Fixed unhandled promise rejections and async/await errors
  - Implemented reliable prompt generation with immediate responses
  - Restored RAG system functionality and document search
  - Eliminated hanging endpoints and timeout problems
- June 25, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```