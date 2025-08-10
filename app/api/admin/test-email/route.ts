import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { emailService } from '@/lib/email-service'
import { logger } from '@/lib/logger'

// Test email endpoint for admins
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const adminError = await requireAdmin(request)
    if (adminError) {
      return NextResponse.json({ error: adminError.message }, { status: adminError.status })
    }

    const { testEmail } = await request.json()

    if (!testEmail) {
      return NextResponse.json({ 
        error: 'Test email address is required' 
      }, { status: 400 })
    }

    // Check email environment variables
    const emailConfig = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS ? '***CONFIGURED***' : undefined,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL
    }

    // Try to send a test email
    try {
      await emailService.sendPasswordReset(testEmail, 'test-token-123')
      
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        config: emailConfig
      })
    } catch (emailError: any) {
      logger.error('Email test failed:', emailError)
      
      return NextResponse.json({
        success: false,
        error: 'Failed to send test email',
        details: emailError.message,
        config: emailConfig
      }, { status: 500 })
    }

  } catch (error: any) {
    logger.error('Email test endpoint error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}