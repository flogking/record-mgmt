import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User } from '../types/user';
import { supabase } from '../lib/supabase';
import * as authService from '../services/authService';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化：从 localStorage 恢复用户信息，或从 session 查询
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 优先从 localStorage 恢复
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser) as User;
          setCurrentUser(parsed);
          setLoading(false);
          return;
        }

        // 尝试从 Supabase session 恢复
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const userId = session.user.id;
          // 根据 userId 查询 users 表获取完整用户信息
          const { data: user } = await supabase
            .from('users')
            .select('id, username, role, parent_id')
            .eq('id', userId)
            .single();

          if (user) {
            const userData: User = {
              id: user.id,
              username: user.username,
              role: user.role,
              parent_id: user.parent_id,
            };
            setCurrentUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          }
        }
      } catch (err) {
        console.error('Failed to restore auth state:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const user = await authService.login(username, password);
    setCurrentUser(user);
    localStorage.setItem('user', JSON.stringify(user));
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setCurrentUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
