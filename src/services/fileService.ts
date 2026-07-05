import { supabase } from '../lib/supabase'
import { getAccessToken } from './authService'
import { SUPABASE_URL, SUPABASE_ANON_KEY, authHeaders, authFetchWithTimeout } from '../utils/api'

function headers() { return authHeaders() }

export interface FileRecord {
  id: string
  title: string
  description: string | null
  file_url: string
  file_type: string | null
  uploaded_by: string
  created_at: string
}

export interface CreateFileData {
  title: string
  description: string | null
  file_url: string
  file_type: string | null
  uploaded_by: string
}

export async function fetchFiles(): Promise<FileRecord[]> {
  const res = await authFetchWithTimeout(SUPABASE_URL + '/rest/v1/files?select=*&order=created_at.desc', {
    headers: headers(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).message || '\u83b7\u53d6\u6587\u4ef6\u5217\u8868\u5931\u8d25')
  }
  return res.json()
}

export async function createFileRecord(data: CreateFileData): Promise<void> {
  const res = await authFetchWithTimeout(SUPABASE_URL + '/rest/v1/files', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).message || '\u4fdd\u5b58\u6587\u4ef6\u8bb0\u5f55\u5931\u8d25')
  }
}

export async function deleteFileRecord(id: string): Promise<void> {
  const res = await authFetchWithTimeout(SUPABASE_URL + '/rest/v1/files?id=eq.' + id, {
    method: 'DELETE',
    headers: headers(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).message || '\u5220\u9664\u6587\u4ef6\u8bb0\u5f55\u5931\u8d25')
  }
}

export async function uploadFileToStorage(file: File, filename: string): Promise<string> {
  const token = getAccessToken()
  const storageUrl = SUPABASE_URL + '/storage/v1/object/sales-files/' + encodeURIComponent(filename)
  const res = await authFetchWithTimeout(storageUrl, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + (token || ''),
      'Content-Type': file.type || 'application/octet-stream',
      'x-upsert': 'false',
    },
    body: file,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).message || (err as any).error || '\u4e0a\u4f20\u6587\u4ef6\u5931\u8d25')
  }

  await res.json()
  const publicUrl = SUPABASE_URL + '/storage/v1/object/public/sales-files/' + encodeURIComponent(filename)
  return publicUrl
}
