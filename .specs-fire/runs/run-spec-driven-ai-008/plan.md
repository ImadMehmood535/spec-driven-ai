---
run: run-spec-driven-ai-008
work_item: authentication-login
intent: developer-user-module
mode: validate
checkpoint: plan
approved_at: 2026-09-12T19:15:00Z
---

# Implementation Plan: Credential Verification and JWT Login

> Checkpoints self-served under the standing instruction. Design doc:
> `.specs-fire/intents/developer-user-module/work-items/authentication-login-design.md`

## Approach

One login route. Verify with `bcrypt`, resolve permissions through the shared query, sign a JWT.
Every failure returns one identical 401. Satisfies FR-U6, FR-U7, D-2.

## Files to Create

`IAuthQueries` + `AuthQueries` (returns the hash, unlike `UserReadModel`); `JwtConfig`
(fail-fast on a missing secret); `AuthPersistenceModule`; `login` feature; `AuthModule`;
`AuthController`; two spec files.

## Files to Modify

`api/ApiModule.ts`; `AppController.spec.ts` (needs a secret in the environment, since
`AuthModule` refuses to build without one).

## Tests

Success; wrong password; unknown user; **deactivated user with the correct password** (FR-U7);
**all three failures producing an identical message**; timing parity on the absent path; claim
contents; no credential material in claims; blank input short-circuited; permissions not
resolved until credentials pass; and the secret fail-fast in every blank form.

## Technical Details

**A separate auth read model.** `UserReadModel` deliberately has no `passwordHash`, so
verification needs its own query. Keeping them separate means the general read path stays
hash-free rather than gaining a hash field that everything else must remember to strip.

**Dummy-hash verify on the absent path.** Without it, an unknown user returns in a few
milliseconds while a real one takes ~200ms at cost 12 — response time alone would reveal whether
an account exists.

**Fail fast on a missing secret.** A default signing key would make every token forgeable in any
deployment that forgot to set one. A crash at startup is the safer failure.

---
*Plan approved at checkpoint. Execution follows.*
