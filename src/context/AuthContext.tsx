import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User, UserRole } from '../types';
import { IS_DEMO, backend, setAuthToken, setUnauthorizedHandler } from '../services/api';
import { secureStorage } from '../services/storage';

const SESSION_KEY = 'lokma.session.v1';

type Status = 'loading' | 'signedOut' | 'choosingRole' | 'signedIn';

interface PendingLogin {
  token: string;
  phone: string;
  roles: UserRole[];
}

interface AuthState {
  status: Status;
  user: User | null;
  token: string | null;
  pending: PendingLogin | null;
  /** Bir nechta rol bo'lsa status 'choosingRole' bo'ladi, aks holda darhol kiradi */
  signIn: (phoneE164: string, password: string) => Promise<void>;
  chooseRole: (role: UserRole) => Promise<void>;
  cancelRoleSelection: () => void;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [pending, setPending] = useState<PendingLogin | null>(null);

  // HTTP qatlami joriy rol tokenini shu yerdan oladi
  useEffect(() => {
    setAuthToken(session?.token ?? null);
  }, [session?.token]);

  const signOut = useCallback(async () => {
    await secureStorage.remove(SESSION_KEY);
    setAuthToken(null);
    setSession(null);
    setPending(null);
    setStatus('signedOut');
  }, []);

  // Server 401 qaytarsa (muddati tugagan, parol almashgan, hisob o'chirilgan/bloklangan) — chiqib ketamiz
  useEffect(() => {
    setUnauthorizedHandler(() => { void signOut(); });
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  // Ilova ochilganda saqlangan sessiyani tiklash va serverda tekshirish
  useEffect(() => {
    let alive = true;
    (async () => {
      const raw = await secureStorage.get(SESSION_KEY);
      if (!alive) return;
      if (raw) {
        try {
          const s = JSON.parse(raw) as Session;
          if (s?.token && s?.user) {
            setAuthToken(s.token);
            setSession(s);
            setStatus('signedIn');
            if (!IS_DEMO) {
              // Fon rejimida tekshiramiz: yaroqsiz bo'lsa 401 handler chiqarib yuboradi; internet yo'q bo'lsa — ishlayveradi
              backend.fetchSession(s.token).then((fresh) => {
                if (!alive) return;
                setSession(fresh);
                void secureStorage.set(SESSION_KEY, JSON.stringify(fresh));
              }).catch(() => {});
            }
            return;
          }
        } catch {
          await secureStorage.remove(SESSION_KEY);
        }
      }
      setStatus('signedOut');
    })();
    return () => {
      alive = false;
    };
  }, []);

  const finish = useCallback(async (token: string, role: UserRole) => {
    const s = await backend.fetchSession(token, role);
    await secureStorage.set(SESSION_KEY, JSON.stringify(s));
    setAuthToken(s.token);
    setSession(s);
    setPending(null);
    setStatus('signedIn');
  }, []);

  const signIn = useCallback(
    async (phone: string, password: string) => {
      const res = await backend.login(phone, password);
      if (res.roles.length === 1) {
        await finish(res.token, res.roles[0]);
        return;
      }
      setPending({ token: res.token, phone, roles: res.roles });
      setStatus('choosingRole');
    },
    [finish]
  );

  const chooseRole = useCallback(
    async (role: UserRole) => {
      if (!pending) throw new Error('No pending login');
      await finish(pending.token, role);
    },
    [pending, finish]
  );

  const cancelRoleSelection = useCallback(() => {
    setPending(null);
    setStatus('signedOut');
  }, []);

  const deleteAccount = useCallback(async () => {
    if (session) await backend.deleteAccount();
    await signOut();
  }, [session, signOut]);

  const value = useMemo<AuthState>(
    () => ({
      status,
      user: session?.user ?? null,
      token: session?.token ?? null,
      pending,
      signIn,
      chooseRole,
      cancelRoleSelection,
      signOut,
      deleteAccount,
    }),
    [status, session, pending, signIn, chooseRole, cancelRoleSelection, signOut, deleteAccount]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useIsOwner() {
  return useAuth().user?.role === 'owner';
}
