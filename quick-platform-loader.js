const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function quickLoadPlatforms() {
  console.log('[QUICK-LOADER] Loading no-code platform documentation...');
  
  try {
    const attachedAssetsDir = path.join(__dirname, 'attached_assets');
    
    // Platform file mappings based on actual files
    const platformFiles = {
      replit: ['Replitdata_1751086250571.txt', 'replit research updated_1751086250571.txt'],
      lovable: ['lovable2.0 data_1751086250571.txt'],
      bolt: ['boltdata_1751086250570.txt'],
      cursor: ['Cursordata_1751086250570.txt'], 
      windsurf: ['windsurfdata_1751086250572.txt']
    };

    // Clear existing platform documents
    await pool.query("DELETE FROM rag_documents WHERE platform IN ('replit', 'lovable', 'bolt', 'cursor', 'windsurf')");
    console.log('[QUICK-LOADER] Cleared existing platform documentation');

    let totalDocuments = 0;

    for (const [platform, files] of Object.entries(platformFiles)) {
      console.log(`[QUICK-LOADER] Loading ${platform} documentation...`);
      let platformCount = 0;

      for (const filename of files) {
        const filePath = path.join(attachedAssetsDir, filename);
        
        if (!fs.existsSync(filePath)) {
          console.log(`[QUICK-LOADER] File not found: ${filename}`);
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf8');
        console.log(`[QUICK-LOADER] Processing ${filename} (${content.length} characters)`);

        // Split content into chunks
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
      
      console.log(`[QUICK-LOADER] Added ${platformCount} documents for ${platform}`);
      totalDocuments += platformCount;
    }

    console.log(`[QUICK-LOADER] Successfully loaded ${totalDocuments} platform documents`);
    
    // Verify the results
    const result = await pool.query(`
      SELECT platform, COUNT(*) as count 
      FROM rag_documents 
      WHERE platform IN ('replit', 'lovable', 'bolt', 'cursor', 'windsurf')
      GROUP BY platform 
      ORDER BY count DESC
    `);
    
    console.log('[QUICK-LOADER] Platform documentation loaded:');
    result.rows.forEach(row => {
      console.log(`  ${row.platform}: ${row.count} documents`);
    });

  } catch (error) {
    console.error('[QUICK-LOADER] Error:', error);
  } finally {
    await pool.end();
  }
}

function splitIntoChunks(content, platform) {
  const chunks = [];
  const maxChunkSize = 2000;
  
  // Split by sections or paragraphs
  const sections = content.split(/\n\s*\n/).filter(section => section.trim().length > 50);
  
  let chunkIndex = 0;
  for (const section of sections) {
    if (section.length <= maxChunkSize) {
      chunks.push(createChunk(section, platform, chunkIndex++));
    } else {
      // Split large sections
      const words = section.split(' ');
      let currentChunk = '';
      
      for (const word of words) {
        if ((currentChunk + ' ' + word).length > maxChunkSize && currentChunk.length > 0) {
          chunks.push(createChunk(currentChunk.trim(), platform, chunkIndex++));
          currentChunk = word;
        } else {
          currentChunk += (currentChunk ? ' ' : '') + word;
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
    keywords: extractKeywords(content, platform),
    created_at: new Date()
  };
}

function extractTitle(content, platform) {
  const lines = content.split('\n');
  const firstLine = lines[0].trim();
  
  if (firstLine.length > 0 && firstLine.length < 100) {
    return `[${platform.toUpperCase()}] ${firstLine}`;
  }
  
  return `[${platform.toUpperCase()}] ${platform} Documentation - Section ${Date.now()}`;
}

function getDocumentType(content, platform) {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('api') || lowerContent.includes('endpoint')) return 'api';
  if (lowerContent.includes('tutorial') || lowerContent.includes('guide')) return 'tutorial';
  if (lowerContent.includes('example') || lowerContent.includes('demo')) return 'example';
  if (lowerContent.includes('feature') || lowerContent.includes('capability')) return 'feature';
  if (lowerContent.includes('configuration') || lowerContent.includes('setup')) return 'configuration';
  
  return 'general';
}

function extractKeywords(content, platform) {
  const keywords = [platform];
  const lowerContent = content.toLowerCase();
  
  const commonKeywords = [
    'api', 'authentication', 'database', 'deployment', 'configuration',
    'tutorial', 'example', 'feature', 'integration', 'development'
  ];
  
  commonKeywords.forEach(keyword => {
    if (lowerContent.includes(keyword)) {
      keywords.push(keyword);
    }
  });
  
  return keywords;
}

if (require.main === module) {
  quickLoadPlatforms();
}

module.exports = { quickLoadPlatforms };