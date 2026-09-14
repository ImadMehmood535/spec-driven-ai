'use client';

import * as React from 'react';
import { usePermissions } from '@/hooks/usePermissions';

export interface PermissionGateProps {
  /** The permission name the wrapped control requires. */
  permission: string;
  /** Rendered instead when the permission is absent. Defaults to nothing. */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Hides a control the signed-in user has no permission for (FR-UI6).
 * Usability, not security — the API is the boundary.
 */
export function PermissionGate({
  permission,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { can } = usePermissions();

  return <>{can(permission) ? children : fallback}</>;
}
