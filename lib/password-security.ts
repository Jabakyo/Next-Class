import crypto from 'crypto'

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong' | 'very_strong'
  score: number
}

export interface PasswordPolicy {
  minLength: number
  maxLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  disallowCommonPasswords: boolean
  disallowPersonalInfo: boolean
  maxRepeatingChars: number
}

const DEFAULT_POLICY: PasswordPolicy = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  disallowCommonPasswords: true,
  disallowPersonalInfo: true,
  maxRepeatingChars: 2
}

const COMMON_PASSWORDS = new Set([
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
  'qwerty123', '123123', 'admin123', 'root123', 'welcome123'
])

const SPECIAL_CHARS = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/

export function validatePassword(
  password: string, 
  userInfo?: { name?: string; email?: string; studentId?: string },
  policy: PasswordPolicy = DEFAULT_POLICY
): PasswordValidationResult {
  const errors: string[] = []
  let score = 0

  // Length validation
  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`)
  } else if (password.length >= policy.minLength) {
    score += Math.min(password.length * 2, 20)
  }

  if (password.length > policy.maxLength) {
    errors.push(`Password must not exceed ${policy.maxLength} characters`)
  }

  // Character type requirements
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  } else if (/[A-Z]/.test(password)) {
    score += 5
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  } else if (/[a-z]/.test(password)) {
    score += 5
  }

  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  } else if (/\d/.test(password)) {
    score += 5
  }

  if (policy.requireSpecialChars && !SPECIAL_CHARS.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"\\|,.<>/?~)')
  } else if (SPECIAL_CHARS.test(password)) {
    score += 10
  }

  // Complexity bonuses
  const uniqueChars = new Set(password.toLowerCase()).size
  score += Math.min(uniqueChars * 2, 20)

  // Pattern detection penalties
  if (hasSequentialChars(password)) {
    errors.push('Password should not contain sequential characters (e.g., abc, 123)')
    score -= 10
  }

  if (hasRepeatingChars(password, policy.maxRepeatingChars)) {
    errors.push(`Password should not have more than ${policy.maxRepeatingChars} repeating characters`)
    score -= 10
  }

  // Common passwords
  if (policy.disallowCommonPasswords && isCommonPassword(password)) {
    errors.push('Password is too common. Please choose a more unique password')
    score -= 20
  }

  // Personal information check
  if (policy.disallowPersonalInfo && userInfo && containsPersonalInfo(password, userInfo)) {
    errors.push('Password should not contain personal information')
    score -= 15
  }

  // Dictionary word detection (simple check)
  if (containsObviousWords(password)) {
    errors.push('Password should not contain obvious dictionary words')
    score -= 10
  }

  // Ensure minimum score
  score = Math.max(0, Math.min(100, score))

  const strength = getPasswordStrength(score)
  const isValid = errors.length === 0 && score >= 50

  return {
    isValid,
    errors,
    strength,
    score
  }
}

function hasSequentialChars(password: string): boolean {
  const sequences = [
    'abcdefghijklmnopqrstuvwxyz',
    '0123456789',
    'qwertyuiop',
    'asdfghjkl',
    'zxcvbnm'
  ]

  const lower = password.toLowerCase()
  
  for (const seq of sequences) {
    for (let i = 0; i <= seq.length - 3; i++) {
      const substring = seq.substring(i, i + 3)
      if (lower.includes(substring)) {
        return true
      }
    }
  }
  return false
}

function hasRepeatingChars(password: string, maxRepeating: number): boolean {
  let count = 1
  let currentChar = password[0]

  for (let i = 1; i < password.length; i++) {
    if (password[i] === currentChar) {
      count++
      if (count > maxRepeating) {
        return true
      }
    } else {
      count = 1
      currentChar = password[i]
    }
  }
  return false
}

function isCommonPassword(password: string): boolean {
  const lower = password.toLowerCase()
  return COMMON_PASSWORDS.has(lower) || 
         COMMON_PASSWORDS.has(lower.replace(/\d+$/, '')) ||
         /^password\d*$/i.test(password) ||
         /^123+$/i.test(password)
}

function containsPersonalInfo(password: string, userInfo: { name?: string; email?: string; studentId?: string }): boolean {
  const lower = password.toLowerCase()
  
  if (userInfo.name) {
    const nameParts = userInfo.name.toLowerCase().split(/\s+/)
    for (const part of nameParts) {
      if (part.length >= 3 && lower.includes(part)) {
        return true
      }
    }
  }

  if (userInfo.email) {
    const emailParts = userInfo.email.toLowerCase().split('@')[0]
    if (emailParts.length >= 3 && lower.includes(emailParts)) {
      return true
    }
  }

  if (userInfo.studentId && lower.includes(userInfo.studentId.toLowerCase())) {
    return true
  }

  return false
}

function containsObviousWords(password: string): boolean {
  const obviousWords = [
    'password', 'admin', 'user', 'login', 'welcome', 'hello', 'test',
    'student', 'school', 'college', 'university', 'dickinson'
  ]
  
  const lower = password.toLowerCase()
  return obviousWords.some(word => lower.includes(word))
}

function getPasswordStrength(score: number): 'weak' | 'medium' | 'strong' | 'very_strong' {
  if (score < 30) return 'weak'
  if (score < 60) return 'medium'
  if (score < 80) return 'strong'
  return 'very_strong'
}

export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const specials = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  const allChars = uppercase + lowercase + numbers + specials
  
  let password = ''
  
  // Ensure at least one of each required type
  password += uppercase[crypto.randomInt(uppercase.length)]
  password += lowercase[crypto.randomInt(lowercase.length)]
  password += numbers[crypto.randomInt(numbers.length)]
  password += specials[crypto.randomInt(specials.length)]
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[crypto.randomInt(allChars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => crypto.randomInt(3) - 1).join('')
}

export function checkPasswordCompromised(passwordHash: string): Promise<boolean> {
  // This would typically check against Have I Been Pwned API
  // For now, we'll return false but log that the check should be implemented
  console.warn('Password breach check not implemented. Consider integrating with Have I Been Pwned API.')
  return Promise.resolve(false)
}

export function getPasswordPolicyDescription(policy: PasswordPolicy = DEFAULT_POLICY): string[] {
  const requirements: string[] = []
  
  requirements.push(`Be ${policy.minLength}-${policy.maxLength} characters long`)
  
  if (policy.requireUppercase) requirements.push('Contain at least one uppercase letter')
  if (policy.requireLowercase) requirements.push('Contain at least one lowercase letter')
  if (policy.requireNumbers) requirements.push('Contain at least one number')
  if (policy.requireSpecialChars) requirements.push('Contain at least one special character')
  if (policy.disallowCommonPasswords) requirements.push('Not be a common password')
  if (policy.disallowPersonalInfo) requirements.push('Not contain personal information')
  
  requirements.push('Not have excessive repeating characters')
  requirements.push('Not contain sequential characters (e.g., abc, 123)')
  
  return requirements
}