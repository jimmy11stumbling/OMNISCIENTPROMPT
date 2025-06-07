// RAG 2.0 Database System for Platform Documentation Retrieval
const platformDocuments = {
  replit: [
    {
      id: 'repl_1',
      title: 'Replit Database Integration',
      content: 'Replit provides built-in database support with PostgreSQL and Redis. Use the Database tab to create and manage your database. Environment variables DATABASE_URL and REPLIT_DB_URL are automatically configured.',
      type: 'database',
      keywords: ['database', 'postgresql', 'redis', 'storage'],
      lastUpdated: '2024-01-15'
    },
    {
      id: 'repl_2', 
      title: 'Replit Authentication System',
      content: 'Replit Auth provides OAuth integration with GitHub, Google, and email. Use @replit/auth package for seamless user authentication. Supports session management and user profiles.',
      type: 'authentication',
      keywords: ['auth', 'oauth', 'login', 'session'],
      lastUpdated: '2024-01-10'
    },
    {
      id: 'repl_3',
      title: 'Replit Deployment and Hosting',
      content: 'Deploy applications with zero configuration. Replit automatically handles SSL certificates, custom domains, and scaling. Use .replit file for deployment configuration.',
      type: 'deployment',
      keywords: ['deploy', 'hosting', 'ssl', 'domains'],
      lastUpdated: '2024-01-20'
    },
    {
      id: 'repl_4',
      title: 'Real-time Collaboration Features',
      content: 'Replit supports real-time multiplayer coding with live cursors, voice/video chat, and shared terminals. Use Replit multiplayer APIs for collaborative features.',
      type: 'collaboration',
      keywords: ['multiplayer', 'realtime', 'collaboration'],
      lastUpdated: '2024-01-12'
    }
  ],
  
  lovable: [
    {
      id: 'lov_1',
      title: 'Lovable AI Component Generation',
      content: 'Lovable generates React components from natural language descriptions. Use the AI assistant to create forms, layouts, and interactive elements with TailwindCSS styling.',
      type: 'ai-generation',
      keywords: ['ai', 'components', 'react', 'tailwind'],
      lastUpdated: '2024-01-18'
    },
    {
      id: 'lov_2',
      title: 'Design-to-Code Workflow',
      content: 'Upload designs or wireframes to generate production-ready code. Lovable converts Figma designs, sketches, and mockups into functional React applications.',
      type: 'design-conversion',
      keywords: ['design', 'figma', 'wireframe', 'conversion'],
      lastUpdated: '2024-01-16'
    },
    {
      id: 'lov_3',
      title: 'Rapid Prototyping Environment',
      content: 'Iterate quickly with Lovable\'s instant preview and hot reload. Make changes in natural language and see updates in real-time.',
      type: 'prototyping',
      keywords: ['prototype', 'preview', 'iteration'],
      lastUpdated: '2024-01-14'
    }
  ],
  
  bolt: [
    {
      id: 'bolt_1',
      title: 'Bolt Instant Deployment',
      content: 'Deploy full-stack applications instantly with Bolt\'s zero-config deployment. Supports Node.js, Python, and static sites with automatic HTTPS.',
      type: 'deployment',
      keywords: ['deploy', 'instant', 'https', 'fullstack'],
      lastUpdated: '2024-01-19'
    },
    {
      id: 'bolt_2',
      title: 'Real-time Preview System',
      content: 'See changes immediately with Bolt\'s real-time preview. Every code change is instantly reflected in the live preview window.',
      type: 'preview',
      keywords: ['preview', 'realtime', 'live'],
      lastUpdated: '2024-01-17'
    },
    {
      id: 'bolt_3',
      title: 'Collaborative Development',
      content: 'Work together with team members in real-time. Bolt provides shared workspaces, live editing, and integrated communication tools.',
      type: 'collaboration',
      keywords: ['collaboration', 'team', 'workspace'],
      lastUpdated: '2024-01-13'
    }
  ],
  
  cursor: [
    {
      id: 'cur_1',
      title: 'Cursor AI Code Completion',
      content: 'Cursor provides intelligent code completion with context awareness. The AI understands your codebase and suggests relevant completions.',
      type: 'ai-assistance',
      keywords: ['ai', 'completion', 'context', 'suggestions'],
      lastUpdated: '2024-01-21'
    },
    {
      id: 'cur_2',
      title: 'Intelligent Refactoring',
      content: 'Use Cursor\'s AI for automated refactoring. Extract functions, rename variables, and restructure code with AI-powered suggestions.',
      type: 'refactoring',
      keywords: ['refactor', 'ai', 'restructure'],
      lastUpdated: '2024-01-15'
    },
    {
      id: 'cur_3',
      title: 'Automated Testing Generation',
      content: 'Generate comprehensive test suites with Cursor\'s AI. Create unit tests, integration tests, and end-to-end tests automatically.',
      type: 'testing',
      keywords: ['testing', 'automated', 'unit', 'integration'],
      lastUpdated: '2024-01-11'
    }
  ],
  
  windsurf: [
    {
      id: 'wind_1',
      title: 'Windsurf Team Collaboration',
      content: 'Windsurf enables seamless team collaboration with real-time code sharing, integrated chat, and project management tools.',
      type: 'collaboration',
      keywords: ['team', 'collaboration', 'chat', 'management'],
      lastUpdated: '2024-01-20'
    },
    {
      id: 'wind_2',
      title: 'Real-time Synchronization',
      content: 'All team members see changes instantly with Windsurf\'s real-time sync. Conflicts are automatically resolved with intelligent merging.',
      type: 'synchronization',
      keywords: ['sync', 'realtime', 'merge', 'conflicts'],
      lastUpdated: '2024-01-16'
    },
    {
      id: 'wind_3',
      title: 'Integrated Project Management',
      content: 'Manage tasks, deadlines, and team assignments directly in Windsurf. Track progress with built-in project management tools.',
      type: 'project-management',
      keywords: ['tasks', 'deadlines', 'progress', 'management'],
      lastUpdated: '2024-01-12'
    }
  ]
};

