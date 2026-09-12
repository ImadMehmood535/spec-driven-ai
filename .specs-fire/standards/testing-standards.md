# Testing Standards

> **Backend and frontend are both tested.** The user requires test cases on the frontend as
> well, so this document covers each in turn.

## Overview

The reference service configures Jest (rootDir `src`, `testRegex` `.*\.spec\.ts$`, path-alias
`moduleNameMapper`) but contains **zero test files** — there is no existing test precedent to
mirror. The configuration below is inherited from the reference; the coverage expectations are
this project's own, because an access-control module is the wrong place to carry that gap
forward.

## Testing Framework

**Backend**: Jest 30 with `ts-jest`
**Frontend**: Vitest with React Testing Library, plus `jest-axe` for accessibility assertions
**E2E (optional, critical flows only)**: Playwright

## Test Types

| Type | Tool | Location | When to Use |
|------|------|----------|-------------|
| Unit (domain) | Jest | `src/domain/**/*.spec.ts` | Aggregate invariants and guard behaviour |
| Unit (application) | Jest | `src/application/**/*.spec.ts` | Command/query handlers with mocked ports |
| Guard (api) | Jest | `src/api/guards/**/*.spec.ts` | Authentication and permission-check guards |
| E2E (API) | Jest + supertest | `test/*.e2e-spec.ts` | Full HTTP route through to the database |
| Component (UI) | Vitest + RTL | `*.test.tsx` beside the component | Rendering, states, interaction, accessibility |
| Hook (UI) | Vitest + RTL | `*.test.ts` beside the hook | Data hooks with a mocked query client |
| Flow (UI) | Playwright | `e2e/*.spec.ts` | Login, then one full management flow |

## Coverage Requirements

**Target**: 80% on both backend and frontend
**Enforcement**: reported via the coverage scripts; not a hard CI gate until CI exists

**Critical backend paths that MUST have coverage:**
- Permission resolution for a user (the "can this user perform this action" path)
- Role assignment to a user
- Permission assignment to and removal from a role
- Credential verification, including the failure branches
- The authentication guard (missing, malformed, and expired token) and the permission guard
  (valid identity without the required permission)
- Activate/deactivate for user, role, and permission — and the effect of an inactive
  user, role, permission, or role-permission link on permission resolution
- Uniqueness rules (user email/username, role name, permission name)
- Seed idempotency — re-running creates no duplicates and does not reset the administrator

**Critical frontend paths that MUST have coverage:**
- Every shared component in each of its required states: loading/skeleton, empty, error,
  success, and confirmation
- Form validation — invalid submissions blocked, server field errors mapped back to the field,
  input preserved on failure
- The shared data table: filtering, sorting, pagination, column visibility, row actions
- Permission-driven rendering — controls hidden or disabled when the permission is absent
- Keyboard operability and focus handling on dialogs, sheets, and menus
- An accessibility assertion (`jest-axe`) on each shared component

## Test Naming

**Pattern**: `<ClassUnderTest>.spec.ts`, `describe('<ClassUnderTest>')`, `it('<expected behaviour>')`

**Examples**:
- `User.spec.ts` — aggregate invariants for the user aggregate
- `CreateRoleCommandHandler.spec.ts` — handler behaviour with a mocked repository
- `it('rejects a blank role name')` — one behaviour per test

## Test Structure

```typescript
describe('AssignRoleToUserCommandHandler', () => {
  let handler: AssignRoleToUserCommandHandler;
  let userRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      updateUser: jest.fn(),
    } as unknown as jest.Mocked<IUserRepository>;
    handler = new AssignRoleToUserCommandHandler(userRepository, /* roleRepository */);
  });

  it('throws NotFoundError when the user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(handler.execute(new AssignRoleToUserCommand(1, 2))).rejects.toThrow(
      NotFoundError,
    );
  });
});
```

## Frontend Test Structure

Component tests assert what a user can see and do — never implementation detail.

```tsx
describe('RoleTable', () => {
  it('shows a skeleton while loading', () => {
    renderWithQuery(<RoleTable />, { state: 'loading' });

    expect(screen.getByTestId('role-table-skeleton')).toBeInTheDocument();
  });

  it('explains what to do when there are no roles', () => {
    renderWithQuery(<RoleTable />, { roles: [] });

    expect(screen.getByText(/no roles yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create role/i })).toBeInTheDocument();
  });

  it('confirms before deactivating a role', async () => {
    const user = userEvent.setup();
    renderWithQuery(<RoleTable />, { roles: [activeRole] });

    await user.click(screen.getByRole('button', { name: /row actions/i }));
    await user.click(screen.getByRole('menuitem', { name: /deactivate/i }));

    expect(screen.getByRole('dialog', { name: /deactivate role/i })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithQuery(<RoleTable />, { roles: [activeRole] });

    expect(await axe(container)).toHaveNoViolations();
  });
});
```

**Frontend guidelines**:
- Query by role, label, and visible text — not by class name or test id, except where a test id
  is the only stable handle (skeletons)
- Drive interaction with `userEvent`, not synthetic `fireEvent`, so focus and keyboard
  behaviour are exercised the way a real user would
- Mock the API at the network boundary (MSW or a stubbed query client), never the component's
  internals
- Assert the *state the user sees* — a skeleton, an empty message, an error with retry, a
  toast, a confirmation dialog
- One shared render helper providing the query client, theme, and router; no bespoke wrapper
  per test file (reusability applies to tests too)
- Test both themes where a component's correctness depends on the theme

## Mock Strategy

**Approach**: mock at the port boundary (`I*Repository`, `I*Queries`) with `jest.Mocked<T>`

**Guidelines**:
- Never mock Sequelize models in application-layer tests — mock the port instead
- Domain aggregate tests use no mocks at all; they are pure
- E2E tests use a real PostgreSQL instance from `docker-compose.yml`, never a mocked ORM
- Do not mock the `CommandBus`/`QueryBus` in handler tests — instantiate the handler directly
- On the frontend, mock HTTP, not modules — the component under test runs its real hooks

## Test Data

**Strategy**: build aggregates through `create(...)` / `rehydrate(...)` in the test itself

**Guidelines**:
- No shared mutable fixture objects between tests
- Use the aggregate's own factory so invariants stay honest
- E2E tests seed through the API where a route exists, and truncate between suites
- Never use a real password in a fixture; use an obvious placeholder

## Running Tests

```bash
# Backend — all tests
npm test

# Backend — with coverage
npm run test:cov

# Backend — a single file
npm test -- User.spec.ts

# Backend — watch mode
npm run test:watch

# Frontend — all tests
npm run test:ui

# Frontend — with coverage
npm run test:ui:cov

# Frontend — watch mode
npm run test:ui:watch

# End-to-end flows (Playwright)
npm run test:e2e
```

## CI/CD Integration

CI/CD integration not configured.

---
*Generated by specs.md - fabriqa.ai FIRE Flow*
