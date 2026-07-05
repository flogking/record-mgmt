export const SUPABASE_URL = 'https://mxywcwjiltmhyiueatfu.supabase.co'
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14eXdjd2ppbHRtaHlpdWVhdGZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MDI1MzYsImV4cCI6MjA5ODQ3ODUzNn0.K2J9Aw0jJSGipOgjjGx7CHK8-iQ-SCzS5JSxOMRxpW8'

let _onExpired: (() => void) | null = null
export function onJwtExpired(cb: () => void) { _onExpired = cb }

export function authHeaders(): Record<string, string> {
  const t = localStorage.getItem('access_token')
  return { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, ...(t ? { Authorization: 'Bearer ' + t } : {}) }
}

export async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  // Clone response so body can be re-read after JWT check
  const res = await fetch(url, init)
  if (res.status === 401) {
    const clone = res.clone()
    const body = await clone.text().catch(() => '')
    if (body.toLowerCase().includes('jwt') || body.toLowerCase().includes('expired') || body.toLowerCase().includes('token')) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      if (_onExpired) _onExpired()
      throw new Error('\u767b\u5f55\u5df2\u8fc7\u671f\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55')
    }
  }
  return res
}

// Fetch with timeout (default 15s) to avoid infinite hanging
export async function authFetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await authFetch(url, { ...init, signal: controller.signal })
  } catch (err: any) {
    if (err.name === 'AbortError') throw new Error('\u8bf7\u6c42\u8d85\u65f6\uff0c\u8bf7\u68c0\u67e5\u7f51\u7edc\u540e\u91cd\u8bd5')
    throw err
  } finally {
    clearTimeout(timer)
  }
}