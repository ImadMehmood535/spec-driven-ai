---
run: run-spec-driven-ai-010
work_item: route-protection
intent: developer-user-module
mode: validate
checkpoint: plan
approved_at: 2026-09-12T20:30:00Z
---

# Implementation Plan: Route Authentication and Authorization Guards

> Checkpoints self-served under the standing instruction. Design doc:
> `.specs-fire/intents/developer-user-module/work-items/route-protection-design.md`

## Approach

Two globally registered guards. `JwtAuthGuard` verifies the bearer token; `PermissionsGuard`
enforces the permission a route declares. Both are global with explicit `@Public()` exemptions,
because per-route opt-in fails open the moment someone forgets a decorator.

**Default deny**: a route declaring neither a permission nor `@Public()` is refused.

## Files to Create

`api/decorators/Public.ts`; `api/decorators/RequiresPermission.ts`;
`api/guards/AuthenticatedRequest.ts`; `api/guards/JwtAuthGuard.ts`;
`api/guards/PermissionsGuard.ts`; three spec files including a route/catalogue cross-check.

## Files to Modify

`api/ApiModule.ts` (register both as `APP_GUARD`); all five management controllers (annotate 19
routes); `AuthController` and `AppController` (`@Public()`); `AppController.spec.ts`.

## Technical Details

**Permissions come from the JWT claims**, per D-2 — no database round trip per request.
Consequence, stated plainly: a revocation takes effect on token reissue, not immediately.
Anything needing immediacy calls `GET /user/:id/permission`, which is uncached by design.

**The guards do not reimplement resolution.** They read claims the shared query produced at
login, so FR-AC3's four gates cannot drift between login and enforcement.

**Permission names come from the seeded catalogue.** A name the seed does not create would lock
the administrator out of that route with no way to grant it — a test cross-checks every
`@RequiresPermission` against `seed-catalogue.cjs`.

---
*Plan approved at checkpoint. Execution follows.*
