import crypto from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'

export interface FileValidationResult {
  isValid: boolean
  error?: string
  sanitizedName?: string
  mimeType?: string
}

const ALLOWED_IMAGE_TYPES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/jpg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  'image/gif': [0x47, 0x49, 0x46],
  'image/webp': [0x52, 0x49, 0x46, 0x46]
}

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const SUSPICIOUS_EXTENSIONS = ['.php', '.jsp', '.asp', '.aspx', '.exe', '.bat', '.cmd', '.com', '.scr', '.vbs', '.js', '.jar']

export function validateFileSize(buffer: Buffer): boolean {
  return buffer.length <= MAX_FILE_SIZE && buffer.length > 0
}

export function validateMimeType(mimeType: string): boolean {
  return Object.keys(ALLOWED_IMAGE_TYPES).includes(mimeType.toLowerCase())
}

export function validateFileExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase()
  return ALLOWED_EXTENSIONS.includes(ext) && !SUSPICIOUS_EXTENSIONS.some(suspExt => filename.toLowerCase().includes(suspExt))
}

export function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const magicBytes = ALLOWED_IMAGE_TYPES[mimeType.toLowerCase() as keyof typeof ALLOWED_IMAGE_TYPES]
  if (!magicBytes) return false

  for (let i = 0; i < magicBytes.length; i++) {
    if (buffer[i] !== magicBytes[i]) return false
  }
  return true
}

export function sanitizeFileName(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  const nameWithoutExt = path.basename(filename, ext)
  
  const sanitized = nameWithoutExt
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 50)
  
  return sanitized + ext
}

export function generateSecureFileName(userId: string, originalName: string): string {
  const ext = path.extname(originalName).toLowerCase()
  const timestamp = Date.now()
  const random = crypto.randomBytes(16).toString('hex')
  const userHash = crypto.createHash('sha256').update(userId).digest('hex').substring(0, 8)
  
  return `${userHash}_${timestamp}_${random}${ext}`
}

export async function validateImageFile(buffer: Buffer, filename: string, mimeType: string): Promise<FileValidationResult> {
  if (!validateFileSize(buffer)) {
    return { isValid: false, error: 'File size exceeds maximum limit (5MB)' }
  }

  if (!validateMimeType(mimeType)) {
    return { isValid: false, error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' }
  }

  if (!validateFileExtension(filename)) {
    return { isValid: false, error: 'Invalid file extension or suspicious file detected.' }
  }

  if (!validateMagicBytes(buffer, mimeType)) {
    return { isValid: false, error: 'File content does not match declared type.' }
  }

  const sanitizedName = sanitizeFileName(filename)
  
  return {
    isValid: true,
    sanitizedName,
    mimeType
  }
}

export async function secureFileWrite(filePath: string, buffer: Buffer): Promise<void> {
  const tempPath = `${filePath}.tmp`
  
  try {
    await fs.writeFile(tempPath, buffer, { mode: 0o644 })
    await fs.rename(tempPath, filePath)
  } catch (error) {
    try {
      await fs.unlink(tempPath)
    } catch (cleanupError) {
    }
    throw error
  }
}

export async function secureFileDelete(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    await fs.unlink(filePath)
    return true
  } catch (error) {
    return false
  }
}

export function createUploadPath(userId: string, filename: string): { relativePath: string; absolutePath: string } {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
  const secureFilename = generateSecureFileName(userId, filename)
  
  return {
    relativePath: `/uploads/avatars/${secureFilename}`,
    absolutePath: path.join(uploadsDir, secureFilename)
  }
}