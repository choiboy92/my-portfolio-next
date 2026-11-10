const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15'

export class FetchFailedError extends Error {
  url: string
  readonly status?: number
  constructor(url: string, reason: string, status?: number) {
    super(`Request failed for ${url}: ${reason}`)
    this.name = 'FetchFailedError'
    this.url = url
    this.status = status
  }
}

export interface Fetcher {
  text(url: string): Promise<string>
  json<T = unknown>(url: string): Promise<T>
  readonly requestCount: number
}

export type FetcherOptions = {
  fetch?: typeof fetch
  sleep?: (ms: number) => Promise<void>
  delayMs?: number
  retries?: number
  userAgent?: string
}

export function createFetcher(opts: FetcherOptions = {}): Fetcher {
  const doFetch = opts.fetch ?? fetch
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)))
  const delayMs = opts.delayMs ?? 1500
  const retries = opts.retries ?? 4
  const userAgent = opts.userAgent ?? DEFAULT_USER_AGENT
  let requestCount = 0
  let started = false

  async function text(url: string): Promise<string> {
    let lastReason = 'unknown error'
    let lastStatus: number | undefined
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) await sleep(2000 * 2 ** (attempt - 1))
      else if (started) await sleep(delayMs)
      started = true
      requestCount++
      try {
        const res = await doFetch(url, {
          headers: {
            'user-agent': userAgent,
            accept: 'application/json, text/html, */*',
          },
        })
        if (res.ok) return await res.text()
        lastReason = `HTTP ${res.status}`
        lastStatus = res.status
        if (res.status !== 429 && res.status < 500) throw new FetchFailedError(url, lastReason, res.status)
      } catch (err) {
        if (err instanceof FetchFailedError) throw err
        lastReason = err instanceof Error ? err.message : String(err)
        lastStatus = undefined
      }
    }
    throw new FetchFailedError(url, `${lastReason} after ${retries + 1} attempts`, lastStatus)
  }

  return {
    text,
    async json<T = unknown>(url: string): Promise<T> {
      const body = await text(url)
      try {
        return JSON.parse(body) as T
      } catch {
        throw new FetchFailedError(url, 'response was not valid JSON')
      }
    },
    get requestCount() {
      return requestCount
    },
  }
}
