import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { SignJWT } from 'jose'
import { AUTH_COOKIE } from '@/lib/auth'
import { skuKey } from '@/lib/catalogue/helpers'
import type { BasketItemFormData, OrderFormData } from '@/lib/validation-schema'

const send = vi.hoisted(() => vi.fn())
vi.mock('resend', () => ({ Resend: vi.fn(function () { return { emails: { send } } }) }))

vi.mock('@/lib/product-config', async () => {
  const { makeCatalogueHelpers, skuKey: key } = await import('@/lib/catalogue/helpers')
  const { testCatalogue } = await import('./fixtures/test-catalogue')
  const catalogue = structuredClone(testCatalogue)
  const phone = catalogue.categories.iPhone.models['Phone X']
  phone.colors = ['Silver', 'Blue']
  Object.assign(phone.specs[0], {
    partNumber: 'BASE1QN/A',
    partNumbers: {
      [key({ color: 'Silver', storage: '256GB' })]: 'BASE1QN/A',
      [key({ color: 'Blue', storage: '512GB' })]: 'BLUE5QN/A',
    },
  })
  Object.assign(catalogue.categories.MacBook.models['Book 16"'].specs[0], {
    partNumber: 'MAC01B/A',
    includes: ['Mouse <wireless>'],
    appleCare: [{ name: 'AppleCare+ (Monthly)', price: 14.99, billing: 'monthly', partNumber: 'SD433ZM/A' }],
  })
  return { ...makeCatalogueHelpers(catalogue), PRODUCT_CONFIGURATIONS: catalogue.categories }
})

const { POST } = await import('@/app/api/epp/order/route')

const SECRET = '0123456789abcdef0123456789abcdef'

beforeEach(() => {
  send.mockReset().mockResolvedValue({ data: { id: 're_1' }, error: null })
  vi.stubEnv('JWT_SECRET', SECRET)
  vi.stubEnv('RESEND_API_KEY', 're_test')
  vi.stubEnv('EMAIL_FROM', 'from@example.com')
  vi.stubEnv('EMAIL_TO', 'to@example.com')
  vi.spyOn(console, 'info').mockImplementation(() => {})
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

function order(item: BasketItemFormData): OrderFormData {
  return {
    basket: [item],
    delivery: {
      method: 'delivery',
      address: { title: 'Mr', firstName: 'Sam', surname: 'Lee', line1: '1 High St', city: 'London', postcode: 'SW1A 1AA' },
      contact: { email: 'buyer@example.com', phone: '07700900123' },
    },
    checkCompleted: true,
  }
}

async function submit(item: BasketItemFormData) {
  const token = await new SignJWT({ authorized: true }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('1h').sign(new TextEncoder().encode(SECRET))
  const res = await POST(
    new NextRequest('http://x/api/epp/order', { method: 'POST', body: JSON.stringify(order(item)), headers: { cookie: `${AUTH_COOKIE}=${token}` } }),
  )
  expect(res.status).toBe(200)
  return send.mock.calls[0][0] as { text: string; html: string }
}

const phone = (color: string, storage: string): BasketItemFormData => ({ category: 'iPhone', model: 'Phone X', specs: 'Phone X', color, storage })
const mac: BasketItemFormData = {
  category: 'MacBook',
  model: 'Book 16"',
  specs: 'Chip A',
  color: 'Space Black',
  memory: '24GB',
  storage: '512GB',
  charger: '70W',
}

test('skuKey joins colour, storage, connectivity and glass', () => {
  expect(skuKey({ color: 'Blue', storage: '512GB' })).toBe('Blue|512GB||')
  expect(skuKey({ color: 'Silver', storage: '1TB', connectivity: 'Wi-Fi + Cellular', nanoTexture: true })).toBe('Silver|1TB|Wi-Fi + Cellular|nano')
})

test('emails the exact Apple part number of the iPhone configuration ordered', async () => {
  const { text, html } = await submit(phone('Blue', '512GB'))
  expect(text).toContain('Apple part number: BLUE5QN/A')
  expect(text).not.toContain('BASE1QN/A')
  expect(html).toMatch(/<strong>Apple part number:<\/strong> <span[^>]*>BLUE5QN\/A<\/span>/)
  expect(html).not.toContain('BASE1QN/A')
})

test('prints no part number for an iPhone configuration with no exact SKU', async () => {
  const { text, html } = await submit(phone('Silver', '512GB'))
  expect(text).not.toContain('part number')
  expect(html).not.toContain('part number')
})

test('labels a Mac part number as the standard configuration', async () => {
  const { text, html } = await submit(mac)
  expect(text).toContain('Standard-config part number: MAC01B/A')
  expect(text).not.toContain('Apple part number')
  expect(html).toMatch(/<strong>Standard-config part number:<\/strong> <span[^>]*>MAC01B\/A<\/span>/)
})

test('emails bundled extras, escaped in the html body', async () => {
  const { text, html } = await submit(mac)
  expect(text).toContain('Includes: Mouse <wireless>')
  expect(html).toContain('Includes:</strong> <span style="color: #6c757d;">Mouse &lt;wireless&gt;</span>')
  expect(html).not.toContain('<wireless>')
})

test('emails the AppleCare+ price, period and part number in both bodies', async () => {
  const { text, html } = await submit({ ...mac, appleCare: 'AppleCare+ (Monthly)' })
  expect(text).toContain('AppleCare+: AppleCare+ (Monthly) (£14.99/month, not discounted, Apple part SD433ZM/A)')
  expect(html).toContain('AppleCare+ (Monthly) (£14.99/month, not discounted, Apple part SD433ZM/A)')
})
