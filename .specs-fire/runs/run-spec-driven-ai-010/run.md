---
id: run-spec-driven-ai-010
scope: single
work_items:
  - id: route-protection
    intent: developer-user-module
    mode: validate
    status: completed
    current_phase: review
    checkpoint_state: approved
    current_checkpoint: plan
current_item: null
status: completed
started: 2026-09-12T16:50:13.922Z
completed: 2026-09-12T16:56:12.865Z
---

# Run: run-spec-driven-ai-010

## Scope
single (1 work item)

## Work Items
1. **route-protection** (validate) — completed


## Current Item
(all completed)

## Files Created
- `backend/src/api/guards/JwtAuthGuard.ts`: Global authentication, 401 on failure
- `backend/src/api/guards/PermissionsGuard.ts`: Global authorization with default deny, 403 on failure
- `backend/src/api/decorators/RequiresPermission.ts`: Declares the permission a route requires
- `backend/src/api/decorators/Public.ts`: Exempts login, health and docs
- `backend/src/api/guards/RoutePermissionCoverage.spec.ts`: Cross-checks route permissions against the seed catalogue

## Files Modified
- `backend/src/api/ApiModule.ts`: Registered both guards as APP_GUARD
- `backend/src/api/controllers/*.ts`: Annotated 19 routes; login and health marked public

## Decisions
- **Guard registration**: Global with @Public() exemptions (A forgotten decorator must fail closed, not open)
- **Undeclared route**: Refused — default deny (An omission must not become an open route)
- **Permission source**: JWT claims rather than a live query (D-2; avoids a query per request, with revocation delayed until reissue — stated explicitly)


## Summary

- Work items completed: 1
- Files created: 5
- Files modified: 2
- Tests added: 0
- Coverage: 0%
- Completed: 2026-09-12T16:56:12.865Z
