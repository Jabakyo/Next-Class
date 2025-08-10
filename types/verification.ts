export interface EmailVerificationToken {
  id: string
  email: string
  token: string
  userData: {
    name: string
    studentId: string
    password: string // Already hashed
    year: string
    major: string
    selectedClasses: any[]
  }
  createdAt: string
  expiresAt: string
  used: boolean
}