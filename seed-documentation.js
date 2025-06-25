const fs = require('fs');
const path = require('path');
const database = require('./database');

// Load and parse platform documentation from attached assets
async function seedDocumentationDatabase() {
  console.log('[SEED] Starting documentation database population...');
  
  try {
    const attachedAssetsDir = path.join(__dirname, 'attached_assets');
    
    // Platform file mappings
    const platformFiles = {
      replit: ['Replitdata_1749377356094.txt', 'replit research updated_1749377356094.txt'],
      lovable: ['lovable2.0 data_1749377356093.txt'],
      bolt: ['boltdata_1749377356093.txt'],
      cursor: ['Cursordata_1749377356093.txt'],
      windsurf: ['windsurfdata_1749377356094.txt']
    };

    // Clear existing RAG documents
    await database.queryAsync('DELETE FROM rag_documents');
    console.log('[SEED] Cleared existing documentation');

    let totalDocuments = 0;

    for (const [platform, files] of Object.entries(platformFiles)) {
      console.log(`[SEED] Processing ${platform} documentation...`);
      
      for (const filename of files) {
        const filePath = path.join(attachedAssetsDir, filename);
        
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Split content into manageable chunks for better RAG performance
          const chunks = splitIntoChunks(content, platform);
          
          for (const chunk of chunks) {
            await database.queryAsync(`
              INSERT INTO rag_documents (
                platform, title, content, document_type, keywords
              ) VALUES (?, ?, ?, ?, ?)
            `, [
              platform,
              chunk.title,
              chunk.content,
              chunk.type,
              JSON.stringify(chunk.keywords)
            ]);
            totalDocuments++;
          }
          
          console.log(`[SEED] Loaded ${chunks.length} documents from ${filename}`);
        } else {
          console.warn(`[SEED] File not found: ${filename}`);
        }
      }
    }

    console.log(`[SEED] Documentation seeding complete! Total documents: ${totalDocuments}`);
    
    // Verify the seeding
    const verifyResult = await database.queryAsync(`
      SELECT platform, COUNT(*) as count 
      FROM rag_documents 
      WHERE is_active = 1
      GROUP BY platform
    `);
    
    console.log('[SEED] Platform document counts:');
    verifyResult.rows.forEach(row => {
      console.log(`  ${row.platform}: ${row.count} documents`);
    });

    return { success: true, totalDocuments, platformCounts: verifyResult.rows };
    
  } catch (error) {
    console.error('[SEED] Error seeding documentation:', error);
    return { success: false, error: error.message };
  }
}

