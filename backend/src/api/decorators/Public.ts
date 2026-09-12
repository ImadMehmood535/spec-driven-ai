import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';

/**
 * Exempts a route from authentication and authorization. Used only where a
 * token cannot exist yet (login) or the route is not access-controlled
 * (health, docs). Everything else is guarded by default.
 */
export const Public = () => SetMetadata(IS_PUBLIC, true);
