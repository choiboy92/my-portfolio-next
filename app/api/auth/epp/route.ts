// app/api/auth/epp/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { AUTH_COOKIE, getJwtSecret, isAuthenticated, verifyPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const secret = getJwtSecret()
  if (!secret || !process.env.EPP_PORTAL_PASSWORD) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  let password: unknown
  try {
    ;({ password } = await request.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!verifyPassword(password)) {
    return NextResponse.json(
      { error: 'Invalid password' },
      { status: 401 }
    )
  }

  try {
    const token = await new SignJWT({ authorized: true })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .setIssuedAt()
      .sign(secret)

    const response = NextResponse.json({ success: true })

    response.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 // 24 hours
    })

    return response
  } catch {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ authenticated: await isAuthenticated(request) })
}
