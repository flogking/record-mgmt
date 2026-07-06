import type { UserInfo } from './authService'
import { SUPABASE_URL, SUPABASE_ANON_KEY, authHeaders, authFetchWithTimeout } from '../utils/api'

function headers() { return authHeaders() }

export interface UserInfoWithMeta extends UserInfo {
  created_at: string
}

export async function fetchUsers(): Promise<UserInfoWithMeta[]> {
  const res = await authFetchWithTimeout(SUPABASE_URL + '/rest/v1/users?select=id,username,role,parent_id,created_at&order=created_at.desc', {
    headers: headers(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).message || '\u83b7\u53d6\u7528\u6237\u5217\u8868\u5931\u8d25')
  }
  return res.json()
}

export async function fetchAgent1List(): Promise<UserInfo[]> {
  const res = await authFetchWithTimeout(SUPABASE_URL + '/rest/v1/users?select=id,username,role&role=eq.agent_1&order=username.asc', {
    headers: headers(),
  })
  if (!res.ok) return []
  return res.json()
}

export interface CreateUserForm {
  username: string
  password: string
  role: 'agent_1' | 'agent_2' | 'client'
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


export async function fetchParentCandidates(): Promise<UserInfo[]> {
  const res = await authFetchWithTimeout(SUPABASE_URL + '/rest/v1/users?select=id,username,role&role=in.(agent_1,agent_2)&order=username.asc', {
    headers: headers(),
  })
  if (!res.ok) return []
  return res.json()
}

export async function createUser(form: CreateUserForm): Promise<void> {
  const password_hash = await sha256(form.password)
  const body: Record<string, any> = {
    username: form.username,
    password_hash: password_hash,
    role: form.role,
  }
  if (form.parent_id) {
    body.parent_id = form.parent_id
  }
  const res = await authFetchWithTimeout(SUPABASE_URL + '/rest/v1/users', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).message || '\u521b\u5efa\u7528\u6237\u5931\u8d25')
  }
}

export async function updateUser(id: string, form: UpdateUserForm): Promise<void> {
  const body: Record<string, any> = {}
  if (form.username !== undefined) body.username = form.username
  if (form.password) body.password_hash = await sha256(form.password)
  if (form.role !== undefined) body.role = form.role
  if (form.parent_id !== undefined) body.parent_id = form.parent_id

  const res = await authFetchWithTimeout(SUPABASE_URL + '/rest/v1/users?id=eq.' + id, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).message || '\u66f4\u65b0\u7528\u6237\u5931\u8d25')
  }
}

export async function deleteUser(id: string): Promise<void> {
  const res = await authFetchWithTimeout(SUPABASE_URL + '/rest/v1/users?id=eq.' + id, {
    method: 'DELETE',
    headers: headers(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).message || '\u5220\u9664\u7528\u6237\u5931\u8d25')
  }
}
