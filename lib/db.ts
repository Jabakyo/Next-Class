// Database abstraction layer
// This file determines whether to use file-based or PostgreSQL database

const isProduction = process.env.NODE_ENV === 'production'
const hasPostgres = !!process.env.DATABASE_URL

// Use PostgreSQL in production, file-based in development
export const db = hasPostgres && isProduction 
  ? require('./db-postgres').db 
  : require('./db-file').db

// Re-export types
export type { Database } from './db-file'