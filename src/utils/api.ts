export const SUPABASE_URL = 'https://mxywcwjiltmhyiueatfu.supabase.co'
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14eXdjd2ppbHRtaHlpdWVhdGZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MDI1MzYsImV4cCI6MjA5ODQ3ODUzNn0.K2J9Aw0jJSGipOgjjGx7CHK8-iQ-SCzS5JSxOMRxpW8'

let _onExpired: (() => void) | null = null
export function onJwtExpired(cb: () => void) { _onExpired = cb }

export function authHeaders(): Record<string, string> {
  const t = localStorage.getItem('access_token')
  return { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, ...(t ? { Authorization: 'Bearer ' + t } : {}) }
}

export async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, init)
  if (res.status === 401) {
    const body = await res.text().catch(() => '')
    if (body.toLowerCase().includes('jwt') || body.toLowerCase().includes('expired') || body.toLowerCase().includes('token')) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      if (_onExpired) _onExpired()
      throw new Error('登录已过期，请重新登录')
    }
  }
  return res
}