import { EntityStatus } from '@shared/enums/EntityStatus';
import { DomainError } from '@shared/errors/DomainError';

export function requiredId(value: number, field: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new DomainError(`${field} is required.`);
  }
  return value;
}

export function optionalId(
  value: number | null | undefined,
  field: string,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (!Number.isInteger(value) || value <= 0) {
    throw new DomainError(`${field} is invalid.`);
  }
  return value;
}

export function requiredText(
  value: string,
  field: string,
  maxLength: number,
): string {
  const next = (value ?? '').trim();
  if (next.length === 0) {
    throw new DomainError(`${field} is required.`);
  }
  if (next.length > maxLength) {
    throw new DomainError(`${field} must be ${maxLength} characters or fewer.`);
  }
  return next;
}

export function optionalText(
  value: string | null | undefined,
  field: string,
  maxLength: number,
): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const next = value.trim();
  if (next.length === 0) {
    return null;
  }
  if (next.length > maxLength) {
    throw new DomainError(`${field} must be ${maxLength} characters or fewer.`);
  }
  return next;
}

export function ensureEntityStatus(value: EntityStatus): EntityStatus {
  if (!Object.values(EntityStatus).includes(value)) {
    throw new DomainError('Invalid entity status.');
  }
  return value;
}
