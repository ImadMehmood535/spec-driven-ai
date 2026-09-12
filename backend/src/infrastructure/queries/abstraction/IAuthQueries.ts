import { EntityStatus } from '@shared/enums/EntityStatus';

export const AUTH_QUERIES = Symbol('AUTH_QUERIES');

/**
 * Carries the password hash, which `UserReadModel` deliberately does not.
 * Kept as a separate read model so the general user read path stays
 * hash-free (NFR-3) — this one exists only for credential verification.
 */
export interface AuthUserReadModel {
  id: number;
  globalUId: string;
  username: string;
  passwordHash: string;
  /** The column is a native enum, so the value is always one of these. */
  entityStatus: EntityStatus;
  roleName: string | null;
}

export interface IAuthQueries {
  /** Looks up by email OR username — the scope names both as identity. */
  findByIdentifier(identifier: string): Promise<AuthUserReadModel | null>;
}
