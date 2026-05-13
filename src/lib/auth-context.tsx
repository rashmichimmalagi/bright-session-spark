import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AuthUser {
  type: 'student' | 'admin';
  id: string;
  name: string;
  email: string;
  usn?: string;
  adminId?: string;
  department?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

interface LoginResult { success: boolean; error?: string }

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  loginStudent: (identifier: string, password: string) => Promise<LoginResult>;
  loginAdmin: (identifier: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginStudent: async () => ({ success: false }),
  loginAdmin: async () => ({ success: false }),
  logout: async () => {},
  refresh: async () => {},
});

async function resolveEmail(identifier: string): Promise<string | null> {
  if (identifier.includes('@')) return identifier.trim().toLowerCase();
  const { data, error } = await supabase.rpc('lookup_email_by_identifier', { _identifier: identifier.trim() });
  if (error || !data) return null;
  return data as string;
}

async function loadProfile(userId: string): Promise<AuthUser | null> {
  const [{ data: profile }, { data: roleRow }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle(),
  ]);
  if (!profile || !roleRow) return null;
  const type = roleRow.role as 'student' | 'admin';
  return {
    type,
    id: profile.id,
    name: profile.name,
    email: profile.email,
    usn: profile.usn ?? undefined,
    adminId: profile.admin_id ?? undefined,
    department: profile.department ?? undefined,
    status: profile.status,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user) { setUser(null); return; }
    const u = await loadProfile(data.session.user.id);
    setUser(u);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session?.user) { setUser(null); setLoading(false); return; }
      // defer profile fetch to avoid deadlock
      setTimeout(async () => {
        const u = await loadProfile(session.user.id);
        setUser(u);
        setLoading(false);
      }, 0);
    });
    refresh().finally(() => setLoading(false));
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  const doLogin = async (identifier: string, password: string, expectedType: 'student' | 'admin'): Promise<LoginResult> => {
    const email = await resolveEmail(identifier);
    if (!email) return { success: false, error: 'Invalid credentials' };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      if (error?.message?.toLowerCase().includes('not confirmed') || error?.message?.toLowerCase().includes('email')) {
        return { success: false, error: 'Please verify your email before signing in' };
      }
      return { success: false, error: 'Invalid credentials' };
    }
    const profile = await loadProfile(data.user.id);
    if (!profile) { await supabase.auth.signOut(); return { success: false, error: 'Account not found' }; }
    if (profile.type !== expectedType) {
      await supabase.auth.signOut();
      return { success: false, error: `This is a ${profile.type} account. Use the ${profile.type} login page.` };
    }
    if (profile.type === 'student') {
      if (profile.status === 'pending') { await supabase.auth.signOut(); return { success: false, error: 'Account pending admin approval' }; }
      if (profile.status === 'rejected') { await supabase.auth.signOut(); return { success: false, error: 'Account has been rejected by admin' }; }
    }
    setUser(profile);
    return { success: true };
  };

  const loginStudent = (identifier: string, password: string) => doLogin(identifier, password, 'student');
  const loginAdmin = (identifier: string, password: string) => doLogin(identifier, password, 'admin');

  const logout = async () => { await supabase.auth.signOut(); setUser(null); };

  return (
    <AuthContext.Provider value={{ user, loading, loginStudent, loginAdmin, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
