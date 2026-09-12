import { Model } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { registerAuditHooks } from './AuditHook';

/** The shape the hooks actually touch, rather than a full Sequelize model. */
interface AuditableInstance {
  isNewRecord?: boolean;
  globalUId?: string;
  createdAt?: Date;
  modifiedOn?: Date;
}

interface BulkUpdateOptions {
  attributes?: Record<string, unknown>;
  fields?: string[];
}

type InstanceHandler = (instance: Model) => void;
type BulkCreateHandler = (instances: Model[]) => void;
type BulkUpdateHandler = (options: BulkUpdateOptions) => void;

interface CapturedHooks {
  beforeValidate: InstanceHandler;
  beforeBulkCreate: BulkCreateHandler;
  beforeUpdate: InstanceHandler;
  beforeBulkUpdate: BulkUpdateHandler;
}

function registerOnFake(): {
  hooks: CapturedHooks;
  registrations: Record<keyof CapturedHooks, jest.Mock>;
} {
  const hooks = {} as CapturedHooks;
  const registrations = {
    beforeValidate: jest.fn((h: InstanceHandler) => {
      hooks.beforeValidate = h;
    }),
    beforeBulkCreate: jest.fn((h: BulkCreateHandler) => {
      hooks.beforeBulkCreate = h;
    }),
    beforeUpdate: jest.fn((h: InstanceHandler) => {
      hooks.beforeUpdate = h;
    }),
    beforeBulkUpdate: jest.fn((h: BulkUpdateHandler) => {
      hooks.beforeBulkUpdate = h;
    }),
  };

  registerAuditHooks(registrations as unknown as Sequelize);
  return { hooks, registrations };
}

/** Builds a stand-in instance and hands back the typed view of it. */
function instance(fields: AuditableInstance = {}): {
  model: Model;
  audited: AuditableInstance;
} {
  const audited: AuditableInstance = { ...fields };
  return { model: audited as unknown as Model, audited };
}

describe('registerAuditHooks', () => {
  it('registers all four hooks', () => {
    const { registrations } = registerOnFake();

    expect(registrations.beforeValidate).toHaveBeenCalledTimes(1);
    expect(registrations.beforeBulkCreate).toHaveBeenCalledTimes(1);
    expect(registrations.beforeUpdate).toHaveBeenCalledTimes(1);
    expect(registrations.beforeBulkUpdate).toHaveBeenCalledTimes(1);
  });
});

describe('create audit', () => {
  it('assigns a globalUId and createdAt to a new record', () => {
    const { hooks } = registerOnFake();
    const { model, audited } = instance({ isNewRecord: true });

    hooks.beforeValidate(model);

    expect(audited.globalUId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(audited.createdAt).toBeInstanceOf(Date);
  });

  it('leaves an existing globalUId alone', () => {
    const { hooks } = registerOnFake();
    const { model, audited } = instance({
      isNewRecord: true,
      globalUId: 'preset-uid',
    });

    hooks.beforeValidate(model);

    expect(audited.globalUId).toBe('preset-uid');
  });

  it('leaves an existing createdAt alone', () => {
    const { hooks } = registerOnFake();
    const original = new Date('2020-01-01T00:00:00.000Z');
    const { model, audited } = instance({
      isNewRecord: true,
      createdAt: original,
    });

    hooks.beforeValidate(model);

    expect(audited.createdAt).toBe(original);
  });

  it('does not touch a record that is not new', () => {
    const { hooks } = registerOnFake();
    const { model, audited } = instance({ isNewRecord: false });

    hooks.beforeValidate(model);

    expect(audited.globalUId).toBeUndefined();
    expect(audited.createdAt).toBeUndefined();
  });

  it('assigns audit fields to every instance in a bulk create', () => {
    const { hooks } = registerOnFake();
    const first = instance();
    const second = instance();

    hooks.beforeBulkCreate([first.model, second.model]);

    for (const { audited } of [first, second]) {
      expect(audited.globalUId).toBeDefined();
      expect(audited.createdAt).toBeInstanceOf(Date);
    }
  });

  it('gives each bulk-created instance a distinct globalUId', () => {
    const { hooks } = registerOnFake();
    const first = instance();
    const second = instance();

    hooks.beforeBulkCreate([first.model, second.model]);

    expect(first.audited.globalUId).not.toBe(second.audited.globalUId);
  });
});

describe('update audit', () => {
  it('stamps modifiedOn on a single update', () => {
    const { hooks } = registerOnFake();
    const { model, audited } = instance();

    hooks.beforeUpdate(model);

    expect(audited.modifiedOn).toBeInstanceOf(Date);
  });

  it('stamps modifiedOn in bulk update attributes', () => {
    const { hooks } = registerOnFake();
    const options: BulkUpdateOptions = { attributes: { name: 'next' } };

    hooks.beforeBulkUpdate(options);

    expect(options.attributes?.modifiedOn).toBeInstanceOf(Date);
  });

  it('adds modifiedOn to the updated field list', () => {
    const { hooks } = registerOnFake();
    const options: BulkUpdateOptions = { attributes: {}, fields: ['name'] };

    hooks.beforeBulkUpdate(options);

    expect(options.fields).toContain('modifiedOn');
  });

  it('does not duplicate modifiedOn when already listed', () => {
    const { hooks } = registerOnFake();
    const options: BulkUpdateOptions = {
      attributes: {},
      fields: ['name', 'modifiedOn'],
    };

    hooks.beforeBulkUpdate(options);

    expect(options.fields?.filter((f) => f === 'modifiedOn')).toHaveLength(1);
  });

  it('tolerates bulk-update options with neither attributes nor fields', () => {
    const { hooks } = registerOnFake();

    expect(() => hooks.beforeBulkUpdate({})).not.toThrow();
  });
});
