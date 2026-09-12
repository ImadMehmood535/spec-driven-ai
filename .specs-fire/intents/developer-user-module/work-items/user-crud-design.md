---
work_item: user-crud
intent: developer-user-module
created: 2026-09-12T18:00:00Z
mode: validate
checkpoint_1: approved
---

# Design: User Management Slice

> Checkpoint 1 self-served under the user's standing instruction to run the loop autonomously.

## Summary

The user slice: create, view, list, update, activate/deactivate, assign a role, and change a
password. Satisfies FR-U1–FR-U5 and D-9. Rated **high** because it is the first work item that
stores credentials — a `passwordHash` that must never appear in any response, log, or read
model.

Credential *verification* (login) is `authentication-login`. This slice only establishes how a
password is stored.

## Scope

**In Scope:**
- `User` aggregate, model wiring, repository, query class
- Create (with initial password), get, list, update, activate/deactivate
- Assign role — replaces, never accumulates (§6: one role per user)
- Change password by an administrator (D-9)
- A hashing port with a `bcrypt` implementation at cost 12

**Out of Scope:**
- Login, JWT, credential verification — `authentication-login`
- Password reset, self-service, email tokens, current-password challenge (D-9 excludes them)
- Permission resolution — `permission-resolution`
- Route guards — `route-protection`

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Hashing | `bcrypt`, cost 12, behind `IPasswordHasher` | Recorded in `tech-stack.md`; the port keeps `argon2id` swappable |
| Where hashing happens | Application layer (handler), not the aggregate | The aggregate must stay pure and synchronous; hashing is async I/O-ish work |
| What the aggregate holds | The **hash**, never a plaintext password | A plaintext field, even transient, is a field that can leak into a log or a snapshot |
| Read model | Has **no** `passwordHash` field at all | Not "excluded when serialising" — absent from the type, so it cannot be added back by accident |
| Role assignment | Scalar `roleId`, overwritten | §6 one role per user; a join table would invite multi-role |
| Assigning a missing role | 404 | Silently leaving the user role-less would be worse than failing |
| Password change | Dedicated command, not a field on update | Keeps the credential path separate and auditable, and stops a password arriving in a general-purpose PATCH body |
| Uniqueness | `email` and `username`, each checked with `exceptId` on update | FR-U1; DB constraints from run 002 are the guarantee |
| Deactivated users | Stored, not blocked here | FR-U7 ("a deactivated user cannot authenticate") belongs to `authentication-login`; this slice only records status |

## Data Models Affected

Uses `UserModel` from run 002 unchanged. No migration.

## Technical Approach

```
POST /user  ──> UserController
                 └─> CreateUserCommandHandler
                      ├─> hasher.hash(plaintext)        IPasswordHasher (bcrypt, cost 12)
                      ├─> User.create({..., passwordHash})
                      ├─> repository.emailExists / usernameExists   → 409
                      └─> repository.save(user)
                           └─> CreateUserResponse.fromDomain(saved)   no hash in response

PATCH /user/:id/password ──> ChangePasswordCommandHandler  (D-9)
                              ├─> repository.findById → 404
                              ├─> hasher.hash(newPlaintext)
                              ├─> user.changePasswordHash(hash)
                              └─> repository.updateUser(user)

PATCH /user/:id/role ──> AssignRoleCommandHandler
                          ├─> roleRepository.findById → 404
                          └─> user.assignRole(roleId)   replaces
```

## Security Considerations

- **`passwordHash` is absent from `UserReadModel`.** The query class never selects it. Being
  absent from the type is stronger than remembering to strip it.
- **No response class exposes the hash.** Asserted by tests on every response shape.
- **The request logger already redacts** `password`, `newPassword`, `passwordHash` at any depth
  (run 001). This slice is the first to actually send those fields, so a test asserts a created
  user's password never reaches stdout.
- **Plaintext never touches the aggregate or the database.** The handler hashes first; the
  aggregate's setter is named `changePasswordHash` so a caller cannot pass plaintext by mistake.
- **Hashing is not skippable.** `User.create` requires a hash; there is no default and no
  nullable path, matching the `NOT NULL` column.
- **No password in fixtures.** Tests use obvious placeholders.

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `passwordHash` leaking into a response or read model | Credential disclosure | Absent from the read-model type; tests assert every response shape lacks it |
| Plaintext password reaching a log | Credential disclosure | Redaction from run 001, plus a test on the create path asserting the value never appears in stdout |
| Role assignment accumulating instead of replacing | Multi-role by accident, contradicting §6 | Scalar column; a test asserts a second assignment replaces the first |
| A cheap hash cost | Offline cracking | cost 12, asserted by a test reading the bcrypt prefix |
| Password arriving via general PATCH | Credential in an unexpected body, bypassing intent | Dedicated password route; the update DTO has no password field |

## Implementation Checklist

- [ ] `IPasswordHasher` + `BcryptPasswordHasher` (cost 12), bound by symbol
- [ ] `User` aggregate: guards, `assignRole`, `changePasswordHash`, status transitions
- [ ] Repository with `emailExists`/`usernameExists` (both taking `exceptId`)
- [ ] Query class whose read model has no `passwordHash`
- [ ] Features: create, get, list, update, assign-role, change-password
- [ ] Controller with Swagger; no delete route
- [ ] Tests incl. hash-never-exposed, hash-never-logged, role replacement, cost factor
- [ ] Live verification against the real database

---
*Generated by specs.md - fabriqa.ai FIRE Flow | Checkpoint 1 approved: 2026-09-12T18:00:00Z*
