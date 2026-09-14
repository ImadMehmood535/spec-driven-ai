'use client';

import * as React from 'react';

interface PermissionsContextValue {
  permissions: string[];
}

const PermissionsContext = React.createContext<PermissionsContextValue>({
  permissions: [],
});

/**
 * Supplies the permission names from the signed-in user's token claims.
 * `ui-auth` populates this from the JWT; until then it defaults to empty,
 * which hides every gated control rather than showing them optimistically.
 */
export function PermissionsProvider({
  permissions,
  children,
}: {
  permissions: string[];
  children: React.ReactNode;
}) {
  const value = React.useMemo(() => ({ permissions }), [permissions]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

/**
 * **Usability only.** Hiding a control the user cannot use avoids a pointless
 * 403, but it is NOT a security boundary — the API enforces access
 * (FR-AC5–FR-AC7). Never describe or rely on this as protection.
 */
export function usePermissions(): {
  permissions: string[];
  can: (permission: string) => boolean;
} {
  const { permissions } = React.useContext(PermissionsContext);

  const can = React.useCallback(
    (permission: string) => permissions.includes(permission),
    [permissions],
  );

  return { permissions, can };
}
