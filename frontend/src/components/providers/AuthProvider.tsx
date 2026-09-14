'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { PermissionsProvider } from '@/hooks/usePermissions';
import { setTokenGetter, setUnauthenticatedHandler } from '@/lib/api-client';
import {
  clearToken,
  decodeClaims,
  isExpired,
  readToken,
  storeToken,
  type TokenClaims,
} from '@/lib/token';

interface AuthContextValue {
  claims: TokenClaims | null;
  /** False until the stored token has been read, so guards do not flash. */
  ready: boolean;
  signIn: (token: string) => void;
  signOut: () => void;
}

const AuthContext = React.createContext<AuthContextValue>({
  claims: null,
  ready: false,
  signIn: () => undefined,
  signOut: () => undefined,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [claims, setClaims] = React.useState<TokenClaims | null>(null);
  const [ready, setReady] = React.useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  // Kept in a ref so the api-client seams read the current token without the
  // effect below having to re-run on every change.
  const tokenRef = React.useRef<string | null>(null);

  const signOut = React.useCallback(() => {
    tokenRef.current = null;
    clearToken();
    setClaims(null);
    // Without this the next person on this browser sees the previous user's
    // data from cache.
    queryClient.clear();
  }, [queryClient]);

  const signIn = React.useCallback((token: string) => {
    const decoded = decodeClaims(token);
    if (!decoded || isExpired(decoded)) {
      return;
    }
    tokenRef.current = token;
    storeToken(token);
    setClaims(decoded);
  }, []);

  React.useEffect(() => {
    setTokenGetter(() => tokenRef.current);
    setUnauthenticatedHandler(() => {
      signOut();
      router.replace('/login');
    });
  }, [router, signOut]);

  React.useEffect(() => {
    const stored = readToken();
    const decoded = stored ? decodeClaims(stored) : null;

    // An expired token is discarded before it is ever sent, rather than
    // spending a guaranteed 401 to discover it.
    if (decoded && !isExpired(decoded)) {
      tokenRef.current = stored;
      setClaims(decoded);
    } else if (stored) {
      clearToken();
    }

    setReady(true);
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({ claims, ready, signIn, signOut }),
    [claims, ready, signIn, signOut],
  );

  return (
    <AuthContext.Provider value={value}>
      <PermissionsProvider permissions={claims?.permissions ?? []}>
        {children}
      </PermissionsProvider>
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return React.useContext(AuthContext);
}
