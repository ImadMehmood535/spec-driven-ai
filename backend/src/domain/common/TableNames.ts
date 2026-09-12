export const TableNames = {
  User: 'User',
  Role: 'Role',
  Permission: 'Permission',
  RolePermission: 'RolePermission',
} as const;

export type TableName = (typeof TableNames)[keyof typeof TableNames];
