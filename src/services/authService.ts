const SUPABASE_URL = 'https://mxywcwjiltmhyiueatfu.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14eXdjd2ppbHRtaHlpdWVhdGZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MDI1MzYsImV4cCI6MjA5ODQ3ODUzNn0.K2J9Aw0jJSGipOgjjGx7CHK8-iQ-SCzS5JSxOMRxpW8'

export interface UserInfo {
  id: string
  username: string
  role: string
  parent_id: string | null
}

interface LoginResult {
  user: UserInfo
  access_token: string
  refresh_token: string
  token_type: string
}

export async function login(username: string, password: string): Promise<UserInfo> {
  const res = await fetch(SUPABASE_URL + '/functions/v1/custom-login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ username, password }),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.error || '请求失败 (' + res.status + ')')
  }

  const data: LoginResult = await res.json()

  if (!data.access_token || !data.user) {
    throw new Error('登录响应格式错误')
  }

  localStorage.setItem('access_token', data.access_token)
  localStorage.setItem('user', JSON.stringify(data.user))

  return data.user
}

export function logout(): void {
  localStorage.removeItem('access_token')
  localStorage.removeItem('user')
}

export function getUser(): UserInfo | null {
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function getAccessToken(): string | null {
  return localStorage.getItem('access_token')
}
