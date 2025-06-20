const Database = require('better-sqlite3');
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, 'app_database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database tables
function initializeDatabase() {
  try {
    // Create users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        is_active BOOLEAN DEFAULT 1,
        email_verified BOOLEAN DEFAULT 0,
        verification_token TEXT,
        api_key TEXT,
        api_quota_daily INTEGER DEFAULT 100,
        api_quota_used_today INTEGER DEFAULT 0,
        api_quota_reset_date TEXT,
        failed_login_attempts INTEGER DEFAULT 0,
        locked_until DATETIME,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create api_usage_logs table
    db.exec(`
      CREATE TABLE IF NOT EXISTS api_usage_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        endpoint TEXT,
        method TEXT,
        ip_address TEXT,
        user_agent TEXT,
        response_status INTEGER,
        response_time INTEGER,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create notifications table
    db.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        is_read BOOLEAN DEFAULT 0,
        action_url TEXT,
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create saved_prompts table
    db.exec(`
      CREATE TABLE IF NOT EXISTS saved_prompts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT NOT NULL,
        original_query TEXT NOT NULL,
        platform TEXT NOT NULL,
        generated_prompt TEXT NOT NULL,
        reasoning TEXT,
        rag_context TEXT, -- JSON as TEXT
        tokens_used INTEGER DEFAULT 0,
        response_time INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create rag_documents table
    db.exec(`
      CREATE TABLE IF NOT EXISTS rag_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        platform TEXT NOT NULL,
        document_type TEXT,
        content TEXT NOT NULL,
        keywords TEXT, -- JSON as TEXT
        uploaded_by INTEGER,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      )
    `);

    // Create user_sessions table
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        session_token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create error_logs table
    db.exec(`
      CREATE TABLE IF NOT EXISTS error_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        error_id TEXT UNIQUE NOT NULL,
        message TEXT NOT NULL,
        stack_trace TEXT,
        endpoint TEXT,
        method TEXT,
        ip_address TEXT,
        user_agent TEXT,
        user_id INTEGER,
        request_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create performance_logs table
    db.exec(`
      CREATE TABLE IF NOT EXISTS performance_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        endpoint TEXT NOT NULL,
        method TEXT NOT NULL,
        response_time INTEGER NOT NULL,
        memory_delta INTEGER,
        status_code INTEGER,
        user_id INTEGER,
        request_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create security_logs table
    db.exec(`
      CREATE TABLE IF NOT EXISTS security_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        security_id TEXT UNIQUE NOT NULL,
        event_type TEXT NOT NULL,
        details TEXT,
        ip_address TEXT,
        user_agent TEXT,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create indexes for performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON api_usage_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_rag_platform ON rag_documents(platform);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
    `);

    console.log('✅ SQLite database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    return false;
  }
}

// Database wrapper class to match PostgreSQL interface
class DatabaseWrapper {
  constructor() {
    this.db = db;
  }

  // Convert SQLite query to return PostgreSQL-like result
  query(sql, params = []) {
    try {
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        const stmt = this.db.prepare(sql);
        const rows = stmt.all(params);
        return { rows };
      } else {
        const stmt = this.db.prepare(sql);
        const result = stmt.run(params);
        
        // For INSERT statements that need RETURNING
        if (sql.toUpperCase().includes('RETURNING')) {
          const tableName = sql.match(/INSERT INTO (\w+)/i)?.[1];
          if (tableName && result.lastInsertRowid) {
            const selectStmt = this.db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
            const row = selectStmt.get(result.lastInsertRowid);
            return { rows: [row], lastInsertRowid: result.lastInsertRowid };
          }
        }
        
        return { rows: [], rowCount: result.changes };
      }
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  // Async wrapper to match PostgreSQL pool interface
  async queryAsync(sql, params = []) {
    return this.query(sql, params);
  }
}

// Initialize the database
initializeDatabase();

// Export the wrapper
module.exports = new DatabaseWrapper();