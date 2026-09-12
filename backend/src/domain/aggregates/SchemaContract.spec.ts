import { Sequelize } from 'sequelize-typescript';
import { PermissionModel } from '@domain/aggregates/PermissionAggregate/PermissionModel';
import { RoleModel } from '@domain/aggregates/RoleAggregate/RoleModel';
import { RolePermissionModel } from '@domain/aggregates/RolePermissionAggregate/RolePermissionModel';
import { UserModel } from '@domain/aggregates/UserAggregate/UserModel';
import { TableNames } from '@domain/common/TableNames';
import { EntityStatus } from '@shared/enums/EntityStatus';

/**
 * Guards against model/migration drift. The migrations are the source of truth
 * for the schema; these assertions pin the model definitions to the same shape.
 * No connection is opened — defining the models is enough to inspect them.
 */
describe('schema contract', () => {
  beforeAll(() => {
    new Sequelize({
      dialect: 'postgres',
      models: [RoleModel, PermissionModel, UserModel, RolePermissionModel],
    });
  });

  type AnyModelClass = { getAttributes(): unknown; getTableName(): unknown };
  type AttributeShape = {
    allowNull?: boolean;
    unique?: unknown;
    type: { values?: string[] };
  };

  const attributes = (model: AnyModelClass): Record<string, AttributeShape> =>
    model.getAttributes() as Record<string, AttributeShape>;

  describe('table names come from TableNames', () => {
    it.each([
      [RoleModel, TableNames.Role],
      [PermissionModel, TableNames.Permission],
      [UserModel, TableNames.User],
      [RolePermissionModel, TableNames.RolePermission],
    ])('$name maps to the right table', (model, expected) => {
      expect(model.getTableName()).toBe(expected);
    });
  });

  describe('audit columns are inherited everywhere', () => {
    it.each([RoleModel, PermissionModel, UserModel, RolePermissionModel])(
      'model has id, globalUId, createdAt, modifiedOn',
      (model) => {
        const attrs = attributes(model);
        expect(attrs.id).toBeDefined();
        expect(attrs.globalUId.allowNull).toBe(false);
        expect(attrs.createdAt.allowNull).toBe(false);
        expect(attrs.modifiedOn.allowNull).toBe(true);
      },
    );
  });

  describe('User', () => {
    it('allows a null roleId, so a user can exist without a role (FR-AC4)', () => {
      expect(attributes(UserModel).roleId.allowNull).toBe(true);
    });

    it('requires passwordHash, leaving no "no credential" state', () => {
      expect(attributes(UserModel).passwordHash.allowNull).toBe(false);
    });

    it.each(['email', 'username'])('requires %s', (field) => {
      expect(attributes(UserModel)[field].allowNull).toBe(false);
    });

    it.each(['email', 'username'])('marks %s unique', (field) => {
      expect(attributes(UserModel)[field].unique).toBeTruthy();
    });
  });

  describe('RolePermission', () => {
    it.each(['roleId', 'permissionId'])('requires %s', (field) => {
      expect(attributes(RolePermissionModel)[field].allowNull).toBe(false);
    });

    it('declares the composite unique index that FR-RP4 and D-8 rely on', () => {
      const indexes = RolePermissionModel.options.indexes ?? [];
      const composite = indexes.find(
        (index) => index.name === 'RolePermission_roleId_permissionId_unique',
      );

      expect(composite).toBeDefined();
      expect(composite?.unique).toBe(true);
      expect(composite?.fields).toEqual(['roleId', 'permissionId']);
    });
  });

  describe('entityStatus', () => {
    it.each([RoleModel, PermissionModel, UserModel, RolePermissionModel])(
      'is required and limited to ACTIVE/INACTIVE',
      (model) => {
        const status = attributes(model).entityStatus;

        expect(status.allowNull).toBe(false);
        expect(status.type.values).toEqual([
          EntityStatus.Active,
          EntityStatus.Inactive,
        ]);
      },
    );

    it('does not carry DRAFT, which has no meaning for access control', () => {
      expect(attributes(RoleModel).entityStatus.type.values).not.toContain(
        'DRAFT',
      );
    });
  });
});