function splitIntoChunks(content, platform) {
  const chunks = [];
  const maxChunkSize = 3000; // Optimal for RAG retrieval
  
  // Try to split by sections first (look for numbered sections or headers)
  const sections = content.split(/(?=^[IVX]+\.|^[A-Z]\.|^##|^#)/m).filter(s => s.trim().length > 100);
  
  if (sections.length > 1) {
    // Process each section
    sections.forEach((section, index) => {
      const trimmedSection = section.trim();
      if (trimmedSection.length < 50) return;
      
      // Extract title from section start
      const titleMatch = trimmedSection.match(/^([^:\n.]+[:.]?)/);
      const title = titleMatch ? 
        titleMatch[1].replace(/^[IVX]+\.?\s*/, '').replace(/^[A-Z]\.?\s*/, '').trim() : 
        `${platform.charAt(0).toUpperCase() + platform.slice(1)} Documentation Part ${index + 1}`;
      
      if (trimmedSection.length <= maxChunkSize) {
        chunks.push({
          title: title.substring(0, 200),
          content: trimmedSection,
          type: getDocumentType(trimmedSection, platform),
          keywords: extractKeywords(trimmedSection, platform)
        });
      } else {
        // Split large sections into smaller chunks
        const subChunks = splitLargeSection(trimmedSection, title, maxChunkSize);
        chunks.push(...subChunks.map(chunk => ({
          ...chunk,
          type: getDocumentType(chunk.content, platform),
          keywords: extractKeywords(chunk.content, platform)
        })));
      }
    });
  } else {
    // Split by paragraphs or sentences for documents without clear sections
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 100);
    let currentChunk = '';
    let chunkIndex = 1;
    
    for (const paragraph of paragraphs) {
      if ((currentChunk + paragraph).length <= maxChunkSize) {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph.trim();
      } else {
        if (currentChunk) {
          chunks.push({
            title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Documentation ${chunkIndex}`,
            content: currentChunk,
            type: getDocumentType(currentChunk, platform),
            keywords: extractKeywords(currentChunk, platform)
          });
          chunkIndex++;
        }
        currentChunk = paragraph.trim();
      }
    }
    
    if (currentChunk) {
      chunks.push({
        title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Documentation ${chunkIndex}`,
        content: currentChunk,
        type: getDocumentType(currentChunk, platform),
        keywords: extractKeywords(currentChunk, platform)
      });
    }
  }
  
  return chunks;
}

function splitLargeSection(content, baseTitle, maxSize) {
  const chunks = [];
  const sentences = content.split(/(?<=[.!?])\s+/);
  let currentChunk = '';
  let partIndex = 1;
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxSize) {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    } else {
      if (currentChunk) {
        chunks.push({
          title: `${baseTitle} (Part ${partIndex})`,
          content: currentChunk
        });
        partIndex++;
      }
      currentChunk = sentence;
    }
  }
  
  if (currentChunk) {
    chunks.push({
      title: `${baseTitle} (Part ${partIndex})`,
      content: currentChunk
    });
  }
  
  return chunks;
}

function getDocumentType(content, platform) {
  const contentLower = content.toLowerCase();
  
  // Platform-specific type detection
  if (platform === 'replit') {
    if (contentLower.includes('agent') || contentLower.includes('ai')) return 'ai-agent';
    if (contentLower.includes('database') || contentLower.includes('sql')) return 'database';
    if (contentLower.includes('auth') || contentLower.includes('login')) return 'authentication';
    if (contentLower.includes('deploy') || contentLower.includes('hosting')) return 'deployment';
    return 'general';
  }
  
  if (platform === 'lovable') {
    if (contentLower.includes('fullstack') || contentLower.includes('full-stack')) return 'fullstack';
    if (contentLower.includes('component') || contentLower.includes('ui')) return 'components';
    if (contentLower.includes('backend') || contentLower.includes('api')) return 'backend';
    return 'general';
  }
  
  if (platform === 'bolt') {
    if (contentLower.includes('webcontainer') || contentLower.includes('stackblitz')) return 'platform';
    if (contentLower.includes('collaboration') || contentLower.includes('team')) return 'collaboration';
    if (contentLower.includes('deploy') || contentLower.includes('netlify')) return 'deployment';
    return 'general';
  }
  
  if (platform === 'cursor') {
    if (contentLower.includes('editor') || contentLower.includes('vscode')) return 'editor';
    if (contentLower.includes('ai') || contentLower.includes('chat')) return 'ai-features';
    if (contentLower.includes('project') || contentLower.includes('workspace')) return 'project-management';
    return 'general';
  }
  
  if (platform === 'windsurf') {
    if (contentLower.includes('collaboration') || contentLower.includes('team')) return 'collaboration';
    if (contentLower.includes('ai') || contentLower.includes('development')) return 'ai-development';
    if (contentLower.includes('manage') || contentLower.includes('workflow')) return 'project-management';
    return 'general';
  }
  
  return 'general';
}

function extractKeywords(content, platform) {
  const contentLower = content.toLowerCase();
  const keywords = [platform];
  
  // Common technical keywords
  const techKeywords = [
    'ai', 'agent', 'api', 'database', 'auth', 'authentication', 'deployment',
    'frontend', 'backend', 'fullstack', 'react', 'node', 'javascript',
    'collaboration', 'team', 'workspace', 'editor', 'ide', 'chat',
    'generation', 'code', 'development', 'application', 'web', 'mobile'
  ];
  
  techKeywords.forEach(keyword => {
    if (contentLower.includes(keyword) && !keywords.includes(keyword)) {
      keywords.push(keyword);
    }
  });
  
  // Platform-specific keywords
  const platformKeywords = {
    replit: ['replit', 'webcontainer', 'stackblitz'],
    lovable: ['lovable', 'supabase', 'vite', 'tailwind'],
    bolt: ['bolt', 'stackblitz', 'webcontainer', 'netlify'],
    cursor: ['cursor', 'vscode', 'copilot'],
    windsurf: ['windsurf', 'collaborative', 'codeium']
  };
  
  const specificKeywords = platformKeywords[platform] || [];
  specificKeywords.forEach(keyword => {
    if (contentLower.includes(keyword) && !keywords.includes(keyword)) {
      keywords.push(keyword);
    }
  });
  
  return keywords.slice(0, 10); // Limit to 10 keywords for performance
}

module.exports = { seedDocumentationDatabase };