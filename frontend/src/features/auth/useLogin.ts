'use client';

import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  expiresIn: string;
}

/**
 * `skipAuth` because no token can exist yet. The password is sent in the body
 * and never placed in a query string or persisted anywhere.
 */
export function useLogin(onSuccess: (token: string) => void) {
  return useMutation({
    mutationFn: (payload: LoginPayload) =>
      apiRequest<LoginResult>('/auth/login', {
        method: 'POST',
        body: payload,
        skipAuth: true,
      }),
    onSuccess: (result) => onSuccess(result.accessToken),
  });
}
