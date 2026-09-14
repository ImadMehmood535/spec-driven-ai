'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import type { User, UserListParams, UserListResponse } from './types';

const KEY = 'users';

export function useUserList(params: UserListParams) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () =>
      apiRequest<UserListResponse>('/user', {
        query: {
          search: params.search,
          entityStatus: params.entityStatus,
          roleId: params.roleId,
          page: params.page,
          size: params.size,
        },
      }),
  });
}

export interface CreateUserInput {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  /** Sent in the body only. Never stored, echoed, or placed in a URL. */
  password: string;
  roleId: number | null;
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUserInput) =>
      apiRequest<User>('/user', { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

/** No password field — changing one is its own command (D-9). */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: number;
      email?: string;
      username?: string;
      firstName?: string;
      lastName?: string;
      entityStatus?: 'ACTIVE' | 'INACTIVE';
    }) => apiRequest<User>(`/user/${id}`, { method: 'PATCH', body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

/** Replaces any existing role — one role per user (§6). Null clears it. */
export function useAssignRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, roleId }: { id: number; roleId: number | null }) =>
      apiRequest(`/user/${id}/role`, { method: 'PATCH', body: { roleId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: number; newPassword: string }) =>
      apiRequest(`/user/${id}/password`, {
        method: 'PATCH',
        body: { newPassword },
      }),
  });
}
