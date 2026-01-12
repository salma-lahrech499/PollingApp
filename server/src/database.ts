import Database from 'better-sqlite3';
import { randomBytes, createHash } from 'crypto';

const db = new Database('voters.db');

// Initialize database tables
export function initializeDatabase() {
  // Users table (for tracking votes - minimal data)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Polls table
  db.exec(`
    CREATE TABLE IF NOT EXISTS polls (
      id TEXT PRIMARY KEY,
      title TEXT UNIQUE NOT NULL,
      creator_id TEXT,
      creator_name TEXT,
      is_anonymous_creator BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Poll options table
  db.exec(`
    CREATE TABLE IF NOT EXISTS poll_options (
      id TEXT PRIMARY KEY,
      poll_id TEXT NOT NULL,
      text TEXT NOT NULL,
      FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE
    )
  `);

  // Votes table
  // For anonymous votes, user_id will be a one-way hash that can't be traced back
  db.exec(`
    CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY,
      poll_id TEXT NOT NULL,
      option_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      is_anonymous BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
      FOREIGN KEY (option_id) REFERENCES poll_options(id) ON DELETE CASCADE,
      UNIQUE(poll_id, user_id)
    )
  `);

  // Index for faster lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_votes_poll_user ON votes(poll_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_poll_options_poll ON poll_options(poll_id);
  `);
}

// Generate anonymous user ID (one-way hash that can't be traced)
export function generateAnonymousUserId(pollId: string, userAgent: string, ip: string): string {
  // Create a hash that can't be reversed but is consistent for the same user
  // Using a combination that's hard to replicate
  const input = `${pollId}-${userAgent}-${ip}`;
  const hash = createHash('sha256').update(input).digest('hex');
  return hash;
}

// Generate simple user ID for non-anonymous votes
export function generateUserId(): string {
  return randomBytes(16).toString('hex');
}

export default db;

