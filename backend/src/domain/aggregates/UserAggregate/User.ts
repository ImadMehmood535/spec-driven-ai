import {
  ensureEntityStatus,
  optionalId,
  requiredText,
} from '@shared/domain/Guards';
import { EntityStatus } from '@shared/enums/EntityStatus';
import { DomainError } from '@shared/errors/DomainError';

const EMAIL_MAX_LENGTH = 255;
const USERNAME_MAX_LENGTH = 255;
const NAME_MAX_LENGTH = 255;
const HASH_MAX_LENGTH = 255;

/**
 * Props carry the password **hash**, never a plaintext password. Hashing happens
 * in the application layer before the aggregate is built, so no plaintext ever
 * exists on a domain object that could be logged or snapshotted.
 */
export interface UserProps {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  roleId: number | null;
}

export class User {
  private constructor(
    private readonly _id: number | null,
    private _email: string,
    private _username: string,
    private _firstName: string,
    private _lastName: string,
    private _passwordHash: string,
    private _roleId: number | null,
    private _entityStatus: EntityStatus,
  ) {}

  static create(props: UserProps): User {
    const user = new User(null, '', '', '', '', '', null, EntityStatus.Active);
    user.changeEmail(props.email);
    user.changeUsername(props.username);
    user.changeFirstName(props.firstName);
    user.changeLastName(props.lastName);
    user.changePasswordHash(props.passwordHash);
    user.assignRole(props.roleId);
    return user;
  }

  static rehydrate(
    id: number,
    email: string,
    username: string,
    firstName: string,
    lastName: string,
    passwordHash: string,
    roleId: number | null,
    entityStatus: EntityStatus,
  ): User {
    return new User(
      id,
      email,
      username,
      firstName,
      lastName,
      passwordHash,
      roleId,
      entityStatus,
    );
  }

  get id(): number | null {
    return this._id;
  }
  get email(): string {
    return this._email;
  }
  get username(): string {
    return this._username;
  }
  get firstName(): string {
    return this._firstName;
  }
  get lastName(): string {
    return this._lastName;
  }
  /**
   * Exposed only so the repository can persist it. No response class or read
   * model includes it (NFR-3).
   */
  get passwordHash(): string {
    return this._passwordHash;
  }
  get roleId(): number | null {
    return this._roleId;
  }
  get entityStatus(): EntityStatus {
    return this._entityStatus;
  }
  get isActive(): boolean {
    return this._entityStatus === EntityStatus.Active;
  }

  changeEmail(email: string): void {
    const next = requiredText(email, 'User email', EMAIL_MAX_LENGTH);
    if (!next.includes('@')) {
      throw new DomainError('User email is invalid.');
    }
    this._email = next.toLowerCase();
  }

  changeUsername(username: string): void {
    this._username = requiredText(
      username,
      'User username',
      USERNAME_MAX_LENGTH,
    );
  }

  changeFirstName(firstName: string): void {
    this._firstName = requiredText(
      firstName,
      'User first name',
      NAME_MAX_LENGTH,
    );
  }

  changeLastName(lastName: string): void {
    this._lastName = requiredText(lastName, 'User last name', NAME_MAX_LENGTH);
  }

  /**
   * Named for the hash, not the password, so a caller cannot pass plaintext by
   * mistake. Hashing is the application layer's job (D-9).
   */
  changePasswordHash(passwordHash: string): void {
    this._passwordHash = requiredText(
      passwordHash,
      'User password hash',
      HASH_MAX_LENGTH,
    );
  }

  /**
   * One role per user (§6). A second assignment replaces the first — it never
   * accumulates. Null means no role, which resolves to no permissions (FR-AC4).
   */
  assignRole(roleId: number | null): void {
    this._roleId = optionalId(roleId, 'User role');
  }

  changeStatus(status: EntityStatus): void {
    this._entityStatus = ensureEntityStatus(status);
  }

  activate(): void {
    this._entityStatus = EntityStatus.Active;
  }

  deactivate(): void {
    this._entityStatus = EntityStatus.Inactive;
  }
}
