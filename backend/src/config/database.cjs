/**
 * Connection settings shared by sequelize-cli and the NestJS runtime.
 * Kept in one place so the CLI and the app can never disagree about which
 * database they are pointed at.
 */
require('dotenv').config();

const shared = {
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5440),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
  database: process.env.DB_NAME || 'developer_user',
  logging: false,
};

module.exports = {
  development: shared,
  test: shared,
  production: shared,
};
