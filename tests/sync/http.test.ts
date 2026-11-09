import { describe, expect, it } from 'vitest'
import { createFetcher, FetchFailedError } from '@/scripts/catalogue/http'

function fakeFetch(statuses: (number | 'network')[], body = 'ok') {
  const calls: { url: string; headers: Record<string, string> }[] = []
  let i = 0
  const impl = (async (url: string, init?: RequestInit) => {
    calls.push({ url, headers: (init?.headers ?? {}) as Record<string, string> })
    const s = statuses[Math.min(i++, statuses.length - 1)]
    if (s === 'network') throw new TypeError('fetch failed')
    return new Response(s === 200 ? body : 'err', { status: s })
  }) as unknown as typeof fetch
  return { impl, calls }
}

function recorder() {
  const sleeps: number[] = []
  return { sleeps, sleep: async (ms: number) => void sleeps.push(ms) }
}

describe('createFetcher', () => {
  it('succeeds after two 503s with exponential backoff', async () => {
    const { impl } = fakeFetch([503, 503, 200], 'hello')
    const { sleeps, sleep } = recorder()
    const f = createFetcher({ fetch: impl, sleep })
    expect(await f.text('https://x.test/a')).toBe('hello')
    expect(sleeps).toContain(2000)
    expect(sleeps).toContain(4000)
    expect(f.requestCount).toBe(3)
  })

  it('throws FetchFailedError after 5 failed attempts', async () => {
    const { impl } = fakeFetch([500])
    const { sleeps, sleep } = recorder()
    const f = createFetcher({ fetch: impl, sleep })
    const err = await f.text('https://x.test/a').catch((e) => e)
    expect(err).toBeInstanceOf(FetchFailedError)
    expect(err.url).toBe('https://x.test/a')
    expect(f.requestCount).toBe(5)
    expect(sleeps).toEqual([2000, 4000, 8000, 16000])
  })

  it('retries network errors and 429', async () => {
    const { impl } = fakeFetch(['network', 429, 200])
    const { sleep } = recorder()
    const f = createFetcher({ fetch: impl, sleep })
    expect(await f.text('https://x.test/a')).toBe('ok')
    expect(f.requestCount).toBe(3)
  })

  it('does not retry a 404', async () => {
    const { impl } = fakeFetch([404])
    const { sleep } = recorder()
    const f = createFetcher({ fetch: impl, sleep })
    await expect(f.text('https://x.test/a')).rejects.toBeInstanceOf(FetchFailedError)
    expect(f.requestCount).toBe(1)
  })

  it('records the HTTP status on a 404 and on exhausted 503 retries', async () => {
    const missing = createFetcher({ fetch: fakeFetch([404]).impl, sleep: recorder().sleep })
    const e404 = await missing.text('https://x.test/a').catch(e => e)
    expect((e404 as FetchFailedError).status).toBe(404)
    const down = createFetcher({ fetch: fakeFetch([503, 503, 503, 503, 503]).impl, sleep: recorder().sleep })
    const e503 = await down.text('https://x.test/a').catch(e => e)
    expect((e503 as FetchFailedError).status).toBe(503)
  })

  it('sleeps at least delayMs between consecutive requests', async () => {
    const { impl } = fakeFetch([200])
    const { sleeps, sleep } = recorder()
    const f = createFetcher({ fetch: impl, sleep, delayMs: 1500 })
    await f.text('https://x.test/a')
    expect(sleeps).toEqual([])
    await f.text('https://x.test/b')
    expect(sleeps).toHaveLength(1)
    expect(sleeps[0]).toBeGreaterThanOrEqual(1500)
  })

  it('sends the user-agent header', async () => {
    const { impl, calls } = fakeFetch([200])
    const { sleep } = recorder()
    const f = createFetcher({ fetch: impl, sleep, userAgent: 'TestAgent/1' })
    await f.text('https://x.test/a')
    expect(calls[0].headers['user-agent']).toBe('TestAgent/1')
  })

  it('parses json', async () => {
    const { impl } = fakeFetch([200], '{"a":1}')
    const { sleep } = recorder()
    const f = createFetcher({ fetch: impl, sleep })
    expect(await f.json<{ a: number }>('https://x.test/a')).toEqual({ a: 1 })
  })
})
