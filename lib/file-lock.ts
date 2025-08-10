import fs from 'fs'
import path from 'path'
import { logger } from './logger'

// Simple file locking mechanism using lock files
class FileLockManager {
  private locks = new Map<string, Promise<void>>()

  /**
   * Acquire a lock for a file and execute a function
   * @param filePath Path to the file to lock
   * @param operation Function to execute while holding the lock
   */
  async withLock<T>(filePath: string, operation: () => Promise<T> | T): Promise<T> {
    const lockKey = path.resolve(filePath)
    
    // Wait for any existing lock to be released
    const existingLock = this.locks.get(lockKey)
    if (existingLock) {
      await existingLock
    }

    // Create a new lock
    let resolveLock: () => void
    const lockPromise = new Promise<void>((resolve) => {
      resolveLock = resolve
    })
    
    this.locks.set(lockKey, lockPromise)

    try {
      // Execute the operation
      return await operation()
    } finally {
      // Release the lock
      this.locks.delete(lockKey)
      resolveLock!()
    }
  }

  /**
   * Safe file read with retry logic
   */
  async readFileWithRetry(filePath: string, maxRetries = 3): Promise<string> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        if (!fs.existsSync(filePath)) {
          return '[]' // Return empty array for non-existent files
        }
        return fs.readFileSync(filePath, 'utf8')
      } catch (error: any) {
        if (i === maxRetries - 1) throw error
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)))
      }
    }
    return '[]'
  }

  /**
   * Safe file write with atomic operation
   */
  async writeFileAtomic(filePath: string, data: string): Promise<void> {
    const tempPath = `${filePath}.tmp`
    const dirPath = path.dirname(filePath)

    // Ensure directory exists
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }

    try {
      // Write to temporary file first
      fs.writeFileSync(tempPath, data, 'utf8')
      
      // Atomic move to final location
      fs.renameSync(tempPath, filePath)
    } catch (error) {
      // Clean up temp file if it exists
      if (fs.existsSync(tempPath)) {
        try {
          fs.unlinkSync(tempPath)
        } catch (cleanupError) {
          logger.warn('Failed to cleanup temp file', { error: cleanupError })
        }
      }
      throw error
    }
  }
}

// Global instance
export const fileLock = new FileLockManager()

// Utility functions for common file operations
export async function safeReadJsonFile<T = any>(filePath: string, defaultValue: T[] = [] as T[]): Promise<T[]> {
  return fileLock.withLock(filePath, async () => {
    try {
      const data = await fileLock.readFileWithRetry(filePath)
      return JSON.parse(data) as T[]
    } catch (error) {
      logger.warn(`Failed to read ${filePath}, using default value`, { error })
      return defaultValue
    }
  })
}

export async function safeWriteJsonFile<T = any>(filePath: string, data: T[]): Promise<void> {
  return fileLock.withLock(filePath, async () => {
    const jsonData = JSON.stringify(data, null, 2)
    await fileLock.writeFileAtomic(filePath, jsonData)
  })
}

// Helper function to ensure data directory exists
export function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}