---
run: run-spec-driven-ai-009
work_item: seed-bootstrap
intent: developer-user-module
mode: validate
checkpoint: plan
approved_at: 2026-09-12T19:55:00Z
---

# Implementation Plan: Seeds — Permissions, Admin Role, First Administrator

> Checkpoints self-served under the standing instruction. Design doc:
> `.specs-fire/intents/developer-user-module/work-items/seed-bootstrap-design.md`

## Approach

Four ordered `sequelize-cli` seeders plus one shared catalogue. Idempotent by natural key.
Satisfies FR-S1–FR-S7 and D-6/D-7.

## Files to Create

`src/config/seed-catalogue.cjs` (every permission name in one place);
`src/seeders/20260912200000-seed-permissions.cjs`; `…200100-seed-admin-role.cjs`;
`…200200-seed-admin-links.cjs`; `…200300-seed-first-admin.cjs`;
`src/config/SeedCatalogue.spec.ts`.

## Files to Modify

`backend/package.json` — `seed` and `seed:undo` scripts.

## Technical Details

**The catalogue lives in `src/config/`, not `src/seeders/`.** `sequelize-cli` treats every file
in the seeders directory as a seeder, so a shared module there would be executed as one and fail.

**Admin links are computed at run time** from the permission table, not hard-coded. A permission
added later is granted on the next run rather than the administrator silently lacking it.

**Four seeders, not one**, so a failure is attributable and each is independently re-runnable.
Filename order matches the FK dependencies.

**The admin password is never reset on a re-run.** A routine deploy must not be able to take over
a live account.

---
*Plan approved at checkpoint. Execution follows.*
