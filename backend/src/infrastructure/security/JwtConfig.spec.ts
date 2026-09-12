import { ConfigService } from '@nestjs/config';
import { buildJwtOptions, DEFAULT_EXPIRES_IN } from './JwtConfig';

const configWith = (values: Record<string, string | undefined>) =>
  ({
    get: <T>(key: string, fallback?: T) =>
      (values[key] ?? fallback) as unknown as T,
  }) as unknown as ConfigService;

describe('buildJwtOptions', () => {
  it('uses the configured secret', () => {
    const options = buildJwtOptions(
      configWith({ JWT_SECRET: 'a-configured-secret' }),
    );

    expect(options.secret).toBe('a-configured-secret');
  });

  it('defaults the lifetime to 1h', () => {
    const options = buildJwtOptions(configWith({ JWT_SECRET: 's' }));

    expect(options.signOptions?.expiresIn).toBe(DEFAULT_EXPIRES_IN);
  });

  it('honours a configured lifetime', () => {
    const options = buildJwtOptions(
      configWith({ JWT_SECRET: 's', JWT_EXPIRES_IN: '15m' }),
    );

    expect(options.signOptions?.expiresIn).toBe('15m');
  });

  it.each([undefined, '', '   '])(
    'refuses to build when the secret is %p — no insecure default (NFR-8)',
    (secret) => {
      expect(() => buildJwtOptions(configWith({ JWT_SECRET: secret }))).toThrow(
        /JWT_SECRET is not set/,
      );
    },
  );

  it('never invents a fallback secret', () => {
    // The whole point: a default signing key would make every token forgeable
    // in any deployment that forgot to set one.
    expect(() => buildJwtOptions(configWith({}))).toThrow();
  });
});
