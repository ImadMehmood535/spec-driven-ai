import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';
import { SignOptions } from 'jsonwebtoken';

export const DEFAULT_EXPIRES_IN = '1h';

/**
 * Builds JWT options from configuration and **refuses to boot without a
 * secret**. A default secret would mean every deployment that forgot to set
 * one shares a forgeable signing key — worse than a crash on startup.
 */
export function buildJwtOptions(config: ConfigService): JwtModuleOptions {
  const secret = config.get<string>('JWT_SECRET');

  if (!secret || secret.trim().length === 0) {
    throw new Error(
      'JWT_SECRET is not set. The application will not start without it — ' +
        'a default signing key would make every token forgeable.',
    );
  }

  // The library types this as a template literal ('1h' | '30m' | …) but the
  // value arrives from configuration as a plain string, so the narrowing has
  // to happen here.
  const expiresIn = config.get<string>(
    'JWT_EXPIRES_IN',
    DEFAULT_EXPIRES_IN,
  ) as SignOptions['expiresIn'];

  return { secret, signOptions: { expiresIn } };
}
