/**
 * Secure logging utility
 * In production, logs should be sent to a proper logging service
 * This utility ensures sensitive information is not logged
 */

const isDevelopment = process.env.NODE_ENV === 'development'
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'

enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

const logLevels: { [key: string]: LogLevel } = {
  error: LogLevel.ERROR,
  warn: LogLevel.WARN,
  info: LogLevel.INFO,
  debug: LogLevel.DEBUG
}

const currentLogLevel = logLevels[LOG_LEVEL.toLowerCase()] || LogLevel.INFO

/**
 * Enhanced sanitization for sensitive data with comprehensive PII protection
 */
function sanitizeData(data: any, depth: number = 0): any {
  // Prevent infinite recursion
  if (depth > 10) return '[MAX_DEPTH_REACHED]'
  if (!data) return data
  
  if (typeof data === 'string') {
    let sanitized = data
    
    // Mask JWT tokens
    if (sanitized.match(/^eyJ[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_.+/=]*$/)) {
      return '[JWT_TOKEN]'
    }
    
    // Mask API keys and tokens
    if (sanitized.match(/^[a-zA-Z0-9]{20,}$/)) {
      return '[TOKEN]'
    }
    
    // Enhanced email masking
    sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, (match) => {
      const [local, domain] = match.split('@')
      const maskedLocal = local.charAt(0) + '*'.repeat(Math.max(0, local.length - 2)) + (local.length > 1 ? local.charAt(local.length - 1) : '')
      return `${maskedLocal}@${domain}`
    })
    
    // Mask phone numbers
    sanitized = sanitized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, 'XXX-XXX-XXXX')
    
    // Mask credit card numbers
    sanitized = sanitized.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, 'XXXX-XXXX-XXXX-XXXX')
    
    // Mask SSN
    sanitized = sanitized.replace(/\b\d{3}-?\d{2}-?\d{4}\b/g, 'XXX-XX-XXXX')
    
    // Mask IP addresses (keep first octet for debugging)
    sanitized = sanitized.replace(/\b(\d{1,3})\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '$1.XXX.XXX.XXX')
    
    // Mask potential passwords (8+ chars with mixed case/numbers)
    if (sanitized.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)) {
      return '[PASSWORD]'
    }
    
    return sanitized
  }
  
  if (typeof data !== 'object') {
    return data
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item, depth + 1))
  }
  
  const sanitized: any = {}
  const sensitiveKeys = [
    // Authentication
    'password', 'passwd', 'pwd', 'token', 'secret', 'key', 'authorization',
    'cookie', 'session', 'jwt', 'auth', 'credential', 'bearer',
    
    // API Keys
    'api_key', 'apikey', 'api-key', 'access_token', 'accesstoken', 'refresh_token',
    'client_secret', 'clientsecret', 'private_key', 'privatekey',
    
    // Personal Information  
    'ssn', 'social_security', 'credit_card', 'creditcard', 'cvv', 'cvc',
    'drivers_license', 'passport', 'national_id',
    
    // Student specific
    'student_id', 'studentid', 'student_number',
    
    // Financial
    'bank_account', 'routing_number', 'account_number',
    
    // Health
    'medical_record', 'health_id', 'insurance_id',
    
    // Other sensitive
    'pin', 'otp', 'verification_code', 'reset_code'
  ]
  
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase()
    
    // Check if key contains sensitive information
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]'
    } 
    // Special handling for common fields
    else if (lowerKey === 'email' && typeof value === 'string') {
      sanitized[key] = sanitizeData(value, depth + 1)
    }
    else if (lowerKey === 'phone' && typeof value === 'string') {
      sanitized[key] = 'XXX-XXX-XXXX'
    }
    else if (lowerKey === 'ip' && typeof value === 'string') {
      const parts = value.split('.')
      sanitized[key] = parts.length === 4 ? `${parts[0]}.XXX.XXX.XXX` : '[IP_ADDRESS]'
    }
    // Handle nested objects and arrays
    else if (typeof value === 'object' && value !== null) {
      if (value instanceof Date) {
        sanitized[key] = value.toISOString()
      } else if (value instanceof Error) {
        sanitized[key] = {
          name: value.name,
          message: value.message,
          stack: isDevelopment ? value.stack : '[STACK_TRACE_REDACTED]'
        }
      } else {
        sanitized[key] = sanitizeData(value, depth + 1)
      }
    } 
    // Handle primitives
    else {
      sanitized[key] = sanitizeData(value, depth + 1)
    }
  }
  
  return sanitized
}

