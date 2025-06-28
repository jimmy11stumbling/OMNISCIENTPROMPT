/**
 * PostgreSQL Database Initialization
 * Creates all required tables and indexes for the DeepSeek AI Platform
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initializePostgreSQL() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Initializing PostgreSQL database...');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255),
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        email_verified BOOLEAN DEFAULT false,
        verification_token VARCHAR(255),
        api_key VARCHAR(255),
        api_quota_daily INTEGER DEFAULT 100,
        api_quota_used_today INTEGER DEFAULT 0,
        api_quota_reset_date DATE,
        failed_login_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create saved_prompts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS saved_prompts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title TEXT NOT NULL,
        original_query TEXT NOT NULL,
        platform VARCHAR(50) NOT NULL,
        generated_prompt TEXT NOT NULL,
        reasoning TEXT,
        rag_context JSONB DEFAULT '[]',
        tokens_used INTEGER DEFAULT 0,
        response_time INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create rag_documents table
    await client.query(`
      CREATE TABLE IF NOT EXISTS rag_documents (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        platform VARCHAR(50) NOT NULL,
        document_type VARCHAR(50),
        content TEXT NOT NULL,
        keywords JSONB DEFAULT '[]',
        uploaded_by INTEGER REFERENCES users(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create api_usage_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_usage_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        endpoint VARCHAR(255),
        method VARCHAR(10),
        ip_address INET,
        user_agent TEXT,
        response_status INTEGER,
        response_time INTEGER,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        is_read BOOLEAN DEFAULT false,
        action_url TEXT,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user_sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        session_token VARCHAR(255) UNIQUE NOT NULL,
        ip_address INET,
        user_agent TEXT,
        expires_at TIMESTAMP NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_saved_prompts_user_id ON saved_prompts(user_id);
      CREATE INDEX IF NOT EXISTS idx_saved_prompts_platform ON saved_prompts(platform);
      CREATE INDEX IF NOT EXISTS idx_saved_prompts_created_at ON saved_prompts(created_at);
      CREATE INDEX IF NOT EXISTS idx_rag_documents_platform ON rag_documents(platform);
      CREATE INDEX IF NOT EXISTS idx_rag_documents_type ON rag_documents(document_type);
      CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_id ON api_usage_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON api_usage_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
    `);

    // Insert demo user for prompt saving
    const existingUser = await client.query('SELECT id FROM users WHERE username = $1', ['demo_user']);
    if (existingUser.rows.length === 0) {
      await client.query(`
        INSERT INTO users (username, email, full_name, password_hash, role, is_active, email_verified)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, ['demo_user', 'demo@example.com', 'Demo User', 'demo_hash', 'user', true, true]);
      console.log('✅ Demo user created for prompt saving');
    }

    console.log('✅ PostgreSQL database initialized successfully');
    return true;

  } catch (error) {
    console.error('❌ PostgreSQL initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Export initialization function
module.exports = { initializePostgreSQL, pool };