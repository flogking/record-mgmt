import type { UserInfo } from '../services/authService'

export function canEditRow(currentUser: UserInfo, rowUserId: string): boolean {
  if (currentUser.role === 'director') return true
  return currentUser.id === rowUserId
}

export function canDeleteRow(currentUser: UserInfo, rowUserId: string): boolean {
  return canEditRow(currentUser, rowUserId)
}

export const ROLE_LABEL: Record<string, string> = {
  director: '总监',
  agent_1: '经销商',
  agent_2: '分销商',
}