/**
 * Format log message with timestamp and level
 */
function formatLogMessage(level: string, message: string, data?: any): string {
  const timestamp = new Date().toISOString()
  const sanitizedData = data ? sanitizeData(data) : ''
  const dataStr = sanitizedData ? ` ${JSON.stringify(sanitizedData)}` : ''
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`
}

/**
 * Enhanced logger with structured logging and security features
 */
export const logger = {
  error(message: string, data?: any) {
    if (currentLogLevel >= LogLevel.ERROR) {
      const sanitizedData = data ? sanitizeData(data) : undefined
      const logEntry = {
        level: 'ERROR',
        message,
        timestamp: new Date().toISOString(),
        ...(sanitizedData && { data: sanitizedData })
      }
      console.error(JSON.stringify(logEntry))
    }
  },
  
  warn(message: string, data?: any) {
    if (currentLogLevel >= LogLevel.WARN) {
      const sanitizedData = data ? sanitizeData(data) : undefined
      const logEntry = {
        level: 'WARN',
        message,
        timestamp: new Date().toISOString(),
        ...(sanitizedData && { data: sanitizedData })
      }
      console.warn(JSON.stringify(logEntry))
    }
  },
  
  info(message: string, data?: any) {
    if (currentLogLevel >= LogLevel.INFO) {
      const sanitizedData = data ? sanitizeData(data) : undefined
      const logEntry = {
        level: 'INFO',
        message,
        timestamp: new Date().toISOString(),
        ...(sanitizedData && { data: sanitizedData })
      }
      console.log(JSON.stringify(logEntry))
    }
  },
  
  debug(message: string, data?: any) {
    if (currentLogLevel >= LogLevel.DEBUG && isDevelopment) {
      const sanitizedData = data ? sanitizeData(data) : undefined
      const logEntry = {
        level: 'DEBUG',
        message,
        timestamp: new Date().toISOString(),
        ...(sanitizedData && { data: sanitizedData })
      }
      console.log(JSON.stringify(logEntry))
    }
  },

  // Security-focused logging methods
  security: {
    authFailure(message: string, context?: { ip?: string; userAgent?: string; endpoint?: string }) {
      const logEntry = {
        level: 'SECURITY',
        type: 'AUTH_FAILURE',
        message,
        timestamp: new Date().toISOString(),
        context: context ? sanitizeData(context) : undefined
      }
      console.warn(JSON.stringify(logEntry))
    },

    suspiciousActivity(message: string, context?: { userId?: string; ip?: string; activity?: string }) {
      const logEntry = {
        level: 'SECURITY',
        type: 'SUSPICIOUS_ACTIVITY',
        message,
        timestamp: new Date().toISOString(),
        context: context ? sanitizeData(context) : undefined
      }
      console.warn(JSON.stringify(logEntry))
    },

    dataAccess(message: string, context?: { userId?: string; resource?: string; action?: string }) {
      const logEntry = {
        level: 'SECURITY',
        type: 'DATA_ACCESS',
        message,
        timestamp: new Date().toISOString(),
        context: context ? sanitizeData(context) : undefined
      }
      console.log(JSON.stringify(logEntry))
    }
  },

  // Audit logging for compliance
  audit: {
    userAction(action: string, context: { userId?: string; ip?: string; details?: any }) {
      const logEntry = {
        level: 'AUDIT',
        action,
        timestamp: new Date().toISOString(),
        context: sanitizeData(context)
      }
      console.log(JSON.stringify(logEntry))
    },

    systemEvent(event: string, context?: any) {
      const logEntry = {
        level: 'AUDIT',
        event,
        timestamp: new Date().toISOString(),
        context: context ? sanitizeData(context) : undefined
      }
      console.log(JSON.stringify(logEntry))
    }
  }
}

// Export a no-op logger for production if needed
export const productionLogger = {
  error: () => {},
  warn: () => {},
  info: () => {},
  debug: () => {}
}