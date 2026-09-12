---
run: run-spec-driven-ai-008
work_item: authentication-login
intent: developer-user-module
generated: 2026-09-12T19:45:00Z
mode: validate
---

# Implementation Walkthrough: Credential Verification and JWT Login

## Summary

Users can log in with an email or username and receive a JWT carrying their identity and
effective permissions. Satisfies FR-U6, FR-U7, and D-2.

339 tests pass. The security properties were verified by measurement, not assertion.

## The login path

```text
POST /auth/login { identifier, password }
  └─ LoginCommandHandler
       ├─ blank input?                      → 401, no lookup at all
       ├─ authQueries.findByIdentifier()     email OR username; returns the hash
       ├─ absent? → verify(password, DUMMY_HASH) → 401       timing parity
       ├─ verify(password, user.passwordHash) → false → 401
       ├─ user inactive?                     → 401           FR-U7
       ├─ resolution.findEffectivePermissionNames(user.id)   shared query
       └─ jwt.signAsync({ sub, username, role, permissions })
            └─ { accessToken, expiresIn }    no user object, no hash
```

Every failure exits through the same `UnauthorizedError('Invalid credentials.')`.

## Key Implementation Details

### 1. Uniform failure, verified byte-for-byte

Three causes — unknown user, wrong password, deactivated account — must be indistinguishable, or
an attacker can enumerate valid accounts. A live comparison confirmed the three response bodies
are **identical**, not merely similar:

```
wrong password           → {"statusCode":401,"message":"Invalid credentials.",…}
unknown user             → {"statusCode":401,"message":"Invalid credentials.",…}
deactivated + correct pw → {"statusCode":401,"message":"Invalid credentials.",…}
```

A unit test collects all three messages and asserts the set has exactly one member, so a future
"more helpful" error cannot slip in.

### 2. Timing parity, measured rather than assumed

A uniform message is undone if the response time differs. When no user is found, the handler
still runs a bcrypt verify against a dummy hash:

```
existing user, wrong password → 0.20s
unknown user                  → 0.19s
```

Without it: roughly 5ms against 200ms at cost 12 — trivially detectable.

### 3. A separate hash-bearing read model

`UserReadModel` deliberately has no `passwordHash` (run 006). Verification needs one, so
`AuthUserReadModel` exists solely for that. Widening the general read model would have been
easier and would have left a hash one careless change away from every user response.

### 4. The app refuses to start without a secret

```
$ env -u JWT_SECRET node dist/main
JWT_SECRET is not set. The application will not start without it —
a default signing key would make every token forgeable.
```

A default would mean every deployment that forgot to configure one shares a forgeable key. A
crash is the safer failure, and it is tested in every blank form (undefined, empty, whitespace).

### 5. Claims come from the shared resolution

Not a reimplementation. Every FR-AC3 exclusion therefore applies to the token, and a test
asserts an empty resolution produces empty claims. Decoded from a real login:

```json
{ "sub": "282271b5-…", "username": "ahmed", "role": "Developer Admin",
  "permissions": ["project.create"], "iat": …, "exp": … }   // exp - iat = 3600
```

No hash. No plaintext. Verified by decoding, not by reading the code.

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Identifier | One field accepting email **or** username | The scope names both as identity; forcing a choice would be arbitrary |
| Failure response | One message, one status, always | Anything else is a user-enumeration oracle |
| Absent-user path | Verify against a dummy hash | Otherwise response time reveals account existence |
| Missing secret | Throw at construction | A default signing key is worse than a crash |
| Auth read model | Separate from `UserReadModel` | Keeps the general read path hash-free |
| Claim source | The shared resolution query | So FR-AC3 applies to tokens, and the gates cannot drift |

## Deviations from Plan

Five fixes, all in `review-report.md`. Two are worth repeating:

- **I installed `@nestjs/jwt@12` against a Nest 11 stack** by taking `latest`. The compiled app
  ran anyway, because Node 24 can `require()` ESM — only Jest exposed the mismatch. Pinned to
  `^11`.
- **`AuthModule` did not declare `ConfigModule`**, relying on the root module making it global.
  Worked in production; broke the instant a test composed the module alone.

## Dependencies Added

| Package | Why |
|---------|-----|
| `@nestjs/jwt` (^11) | Token signing, pinned to the Nest 11 line |

## How to Verify

```bash
cd backend && npm test      # 339 tests

env -u JWT_SECRET node dist/main            # refuses to start

curl -X POST localhost:3000/auth/login -H 'Content-Type: application/json' \
  -d '{"identifier":"ahmed@example.com","password":"a-real-password"}'   # 200 + token

# decode the claims
node -e "console.log(JSON.parse(Buffer.from(process.argv[1].split('.')[1],'base64url')))" "$TOKEN"

# all three failures, identical bodies:
curl -X POST localhost:3000/auth/login -d '{"identifier":"ahmed@example.com","password":"wrong"}' -H 'Content-Type: application/json'
curl -X POST localhost:3000/auth/login -d '{"identifier":"nobody@example.com","password":"x"}'     -H 'Content-Type: application/json'
# then deactivate the user and retry with the correct password
```

## Test Coverage

- Tests added: 21; 339 total
- Live checks: 12, including decoded claims, identical failure bodies, measured timing, fail-fast
- Status: passing

## Ready for Review

- [x] All acceptance criteria met — 12/12
- [x] Tests passing
- [x] No critical issues
- [x] Documentation updated
- [x] Developer notes captured

## Developer Notes

**Token staleness is now real.** Permissions are embedded at login, so a revocation does not take
effect until expiry (default 1h). That is D-2's accepted trade-off, and it is why
`permission-resolution` has no cache — the uncached query stays the source of truth for anything
needing immediacy. **`route-protection` must choose** between trusting claims and doing a live
lookup, and should state the consequence either way.

**No rate limiting or lockout.** Uniform errors and timing parity resist *enumeration*; they do
nothing against brute force. Nothing in `docs/scope.md` asks for throttling, so adding it would
be scope creep — but it is a real gap worth naming rather than leaving implied.

**Next work item**: `seed-bootstrap` (high, validate) — the permission catalogue, the admin role
holding every permission, and the first administrator from environment configuration.

---
*Generated by specs.md - fabriqa.ai FIRE Flow Run run-spec-driven-ai-008*
