const fs = require('fs');
const path = require('path');
const database = require('./database');

// Comprehensive seeding with all latest platform documentation
async function comprehensiveSeed() {
  console.log('[COMPREHENSIVE-SEED] Starting complete documentation seeding...');
  
  try {
    const attachedAssetsDir = path.join(__dirname, 'attached_assets');
    
    // Get all text files from attached_assets
    const allFiles = fs.readdirSync(attachedAssetsDir).filter(file => file.endsWith('.txt'));
    console.log(`[COMPREHENSIVE-SEED] Found ${allFiles.length} text files to process`);

    // Complete platform file mappings with latest comprehensive docs
    const platformFiles = {
      replit: [
        'Replitdata_1749377356094.txt', 
        'replit research updated_1749377356094.txt',
        'Replitdata_1751086250571.txt',
        'replit research updated_1751086250571.txt'
      ],
      lovable: [
        'lovable2.0 data_1749377356093.txt',
        'lovable2.0 data_1751086242600.txt',
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

    // Protocol and system files
    const systemFiles = allFiles.filter(file => 
      !Object.values(platformFiles).flat().includes(file)
    );

    // Clear existing RAG documents
    await database.queryAsync('DELETE FROM rag_documents');
    console.log('[COMPREHENSIVE-SEED] Cleared existing documentation');

    let totalDocuments = 0;
    let platformCounts = {};

    // Process platform-specific files
    for (const [platform, files] of Object.entries(platformFiles)) {
      console.log(`[COMPREHENSIVE-SEED] Processing ${platform} documentation...`);
      platformCounts[platform] = 0;
      
      for (const filename of files) {
        const filePath = path.join(attachedAssetsDir, filename);
        
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          console.log(`[COMPREHENSIVE-SEED] Loaded ${filename} (${content.length} characters)`);
          
          // Split content into manageable chunks
          const chunks = splitIntoChunks(content, platform);
          
          for (const chunk of chunks) {
            await database.queryAsync(`
              INSERT INTO rag_documents (title, content, platform, keywords, created_at)
              VALUES (?, ?, ?, ?, datetime('now'))
            `, [chunk.title, chunk.content, platform, JSON.stringify(chunk.keywords)]);
            
            totalDocuments++;
            platformCounts[platform]++;
          }
          
          console.log(`[COMPREHENSIVE-SEED] Added ${chunks.length} documents from ${filename}`);
        } else {
          console.log(`[COMPREHENSIVE-SEED] File not found: ${filePath}`);
        }
      }
    }

    // Process system/protocol files
    console.log(`[COMPREHENSIVE-SEED] Processing ${systemFiles.length} system/protocol files...`);
    platformCounts['system'] = 0;
    
    for (const filename of systemFiles) {
      const filePath = path.join(attachedAssetsDir, filename);
      const content = fs.readFileSync(filePath, 'utf8');
      
      const chunks = splitIntoChunks(content, 'system');
      
      for (const chunk of chunks) {
        await database.queryAsync(`
          INSERT INTO rag_documents (title, content, platform, type, keywords, last_updated)
          VALUES (?, ?, ?, ?, ?, datetime('now'))
        `, [chunk.title, chunk.content, 'system', chunk.type, JSON.stringify(chunk.keywords)]);
        
        totalDocuments++;
        platformCounts['system']++;
      }
      
      console.log(`[COMPREHENSIVE-SEED] Added ${chunks.length} documents from ${filename}`);
    }

    console.log(`[COMPREHENSIVE-SEED] Complete! Total documents: ${totalDocuments}`);
    console.log('[COMPREHENSIVE-SEED] Platform distribution:');
    for (const [platform, count] of Object.entries(platformCounts)) {
      console.log(`  ${platform}: ${count} documents`);
    }

    return {
      success: true,
      totalDocuments,
      platformCounts: Object.entries(platformCounts).map(([platform, count]) => ({ platform, count }))
    };

  } catch (error) {
    console.error('[COMPREHENSIVE-SEED] Error:', error);
    return { success: false, error: error.message };
  }
}

function splitIntoChunks(content, platform) {
  const maxChunkSize = 2000;
  const chunks = [];
  let chunkIndex = 1;

  // Try to split by sections/headers first
  const sections = content.split(/(?=^[A-Z\d][\.\)]\s|\n#{1,3}\s|\n[A-Z][^a-z\n]{10,}\n)/m).filter(s => s.trim().length > 100);
  
  if (sections.length > 1) {
    for (const section of sections) {
      if (section.length <= maxChunkSize) {
        chunks.push(createChunk(section, platform, chunkIndex++));
      } else {
        // Split large sections further
        const subsections = splitLargeSection(section, `${platform} Documentation`, maxChunkSize);
        for (const subsection of subsections) {
          chunks.push(createChunk(subsection, platform, chunkIndex++));
        }
      }
    }
  } else {
    // Fall back to paragraph-based splitting
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 50);
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      if ((currentChunk + paragraph).length <= maxChunkSize) {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      } else {
        if (currentChunk) {
          chunks.push(createChunk(currentChunk, platform, chunkIndex++));
          currentChunk = paragraph;
        } else {
          // Single paragraph too large
          const subChunks = splitLargeSection(paragraph, `${platform} Documentation`, maxChunkSize);
          for (const subChunk of subChunks) {
            chunks.push(createChunk(subChunk, platform, chunkIndex++));
          }
          currentChunk = '';
        }
      }
    }
    
    if (currentChunk) {
      chunks.push(createChunk(currentChunk, platform, chunkIndex++));
    }
  }

  return chunks.length > 0 ? chunks : [createChunk(content.substring(0, maxChunkSize), platform, 1)];
}

