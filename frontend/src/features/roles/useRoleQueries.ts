'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import type { Role, RoleListResponse, RolePermissionsResponse } from './types';

const KEY = 'roles';
const PERMISSIONS_KEY = 'role-permissions';

export interface RoleListParams {
  search?: string;
  page: number;
  size: number;
}

export function useRoleList(params: RoleListParams) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () =>
      apiRequest<RoleListResponse>('/role', {
        query: { search: params.search, page: params.page, size: params.size },
      }),
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { name: string; description: string | null }) =>
      apiRequest<Role>('/role', { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: number;
      name?: string;
      description?: string | null;
      entityStatus?: 'ACTIVE' | 'INACTIVE';
    }) => apiRequest<Role>(`/role/${id}`, { method: 'PATCH', body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

/** A role's currently assigned permissions. Inactive links are excluded (D-8). */
export function useRolePermissions(roleId: number | null) {
  return useQuery({
    queryKey: [PERMISSIONS_KEY, roleId],
    queryFn: () =>
      apiRequest<RolePermissionsResponse>(`/role/${roleId}/permission`),
    enabled: roleId !== null,
  });
}

export function useAssignPermissions(roleId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (permissionIds: number[]) =>
      apiRequest(`/role/${roleId}/permission`, {
        method: 'POST',
        body: { permissionIds },
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [PERMISSIONS_KEY, roleId] }),
  });
}

/**
 * Removal deactivates the link rather than deleting it (D-8), so re-adding
 * later is an ordinary assign — the backend reactivates the same row.
 */
export function useRemovePermission(roleId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (permissionId: number) =>
      apiRequest(`/role/${roleId}/permission/${permissionId}`, {
        method: 'DELETE',
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [PERMISSIONS_KEY, roleId] }),
  });
}