class RAGDatabase {
  constructor() {
    this.documents = platformDocuments;
    this.embeddings = new Map(); // In production, use vector database
  }

  // Semantic search for relevant documentation
  searchDocuments(query, platform = null, limit = 5) {
    const searchTerms = query.toLowerCase().split(' ');
    const results = [];

    const platforms = platform ? [platform] : Object.keys(this.documents);

    for (const platformName of platforms) {
      const docs = this.documents[platformName] || [];
      
      for (const doc of docs) {
        let score = 0;
        const searchableText = `${doc.title} ${doc.content} ${doc.keywords.join(' ')}`.toLowerCase();
        
        // Calculate relevance score
        for (const term of searchTerms) {
          if (searchableText.includes(term)) {
            score += 1;
            // Boost score for title matches
            if (doc.title.toLowerCase().includes(term)) {
              score += 2;
            }
            // Boost score for keyword matches
            if (doc.keywords.some(keyword => keyword.includes(term))) {
              score += 1.5;
            }
          }
        }
        
        if (score > 0) {
          results.push({
            ...doc,
            platform: platformName,
            relevanceScore: score,
            snippet: this.generateSnippet(doc.content, searchTerms)
          });
        }
      }
    }

    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  // Generate relevant snippet from content
  generateSnippet(content, searchTerms, maxLength = 200) {
    const sentences = content.split('. ');
    
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      if (searchTerms.some(term => lowerSentence.includes(term))) {
        return sentence.length > maxLength 
          ? sentence.substring(0, maxLength) + '...'
          : sentence + '.';
      }
    }
    
    return content.substring(0, maxLength) + '...';
  }

  // Get platform-specific documentation
  getPlatformDocs(platform) {
    return this.documents[platform] || [];
  }

  // Get documentation by type
  getDocsByType(type, platform = null) {
    const platforms = platform ? [platform] : Object.keys(this.documents);
    const results = [];

    for (const platformName of platforms) {
      const docs = this.documents[platformName] || [];
      const filtered = docs.filter(doc => doc.type === type);
      results.push(...filtered.map(doc => ({ ...doc, platform: platformName })));
    }

    return results;
  }

  // Add new document (for dynamic updates)
  addDocument(platform, document) {
    if (!this.documents[platform]) {
      this.documents[platform] = [];
    }
    
    const newDoc = {
      ...document,
      id: `${platform}_${Date.now()}`,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    
    this.documents[platform].push(newDoc);
    return newDoc;
  }

  // Get contextual recommendations
  getContextualRecommendations(query, platform) {
    const searchResults = this.searchDocuments(query, platform, 3);
    const platformDocs = this.getPlatformDocs(platform);
    
    // Get related documents by type
    const types = [...new Set(searchResults.map(doc => doc.type))];
    const relatedDocs = [];
    
    for (const type of types) {
      const related = this.getDocsByType(type, platform)
        .filter(doc => !searchResults.find(result => result.id === doc.id))
        .slice(0, 2);
      relatedDocs.push(...related);
    }

    return {
      primary: searchResults,
      related: relatedDocs,
      platformSpecific: platformDocs.slice(0, 2)
    };
  }
}

module.exports = { RAGDatabase, platformDocuments };