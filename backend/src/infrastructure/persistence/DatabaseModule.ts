import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InjectConnection, SequelizeModule } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { PermissionModel } from '@domain/aggregates/PermissionAggregate/PermissionModel';
import { RoleModel } from '@domain/aggregates/RoleAggregate/RoleModel';
import { RolePermissionModel } from '@domain/aggregates/RolePermissionAggregate/RolePermissionModel';
import { UserModel } from '@domain/aggregates/UserAggregate/UserModel';
import { registerAuditHooks } from './hooks/AuditHook';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        dialect: 'postgres' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<string>('DB_PORT', '5440')),
        username: config.get<string>('DB_USER', 'postgres'),
        password: config.get<string>('DB_PASS', 'postgres'),
        database: config.get<string>('DB_NAME', 'developer_user'),
        models: [RoleModel, PermissionModel, UserModel, RolePermissionModel],
        autoLoadModels: true,
        // Schema is owned by migrations (NFR-7). Never enable sync.
        synchronize: false,
        logging: false,
      }),
    }),
  ],
})
export class DatabaseModule implements OnModuleInit {
  constructor(
    @InjectConnection()
    private readonly sequelize: Sequelize,
  ) {}

  onModuleInit(): void {
    registerAuditHooks(this.sequelize);
  }
}
