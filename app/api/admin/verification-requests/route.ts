import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-error'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const adminError = await requireAdmin(request)
    if (adminError) {
      return createErrorResponse(adminError)
    }
    
    const verificationRequestsFile = path.join(process.cwd(), 'data', 'verification-requests.json')
    let requests = []
    
    if (fs.existsSync(verificationRequestsFile)) {
      const data = fs.readFileSync(verificationRequestsFile, 'utf8')
      requests = JSON.parse(data)
    }

    // Sort by most recent first
    requests.sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())

    return createSuccessResponse({ requests }, 'Verification requests retrieved successfully')
  } catch (error) {
    return handleApiError(error, 'GET /api/admin/verification-requests')
  }
}