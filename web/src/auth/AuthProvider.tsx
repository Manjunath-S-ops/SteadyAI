'use client';

import { isGoogleAuthConfigured } from '@/config/env';
import { usePathname, useRouter } from 'next/navigation';
import { sanitizeAuthRedirect } from './routing';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';

const AUTH_STORAGE_KEY = 'steadyai.jwt';
const DEV_USER_ID_STORAGE_KEY = 'steadyai.dev-user-id';

interface AuthContextValue {
  token: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isGoogleAuthConfigured: boolean;
  isSigningInWithGoogle: boolean;
  login: (jwt: string) => void;
  loginAsDevUser: (userId: string) => void;
  signInWithGoogle: (options?: { redirectTo?: string }) => void;
  setToken: (jwt: string | null) => void;
  logout: (options?: { redirectTo?: string }) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [userId, setUserIdState] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSigningInWithGoogle, setIsSigningInWithGoogle] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const googleAuthConfigured = isGoogleAuthConfigured();

  // Hydrate auth state from localStorage on mount
  useEffect(() => {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
    const storedUserId = window.localStorage.getItem(DEV_USER_ID_STORAGE_KEY);
    setTokenState(stored && stored.trim() ? stored : null);
    setUserIdState(storedUserId && storedUserId.trim() ? storedUserId : null);
    setIsHydrated(true);
  }, []);

  // Sync across tabs
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === AUTH_STORAGE_KEY) {
        const next = event.newValue && event.newValue.trim() ? event.newValue : null;
        setTokenState(next);
      }

      if (event.key === DEV_USER_ID_STORAGE_KEY) {
        const nextUserId = event.newValue && event.newValue.trim() ? event.newValue : null;
        setUserIdState(nextUserId);
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const persistToken = useCallback((jwt: string | null) => {
    if (jwt && jwt.trim()) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, jwt.trim());
      setTokenState(jwt.trim());
      return;
    }

    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    setTokenState(null);
  }, []);

  const persistDevUserId = useCallback((nextUserId: string | null) => {
    if (nextUserId && nextUserId.trim()) {
      window.localStorage.setItem(DEV_USER_ID_STORAGE_KEY, nextUserId.trim());
      setUserIdState(nextUserId.trim());
      return;
    }

    window.localStorage.removeItem(DEV_USER_ID_STORAGE_KEY);
    setUserIdState(null);
  }, []);

  const login = useCallback(
    (jwt: string) => {
      persistToken(jwt);
    },
    [persistToken]
  );

  const loginAsDevUser = useCallback(
    (nextUserId: string) => {
      persistDevUserId(nextUserId);
    },
    [persistDevUserId]
  );

  /**
   * Redirect the browser to Google's OAuth consent page.
   * After the user authenticates, Google will redirect to /auth/callback?code=...
   */
  const signInWithGoogle = useCallback(
    (options?: { redirectTo?: string }) => {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        throw new Error('Google OAuth client ID is not configured.');
      }

      setIsSigningInWithGoogle(true);

      const redirectUri = `${window.location.origin}/auth/callback`;
      const next = sanitizeAuthRedirect(options?.redirectTo || (pathname && pathname !== '/' ? pathname : '/onboarding'));

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'consent',
        // Pass the intended post-auth destination via state
        state: encodeURIComponent(next)
      });

      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    },
    [pathname]
  );

  const logout = useCallback(
    (options?: { redirectTo?: string }) => {
      persistToken(null);
      persistDevUserId(null);
      const target = options?.redirectTo ?? '/';
      if (pathname !== target) {
        router.replace(target);
      }
    },
    [pathname, persistDevUserId, persistToken, router]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      userId,
      isHydrated,
      isAuthenticated: Boolean(token || userId),
      isGoogleAuthConfigured: googleAuthConfigured,
      isSigningInWithGoogle,
      login,
      loginAsDevUser,
      signInWithGoogle,
      setToken: persistToken,
      logout
    }),
    [
      googleAuthConfigured,
      isHydrated,
      isSigningInWithGoogle,
      login,
      loginAsDevUser,
      logout,
      persistToken,
      signInWithGoogle,
      token,
      userId
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }

  return context;
}

export function useRequireAuth(options?: { redirectTo?: string }) {
  const { isHydrated, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isHydrated || isAuthenticated) {
      return;
    }

    const redirectBase = options?.redirectTo ?? '/';
    const next = pathname ? `?next=${encodeURIComponent(pathname)}` : '';
    router.replace(`${redirectBase}${next}`);
  }, [isAuthenticated, isHydrated, options?.redirectTo, pathname, router]);

  return {
    isHydrated,
    isAuthenticated,
    isAuthorized: isHydrated && isAuthenticated
  };
}
