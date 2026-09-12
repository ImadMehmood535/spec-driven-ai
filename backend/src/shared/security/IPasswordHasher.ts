export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');

export interface IPasswordHasher {
  /** Hashes a plaintext password. The plaintext is never stored or returned. */
  hash(plaintext: string): Promise<string>;
  /** Verifies a plaintext against a stored hash. Used by authentication-login. */
  verify(plaintext: string, hash: string): Promise<boolean>;
}
