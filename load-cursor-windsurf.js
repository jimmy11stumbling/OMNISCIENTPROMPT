const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function loadCursorWindsurf() {
  console.log('[CURSOR-WINDSURF] Loading Cursor and Windsurf documentation...');
  
  try {
    const attachedAssetsDir = path.join(__dirname, 'attached_assets');
    
    const platformFiles = {
      cursor: ['Cursordata_1751086250570.txt'], 
      windsurf: ['windsurfdata_1751086250572.txt']
    };

    let totalDocuments = 0;

    for (const [platform, files] of Object.entries(platformFiles)) {
      console.log(`[CURSOR-WINDSURF] Loading ${platform} documentation...`);
      let platformCount = 0;

      for (const filename of files) {
        const filePath = path.join(attachedAssetsDir, filename);
        
        if (!fs.existsSync(filePath)) {
          console.log(`[CURSOR-WINDSURF] File not found: ${filename}`);
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf8');
        console.log(`[CURSOR-WINDSURF] Processing ${filename} (${content.length} characters)`);

        // Split content into manageable chunks
        const chunks = splitIntoChunks(content, platform);
        
        for (const chunk of chunks) {
          await pool.query(`
            INSERT INTO rag_documents (
              platform, title, content, document_type, keywords, created_at
            ) VALUES ($1, $2, $3, $4, $5, NOW())
          `, [
            chunk.platform,
            chunk.title,
            chunk.content,
            chunk.document_type,
            chunk.keywords
          ]);
          platformCount++;
        }
      }
      
      console.log(`[CURSOR-WINDSURF] Added ${platformCount} documents for ${platform}`);
      totalDocuments += platformCount;
    }

    console.log(`[CURSOR-WINDSURF] Successfully loaded ${totalDocuments} documents`);
    
    // Verify the final results
    const result = await pool.query(`
      SELECT platform, COUNT(*) as count 
      FROM rag_documents 
      WHERE platform IN ('replit', 'lovable', 'bolt', 'cursor', 'windsurf')
      GROUP BY platform 
      ORDER BY count DESC
    `);
    
    console.log('[CURSOR-WINDSURF] All platforms now loaded:');
    result.rows.forEach(row => {
      console.log(`  ${row.platform}: ${row.count} documents`);
    });

  } catch (error) {
    console.error('[CURSOR-WINDSURF] Error:', error);
  } finally {
    await pool.end();
  }
}

function splitIntoChunks(content, platform) {
  const chunks = [];
  const maxChunkSize = 1500; // Smaller chunks for faster processing
  
  // Split by double newlines first
  const sections = content.split(/\n\s*\n/).filter(section => section.trim().length > 30);
  
  let chunkIndex = 0;
  for (const section of sections) {
    if (section.length <= maxChunkSize) {
      chunks.push(createChunk(section, platform, chunkIndex++));
    } else {
      // Split large sections into smaller pieces
      const sentences = section.split(/[.!?]+/).filter(s => s.trim().length > 10);
      let currentChunk = '';
      
      for (const sentence of sentences) {
        const trimmedSentence = sentence.trim() + '.';
        if ((currentChunk + ' ' + trimmedSentence).length > maxChunkSize && currentChunk.length > 0) {
          chunks.push(createChunk(currentChunk.trim(), platform, chunkIndex++));
          currentChunk = trimmedSentence;
        } else {
          currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
        }
      }
      
      if (currentChunk.trim()) {
        chunks.push(createChunk(currentChunk.trim(), platform, chunkIndex++));
      }
    }
  }
  
  return chunks;
}

function createChunk(content, platform, index) {
  return {
    platform,
    title: extractTitle(content, platform),
    content: content.trim(),
    document_type: getDocumentType(content, platform),
    keywords: extractKeywords(content, platform)
  };
}

function extractTitle(content, platform) {
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  const firstLine = lines[0]?.trim() || '';
  
  // Use first meaningful line as title
  if (firstLine.length > 0 && firstLine.length < 120) {
    return `[${platform.toUpperCase()}] ${firstLine}`;
  }
  
  // Extract key phrase from content
  const words = content.split(' ').slice(0, 8).join(' ');
  return `[${platform.toUpperCase()}] ${words}...`;
}

function getDocumentType(content, platform) {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('api') || lowerContent.includes('endpoint')) return 'api';
  if (lowerContent.includes('feature') || lowerContent.includes('capability')) return 'feature';
  if (lowerContent.includes('tutorial') || lowerContent.includes('guide') || lowerContent.includes('how to')) return 'tutorial';
  if (lowerContent.includes('example') || lowerContent.includes('demo')) return 'example';
  if (lowerContent.includes('config') || lowerContent.includes('setup') || lowerContent.includes('install')) return 'configuration';
  
  return 'general';
}

function extractKeywords(content, platform) {
  const keywords = [platform];
  const lowerContent = content.toLowerCase();
  
  // Platform-specific keywords
  if (platform === 'cursor') {
    ['ai', 'vscode', 'copilot', 'composer', 'code', 'development'].forEach(keyword => {
      if (lowerContent.includes(keyword)) keywords.push(keyword);
    });
  } else if (platform === 'windsurf') {
    ['cascade', 'collaboration', 'multi-file', 'context', 'editing'].forEach(keyword => {
      if (lowerContent.includes(keyword)) keywords.push(keyword);
    });
  }
  
  // Common keywords
  ['api', 'authentication', 'integration', 'development', 'feature'].forEach(keyword => {
    if (lowerContent.includes(keyword) && !keywords.includes(keyword)) {
      keywords.push(keyword);
    }
  });
  
  return keywords;
}

if (require.main === module) {
  loadCursorWindsurf();
}

module.exports = { loadCursorWindsurf };