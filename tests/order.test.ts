import { test, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { SignJWT } from 'jose'
import { POST } from '@/app/api/epp/order/route'
import { escapeStrings } from '@/lib/escape-html'
import { orderSchema } from '@/lib/validation-schema'
import { AUTH_COOKIE } from '@/lib/auth'
import { PRODUCT_CONFIGURATIONS, priceBasketItem } from '@/lib/product-config'
import { cheapestItem, macbookItem as macbook, validItem, validOrder, watchItem as watch } from './fixtures/order'

const send = vi.hoisted(() => vi.fn())
vi.mock('resend', () => ({ Resend: vi.fn(function () { return { emails: { send } } }) }))

const SECRET = '0123456789abcdef0123456789abcdef'

beforeEach(() => {
  send.mockReset().mockResolvedValue({ data: { id: 're_1' }, error: null })
  vi.stubEnv('JWT_SECRET', SECRET)
  vi.stubEnv('RESEND_API_KEY', 're_test')
  vi.stubEnv('EMAIL_FROM', 'from@example.com')
  vi.stubEnv('EMAIL_TO', 'to@example.com')
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

async function submit(body: unknown) {
  const token = await new SignJWT({ authorized: true }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('1h').sign(new TextEncoder().encode(SECRET))
  return POST(new NextRequest('http://x/api/epp/order', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body), headers: { cookie: `${AUTH_COOKIE}=${token}` } }))
}
const sent = () => send.mock.calls[0][0] as { text: string; html: string }
const muteConsole = () =>
  [vi.spyOn(console, 'log'), vi.spyOn(console, 'info'), vi.spyOn(console, 'error')].map(spy => spy.mockImplementation(() => {}))

test('escapeStrings escapes nested strings', () => {
  expect(escapeStrings({ a: [`O'Brien & <Sons>`], n: 1, b: true })).toEqual({ a: ['O&#39;Brien &amp; &lt;Sons&gt;'], n: 1, b: true })
})
test('schema rejects orderComments and enforces limits', () => {
  expect(orderSchema.safeParse(validOrder()).success).toBe(true)
  expect(orderSchema.safeParse({ ...validOrder(), orderComments: 'x' }).success).toBe(false)
  expect(orderSchema.safeParse(validOrder({ basket: Array.from({ length: 21 }, () => validItem()) })).success).toBe(false)
  expect(orderSchema.safeParse(validOrder({ additionalComments: 'x'.repeat(1001) })).success).toBe(false)
  expect(orderSchema.safeParse(validOrder({ basket: [validItem({ estimatedPrice: -1 })] })).success).toBe(false)
})
test('schema rejects a boolean appleCare', () => {
  expect(orderSchema.safeParse(validOrder({ basket: [{ ...validItem(), appleCare: true as unknown as string }] })).success).toBe(false)
})
test('accepts the legacy appleCare: false from an open old tab', async () => {
  muteConsole()
  const res = await submit(validOrder({ basket: [{ ...validItem(), appleCare: false as unknown as string }] }))
  expect(res.status).toBe(200)
  expect(sent().text).not.toContain('AppleCare+:')
})
test('rejects appleCare: true with 400', async () => {
  muteConsole()
  const res = await submit(validOrder({ basket: [{ ...validItem(), appleCare: true as unknown as string }] }))
  expect(res.status).toBe(400)
  expect(send).not.toHaveBeenCalled()
})
test('emails the chosen AppleCare+ tier', async () => {
  muteConsole()
  const item = cheapestItem('iPhone', (_, spec) => spec.appleCare.length > 0)
  const model = PRODUCT_CONFIGURATIONS.iPhone.models[item.model]
  const tier = model.specs.find(s => s.name === item.specs)!.appleCare[0]
  const price = Number.isInteger(tier.price) ? `${tier.price}` : tier.price.toFixed(2)
  const res = await submit(validOrder({ basket: [{ ...item, appleCare: tier.name }] }))
  expect(res.status).toBe(200)
  expect(sent().text).toContain(`AppleCare+: ${tier.name} (£${price}/${tier.billing === 'monthly' ? 'month' : 'year'}, not discounted`)
  expect(sent().html).toContain(tier.name)
  expect(sent().html).toContain(`Apple part ${tier.partNumber}`)
})
test('emails the Mac standard-config part number from the catalogue', async () => {
  muteConsole()
  const item = cheapestItem('MacBook', (_, s) => !!s.partNumber)
  const spec = PRODUCT_CONFIGURATIONS.MacBook.models[item.model].specs.find(s => s.name === item.specs)!
  const res = await submit(validOrder({ basket: [{ ...item, partNumber: 'FORGED' } as typeof item] }))
  expect(res.status).toBe(200)
  expect(sent().text).toContain(`Standard-config part number: ${spec.partNumber}`)
  expect(sent().html).toMatch(new RegExp(`<strong>Standard-config part number:</strong> <span[^>]*>${spec.partNumber}</span>`))
  expect(sent().text).not.toContain('FORGED')
})
test('schema requires confirmation', () => {
  expect(orderSchema.safeParse(validOrder({ checkCompleted: false })).success).toBe(false)
})
test('returns 401 without a session', async () => {
  const res = await POST(new NextRequest('http://x/api/epp/order', { method: 'POST', body: JSON.stringify(validOrder()) }))
  expect(res.status).toBe(401)
  expect(send).not.toHaveBeenCalled()
})
test('overwrites client prices', async () => {
  muteConsole()
  const res = await submit(validOrder({ basket: [validItem({ estimatedPrice: 1, discountValue: 999999 })] }))
  expect(res.status).toBe(200)
  const { estimatedPrice, discountValue } = priceBasketItem(validItem())
  expect(sent().html).toContain(`£${estimatedPrice.toLocaleString()}`)
  expect(sent().html).toContain(`£${discountValue.toLocaleString()}`)
  expect(sent().html).not.toContain('999,999')
})
test('delivers comments and every option', async () => {
  muteConsole()
  await submit(validOrder({ basket: [macbook] }))
  expect(sent().text).toContain('Please engrave')
  expect(sent().text).toContain(`Memory: ${macbook.memory}`)
  expect(sent().text).toContain(`Charger: ${macbook.charger}`)
})
test('escapes user input in the html body', async () => {
  muteConsole()
  const order = validOrder({ additionalComments: '<script>x</script>' })
  if (order.delivery.method === 'delivery') order.delivery.address.surname = "O'Brien & Sons"
  await submit(order)
  expect(sent().html).toContain('O&#39;Brien &amp; Sons')
  expect(sent().html).toContain('&lt;script&gt;')
  expect(sent().html).not.toContain('<script>')
  expect(sent().text).toContain("O'Brien & Sons")
})
test('shows band size, not style', async () => {
  muteConsole()
  await submit(validOrder({ basket: [watch] }))
  expect(sent().html).toContain(`Size: ${watch.band!.size}`)
  expect(sent().html).not.toContain(`Size: ${watch.band!.style}`)
})
test('rejects unknown products', async () => {
  const res = await submit(validOrder({ basket: [validItem({ model: 'iPhone 99' })] }))
  expect(res.status).toBe(400)
  expect((await res.json()).details[0].field).toBe('basket.0')
  expect(send).not.toHaveBeenCalled()
})
test('rejects prototype-key category and model as unknown products', async () => {
  for (const item of [validItem({ model: 'constructor' }), validItem({ category: 'constructor' }), validItem({ category: 'toString', appleCare: 'AppleCare+' })]) {
    const res = await submit(validOrder({ basket: [item] }))
    expect(res.status).toBe(400)
  }
  expect(send).not.toHaveBeenCalled()
})
test('rejects options the configuration does not offer', async () => {
  for (const item of [
    validItem({ storage: 'NOPE' }),
    validItem({ color: 'Hot Pink' }),
    { ...macbook, memory: '8GB' },
    { ...watch, connectivity: 'NOPE' },
    { ...watch, band: { ...watch.band!, color: 'Tartan' } },
  ]) {
    const res = await submit(validOrder({ basket: [item] }))
    expect(res.status).toBe(400)
  }
  expect(send).not.toHaveBeenCalled()
})
test('returns 502 when Resend returns an error', async () => {
  muteConsole()
  send.mockResolvedValue({ data: null, error: { name: 'rate_limit_exceeded', message: 'x' } })
  const res = await submit(validOrder())
  expect(res.status).toBe(502)
  expect(console.error).toHaveBeenCalledWith('EPP order email failed', { orderId: expect.any(String), name: 'rate_limit_exceeded' })
})
test('never logs contact details', async () => {
  const spies = muteConsole()
  await submit(validOrder())
  send.mockResolvedValue({ data: null, error: { name: 'rate_limit_exceeded', message: 'buyer@example.com' } })
  await submit(validOrder())
  send.mockRejectedValue(new Error('boom'))
  await submit(validOrder())
  const calls = spies.flatMap(spy => spy.mock.calls)
  expect(calls.length).toBeGreaterThan(0)
  expect(calls.some(args => JSON.stringify(args).includes('buyer@example.com'))).toBe(false)
})
test('rejects malformed JSON without logging the body', async () => {
  const spies = muteConsole()
  const res = await submit('buyer@example.com')
  expect(res.status).toBe(400)
  expect(send).not.toHaveBeenCalled()
  expect(spies.flatMap(spy => spy.mock.calls).some(args => JSON.stringify(args).includes('buyer@example.com'))).toBe(false)
})
