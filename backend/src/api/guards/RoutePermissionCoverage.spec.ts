import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

interface CataloguePermission {
  name: string;
}
interface Catalogue {
  ALL_PERMISSIONS: CataloguePermission[];
}
// eslint-disable-next-line @typescript-eslint/no-require-imports -- CommonJS by necessity: sequelize-cli runs the catalogue with node
const catalogue = require('../../config/seed-catalogue.cjs') as Catalogue;

const CONTROLLERS_DIR = join(__dirname, '..', 'controllers');

const controllerSources = (): { file: string; source: string }[] =>
  readdirSync(CONTROLLERS_DIR)
    .filter((file) => file.endsWith('Controller.ts'))
    .map((file) => ({
      file,
      source: readFileSync(join(CONTROLLERS_DIR, file), 'utf8'),
    }));

const requiredPermissions = (source: string): string[] =>
  [...source.matchAll(/@RequiresPermission\('([^']+)'\)/g)].map(
    (match) => match[1],
  );

describe('route permission coverage', () => {
  const seeded = new Set(catalogue.ALL_PERMISSIONS.map((p) => p.name));

  it('every permission a route requires is one the seed creates', () => {
    // If a guard requires a name the seed does not create, the administrator
    // is locked out of that route with no way to grant it through the API.
    const missing: string[] = [];

    for (const { file, source } of controllerSources()) {
      for (const permission of requiredPermissions(source)) {
        if (!seeded.has(permission)) {
          missing.push(`${file}: ${permission}`);
        }
      }
    }

    expect(missing).toEqual([]);
  });

  it('every controller with routes declares permissions or is public', () => {
    const unguarded: string[] = [];

    for (const { file, source } of controllerSources()) {
      const hasRoutes = /@(Post|Get|Patch|Delete)\(/.test(source);
      const declares =
        source.includes('@RequiresPermission(') || source.includes('@Public()');

      if (hasRoutes && !declares) {
        unguarded.push(file);
      }
    }

    expect(unguarded).toEqual([]);
  });

  it('the route-bearing controllers are all accounted for', () => {
    // A sanity check that the scan is actually finding files, so the two
    // assertions above cannot pass by looking at nothing.
    expect(controllerSources().length).toBeGreaterThanOrEqual(6);
  });
});
