import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest, type AuthResponse, type AuthSession, type AuthUser } from '@/lib/api';

type StoredAuth = {
  session: AuthSession;
  user: AuthUser | null;
};

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'ce-auth-session';
const DIETARY_RESTRICTIONS_CACHE_KEY = 'ce-dietary-restrictions';
const USER_DIETARY_CACHE_PREFIX = 'ce-user-dietary:';
const REFRESH_EARLY_MS = 60 * 1000;

async function readStoredAuth(): Promise<StoredAuth | null> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

async function writeStoredAuth(data: StoredAuth | null) {
  try {
    if (!data) {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshSessionRef = useRef<() => Promise<void>>(async () => {});

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const scheduleRefresh = useCallback(
    (expiresAt: number) => {
      clearRefreshTimer();
      const delay = expiresAt * 1000 - Date.now() - REFRESH_EARLY_MS;
      if (delay <= 0) {
        void refreshSessionRef.current();
        return;
      }
      refreshTimerRef.current = setTimeout(() => {
        void refreshSessionRef.current();
      }, delay);
    },
    [clearRefreshTimer]
  );

  const applyAuth = useCallback(
    async (payload: AuthResponse) => {
      const nextSession = payload.session ?? null;
      const nextUser = nextSession ? payload.user ?? null : null;

      setUser(nextUser);
      setSession(nextSession);
      if (nextSession) {
        await writeStoredAuth({ session: nextSession, user: nextUser });
        scheduleRefresh(nextSession.expires_at);
      } else {
        await writeStoredAuth(null);
        clearRefreshTimer();
        queryClient.clear();
      }
    },
    [clearRefreshTimer, queryClient, scheduleRefresh]
  );

  const refreshSession = useCallback(async () => {
    const stored = await readStoredAuth();
    const refreshToken = stored?.session.refresh_token ?? session?.refresh_token;
    if (!refreshToken) {
      await applyAuth({ user: null, session: null });
      return;
    }

    const data = await apiRequest<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    await applyAuth(data);
  }, [applyAuth, session?.refresh_token]);

  useEffect(() => {
    refreshSessionRef.current = refreshSession;
  }, [refreshSession]);

  const loadSession = useCallback(async () => {
    const stored = await readStoredAuth();
    if (!stored?.session?.access_token) {
      setLoading(false);
      return;
    }

    try {
      const me = await apiRequest<{ user: AuthUser | null }>(
        '/auth/me',
        { method: 'GET' },
        stored.session.access_token
      );

      setUser(me.user ?? stored.user ?? null);
      setSession(stored.session);
      scheduleRefresh(stored.session.expires_at);
    } catch {
      try {
        await refreshSession();
      } catch {
        await applyAuth({ user: null, session: null });
      }
    } finally {
      setLoading(false);
    }
  }, [applyAuth, refreshSession, scheduleRefresh]);

  useEffect(() => {
    void loadSession();
    return () => {
      clearRefreshTimer();
    };
  }, [clearRefreshTimer, loadSession]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    await applyAuth(data);
  }, [applyAuth]);

  const register = useCallback(async (email: string, password: string) => {
    const data = await apiRequest<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    await applyAuth(data);
  }, [applyAuth]);

  const logout = useCallback(async () => {
    const previousUserId = user?.id;
    const accessToken = session?.access_token;
    const isJwt = typeof accessToken === 'string'
      && /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(accessToken);
    if (isJwt) {
      try {
        await apiRequest('/auth/logout', { method: 'POST' }, accessToken);
      } catch {
        // Ignore logout errors and continue local cleanup
      }
    }
    if (previousUserId) {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const userKeys = keys.filter((key) => key === DIETARY_RESTRICTIONS_CACHE_KEY || key.startsWith(USER_DIETARY_CACHE_PREFIX));
        if (userKeys.length > 0) {
          await AsyncStorage.multiRemove(userKeys);
        }
      } catch {
        // Ignore storage cleanup errors
      }
    }
    await applyAuth({ user: null, session: null });
  }, [applyAuth, session?.access_token, user?.id]);

  const resetPassword = useCallback(async (email: string) => {
    await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }, []);

  const value = useMemo(
    () => ({ user, session, loading, login, register, logout, resetPassword, refreshSession }),
    [loading, login, logout, refreshSession, register, resetPassword, session, user]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
