import { BCRYPT_COST, BcryptPasswordHasher } from './BcryptPasswordHasher';

describe('BcryptPasswordHasher', () => {
  // cost 12 is deliberately slow; these are the only tests that pay for real hashing
  jest.setTimeout(30000);

  const hasher = new BcryptPasswordHasher();
  const PLACEHOLDER = 'placeholder-plaintext';

  it('produces a hash that is not the plaintext', async () => {
    const hash = await hasher.hash(PLACEHOLDER);

    expect(hash).not.toBe(PLACEHOLDER);
    expect(hash).not.toContain(PLACEHOLDER);
  });

  it('uses cost 12, so offline cracking stays expensive', async () => {
    const hash = await hasher.hash(PLACEHOLDER);

    // bcrypt encodes the cost in the hash prefix: $2b$12$...
    expect(hash).toMatch(/^\$2[aby]\$12\$/);
    expect(BCRYPT_COST).toBe(12);
  });

  it('salts, so the same password hashes differently each time', async () => {
    const [first, second] = await Promise.all([
      hasher.hash(PLACEHOLDER),
      hasher.hash(PLACEHOLDER),
    ]);

    expect(first).not.toBe(second);
  });

  it('verifies a correct password', async () => {
    const hash = await hasher.hash(PLACEHOLDER);

    await expect(hasher.verify(PLACEHOLDER, hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hasher.hash(PLACEHOLDER);

    await expect(hasher.verify('something-else', hash)).resolves.toBe(false);
  });
});
