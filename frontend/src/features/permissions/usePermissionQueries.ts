'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import type {
  Permission,
  PermissionListParams,
  PermissionListResponse,
} from './types';

const KEY = 'permissions';

export function usePermissionList(params: PermissionListParams) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () =>
      apiRequest<PermissionListResponse>('/permission', {
        query: {
          search: params.search,
          entityStatus: params.entityStatus,
          page: params.page,
          size: params.size,
        },
      }),
  });
}

export interface CreatePermissionInput {
  name: string;
  description: string | null;
}

export function useCreatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePermissionInput) =>
      apiRequest<Permission>('/permission', { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export interface UpdatePermissionInput {
  id: number;
  name?: string;
  description?: string | null;
  entityStatus?: 'ACTIVE' | 'INACTIVE';
}

export function useUpdatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...body }: UpdatePermissionInput) =>
      apiRequest<Permission>(`/permission/${id}`, {
        method: 'PATCH',
        body,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}
