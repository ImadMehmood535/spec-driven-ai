/** Claims signed at login (D-2), attached to the request by JwtAuthGuard. */
export interface TokenClaims {
  sub: string;
  username: string;
  role: string | null;
  permissions: string[];
}

export interface AuthenticatedRequest {
  headers: Record<string, string | string[] | undefined>;
  claims?: TokenClaims;
}
