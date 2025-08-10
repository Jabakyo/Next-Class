import { Pool } from 'pg'
import type { User } from '@/types/user'
import { logger } from './logger'

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

export class PostgresDB {
  // Initialize database tables
  async init() {
    try {
      await this.createTables()
      logger.info('Database initialized successfully')
    } catch (error) {
      logger.error('Database initialization failed', error)
      throw error
    }
  }

  private async createTables() {
    const client = await pool.connect()
    try {
      // Users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          student_id VARCHAR(50) UNIQUE NOT NULL,
          year VARCHAR(20) NOT NULL DEFAULT 'Freshman',
          major VARCHAR(255) NOT NULL DEFAULT 'Undeclared',
          bio TEXT DEFAULT '',
          avatar VARCHAR(500) DEFAULT '',
          interests TEXT[] DEFAULT '{}',
          classes JSONB DEFAULT '[]',
          points INTEGER DEFAULT 0,
          achievements TEXT[] DEFAULT '{}',
          has_shared_schedule BOOLEAN DEFAULT false,
          schedule_verification_status VARCHAR(20) DEFAULT 'none',
          verification_submitted_at TIMESTAMP,
          verification_screenshot VARCHAR(500),
          previous_classes JSONB DEFAULT '[]',
          classes_changed_at TIMESTAMP,
          social_links JSONB DEFAULT '{}',
          settings JSONB DEFAULT '{"privacy": {"showEmail": false, "showSchedule": true, "showInterests": true, "showSocialLinks": true}, "notifications": {"classUpdates": true, "classmateRequests": true, "scheduleChanges": true, "newFeatures": false}}',
          is_active BOOLEAN DEFAULT true,
          email_verified BOOLEAN DEFAULT false,
          password_strength VARCHAR(20),
          mfa_enabled BOOLEAN DEFAULT false,
          account_locked BOOLEAN DEFAULT false,
          lockout_reason VARCHAR(255),
          lockout_until TIMESTAMP,
          last_login_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)

      // Events table
      await client.query(`
        CREATE TABLE IF NOT EXISTS events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255) NOT NULL,
          description TEXT,
          creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          time TIME NOT NULL,
          location VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          max_attendees INTEGER,
          is_private BOOLEAN DEFAULT false,
          attendees JSONB DEFAULT '[]',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)

      // Verification requests table
      await client.query(`
        CREATE TABLE IF NOT EXISTS verification_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          screenshot_url VARCHAR(500) NOT NULL,
          status VARCHAR(20) DEFAULT 'pending',
          submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          reviewed_at TIMESTAMP,
          reviewed_by UUID REFERENCES users(id),
          reason TEXT,
          current_classes JSONB DEFAULT '[]',
          previous_classes JSONB DEFAULT '[]'
        )
      `)

      // Email verification tokens
      await client.query(`
        CREATE TABLE IF NOT EXISTS email_verification_tokens (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) NOT NULL,
          token VARCHAR(255) NOT NULL UNIQUE,
          user_data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP NOT NULL,
          used BOOLEAN DEFAULT false
        )
      `)

      // Password reset tokens
      await client.query(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token VARCHAR(255) NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP NOT NULL,
          used BOOLEAN DEFAULT false,
          used_at TIMESTAMP
        )
      `)

      // Profile visits
      await client.query(`
        CREATE TABLE IF NOT EXISTS profile_visits (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          viewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          viewed_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ip_address INET,
          user_agent TEXT,
          duration INTEGER,
          view_type VARCHAR(50) DEFAULT 'direct'
        )
      `)

      // Indexes for performance
      await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)')
      await client.query('CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id)')
      await client.query('CREATE INDEX IF NOT EXISTS idx_events_creator_id ON events(creator_id)')
      await client.query('CREATE INDEX IF NOT EXISTS idx_events_date ON events(date)')
      await client.query('CREATE INDEX IF NOT EXISTS idx_profile_visits_viewer ON profile_visits(viewer_id)')
      await client.query('CREATE INDEX IF NOT EXISTS idx_profile_visits_viewed ON profile_visits(viewed_user_id)')

    } finally {
      client.release()
    }
  }

  // User operations
  async findUserByEmail(email: string): Promise<User | null> {
    const client = await pool.connect()
    try {
      const result = await client.query('SELECT * FROM users WHERE email = $1', [email])
      return result.rows[0] || null
    } finally {
      client.release()
    }
  }

  async findUserById(id: string): Promise<User | null> {
    const client = await pool.connect()
    try {
      const result = await client.query('SELECT * FROM users WHERE id = $1', [id])
      return result.rows[0] || null
    } finally {
      client.release()
    }
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const client = await pool.connect()
    try {
      const result = await client.query(`
        INSERT INTO users (email, password, name, student_id, year, major, bio, interests, settings)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        userData.email,
        (userData as any).password,
        userData.name,
        userData.studentId,
        userData.year || 'Freshman',
        userData.major || 'Undeclared',
        userData.bio || '',
        userData.interests || [],
        userData.settings || {}
      ])
      return result.rows[0]
    } finally {
      client.release()
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const client = await pool.connect()
    try {
      const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ')
      const values = [id, ...Object.values(updates)]
      
      const result = await client.query(`
        UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `, values)
      
      return result.rows[0] || null
    } finally {
      client.release()
    }
  }

  // Search users
  async searchUsers(query: string, limit: number = 20): Promise<User[]> {
    const client = await pool.connect()
    try {
      const result = await client.query(`
        SELECT * FROM users 
        WHERE (name ILIKE $1 OR email ILIKE $1 OR major ILIKE $1)
        AND is_active = true
        ORDER BY name
        LIMIT $2
      `, [`%${query}%`, limit])
      return result.rows
    } finally {
      client.release()
    }
  }

  // Close connection
  async close() {
    await pool.end()
  }
}

export const db = new PostgresDB()