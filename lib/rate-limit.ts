import { NextRequest, NextResponse } from 'next/server'
import { logger } from './logger'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum number of requests per window
  message?: string // Custom error message
  keyGenerator?: (req: NextRequest) => string // Function to generate unique key per user
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private storage = new Map<string, RateLimitEntry>()
  
  constructor(private config: RateLimitConfig) {
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000)
  }
  
  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.storage.entries()) {
      if (entry.resetTime < now) {
        this.storage.delete(key)
      }
    }
  }
  
  private getKey(request: NextRequest): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(request)
    }
    
    // Default: Use IP address or forwarded IP
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
    return ip
  }
  
  async check(request: NextRequest): Promise<NextResponse | null> {
    const key = this.getKey(request)
    const now = Date.now()
    
    let entry = this.storage.get(key)
    
    if (!entry || entry.resetTime < now) {
      // Create new entry
      entry = {
        count: 1,
        resetTime: now + this.config.windowMs
      }
      this.storage.set(key, entry)
      return null // Allow request
    }
    
    entry.count++
    
    if (entry.count > this.config.maxRequests) {
      logger.warn('Rate limit exceeded', { 
        key, 
        count: entry.count, 
        maxRequests: this.config.maxRequests 
      })
      
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
      
      return NextResponse.json(
        { 
          error: this.config.message || 'Too many requests, please try again later.',
          retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': this.config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(entry.resetTime).toISOString()
          }
        }
      )
    }
    
    // Update remaining requests header
    const remaining = this.config.maxRequests - entry.count
    
    return null // Allow request with headers to be added by middleware
  }
  
  getRemainingRequests(request: NextRequest): number {
    const key = this.getKey(request)
    const entry = this.storage.get(key)
    
    if (!entry || entry.resetTime < Date.now()) {
      return this.config.maxRequests
    }
    
    return Math.max(0, this.config.maxRequests - entry.count)
  }
}

// Pre-configured rate limiters for different endpoints
export const rateLimiters = {
  // Strict rate limit for authentication endpoints
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later.'
  }),
  
  // Medium rate limit for API endpoints
  api: new RateLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // Default 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many API requests, please slow down.'
  }),
  
  // Lenient rate limit for search endpoints
  search: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Too many search requests, please try again in a moment.'
  }),
  
  // Very strict rate limit for password reset
  passwordReset: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many password reset attempts. Please try again later.'
  }),
  
  // Rate limit for file uploads
  upload: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: 'Too many file uploads. Please try again later.'
  })
}

// Helper function to apply rate limiting to an API route
export async function withRateLimit(
  request: NextRequest,
  rateLimiter: RateLimiter,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const rateLimitResponse = await rateLimiter.check(request)
  
  if (rateLimitResponse) {
    return rateLimitResponse
  }
  
  const response = await handler()
  
  // Add rate limit headers to successful responses
  const remaining = rateLimiter.getRemainingRequests(request)
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  
  return response
}

// Middleware function for rate limiting
export async function rateLimitMiddleware(
  request: NextRequest,
  rateLimiter: RateLimiter
): Promise<NextResponse | null> {
  return rateLimiter.check(request)
}