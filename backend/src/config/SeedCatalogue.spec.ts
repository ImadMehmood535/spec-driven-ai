interface CataloguePermission {
  name: string;
  description: string;
}

interface Catalogue {
  PROJECT_PERMISSIONS: CataloguePermission[];
  MODULE_PERMISSIONS: CataloguePermission[];
  ALL_PERMISSIONS: CataloguePermission[];
  ADMIN_ROLE: { name: string; description: string };
}

// The catalogue is CommonJS because sequelize-cli seeders run it directly with
// node. Requiring it here keeps it under test despite living outside the build.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- the catalogue is CommonJS by necessity: sequelize-cli seeders run it directly with node
const catalogue = require('./seed-catalogue.cjs') as Catalogue;

describe('seed catalogue', () => {
  it('includes the four action names from docs/scope.md §5 (FR-S1)', () => {
    expect(catalogue.PROJECT_PERMISSIONS.map((p) => p.name)).toEqual([
      'project.create',
      'project.update',
      'project.delete',
      'project.view',
    ]);
  });

  it('covers every route this module exposes (FR-S6)', () => {
    // If a route is added without a permission name here, route-protection
    // would have nothing to require — this is the list that prevents that.
    expect(catalogue.MODULE_PERMISSIONS.map((p) => p.name)).toEqual(
      expect.arrayContaining([
        'user.create',
        'user.view',
        'user.update',
        'user.assign-role',
        'user.change-password',
        'role.create',
        'role.view',
        'role.update',
        'permission.create',
        'permission.view',
        'permission.update',
        'role-permission.view',
        'role-permission.assign',
        'role-permission.remove',
      ]),
    );
  });

  it('has no duplicate names', () => {
    const names = catalogue.ALL_PERMISSIONS.map((p) => p.name);

    expect(new Set(names).size).toBe(names.length);
  });

  it('combines both groups into ALL_PERMISSIONS', () => {
    expect(catalogue.ALL_PERMISSIONS).toHaveLength(
      catalogue.PROJECT_PERMISSIONS.length +
        catalogue.MODULE_PERMISSIONS.length,
    );
  });

  it('follows the resource.action shape §5 uses', () => {
    for (const permission of catalogue.ALL_PERMISSIONS) {
      expect(permission.name).toMatch(/^[a-z-]+\.[a-z-]+$/);
    }
  });

  it('describes every permission, since operators read these', () => {
    for (const permission of catalogue.ALL_PERMISSIONS) {
      expect(permission.description.trim().length).toBeGreaterThan(0);
    }
  });

  it('names no activate/deactivate permission — that rides on update', () => {
    const names = catalogue.ALL_PERMISSIONS.map((p) => p.name);

    // A separate *.activate permission would describe an API that does not
    // exist: activation is a status change on the update route.
    expect(names.filter((n) => /activate/.test(n))).toEqual([]);
  });

  it('defines the administrator role', () => {
    expect(catalogue.ADMIN_ROLE.name).toBe('Developer Admin');
  });
});
