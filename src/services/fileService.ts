import { supabase } from '../lib/supabase'
import { getAccessToken } from './authService'

const SUPABASE_URL = 'https://mxywcwjiltmhyiueatfu.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14eXdjd2ppbHRtaHlpdWVhdGZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MDI1MzYsImV4cCI6MjA5ODQ3ODUzNn0.K2J9Aw0jJSGipOgjjGx7CHK8-iQ-SCzS5JSxOMRxpW8'

function headers(): Record<string, string> {
  const token = getAccessToken()
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
  }
}

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
  const res = await fetch(SUPABASE_URL + '/rest/v1/files?select=*&order=created_at.desc', {
    headers: headers(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).message || '\u83b7\u53d6\u6587\u4ef6\u5217\u8868\u5931\u8d25')
  }
  return res.json()
}

export async function createFileRecord(data: CreateFileData): Promise<void> {
  const res = await fetch(SUPABASE_URL + '/rest/v1/files', {
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
  const res = await fetch(SUPABASE_URL + '/rest/v1/files?id=eq.' + id, {
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
  // Use direct fetch to Supabase Storage REST API to ensure auth header is included
  const storageUrl = SUPABASE_URL + '/storage/v1/object/sales-files/' + encodeURIComponent(filename)
  const res = await fetch(storageUrl, {
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

  const result = await res.json()
  // Public URL format for Supabase Storage
  const publicUrl = SUPABASE_URL + '/storage/v1/object/public/sales-files/' + encodeURIComponent(filename)
  return publicUrl
}
