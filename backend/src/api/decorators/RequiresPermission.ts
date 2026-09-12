import { SetMetadata } from '@nestjs/common';

export const REQUIRED_PERMISSION = 'requiredPermission';

/**
 * Declares the permission a route requires (FR-AC6). The name must be one the
 * seed catalogue creates, or an administrator would be locked out of the route
 * with no way to grant it through the API.
 *
 * A route with neither this nor `@Public()` is refused — default deny.
 */
export const RequiresPermission = (permission: string) =>
  SetMetadata(REQUIRED_PERMISSION, permission);
