import type { UserInfo } from './authService'

const SUPABASE_URL = 'https://mxywcwjiltmhyiueatfu.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14eXdjd2ppbHRtaHlpdWVhdGZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MDI1MzYsImV4cCI6MjA5ODQ3ODUzNn0.K2J9Aw0jJSGipOgjjGx7CHK8-iQ-SCzS5JSxOMRxpW8'

function headers(): Record<string, string> {
  const token = localStorage.getItem('access_token')
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
  }
}

export interface UserInfoWithMeta extends UserInfo {
  created_at: string
}

export async function fetchUsers(): Promise<UserInfoWithMeta[]> {
  const res = await fetch(SUPABASE_URL + '/rest/v1/users?select=id,username,role,parent_id,created_at&order=created_at.desc', {
    headers: headers(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).message || '获取用户列表失败')
  }
  return res.json()
}

export async function fetchAgent1List(): Promise<UserInfo[]> {
  const res = await fetch(SUPABASE_URL + '/rest/v1/users?select=id,username,role&role=eq.agent_1&order=username.asc', {
    headers: headers(),
  })
  if (!res.ok) return []
  return res.json()
}

export interface CreateUserForm {
  username: string
  password: string
  role: 'agent_1' | 'agent_2'
  parent_id?: string
}

export interface UpdateUserForm {
  username?: string
  password?: string
  role?: string
  parent_id?: string | null
}

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function createUser(form: CreateUserForm): Promise<void> {
  const password_hash = await sha256(form.password)
  const body: Record<string, any> = {
    username: form.username,
    password_hash: password_hash,
    role: form.role,
  }
  if (form.role === 'agent_2' && form.parent_id) {
    body.parent_id = form.parent_id
  }
  const res = await fetch(SUPABASE_URL + '/rest/v1/users', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).message || '创建用户失败')
  }
}

export async function updateUser(id: string, form: UpdateUserForm): Promise<void> {
  const body: Record<string, any> = {}
  if (form.username !== undefined) body.username = form.username
  if (form.password) body.password_hash = await sha256(form.password)
  if (form.role !== undefined) body.role = form.role
  if (form.parent_id !== undefined) body.parent_id = form.parent_id

  const res = await fetch(SUPABASE_URL + '/rest/v1/users?id=eq.' + id, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).message || '更新用户失败')
  }
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(SUPABASE_URL + '/rest/v1/users?id=eq.' + id, {
    method: 'DELETE',
    headers: headers(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).message || '删除用户失败')
  }
}
