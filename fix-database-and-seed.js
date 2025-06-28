const fs = require('fs');
const path = require('path');
const database = require('./database');

async function fixDatabaseAndSeed() {
  console.log('[FIX] Starting database fix and documentation seeding...');
  
  try {
    // Clear existing RAG documents first
    await database.queryAsync('DELETE FROM rag_documents');
    console.log('[FIX] Cleared existing rag_documents');

    // Platform file mappings based on actual files in attached_assets
    const attachedAssetsDir = path.join(__dirname, 'attached_assets');
    const platformFiles = {
      replit: [
        'Replitdata_1749377356094.txt', 
        'replit research updated_1749377356094.txt',
        'Replitdata_1751086250571.txt',
        'replit research updated_1751086250571.txt'
      ],
      lovable: [
        'lovable2.0 data_1749377356093.txt',
        'lovable2.0 data_1751086250571.txt'
      ],
      bolt: [
        'boltdata_1749377356093.txt',
        'boltdata_1751086250570.txt'
      ],
      cursor: [
        'Cursordata_1749377356093.txt',
        'Cursordata_1751086250570.txt'
      ],
      windsurf: [
        'windsurfdata_1749377356094.txt',
        'windsurfdata_1751086250572.txt'
      ]
    };

    let totalDocuments = 0;

    for (const [platform, files] of Object.entries(platformFiles)) {
      console.log(`[FIX] Processing ${platform} documentation...`);
      
      for (const filename of files) {
        const filePath = path.join(attachedAssetsDir, filename);
        
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          console.log(`[FIX] Loaded ${filename} (${content.length} characters)`);
          
          // Split content into manageable chunks
          const chunks = splitIntoChunks(content, platform);
          
          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            try {
              await database.queryAsync(`
                INSERT INTO rag_documents (
                  platform, title, content, document_type, keywords, is_active
                ) VALUES (?, ?, ?, ?, ?, 1)
              `, [
                platform,
                chunk.title,
                chunk.content,
                chunk.type,
                JSON.stringify(chunk.keywords)
              ]);
              totalDocuments++;
            } catch (error) {
              console.error(`[FIX] Error inserting chunk ${i} for ${platform}:`, error.message);
            }
          }
          
          console.log(`[FIX] Added ${chunks.length} documents from ${filename}`);
        } else {
          console.warn(`[FIX] File not found: ${filePath}`);
        }
      }
    }

    // Verify the seeding
    const verifyResult = await database.queryAsync(`
      SELECT platform, COUNT(*) as count 
      FROM rag_documents 
      WHERE is_active = 1
      GROUP BY platform
    `);
    
    console.log(`[FIX] Documentation seeding complete! Total documents: ${totalDocuments}`);
    console.log('[FIX] Platform document counts:');
    verifyResult.rows.forEach(row => {
      console.log(`  ${row.platform}: ${row.count} documents`);
    });

    return { success: true, totalDocuments, platformCounts: verifyResult.rows };
    
  } catch (error) {
    console.error('[FIX] Error in fix and seed:', error);
    return { success: false, error: error.message };
  }
}