function splitLargeSection(content, baseTitle, maxSize) {
  const chunks = [];
  let start = 0;
  let partIndex = 1;
  
  while (start < content.length) {
    let end = start + maxSize;
    
    if (end < content.length) {
      // Try to end at a sentence or paragraph boundary
      const lastSentence = content.lastIndexOf('.', end);
      const lastParagraph = content.lastIndexOf('\n\n', end);
      
      if (lastParagraph > start + maxSize * 0.7) {
        end = lastParagraph;
      } else if (lastSentence > start + maxSize * 0.7) {
        end = lastSentence + 1;
      }
    }
    
    const chunk = content.substring(start, end).trim();
    if (chunk.length > 0) {
      chunks.push({
        title: `${baseTitle} (Part ${partIndex})`,
        content: chunk,
        type: 'documentation',
        keywords: extractKeywords(chunk, baseTitle.split(' ')[0].toLowerCase())
      });
    }
    
    start = end;
    partIndex++;
  }
  
  return chunks;
}

function createChunk(content, platform, index) {
  if (typeof content !== 'string') {
    content = String(content);
  }
  const title = extractTitle(content) || `${platform.charAt(0).toUpperCase() + platform.slice(1)} Documentation ${index}`;
  return {
    title,
    content: content.trim(),
    type: getDocumentType(content, platform),
    keywords: extractKeywords(content, platform)
  };
}

function extractTitle(content) {
  if (typeof content !== 'string') {
    content = String(content);
  }
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return null;
  
  const firstLine = lines[0].trim();
  
  // Look for headers
  if (firstLine.match(/^#{1,3}\s+(.+)$/)) {
    return firstLine.replace(/^#+\s+/, '');
  }
  
  // Look for numbered sections
  if (firstLine.match(/^[A-Z\d][\.\)]\s+(.+)$/)) {
    return firstLine;
  }
  
  // Use first substantial line
  if (firstLine.length > 10 && firstLine.length < 100) {
    return firstLine;
  }
  
  return null;
}

function getDocumentType(content, platform) {
  const contentLower = content.toLowerCase();
  
  if (contentLower.includes('pricing') || contentLower.includes('plan') || contentLower.includes('cost')) return 'pricing';
  if (contentLower.includes('feature') || contentLower.includes('capability')) return 'features';
  if (contentLower.includes('tutorial') || contentLower.includes('guide') || contentLower.includes('how to')) return 'tutorial';
  if (contentLower.includes('api') || contentLower.includes('integration')) return 'api';
  if (contentLower.includes('deploy') || contentLower.includes('hosting')) return 'deployment';
  
  return 'general';
}

function extractKeywords(content, platform) {
  const keywords = [platform];
  const contentLower = content.toLowerCase();
  
  // Platform-specific keywords
  const platformKeywords = {
    replit: ['agent', 'deployment', 'database', 'hosting', 'collaboration'],
    lovable: ['ai', 'fullstack', 'supabase', 'credits', 'chat mode'],
    bolt: ['stackblitz', 'webcontainer', 'claude', 'deployment', 'github'],
    cursor: ['vscode', 'ai assistant', 'claude', 'copilot', 'codebase'],
    windsurf: ['cascade', 'ai ide', 'mcp', 'contextual', 'coding']
  };
  
  if (platformKeywords[platform]) {
    for (const keyword of platformKeywords[platform]) {
      if (contentLower.includes(keyword)) {
        keywords.push(keyword);
      }
    }
  }
  
  // General keywords
  const generalKeywords = ['ai', 'development', 'code', 'app', 'project', 'deployment', 'integration', 'api', 'database'];
  for (const keyword of generalKeywords) {
    if (contentLower.includes(keyword) && !keywords.includes(keyword)) {
      keywords.push(keyword);
    }
  }
  
  return keywords.slice(0, 10); // Limit keywords
}

// Run the comprehensive seeding
if (require.main === module) {
  comprehensiveSeed().then(result => {
    console.log('[COMPREHENSIVE-SEED] Final result:', JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { comprehensiveSeed };