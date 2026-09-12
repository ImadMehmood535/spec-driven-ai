import { User } from '@domain/aggregates/UserAggregate/User';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface IUserRepository {
  save(user: User): Promise<User>;
  updateUser(user: User): Promise<void>;
  findById(id: number): Promise<User | null>;
  emailExists(email: string, exceptId?: number): Promise<boolean>;
  usernameExists(username: string, exceptId?: number): Promise<boolean>;
}
