import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import * as accounts from '@/lib/accounts';
import type { Session } from '@/lib/accounts';

type AuthContextValue = {
  user: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  signUp: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = await accounts.getSession();
      if (!cancelled) {
        setUser(session);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await accounts.signIn(email, password);
    if (res.ok) setUser(res.session);
    return res;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const res = await accounts.signUp(email, password);
    if (res.ok) setUser(res.session);
    return res;
  }, []);

  const signOut = useCallback(async () => {
    await accounts.signOut();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn,
      signUp,
      signOut
    }),
    [user, loading, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
