import { NextRequest, NextResponse } from 'next/server'
import { ownerLogin } from '@/lib/owner-auth'
import { z } from 'zod'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validationResult = loginSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }
    
    const { username, password } = validationResult.data
    
    // Attempt login
    const result = await ownerLogin(username, password)
    
    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      )
    }
    
    // Return token on successful login
    return NextResponse.json({
      token: result.token,
      message: 'Owner authentication successful'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}