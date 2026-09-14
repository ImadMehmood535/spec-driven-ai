import { ConfigService } from '@nestjs/config';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export const DEFAULT_CORS_ORIGIN = 'http://localhost:3100';

/**
 * The admin UI is a separate project on a different origin, so the browser
 * will not let it call this API without CORS. Server-side callers never see
 * this, which is why it went unnoticed until the end-to-end suite.
 *
 * An explicit allow-list rather than a wildcard: this is an authenticated API
 * and the set of legitimate front ends is known.
 */
export function buildCorsOptions(config: ConfigService): CorsOptions {
  const configured = config.get<string>('CORS_ORIGIN', DEFAULT_CORS_ORIGIN);

  const origins = configured
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  return {
    origin: origins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    // The token travels in an Authorization header, not a cookie, so the
    // browser is never asked to attach credentials automatically.
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  };
}
