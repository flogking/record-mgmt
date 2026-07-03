import type { Record } from '../types/record'

const SUPABASE_URL = 'https://mxywcwjiltmhyiueatfu.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14eXdjd2ppbHRtaHlpdWVhdGZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MDI1MzYsImV4cCI6MjA5ODQ3ODUzNn0.K2J9Aw0jJSGipOgjjGx7CHK8-iQ-SCzS5JSxOMRxpW8'

function headers(): { [key: string]: string } {
  const token = localStorage.getItem('access_token')
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
  }
}

export async function fetchRecords(): Promise<Record[]> {
  const res = await fetch(SUPABASE_URL + '/rest/v1/records?select=*&order=created_at.desc', {
    headers: headers(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).message || '获取数据失败')
  }
  return res.json()
}

export interface RecordFormData {
  customer_name: string
  product: string
  amount: number
  record_date: string
  shipping_address: string
  record_time: string
  tracking_number: string | null
  remark: string | null
}

export async function createRecord(data: RecordFormData): Promise<Record> {
  const userRaw = localStorage.getItem('user')
  const user = userRaw ? JSON.parse(userRaw) : null
  const res = await fetch(SUPABASE_URL + '/rest/v1/records', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ ...data, user_id: user?.id }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).message || '创建失败')
  }
  return res.json()
}

export async function updateRecord(id: string, data: Partial<RecordFormData>): Promise<void> {
  const res = await fetch(SUPABASE_URL + '/rest/v1/records?id=eq.' + id, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).message || '更新失败')
  }
}

export async function deleteRecord(id: string): Promise<void> {
  const res = await fetch(SUPABASE_URL + '/rest/v1/records?id=eq.' + id, {
    method: 'DELETE',
    headers: headers(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).message || '删除失败')
  }
}
