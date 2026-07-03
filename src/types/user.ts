export type UserRole = 'director' | 'agent_1' | 'agent_2';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  parent_id: string | null;
}
