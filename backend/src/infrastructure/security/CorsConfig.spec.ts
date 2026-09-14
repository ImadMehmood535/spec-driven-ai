import { ConfigService } from '@nestjs/config';
import { buildCorsOptions, DEFAULT_CORS_ORIGIN } from './CorsConfig';

const configWith = (values: Record<string, string | undefined>) =>
  ({
    get: <T>(key: string, fallback?: T) =>
      (values[key] ?? fallback) as unknown as T,
  }) as unknown as ConfigService;

describe('buildCorsOptions', () => {
  it('defaults to the admin UI origin', () => {
    expect(buildCorsOptions(configWith({})).origin).toEqual([
      DEFAULT_CORS_ORIGIN,
    ]);
  });

  it('honours a configured origin', () => {
    const options = buildCorsOptions(
      configWith({ CORS_ORIGIN: 'https://admin.example.com' }),
    );

    expect(options.origin).toEqual(['https://admin.example.com']);
  });

  it('accepts several origins', () => {
    const options = buildCorsOptions(
      configWith({
        CORS_ORIGIN: 'https://admin.example.com, http://localhost:3100',
      }),
    );

    expect(options.origin).toEqual([
      'https://admin.example.com',
      'http://localhost:3100',
    ]);
  });

  it('never allows a wildcard origin', () => {
    // This is an authenticated API and the legitimate front ends are known.
    const options = buildCorsOptions(configWith({}));

    expect(options.origin).not.toBe('*');
    expect(options.origin).not.toContain('*');
  });

  it('allows only the headers the client actually sends', () => {
    const options = buildCorsOptions(configWith({}));

    expect(options.allowedHeaders).toEqual(['Content-Type', 'Authorization']);
  });

  it('does not enable credentials', () => {
    // The token travels in an Authorization header, not a cookie, so the
    // browser is never asked to attach anything automatically.
    expect(buildCorsOptions(configWith({})).credentials).toBe(false);
  });

  it('permits the verbs the API exposes, including preflight', () => {
    const options = buildCorsOptions(configWith({}));

    expect(options.methods).toEqual([
      'GET',
      'POST',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ]);
  });
});
