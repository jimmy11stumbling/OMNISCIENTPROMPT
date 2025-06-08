// RAG 2.0 Database System for Platform Documentation Retrieval - Updated with Comprehensive No-Code Platform Data
const platformDocuments = {
  replit: [
    {
      id: 'repl_1',
      title: 'Replit Agent AI Development',
      content: 'Replit Agent is an AI system that builds full-stack applications from natural language prompts. It creates complete project structures, implements databases, handles authentication, and manages deployments. Agent can work with PostgreSQL, Redis, and various APIs while providing real-time collaboration features.',
      type: 'ai-agent',
      keywords: ['agent', 'ai', 'fullstack', 'prompt', 'natural-language'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'repl_2',
      title: 'Replit Database & Storage Systems',
      content: 'Replit provides comprehensive database solutions including PostgreSQL with automated backups, ReplDB for key-value storage, and Object Storage for file management. Environment variables are auto-configured. Supports schema design, migrations, and real-time data sync.',
      type: 'database',
      keywords: ['database', 'postgresql', 'repldb', 'storage', 'migrations'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'repl_3',
      title: 'Authentication & Security Systems',
      content: 'Replit Auth provides OAuth integration with GitHub, Google, email, and custom providers. Includes session management, user profiles, role-based access control, and security scanning. Supports JWT tokens and encrypted password storage.',
      type: 'authentication',
      keywords: ['auth', 'oauth', 'security', 'jwt', 'encryption'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'repl_4',
      title: 'Deployment & Hosting Options',
      content: 'Multiple deployment types: Autoscale (dynamic scaling, $1/month), Static (free for Core users), Reserved VM (always-on, $10/month), and Scheduled (cron jobs). Includes automatic SSL, custom domains, CDN, and global edge deployment.',
      type: 'deployment',
      keywords: ['deploy', 'autoscale', 'static', 'vm', 'ssl', 'cdn'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'repl_5',
      title: 'Mobile Development with Expo',
      content: 'Replit integrates with Expo for mobile app development. Zero-setup React Native environment with instant device preview via QR codes. Supports iOS/Android deployment through Expo Application Services (EAS) with automated certificate management.',
      type: 'mobile',
      keywords: ['expo', 'mobile', 'react-native', 'ios', 'android', 'eas'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'repl_6',
      title: 'Real-time Collaboration & Version Control',
      content: 'Multiplayer coding with live cursors, voice/video chat, shared terminals, and real-time file editing. Integrated Git support with GitHub sync, branch management, and automated checkpoints for rollback functionality.',
      type: 'collaboration',
      keywords: ['multiplayer', 'realtime', 'git', 'github', 'version-control'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'repl_7',
      title: 'API Integrations & Third-party Services',
      content: 'Seamless integration with external APIs and services. Replit Agent automatically handles API authentication, environment variables, and service configuration. Supports REST, GraphQL, WebSocket, and gRPC protocols.',
      type: 'integrations',
      keywords: ['api', 'rest', 'graphql', 'websocket', 'grpc', 'integrations'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'repl_8',
      title: 'Prompt Engineering Best Practices',
      content: 'Effective Replit Agent prompting follows ISSS principles: Instruct (clear goals), Select (focused context), Show (concrete examples), Simplify (clear communication), Specify (exact requirements). Break complex tasks into sequential steps and use iterative refinement.',
      type: 'prompting',
      keywords: ['prompting', 'isss', 'best-practices', 'iterative', 'examples'],
      lastUpdated: '2025-06-08'
    }
  ],
  
  lovable: [
    {
      id: 'lov_1',
      title: 'Lovable 2.0 AI Fullstack Engineer',
      content: 'Lovable 2.0 positions itself as an "AI Fullstack Engineer" enabling production-ready application development through conversational AI. Features "vibe coding" philosophy where users describe requirements in natural language and AI generates complete React/Tailwind/Vite frontend with Supabase backend integration.',
      type: 'ai-fullstack',
      keywords: ['ai-engineer', 'vibe-coding', 'react', 'tailwind', 'supabase', 'production'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'lov_2',
      title: 'Multiplayer Collaboration & Teams',
      content: 'Real-time co-editing with shared team workspaces. Pro plan supports 2 collaborators per project, Teams plan supports up to 20 users per workspace with shared credits, role management, and centralized billing. Uses WebSocket technology for live collaboration.',
      type: 'collaboration',
      keywords: ['multiplayer', 'teams', 'real-time', 'websocket', 'shared-credits'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'lov_3',
      title: 'Agentic Chat Mode & Dev Mode',
      content: 'Intelligent chat agent for planning, debugging, and understanding applications without direct code modification. Dev Mode allows direct editing of underlying project code. Multi-step reasoning with file search, log inspection, and database queries using LLM with RAG capabilities.',
      type: 'development-modes',
      keywords: ['agentic-chat', 'dev-mode', 'debugging', 'multi-step', 'rag'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'lov_4',
      title: 'Visual Edits & Security Scanning',
      content: 'Visual modification of application styling similar to Figma/Webflow with improved CSS generation. Automatic security scanning for vulnerabilities, especially in Supabase-connected projects. Detects missing RLS, exposed data, and common security issues.',
      type: 'visual-security',
      keywords: ['visual-edits', 'security-scan', 'css', 'rls', 'vulnerabilities'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'lov_5',
      title: 'Custom Domains & Publishing',
      content: 'Built-in custom domain functionality with native Entri support and configuration for Netlify, Vercel, Namecheap. Over 10,000 custom domains connected pre-2.0 launch. DNS automation and one-click publishing with preview links.',
      type: 'publishing',
      keywords: ['custom-domains', 'entri', 'netlify', 'vercel', 'dns', 'publishing'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'lov_6',
      title: 'Credit System & Pricing Tiers',
      content: 'Credit-based pricing: Free (30 credits/month), Pro ($25-30, 100 credits), Teams ($30, shared pool), Enterprise (custom). 1 credit per AI message regardless of length. Manual style tweaks consume no credits. Credits do not roll over monthly.',
      type: 'pricing',
      keywords: ['credits', 'pricing', 'free', 'pro', 'teams', 'enterprise'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'lov_7',
      title: 'Native Integrations & Ecosystem',
      content: 'Deep integrations: GitHub (real-time two-way sync), Supabase (full backend), Stripe (payments), Replicate (AI media), Builder.io (Figma import), Resend (email). Supports any external API with guided integration through Agentic Chat Mode.',
      type: 'integrations',
      keywords: ['github', 'supabase', 'stripe', 'replicate', 'figma', 'api-integration'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'lov_8',
      title: 'Advanced Features & AI Models',
      content: 'Uses Anthropic Claude Sonnet 3.7 for code generation. Features responsive design generation, image/sketch to code conversion, knowledge base for project specs, SEO tools, versioning 2.0 with bookmarking, and enhanced history management.',
      type: 'advanced-features',
      keywords: ['claude-sonnet', 'responsive', 'image-to-code', 'seo', 'versioning'],
      lastUpdated: '2025-06-08'
    }
  ],
  
  bolt: [
    {
      id: 'bolt_1',
      title: 'Bolt.new AI Web Development Agent',
      content: 'Bolt.new is an AI web development agent built on StackBlitz WebContainer technology. Uses prompt-based generation where users provide natural language prompts to generate full-stack applications. AI has control over filesystem, Node.js server, package manager, terminal, and browser console.',
      type: 'ai-agent',
      keywords: ['ai-agent', 'webcontainer', 'prompt-based', 'filesystem', 'nodejs'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'bolt_2',
      title: 'Browser-Based IDE & Development Environment',
      content: 'Complete development environment in browser with code editor featuring syntax highlighting, auto-completion, real-time error checking, multi-cursor support, and live preview. Integrated terminal for commands, npm management, and server logs.',
      type: 'ide',
      keywords: ['browser-ide', 'code-editor', 'terminal', 'live-preview', 'syntax-highlighting'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'bolt_3',
      title: 'Project Management & Version Control',
      content: 'Rollback functionality to previous states via chat history. Backup system with timestamped backups creating new chat forks. File locking to prevent AI changes and targeting files for focused modifications. Integrated Git workflows.',
      type: 'version-control',
      keywords: ['rollback', 'backups', 'file-locking', 'git', 'chat-history'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'bolt_4',
      title: 'One-Click Deployment & Integrations',
      content: 'Integrated deployment to Netlify with one-click build and deploy. Provides live project URL and Netlify claim link. Additional integrations: Supabase (BaaS), Expo (mobile), GitHub (repositories), Stripe (payments), Figma via Anima (design-to-code).',
      type: 'deployment-integrations',
      keywords: ['netlify', 'one-click', 'supabase', 'expo', 'github', 'stripe', 'figma'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'bolt_5',
      title: 'Discussion Mode with Gemini 2.0',
      content: 'Discussion Mode uses Gemini 2.0 Flash with search grounding for project insights, debugging assistance, and strategic guidance without code generation. Accesses Bolt documentation and real-time internet information. Context includes codebase and six recent messages.',
      type: 'discussion-mode',
      keywords: ['discussion-mode', 'gemini-2.0', 'debugging', 'search-grounding', 'project-insights'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'bolt_6',
      title: 'Enhanced Prompt Features & AI Control',
      content: 'Enhanced prompt feature with icon-indicated structured input. Well-detailed free-form prompts also effective. AI actively monitors for errors and suggests/implements automated fixes. Core interaction through natural language prompts with varying specificity levels.',
      type: 'prompting',
      keywords: ['enhanced-prompts', 'structured-input', 'error-monitoring', 'automated-fixes'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'bolt_7',
      title: 'Pricing & Token-Based System',
      content: 'Freemium model with token-based AI interactions. Free plan includes StackBlitz IDE, unlimited public projects, 1MB file uploads, daily token limit. Pro ($18-20/month): 10M tokens, unlimited uploads. Teams ($55-60/month): collaboration features. Enterprise: custom pricing.',
      type: 'pricing',
      keywords: ['freemium', 'tokens', 'free-plan', 'pro-plan', 'teams', 'enterprise'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'bolt_8',
      title: 'LLM Models & AI Architecture',
      content: 'Primarily uses Anthropic Claude series (Claude 3.7 Sonnet) for main code generation. Discussion Mode utilizes Gemini 2.0 Flash. Built on StackBlitz WebContainer for browser-based Node.js execution with full development environment capabilities.',
      type: 'ai-models',
      keywords: ['claude-sonnet', 'gemini-2.0', 'webcontainer', 'nodejs', 'browser-execution'],
      lastUpdated: '2025-06-08'
    }
  ],
  
  cursor: [
    {
      id: 'cur_1',
      title: 'Cursor AI-First IDE & VSCode Fork',
      content: 'Cursor is an AI-first IDE built as a VSCode fork, providing intelligent code completion with deep codebase understanding. Features Tab (autocomplete), Composer (multi-file editing), Chat (codebase Q&A), and Inline AI for targeted modifications. Uses custom and frontier models from OpenAI, Anthropic, Google, and xAI.',
      type: 'ai-ide',
      keywords: ['ai-first', 'vscode-fork', 'tab', 'composer', 'chat', 'inline-ai'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'cur_2',
      title: 'Codebase Indexing & Context Management',
      content: 'Computes embeddings for each file in codebase using custom retrieval models. Automatic indexing with .gitignore/.cursorignore support. @-symbols for precise context control: @files, @folders, @Docs, @Web, @git, @Recent Changes. Supports full codebase context inclusion.',
      type: 'context-management',
      keywords: ['codebase-indexing', 'embeddings', 'retrieval-models', '@-symbols', 'context-control'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'cur_3',
      title: 'Advanced AI Features & Models',
      content: 'Tab autocomplete with custom models, Composer for multi-file edits, Chat with codebase Q&A, Inline AI (Cmd+I) for targeted changes. Supports GPT-4o, Claude 3.5 Sonnet, Gemini 2.5 Pro, Grok models, and DeepSeek. Features Auto-select for optimal model choice and Max Mode for enhanced reasoning.',
      type: 'ai-features',
      keywords: ['tab-autocomplete', 'composer', 'multi-file', 'gpt-4o', 'claude', 'gemini', 'grok', 'deepseek'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'cur_4',
      title: 'Smart Code Enhancement & Debugging',
      content: 'Multi-line edits, smart rewrites for code optimization, cursor prediction for navigation, automatic error correction with lint fixes, quick questions on selected code, AI commit messages, documentation generation, and refactoring assistance across multiple files.',
      type: 'code-enhancement',
      keywords: ['multi-line-edits', 'smart-rewrites', 'error-correction', 'refactoring', 'documentation'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'cur_5',
      title: 'Customization & Rules System',
      content: '.cursorrules files for project-specific AI instructions and global "Rules for AI" settings. Supports coding standards, framework preferences, style guidelines, and naming patterns. Privacy mode for sensitive projects with local-only processing and SOC 2 compliance.',
      type: 'customization',
      keywords: ['cursorrules', 'project-specific', 'global-rules', 'privacy-mode', 'soc2'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'cur_6',
      title: 'Enterprise & Subscription Tiers',
      content: 'Free tier with basic features and usage limits. Pro ($20/month): unlimited usage, GPT-4, Claude, premium features. Business ($40/user/month): admin controls, centralized billing, audit logs. Enterprise: custom pricing, self-hosting, enhanced security, dedicated support.',
      type: 'pricing-enterprise',
      keywords: ['free-tier', 'pro', 'business', 'enterprise', 'admin-controls', 'self-hosting'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'cur_7',
      title: 'Technical Architecture & Privacy',
      content: 'Built on VSCode foundation with regular rebasing. Cloud-based AI processing with privacy mode for sensitive data. Codebase indexing using embeddings and AST parsing with tree-sitter. Supports Windows, macOS, Linux with 4GB+ RAM recommended.',
      type: 'technical-architecture',
      keywords: ['vscode-foundation', 'cloud-processing', 'embeddings', 'ast-parsing', 'cross-platform'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'cur_8',
      title: 'Integration & Extension Ecosystem',
      content: 'Supports most VSCode extensions with compatibility considerations. Integrated terminal, Git support, debugging tools, and language servers. Extension marketplace access with AI-enhanced functionality where applicable.',
      type: 'integrations',
      keywords: ['vscode-extensions', 'terminal', 'git', 'debugging', 'language-servers'],
      lastUpdated: '2025-06-08'
    }
  ],

  // Advanced AI Protocols & Technologies
  'advanced-ai': [
    {
      id: 'ai_1',
      title: 'RAG 2.0 Advanced Retrieval Systems',
      content: 'RAG 2.0 represents the evolution beyond naive RAG implementations, incorporating sophisticated multi-stage pipelines with pre-retrieval optimization, hybrid search combining dense vector and sparse keyword retrieval, re-ranking mechanisms using cross-encoders, contextual compression, and advanced chunking strategies. Key techniques include HyDE (Hypothetical Document Embeddings), RAG-Fusion for multi-query generation, Self-RAG for self-reflection, Corrective RAG (CRAG) for quality assessment, and Maximum Marginal Relevance (MMR) for diversity promotion.',
      type: 'rag-protocol',
      keywords: ['rag-2.0', 'hybrid-search', 're-ranking', 'hyde', 'rag-fusion', 'self-rag', 'crag', 'vector-search', 'contextual-compression'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'ai_2',
      title: 'RAG 2.0 Implementation Pipeline',
      content: 'Advanced RAG workflow includes: Ingestion phase (content preprocessing, optimized chunking with overlapping and hierarchical strategies, metadata enrichment with hypothetical questions), Retrieval phase (query transformation, hybrid search with BM25+vector, metadata filtering), Post-retrieval processing (re-ranking with cross-encoders, filtering/compression, Corrective RAG evaluation), Generation phase (contextual fusion, prompt construction, Chain-of-Thought reasoning), and Post-generation (fact checking, citation generation, evaluation with RAGAS/ARES/RAGBench).',
      type: 'rag-implementation',
      keywords: ['rag-pipeline', 'chunking', 'bm25', 'cross-encoders', 'chain-of-thought', 'ragas', 'fact-checking', 'citations'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'ai_3',
      title: 'Model Context Protocol (MCP) Architecture',
      content: 'MCP is an open standard protocol for connecting AI models to external systems using a client-server architecture. Core components include MCP Host (AI application), MCP Client (connector library), and MCP Server (gateway to external systems). Built on JSON-RPC 2.0 foundation with stateful connections. Supports multiple transport mechanisms: stdio for local communication and Server-Sent Events (SSE) for remote connections with HTTPS/OAuth security.',
      type: 'mcp-protocol',
      keywords: ['mcp', 'model-context-protocol', 'json-rpc', 'client-server', 'stdio', 'sse', 'oauth', 'stateful'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'ai_4',
      title: 'MCP Core Primitives and Capabilities',
      content: 'MCP defines four core primitives: Tools (executable functions with side effects, analogous to POST requests), Resources (contextual read-only data identified by URIs, analogous to GET requests), Prompts (reusable templates and workflows for user/LLM interactions), and Sampling (client capability allowing servers to request LLM text generation). Features capability negotiation during initialization, user consent controls, and standardized security principles including data privacy and tool safety.',
      type: 'mcp-primitives',
      keywords: ['mcp-tools', 'mcp-resources', 'mcp-prompts', 'sampling', 'capability-negotiation', 'user-consent', 'security'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'ai_5',
      title: 'Agent-to-Agent (A2A) Communication Protocols',
      content: 'A2A protocols enable autonomous software agents to interact in multi-agent systems through standardized Agent Communication Languages (ACLs). Built on speech act theory with performatives (inform, request, query-if, propose, agree, refuse) that indicate communicative intent. Message structure includes sender/receiver agent identifiers, content in specified languages, conversation management with protocol/conversation-id tracking, and facilitator agents for message routing and matchmaking.',
      type: 'a2a-protocol',
      keywords: ['a2a', 'agent-communication', 'speech-acts', 'performatives', 'multi-agent', 'facilitators', 'acl', 'conversation-management'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'ai_6',
      title: 'KQML and FIPA ACL Foundations',
      content: 'Knowledge Query and Manipulation Language (KQML) emerged from DARPA Knowledge Sharing Effort with extensible performatives (ask-if, tell, achieve, subscribe, advertise) and LISP-like syntax. FIPA ACL provides standardized IEEE specification with formal semantics, detailed message parameters (:performative, :sender, :receiver, :content, :language, :ontology, :protocol, :conversation-id), and interaction protocols for structured conversations including request, contract-net, and auction protocols.',
      type: 'acl-languages',
      keywords: ['kqml', 'fipa-acl', 'performatives', 'message-structure', 'interaction-protocols', 'ontology', 'ieee-standard'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'ai_7',
      title: 'AG-UI Real-Time Agent-User Interaction',
      content: 'AG-UI is an open-source, lightweight, event-based protocol for standardizing real-time interactions between AI agents and frontend applications. Uses Server-Sent Events (SSE) over HTTP with 16 standard event types: lifecycle events (RUN_STARTED, RUN_FINISHED, RUN_ERROR), text streaming (TEXT_MESSAGE_START, TEXT_MESSAGE_CONTENT, TEXT_MESSAGE_CHUNK, TEXT_MESSAGE_END), tool interactions (TOOL_CALL_START, TOOL_CALL_COMPLETE, TOOL_CALL_CHUNK), state management (STATE_SNAPSHOT, STATE_DELTA), and media streaming (MEDIA_FRAME).',
      type: 'ag-ui-protocol',
      keywords: ['ag-ui', 'agent-user-interaction', 'real-time', 'sse', 'event-driven', 'streaming', 'state-sync', 'lifecycle-events'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'ai_8',
      title: 'AG-UI Implementation and Frontend Integration',
      content: 'AG-UI backend implementation supports Python with FastAPI and TypeScript with Express.js using dedicated SDKs. Features EventEncoder for proper SSE formatting, StreamingResponse with text/event-stream media type, and optional binary serialization for 60% payload reduction. Frontend integration through CopilotKit React components (CopilotKitProvider, CopilotChat) with HttpAgent for API communication. Includes middleware layer for protocol translation and framework compatibility.',
      type: 'ag-ui-implementation',
      keywords: ['ag-ui-sdk', 'fastapi', 'express', 'event-encoder', 'copilotkit', 'react-components', 'binary-serialization', 'middleware'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'ai_9',
      title: 'DeepSeek Reasoning Model Integration',
      content: 'DeepSeek-reasoner is an advanced reasoning model that generates Chain of Thought (CoT) before delivering final answers. Features 64K context length with reasoning_content output separate from final content, multi-round conversation support with CoT exclusion from context to prevent contamination, enhanced accuracy through explicit reasoning processes, and transparent reasoning visibility. Supports chat completion with prefix completion beta, requires OpenAI SDK upgrade, and provides max_tokens control for final response (4K default, 8K max) while CoT can reach 32K tokens.',
      type: 'deepseek-model',
      keywords: ['deepseek-reasoner', 'chain-of-thought', 'reasoning', 'cot', 'context-length', 'transparency', 'openai-sdk', 'multi-round'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'ai_10',
      title: 'Multi-Protocol AI Architecture Design',
      content: 'Next-generation AI applications integrate multiple protocols for comprehensive functionality: AG-UI for frontend interaction and real-time streaming, MCP for external tool/data access and capability discovery, A2A for agent collaboration and coordination, and RAG 2.0 for advanced knowledge retrieval. Architecture patterns include event-driven communication, state synchronization across protocols, middleware layers for protocol translation, security boundaries with OAuth/authentication, scalable deployment with containerization and load balancing, and unified error handling across protocol boundaries.',
      type: 'multi-protocol-architecture',
      keywords: ['multi-protocol', 'event-driven', 'middleware', 'protocol-translation', 'oauth', 'containerization', 'load-balancing', 'unified-architecture'],
      lastUpdated: '2025-06-08'
    }
  ],
  
  windsurf: [
    {
      id: 'wind_1',
      title: 'Windsurf Agentic IDE & Cascade AI',
      content: 'Windsurf (formerly Codeium) is an agentic IDE with Cascade AI agent having full contextual codebase awareness. Features Write Mode (highly automated), Chat Mode (interactive guidance), and various specialized modes for different development tasks. Excellent for database development and schema design.',
      type: 'agentic-ide',
      keywords: ['agentic', 'cascade', 'write-mode', 'chat-mode', 'database', 'schema'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'wind_2',
      title: 'AI Features & Model Context Protocol',
      content: 'Inline AI for targeted code modifications (Cmd/Ctrl+I), Supercomplete for advanced autocompletion, AI Terminal for natural language commands. Model Context Protocol (MCP) enables connection to external tools including PostgreSQL, MongoDB, MySQL databases for direct operations.',
      type: 'ai-features',
      keywords: ['inline-ai', 'supercomplete', 'ai-terminal', 'mcp', 'postgresql', 'mongodb', 'mysql'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'wind_3',
      title: 'Database Development Capabilities',
      content: 'Specialized for database development with SQL DDL generation, ORM model creation (SQLAlchemy, Prisma, TypeORM), schema design assistance, migration scripts, and direct database operations through MCP servers. Supports context-aware database code generation.',
      type: 'database-development',
      keywords: ['sql-ddl', 'orm', 'sqlalchemy', 'prisma', 'typeorm', 'migrations', 'mcp-servers'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'wind_4',
      title: 'Context Management & Indexing',
      content: 'Local codebase indexing with deep contextual understanding. .windsurfrules files for custom AI behavior guidance and Memories system for persistent context. Respects .gitignore patterns and provides semantic code analysis.',
      type: 'context-management',
      keywords: ['local-indexing', 'windsurfrules', 'memories', 'semantic-analysis', 'gitignore'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'wind_5',
      title: 'VS Code Import & Setup',
      content: 'One-click import from VS Code or Cursor including settings, extensions, keybindings. Cross-platform support (Windows, macOS, Linux) with familiar interface. Easy onboarding flow with theme and keybinding customization.',
      type: 'setup-import',
      keywords: ['vscode-import', 'cursor-import', 'cross-platform', 'onboarding', 'customization'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'wind_6',
      title: 'Database Schema & ORM Generation',
      content: 'Generates SQL DDL for various databases, creates SQLAlchemy models with relationships, designs Prisma schemas with proper relations, and builds TypeORM entities. Supports best practices for normalization, naming conventions, and security guidelines.',
      type: 'schema-orm',
      keywords: ['sql-ddl', 'sqlalchemy-models', 'prisma-schemas', 'typeorm-entities', 'best-practices'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'wind_7',
      title: 'Advanced Database Operations',
      content: 'Direct database connectivity through MCP for PostgreSQL (Neon, Prisma), MongoDB, MySQL. Can perform schema manipulation, data querying, migration management using natural language prompts. Supports complex joins, indexing strategies, and performance optimization.',
      type: 'database-operations',
      keywords: ['mcp-connectivity', 'schema-manipulation', 'data-querying', 'migrations', 'performance'],
      lastUpdated: '2025-06-08'
    },
    {
      id: 'wind_8',
      title: 'Project Templates & Code Generation',
      content: 'New Project functionality generates project structures from natural language prompts. Can create Flask projects with SQLAlchemy, Django with PostgreSQL, Node.js with TypeORM, and other full-stack configurations with proper database integration.',
      type: 'project-generation',
      keywords: ['project-templates', 'flask', 'django', 'nodejs', 'full-stack', 'database-integration'],
      lastUpdated: '2025-06-08'
    }
  ]
};

class RAGDatabase {
  constructor(pool = null) {
    this.documents = platformDocuments;
    this.embeddings = new Map(); // In production, use vector database
    this.pool = pool; // PostgreSQL connection pool for database documents
  }

  // Enhanced semantic search combining in-memory and database documents
  searchDocuments(query, platform = null, limit = 5) {
    const searchTerms = query.toLowerCase().split(' ');
    const results = [];

    // Search in-memory platform documents
    const platforms = platform ? [platform] : Object.keys(this.documents);

    for (const platformName of platforms) {
      const docs = this.documents[platformName] || [];
      
      for (const doc of docs) {
        let score = 0;
        const searchableText = `${doc.title} ${doc.content} ${doc.keywords.join(' ')}`.toLowerCase();
        
        // Calculate relevance score
        for (const term of searchTerms) {
          if (searchableText.includes(term)) {
            // Boost score for title matches
            if (doc.title.toLowerCase().includes(term)) {
              score += 3;
            }
            // Boost score for keyword matches
            if (doc.keywords.some(kw => kw.toLowerCase().includes(term))) {
              score += 2;
            }
            // Standard content match - use simple string counting for safety
            const termOccurrences = searchableText.split(term).length - 1;
            score += termOccurrences;
          }
        }
        
        if (score > 0) {
          results.push({
            ...doc,
            platform: platformName,
            relevanceScore: score,
            snippet: this.generateSnippet(doc.content, searchTerms),
            source: 'platform-docs'
          });
        }
      }
    }

    // Search database documents synchronously if pool is available
    if (this.pool) {
      try {
        // Synchronous database search to include results immediately
        const dbResults = this.searchDatabaseDocumentsSync(query, platform, searchTerms, limit);
        results.push(...dbResults);
        console.log(`[RAG-DB] Found ${dbResults.length} additional documents in database`);
      } catch (error) {
        console.error('Database search error:', error);
      }
    }

    // Sort by relevance and return top results
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  // Generate contextual snippet for search results
  generateSnippet(content, searchTerms, maxLength = 200) {
    const words = content.split(' ');
    let bestStart = 0;
    let maxMatches = 0;

    // Find the section with most search term matches
    for (let i = 0; i < words.length - 20; i++) {
      const section = words.slice(i, i + 20).join(' ').toLowerCase();
      const matches = searchTerms.reduce((count, term) => {
        return count + (section.includes(term) ? 1 : 0);
      }, 0);
      
      if (matches > maxMatches) {
        maxMatches = matches;
        bestStart = i;
      }
    }

    let snippet = words.slice(bestStart, bestStart + 25).join(' ');
    if (snippet.length > maxLength) {
      snippet = snippet.substring(0, maxLength - 3) + '...';
    }
    
    return snippet;
  }

  // Get platform-specific documentation
  getPlatformDocs(platform) {
    return this.documents[platform] || [];
  }

  // Get documents by type across platforms
  getDocsByType(type, platform = null) {
    const results = [];
    const platforms = platform ? [platform] : Object.keys(this.documents);

    for (const platformName of platforms) {
      const docs = this.documents[platformName] || [];
      const typeDocs = docs.filter(doc => doc.type === type);
      results.push(...typeDocs.map(doc => ({ ...doc, platform: platformName })));
    }

    return results;
  }

  // Add new document to platform (for future extensibility)
  addDocument(platform, document) {
    if (!this.documents[platform]) {
      this.documents[platform] = [];
    }
    
    const newDoc = {
      id: `${platform}_${Date.now()}`,
      ...document,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    
    this.documents[platform].push(newDoc);
    return newDoc;
  }

  // Synchronous database search helper  
  searchDatabaseDocumentsSync(query, platform, searchTerms, limit) {
    const results = [];
    try {
      let dbQuery = `
        SELECT id, title, content, platform, document_type, keywords, created_at
        FROM rag_documents 
        WHERE is_active = true
      `;
      const queryParams = [];
      let paramIndex = 1;

      // Add platform filter if specified
      if (platform) {
        dbQuery += ` AND platform = $${paramIndex}`;
        queryParams.push(platform);
        paramIndex++;
      }

      // Add text search conditions
      const searchConditions = searchTerms.map(() => {
        const condition = `(title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`;
        queryParams.push(`%${searchTerms[paramIndex - (platform ? 2 : 1)]}%`);
        paramIndex++;
        return condition;
      }).join(' OR ');

      if (searchConditions) {
        dbQuery += ` AND (${searchConditions})`;
      }

      dbQuery += ` ORDER BY created_at DESC LIMIT ${limit * 2}`;

      // Use a promise-based approach that resolves immediately with cached results
      // For real-time search, we'll use a different approach
      const cachedResults = this.getCachedDatabaseResults(query, platform);
      if (cachedResults.length > 0) {
        return cachedResults;
      }

      // If no cached results, perform async search and return empty for now
      this.performAsyncDatabaseSearch(query, platform, searchTerms, limit);
      return [];
    } catch (error) {
      console.error('Database search sync error:', error);
      return [];
    }
  }

  // Get cached database results
  getCachedDatabaseResults(query, platform) {
    // Simple cache implementation - in production use Redis
    const cacheKey = `${query}-${platform || 'all'}`;
    return this.dbCache?.get(cacheKey) || [];
  }

  // Perform async database search and cache results
  async performAsyncDatabaseSearch(query, platform, searchTerms, limit) {
    if (!this.pool) return;

    try {
      let dbQuery = `
        SELECT id, title, content, platform, document_type, keywords, created_at
        FROM rag_documents 
        WHERE is_active = true
      `;
      const queryParams = [];
      let paramIndex = 1;

      if (platform) {
        dbQuery += ` AND platform = $${paramIndex}`;
        queryParams.push(platform);
        paramIndex++;
      }

      const searchConditions = searchTerms.map(term => {
        const condition = `(title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`;
        queryParams.push(`%${term}%`);
        paramIndex++;
        return condition;
      }).join(' OR ');

      if (searchConditions) {
        dbQuery += ` AND (${searchConditions})`;
      }

      dbQuery += ` ORDER BY created_at DESC LIMIT ${limit * 2}`;

      const dbResult = await this.pool.query(dbQuery, queryParams);
      const results = [];

      for (const row of dbResult.rows) {
        let score = 0;
        const keywords = Array.isArray(row.keywords) ? row.keywords : [];
        const searchableText = `${row.title} ${row.content} ${keywords.join(' ')}`.toLowerCase();
        
        // Calculate relevance score for database documents
        for (const term of searchTerms) {
          if (searchableText.includes(term)) {
            if (row.title.toLowerCase().includes(term)) {
              score += 3;
            }
            if (keywords.some(kw => kw.toLowerCase().includes(term))) {
              score += 2;
            }
            try {
              const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const matches = (searchableText.match(new RegExp(escapedTerm, 'g')) || []).length;
              score += matches;
            } catch (regexError) {
              const termOccurrences = searchableText.split(term).length - 1;
              score += termOccurrences;
            }
          }
        }
        
        if (score > 0) {
          results.push({
            id: `db_${row.id}`,
            title: row.title,
            content: row.content,
            type: row.document_type || 'document',
            keywords: keywords,
            platform: row.platform,
            relevanceScore: score,
            snippet: this.generateSnippet(row.content, searchTerms),
            source: 'user-uploaded',
            lastUpdated: row.created_at
          });
        }
      }
      
      // Initialize cache if not exists
      if (!this.dbCache) {
        this.dbCache = new Map();
      }
      
      // Cache results for future searches
      const cacheKey = `${query}-${platform || 'all'}`;
      this.dbCache.set(cacheKey, results);
      
    } catch (error) {
      console.error('Database search error:', error);
    }
    return results;
  }

  // Get contextual recommendations based on query and platform
  getContextualRecommendations(query, platform) {
    const searchResults = this.searchDocuments(query, platform, 3);
    const relatedTypes = [...new Set(searchResults.map(doc => doc.type))];
    
    const recommendations = [];
    for (const type of relatedTypes) {
      const typeDocs = this.getDocsByType(type, platform);
      recommendations.push(...typeDocs.filter(doc => 
        !searchResults.some(result => result.id === doc.id)
      ).slice(0, 2));
    }
    
    return {
      primary: searchResults,
      related: recommendations.slice(0, 5)
    };
  }
}

// Export for use in the main application
module.exports = RAGDatabase;