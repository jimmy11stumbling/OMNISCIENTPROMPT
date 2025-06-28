/**
 * Load Protocol Documentation into Database
 * Seeds RAG 2.0, MCP, and A2A protocol documents
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

async function loadProtocolDocuments() {
  console.log('[PROTOCOL-LOADER] Starting protocol document loading...');
  
  // Initialize database connection
  const dbPath = path.join(__dirname, 'app_database.sqlite');
  const db = new Database(dbPath);
  
  // Protocol document files to load
  const protocolFiles = [
    {
      file: 'attached_assets/RAG 2.0 Deep Dive Report__1749385628898.txt',
      platform: 'rag2.0',
      type: 'protocol'
    },
    {
      file: 'attached_assets/MCP Deep Dive Research__1749385628905.txt', 
      platform: 'mcp',
      type: 'protocol'
    },
    {
      file: 'attached_assets/A2A Agent Communication Deep Dive__1749385628915.txt',
      platform: 'a2a',
      type: 'protocol'
    },
    {
      file: 'attached_assets/RAG,MCP,A2A_1749385628898.txt',
      platform: 'protocols',
      type: 'comprehensive'
    },
    {
      file: 'attached_assets/Pasted-Reasoning-Model-deepseek-reasoner-deepseek-reasoner-is-a-reasoning-model-developed-by-DeepSeek-B-1745791786728_1749385628899.txt',
      platform: 'deepseek',
      type: 'reasoning'
    }
  ];

  let loadedCount = 0;

  for (const docInfo of protocolFiles) {
    try {
      if (!fs.existsSync(docInfo.file)) {
        console.log(`[PROTOCOL-LOADER] File not found: ${docInfo.file}`);
        continue;
      }

      const content = fs.readFileSync(docInfo.file, 'utf8');
      const chunks = splitIntoChunks(content, docInfo.platform, docInfo.type);
      
      for (const chunk of chunks) {
        try {
          const stmt = db.prepare(`
            INSERT OR REPLACE INTO rag_documents (id, title, content, platform, document_type, keywords, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `);
          
          stmt.run(
            chunk.id,
            chunk.title,
            chunk.content,
            chunk.platform,
            chunk.document_type,
            JSON.stringify(chunk.keywords),
            JSON.stringify(chunk.metadata)
          );
          
          loadedCount++;
        } catch (err) {
          console.log(`[PROTOCOL-LOADER] Error inserting chunk: ${err.message}`);
        }
      }
      
      console.log(`[PROTOCOL-LOADER] Loaded ${chunks.length} chunks from ${docInfo.platform}`);
      
    } catch (error) {
      console.log(`[PROTOCOL-LOADER] Error loading ${docInfo.file}: ${error.message}`);
    }
  }

  // Load comprehensive protocol documentation
  await loadComprehensiveProtocolDocs(db);

  console.log(`[PROTOCOL-LOADER] Successfully loaded ${loadedCount} protocol document chunks`);
  return loadedCount;
}

function splitIntoChunks(content, platform, type) {
  const chunks = [];
  const lines = content.split('\n');
  let currentChunk = '';
  let chunkIndex = 0;
  const maxChunkSize = 3000;

  let currentTitle = `${platform.toUpperCase()} Protocol Documentation`;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect section headers
    if (line.match(/^#|^\d+\.|\*\*|Introduction|Architecture|Implementation|Protocol|Framework/)) {
      if (currentChunk.length > 500) {
        // Save current chunk
        chunks.push(createProtocolChunk(currentChunk, platform, type, currentTitle, chunkIndex++));
        currentChunk = '';
      }
      
      if (line.length > 10 && line.length < 100) {
        currentTitle = line.replace(/^#+\s*|\*\*/g, '').trim() || currentTitle;
      }
    }
    
    currentChunk += line + '\n';
    
    // Split if chunk gets too large
    if (currentChunk.length > maxChunkSize) {
      chunks.push(createProtocolChunk(currentChunk, platform, type, currentTitle, chunkIndex++));
      currentChunk = '';
    }
  }
  
  // Add final chunk
  if (currentChunk.trim()) {
    chunks.push(createProtocolChunk(currentChunk, platform, type, currentTitle, chunkIndex++));
  }
  
  return chunks;
}

