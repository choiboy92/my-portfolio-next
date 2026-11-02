import { createHash, timingSafeEqual } from 'node:crypto'
import { jwtVerify } from 'jose'
import type { NextRequest } from 'next/server'

export const AUTH_COOKIE = 'auth-token'

export function getJwtSecret(): Uint8Array | null {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? '')
  return secret.length >= 32 ? secret : null
}

const sha256 = (value: string) => createHash('sha256').update(value).digest()

export function verifyPassword(candidate: unknown): boolean {
  const expected = process.env.EPP_PORTAL_PASSWORD
  if (!expected || typeof candidate !== 'string') return false
  return timingSafeEqual(sha256(candidate), sha256(expected))
}

export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const secret = getJwtSecret()
  const token = request.cookies.get(AUTH_COOKIE)?.value
  if (!secret || !token) return false
  try {
    await jwtVerify(token, secret, { algorithms: ['HS256'] })
    return true
  } catch {
    return false
  }
}
