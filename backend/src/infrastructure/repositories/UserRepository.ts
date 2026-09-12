import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { User } from '@domain/aggregates/UserAggregate/User';
import { UserModel } from '@domain/aggregates/UserAggregate/UserModel';
import { IUserRepository } from './abstraction/IUserRepository';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectModel(UserModel)
    private readonly userModel: typeof UserModel,
  ) {}

  async save(user: User): Promise<User> {
    const created = await this.userModel.create({
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      passwordHash: user.passwordHash,
      roleId: user.roleId,
      entityStatus: user.entityStatus,
    });

    return this.toDomain(created);
  }

  async updateUser(user: User): Promise<void> {
    await this.userModel.update(
      {
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        passwordHash: user.passwordHash,
        roleId: user.roleId,
        entityStatus: user.entityStatus,
      },
      { where: { id: user.id as number } },
    );
  }

  async findById(id: number): Promise<User | null> {
    const row = await this.userModel.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async emailExists(email: string, exceptId?: number): Promise<boolean> {
    const normalised = email.trim().toLowerCase();
    const where =
      exceptId === undefined
        ? { email: normalised }
        : { email: normalised, id: { [Op.ne]: exceptId } };
    return (await this.userModel.count({ where })) > 0;
  }

  async usernameExists(username: string, exceptId?: number): Promise<boolean> {
    const trimmed = username.trim();
    const where =
      exceptId === undefined
        ? { username: trimmed }
        : { username: trimmed, id: { [Op.ne]: exceptId } };
    return (await this.userModel.count({ where })) > 0;
  }

  private toDomain(row: UserModel): User {
    return User.rehydrate(
      Number(row.id),
      row.email,
      row.username,
      row.firstName,
      row.lastName,
      row.passwordHash,
      row.roleId === null ? null : Number(row.roleId),
      row.entityStatus,
    );
  }
}
