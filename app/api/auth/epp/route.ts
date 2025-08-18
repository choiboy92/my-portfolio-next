// app/api/auth/epp/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    
    if (password === process.env.EPP_PORTAL_PASSWORD) {
      // Create JWT token for session
      const token = await new SignJWT({ authorized: true })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('24h')
        .setIssuedAt()
        .sign(secret)

      const response = NextResponse.json({ success: true })
      
      // Set secure HTTP-only cookie
      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 // 24 hours
      })

      return response
    }
    
    return NextResponse.json(
      { error: 'Invalid password' },
      { status: 401 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

// Verify session endpoint
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ authenticated: false })
    }

    await jwtVerify(token, secret)
    return NextResponse.json({ authenticated: true })
  } catch {
    return NextResponse.json({ authenticated: false })
  }
}
