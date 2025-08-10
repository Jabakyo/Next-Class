// File-based database implementation (for development)
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { User } from '@/types/user'

const DATA_DIR = join(process.cwd(), 'data')
const USERS_FILE = join(DATA_DIR, 'users.json')
const EVENTS_FILE = join(DATA_DIR, 'events.json')
const VERIFICATION_REQUESTS_FILE = join(DATA_DIR, 'verification-requests.json')

export interface Database {
  users: {
    findByEmail(email: string): Promise<User | null>
    findById(id: string): Promise<User | null>
    create(user: Partial<User>): Promise<User>
    update(id: string, updates: Partial<User>): Promise<User | null>
    delete(id: string): Promise<boolean>
    search(query: string, limit?: number): Promise<User[]>
  }
}

class FileDatabase implements Database {
  private readJSON<T>(filePath: string): T[] {
    if (!existsSync(filePath)) {
      return []
    }
    try {
      const data = readFileSync(filePath, 'utf-8')
      return JSON.parse(data)
    } catch {
      return []
    }
  }

  private writeJSON<T>(filePath: string, data: T[]): void {
    writeFileSync(filePath, JSON.stringify(data, null, 2))
  }

  users = {
    findByEmail: async (email: string): Promise<User | null> => {
      const users = this.readJSON<User>(USERS_FILE)
      return users.find(u => u.email === email) || null
    },

    findById: async (id: string): Promise<User | null> => {
      const users = this.readJSON<User>(USERS_FILE)
      return users.find(u => u.id === id) || null
    },

    create: async (userData: Partial<User>): Promise<User> => {
      const users = this.readJSON<User>(USERS_FILE)
      const newUser = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...userData
      } as User
      users.push(newUser)
      this.writeJSON(USERS_FILE, users)
      return newUser
    },

    update: async (id: string, updates: Partial<User>): Promise<User | null> => {
      const users = this.readJSON<User>(USERS_FILE)
      const index = users.findIndex(u => u.id === id)
      if (index === -1) return null
      
      users[index] = {
        ...users[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      this.writeJSON(USERS_FILE, users)
      return users[index]
    },

    delete: async (id: string): Promise<boolean> => {
      const users = this.readJSON<User>(USERS_FILE)
      const filtered = users.filter(u => u.id !== id)
      if (filtered.length === users.length) return false
      this.writeJSON(USERS_FILE, filtered)
      return true
    },

    search: async (query: string, limit = 20): Promise<User[]> => {
      const users = this.readJSON<User>(USERS_FILE)
      const lowercaseQuery = query.toLowerCase()
      return users
        .filter(u => 
          u.name.toLowerCase().includes(lowercaseQuery) ||
          u.email.toLowerCase().includes(lowercaseQuery) ||
          u.major.toLowerCase().includes(lowercaseQuery)
        )
        .slice(0, limit)
    }
  }
}

export const db = new FileDatabase()