function splitIntoChunks(content, platform) {
  const chunks = [];
  const maxChunkSize = 2500; // Optimal for RAG retrieval
  
  // Split by sections or paragraphs
  const sections = content.split(/\n\s*\n/).filter(s => s.trim().length > 50);
  
  let currentChunk = '';
  let chunkIndex = 1;
  
  for (const section of sections) {
    const trimmedSection = section.trim();
    
    if ((currentChunk + '\n\n' + trimmedSection).length <= maxChunkSize) {
      currentChunk += (currentChunk ? '\n\n' : '') + trimmedSection;
    } else {
      if (currentChunk) {
        chunks.push(createChunk(currentChunk, platform, chunkIndex));
        chunkIndex++;
      }
      
      if (trimmedSection.length <= maxChunkSize) {
        currentChunk = trimmedSection;
      } else {
        // Split very large sections
        const sentences = trimmedSection.split(/(?<=[.!?])\s+/);
        let tempChunk = '';
        
        for (const sentence of sentences) {
          if ((tempChunk + ' ' + sentence).length <= maxChunkSize) {
            tempChunk += (tempChunk ? ' ' : '') + sentence;
          } else {
            if (tempChunk) {
              chunks.push(createChunk(tempChunk, platform, chunkIndex));
              chunkIndex++;
            }
            tempChunk = sentence;
          }
        }
        currentChunk = tempChunk;
      }
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(createChunk(currentChunk, platform, chunkIndex));
  }
  
  return chunks;
}

function createChunk(content, platform, index) {
  // Extract title from content start
  const lines = content.split('\n');
  const firstLine = lines[0].trim();
  
  let title = firstLine.length > 100 ? 
    firstLine.substring(0, 100).trim() + '...' : 
    firstLine;
    
  if (!title || title.length < 10) {
    title = `${platform.charAt(0).toUpperCase() + platform.slice(1)} Documentation ${index}`;
  }
  
  return {
    title: title.substring(0, 200),
    content: content.trim(),
    type: getDocumentType(content, platform),
    keywords: extractKeywords(content, platform)
  };
}

function getDocumentType(content, platform) {
  const contentLower = content.toLowerCase();
  
  if (platform === 'replit') {
    if (contentLower.includes('agent') || contentLower.includes('ai')) return 'ai-agent';
    if (contentLower.includes('database') || contentLower.includes('sql')) return 'database';
    if (contentLower.includes('auth') || contentLower.includes('login')) return 'authentication';
    if (contentLower.includes('deploy') || contentLower.includes('hosting')) return 'deployment';
  }
  
  if (platform === 'lovable') {
    if (contentLower.includes('fullstack') || contentLower.includes('collaboration')) return 'fullstack';
    if (contentLower.includes('component') || contentLower.includes('ui')) return 'components';
    if (contentLower.includes('backend') || contentLower.includes('api')) return 'backend';
  }
  
  if (platform === 'bolt') {
    if (contentLower.includes('webcontainer') || contentLower.includes('stackblitz')) return 'platform';
    if (contentLower.includes('collaboration') || contentLower.includes('team')) return 'collaboration';
    if (contentLower.includes('deploy') || contentLower.includes('netlify')) return 'deployment';
  }
  
  if (platform === 'cursor') {
    if (contentLower.includes('editor') || contentLower.includes('vscode')) return 'editor';
    if (contentLower.includes('ai') || contentLower.includes('chat')) return 'ai-features';
    if (contentLower.includes('project') || contentLower.includes('workspace')) return 'project-management';
  }
  
  if (platform === 'windsurf') {
    if (contentLower.includes('collaboration') || contentLower.includes('team')) return 'collaboration';
    if (contentLower.includes('ai') || contentLower.includes('development')) return 'ai-development';
    if (contentLower.includes('manage') || contentLower.includes('workflow')) return 'project-management';
  }
  
  return 'general';
}

function extractKeywords(content, platform) {
  const contentLower = content.toLowerCase();
  const keywords = [platform];
  
  const techKeywords = [
    'ai', 'agent', 'api', 'database', 'auth', 'deployment', 'frontend', 'backend', 
    'fullstack', 'react', 'javascript', 'collaboration', 'team', 'workspace', 
    'editor', 'development', 'application', 'web', 'mobile', 'code'
  ];
  
  techKeywords.forEach(keyword => {
    if (contentLower.includes(keyword) && !keywords.includes(keyword)) {
      keywords.push(keyword);
    }
  });
  
  return keywords.slice(0, 8);
}

// Run the fix if called directly
if (require.main === module) {
  fixDatabaseAndSeed().then(result => {
    console.log('[FIX] Final result:', result);
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { fixDatabaseAndSeed };