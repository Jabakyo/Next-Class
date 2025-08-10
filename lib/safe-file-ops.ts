import fs from 'fs'
import path from 'path'
import { lockfile } from '@/lib/file-utils'
import { logger } from './logger'

// Ensure directory exists
export function ensureDirectory(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

// Safe read JSON file with locking
export async function safeReadJson<T>(filePath: string, defaultValue: T): Promise<T> {
  const release = await lockfile.lock(filePath)
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue
    }
    const data = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(data) as T
  } catch (error) {
    logger.error(`Error reading ${filePath}`, error)
    return defaultValue
  } finally {
    await release()
  }
}

// Safe write JSON file with locking
export async function safeWriteJson(filePath: string, data: any): Promise<void> {
  const release = await lockfile.lock(filePath)
  try {
    ensureDirectory(path.dirname(filePath))
    const tempFile = `${filePath}.tmp`
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8')
    fs.renameSync(tempFile, filePath)
  } catch (error) {
    logger.error(`Error writing ${filePath}`, error)
    throw error
  } finally {
    await release()
  }
}

// Safe update JSON file with locking
export async function safeUpdateJson<T>(
  filePath: string, 
  updateFn: (data: T) => T,
  defaultValue: T
): Promise<T> {
  const release = await lockfile.lock(filePath)
  try {
    let data = defaultValue
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8')
      data = JSON.parse(fileContent) as T
    }
    
    const updatedData = updateFn(data)
    
    ensureDirectory(path.dirname(filePath))
    const tempFile = `${filePath}.tmp`
    fs.writeFileSync(tempFile, JSON.stringify(updatedData, null, 2), 'utf8')
    fs.renameSync(tempFile, filePath)
    
    return updatedData
  } catch (error) {
    logger.error(`Error updating ${filePath}`, error)
    throw error
  } finally {
    await release()
  }
}