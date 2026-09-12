import { randomUUID } from 'crypto';
import { Model } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { AuditableFields } from '@shared/audit/AuditableFields';

function applyCreateAudit(instance: Model): void {
  const auditable = instance as unknown as AuditableFields;
  if (!auditable.globalUId) {
    auditable.globalUId = randomUUID();
  }

  if (!auditable.createdAt) {
    auditable.createdAt = new Date();
  }
}

export function registerAuditHooks(sequelize: Sequelize): void {
  sequelize.beforeValidate((instance: Model) => {
    if (instance.isNewRecord) {
      applyCreateAudit(instance);
    }
  });

  sequelize.beforeBulkCreate((instances: Model[]) => {
    for (const instance of instances) {
      applyCreateAudit(instance);
    }
  });

  sequelize.beforeUpdate((instance: Model) => {
    (instance as unknown as AuditableFields).modifiedOn = new Date();
  });

  sequelize.beforeBulkUpdate((options) => {
    const opts = options as unknown as {
      attributes?: Record<string, unknown>;
      fields?: string[];
    };
    if (opts.attributes) {
      opts.attributes.modifiedOn = new Date();
    }
    if (opts.fields && !opts.fields.includes('modifiedOn')) {
      opts.fields.push('modifiedOn');
    }
  });
}
