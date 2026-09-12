export const USER_PERMISSION_QUERIES = Symbol('USER_PERMISSION_QUERIES');

export interface IUserPermissionQueries {
  /**
   * Effective permission names for a user (FR-AC1, FR-AC2).
   *
   * Returns an empty array when the user is inactive, has no role, or the role
   * grants nothing active — every gate in FR-AC3. Existence is NOT checked
   * here; the handler does that so a non-existent user can be a 404 rather
   * than an indistinguishable empty set.
   */
  findEffectivePermissionNames(userId: number): Promise<string[]>;
  /** True when the user exists, regardless of status. */
  userExists(userId: number): Promise<boolean>;
}
