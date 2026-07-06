import type { Record } from '../types/record'
import { SUPABASE_URL, SUPABASE_ANON_KEY, authHeaders, authFetchWithTimeout } from '../utils/api'

function headers() { return authHeaders() }

export async function fetchRecords(): Promise<Record[]> {
  const res = await authFetchWithTimeout(SUPABASE_URL + '/rest/v1/records?select=*&order=created_at.desc', {
    headers: headers(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).message || '\u83b7\u53d6\u6570\u636e\u5931\u8d25')
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
  phone: string | null
  business_type: string | null
  remark: string | null
}

export async function createRecord(data: RecordFormData): Promise<Record> {
  const userRaw = localStorage.getItem('user')
  const user = userRaw ? JSON.parse(userRaw) : null
  const res = await authFetchWithTimeout(SUPABASE_URL + '/rest/v1/records', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ ...data, user_id: user?.id }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).message || '\u521b\u5efa\u5931\u8d25')
  }
  return res.json()
}

export async function updateRecord(id: string, data: Partial<RecordFormData>): Promise<void> {
  const res = await authFetchWithTimeout(SUPABASE_URL + '/rest/v1/records?id=eq.' + id, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).message || '\u66f4\u65b0\u5931\u8d25')
  }
}

export async function deleteRecord(id: string): Promise<void> {
  const res = await authFetchWithTimeout(SUPABASE_URL + '/rest/v1/records?id=eq.' + id, {
    method: 'DELETE',
    headers: headers(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).message || '\u5220\u9664\u5931\u8d25')
  }
}