function createProtocolChunk(content, platform, type, title, index) {
  const keywords = extractProtocolKeywords(content, platform);
  
  return {
    id: `${platform}_protocol_${index}`,
    title: `${title} - Part ${index + 1}`,
    content: content.trim(),
    platform: platform,
    document_type: type,
    keywords: keywords,
    metadata: {
      protocol: platform,
      documentType: type,
      chunkIndex: index,
      contentLength: content.length
    }
  };
}

function extractProtocolKeywords(content, platform) {
  const keywords = [];
  
  // Platform-specific keywords
  const keywordMap = {
    'rag2.0': ['retrieval', 'augmented', 'generation', 'embedding', 'vector', 'database', 'similarity', 'semantic'],
    'mcp': ['model context protocol', 'json-rpc', 'tools', 'resources', 'prompts', 'anthropic', 'client', 'server'],
    'a2a': ['agent', 'communication', 'multi-agent', 'coordination', 'collaboration', 'protocol', 'message'],
    'protocols': ['integration', 'communication', 'protocol', 'architecture', 'implementation'],
    'deepseek': ['reasoning', 'model', 'ai', 'language', 'generation', 'context', 'inference']
  };
  
  const platformKeywords = keywordMap[platform] || [];
  
  for (const keyword of platformKeywords) {
    if (content.toLowerCase().includes(keyword.toLowerCase())) {
      keywords.push(keyword);
    }
  }
  
  return keywords;
}

async function loadComprehensiveProtocolDocs(db) {
  // Add comprehensive protocol overview documents
  const comprehensiveDocs = [
    {
      id: 'protocol_overview_rag',
      title: 'RAG 2.0 Advanced Retrieval-Augmented Generation',
      content: 'RAG 2.0 represents the evolution of Retrieval-Augmented Generation beyond naive implementations. It incorporates advanced techniques like hybrid search, re-ranking, query transformation, contextual compression, and fine-tuned models to achieve enterprise-grade performance. Key improvements include pre-retrieval optimization, sophisticated chunking strategies, metadata enrichment, and post-retrieval processing.',
      platform: 'rag2.0',
      document_type: 'overview'
    },
    {
      id: 'protocol_overview_mcp',
      title: 'Model Context Protocol - Universal AI Connectivity',
      content: 'Model Context Protocol (MCP) is an open standard for connecting AI models to external systems. Often called "USB-C for AI", MCP uses JSON-RPC 2.0 protocol with tools, resources, and prompts primitives. It enables seamless integration between AI assistants and data sources, APIs, and tools while maintaining security through capability negotiation.',
      platform: 'mcp',
      document_type: 'overview'
    },
    {
      id: 'protocol_overview_a2a',
      title: 'Agent-to-Agent Communication Protocols',
      content: 'Agent-to-Agent (A2A) communication enables autonomous software agents to interact, coordinate, and collaborate within Multi-Agent Systems (MAS). A2A protocols standardize how agents exchange information, delegate tasks, and achieve collective goals through structured message passing and coordination mechanisms.',
      platform: 'a2a',
      document_type: 'overview'
    },
    {
      id: 'protocol_integration_deepseek',
      title: 'DeepSeek Reasoning Integration',
      content: 'DeepSeek provides advanced reasoning capabilities through its reasoning models. Integration involves API connectivity, prompt optimization, context management, and leveraging DeepSeek\'s chain-of-thought reasoning for enhanced AI responses. Supports streaming, conversation management, and reasoning chain visualization.',
      platform: 'deepseek',
      document_type: 'integration'
    }
  ];

  for (const doc of comprehensiveDocs) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO rag_documents (id, title, content, platform, document_type, keywords, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    
    stmt.run(
      doc.id,
      doc.title,
      doc.content,
      doc.platform,
      doc.document_type,
      JSON.stringify(extractProtocolKeywords(doc.content, doc.platform)),
      JSON.stringify({ comprehensive: true, protocol: doc.platform })
    );
  }
}

// Run the loader
if (require.main === module) {
  loadProtocolDocuments()
    .then(count => {
      console.log(`[PROTOCOL-LOADER] Completed loading ${count} protocol documents`);
      process.exit(0);
    })
    .catch(error => {
      console.error(`[PROTOCOL-LOADER] Failed:`, error);
      process.exit(1);
    });
}

module.exports = { loadProtocolDocuments };