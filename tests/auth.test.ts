import { test, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { createHmac } from 'node:crypto'
import { verifyPassword, isAuthenticated } from '@/lib/auth'
import { GET, POST } from '@/app/api/auth/epp/route'

const SECRET = '0123456789abcdef0123456789abcdef'
beforeEach(() => { vi.stubEnv('JWT_SECRET', SECRET); vi.stubEnv('EPP_PORTAL_PASSWORD', 'hunter22') })
afterEach(() => vi.unstubAllEnvs())

const login = (body: string) => POST(new NextRequest('http://x/api/auth/epp', { method: 'POST', body }))
const withCookie = (token: string) => new NextRequest('http://x/', { headers: { cookie: `auth-token=${token}` } })

test('verifyPassword accepts only the exact password', () => {
  expect([verifyPassword('hunter22'), verifyPassword('hunter2'), verifyPassword(undefined), verifyPassword(12345678)]).toEqual([true, false, false, false])
})
test('login fails closed when EPP_PORTAL_PASSWORD is unset', async () => {
  vi.stubEnv('EPP_PORTAL_PASSWORD', '')
  const res = await login('{}')
  expect(res.status).toBe(500)
  expect(res.headers.get('set-cookie')).toBeNull()
})
test('login fails closed when JWT_SECRET is short', async () => {
  vi.stubEnv('JWT_SECRET', 'short')
  expect((await login('{"password":"hunter22"}')).status).toBe(500)
})
test('login sets the session cookie for the right password', async () => {
  const res = await login('{"password":"hunter22"}')
  expect(res.status).toBe(200)
  expect(res.headers.get('set-cookie')).toMatch(/auth-token=.+HttpOnly.+SameSite=strict/i)
  expect((await login('{"password":"nope"}')).status).toBe(401)
  expect((await login('{')).status).toBe(400)
})
const forgeWithKey = (key: string) => {
  const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')
  const unsigned = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ authorized: true, exp: Math.floor(Date.now() / 1000) + 3600 })}`
  return `${unsigned}.${createHmac('sha256', key).update(unsigned).digest('base64url')}`
}
test('isAuthenticated rejects a token signed with a short key', async () => {
  vi.stubEnv('JWT_SECRET', 'short')
  expect(await isAuthenticated(withCookie(forgeWithKey('short')))).toBe(false)
})
test('GET reports a session from a successful login', async () => {
  const cookie = (await login('{"password":"hunter22"}')).cookies.get('auth-token')!.value
  expect(await (await GET(withCookie(cookie))).json()).toEqual({ authenticated: true })
  vi.stubEnv('JWT_SECRET', 'short')
  expect(await (await GET(withCookie(forgeWithKey('short')))).json()).toEqual({ authenticated: false })
})
