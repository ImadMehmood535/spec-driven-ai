# Project Constitution

> Universal policies that apply to ALL code in this project.
> This file is always inherited from root — modules cannot override it.

## Repository Boundary (absolute)

This is a **standalone project**. It belongs to no other repository, monorepo, or service
estate.

- **The only writable location is** `/Users/imadmehmood/projects/invespy/spec-driven-ai`.
  Every file created, edited, moved, or deleted must live inside it.
- **`/Users/imadmehmood/projects/invespy/v2/invespy-v2-feeds-microservice` is
  reference-only.** It was provided solely to show the DDD, CQRS, and clean-architecture
  layout. Never write to it, never modify it, never commit to it — read it, nothing more.
- **No other repository may be written to**, including anything else under
  `/Users/imadmehmood/projects/invespy/` (`v2/*`, `current/*`, `study/*`) and any path
  outside this project directory.
- **No cross-repository dependency.** This project does not import from, link to, publish to,
  or share a database with any other Invespy repository. Code is not copied wholesale from the
  reference repo; its *patterns* are followed and its code is re-authored for this domain.
- **One git remote only**: `https://github.com/ImadMehmood535/spec-driven-ai.git`. No other
  remote is added, fetched from, or pushed to.

This boundary outranks convenience. If a task appears to require writing outside this
directory, stop and raise it rather than doing it.

## Backend / Frontend Separation (absolute)

`backend/` and `frontend/` are **two independent projects that will be split into two separate
repositories**. They are kept in one directory today purely for convenience; nothing may depend
on that arrangement.

- **Each project is fully self-contained**: its own `package.json`, lockfile, `tsconfig`,
  ESLint and Prettier config, `.gitignore`, `README.md`, `.env.example`, and test setup.
  `backend/` also owns its `docker-compose.yml`.
- **No root-level tooling.** No root `package.json`, no npm workspaces, no shared lockfile, no
  root build or test script that spans both. Commands run inside each project.
- **No shared code, ever.** Neither project imports from the other. No shared types package,
  no shared utils directory, no relative import that crosses the boundary, no symlink, no
  generated client committed into the other side.
- **The contract between them is the HTTP API only** — the documented REST surface and its
  Swagger description. The frontend talks to the backend the way any external client would.
- **Duplication across the boundary is correct**, not a smell. If both sides need a permission
  name or a status value, each declares its own. FR-UI13's reuse rule applies *within* a
  project, never across the two.

**The test**: moving either directory into an empty repository must leave it working, with no
file from the other side. Any change that would break that test is a violation — raise it
instead of making it.

## Git Workflow

- **Remote**: `https://github.com/ImadMehmood535/spec-driven-ai.git` — the only one
- **Main Branch**: `main` is always deployable. Never commit directly to `main`.
- **Branch per run**: one branch per FIRE run, named `run/<run-id>` (e.g.
  `run/run-spec-driven-ai-001`). A run may carry several work items; they share the branch.
- **Work outside a run** — specs, standards, tooling, repo scaffolding — uses a conventional
  prefix instead: `chore/<short-name>` or `docs/<short-name>`. Same PR rules apply, but the
  run-specific fields in the PR description are answered "not a run".
- **Commit Style**: Conventional commits — `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`,
  `test:`. Scope with the area when useful: `feat(role): add permission assignment`.
- **Commit granularity**: one logical change per commit. A commit compiles and its tests pass.
- **Never commit**: `.env` files, JWT secrets, seed administrator credentials, or any real
  password — see *Security Policies*.

## Pull Requests

**One PR per run.** The PR is the review checkpoint for everything that run produced.

### Requirements

- Opened from `run/<run-id>` into `main`
- Title: conventional-commit style, naming the run's outcome
- Description must contain:
  - the **run id** and the **work items** it closes
  - the **requirement IDs** satisfied (e.g. `FR-U1`, `FR-AC5`, `FR-UI7`) — traceable back to
    `.specs-fire/intents/developer-user-module/brief.md`
  - a link to the run's `walkthrough.md`
  - anything deliberately left out, and why
  - migration and seed notes when either changed
- Scope discipline: a PR contains its run's work and nothing else. Unrelated fixes go in their
  own PR.

### Definition of done — checked before merge

- [ ] Every acceptance criterion on the run's work items is met
- [ ] Backend tests pass; frontend tests pass
- [ ] Lint and formatting clean; TypeScript compiles with no new errors
- [ ] New migrations run `up` **and** `down` cleanly against a fresh database
- [ ] Seeds remain idempotent — running them twice changes nothing
- [ ] No password hash, token, or credential in any response, log, read model, or fixture
- [ ] Swagger decorators present on new request/response classes and routes
- [ ] New UI work covers loading, empty, error, success, and confirmation states
- [ ] New UI work is responsive, keyboard-operable, and correct in dark mode
- [ ] No component duplicates an existing shared one
- [ ] Nothing outside this repository was modified (see *Repository Boundary*)
- [ ] No scope added beyond `docs/scope.md` and the intent brief

### Review

- **Solo project**: self-merge is allowed. The PR and the checklist above are the review — work
  through them honestly rather than treating the merge as a formality.
- **Squash merge** into `main`, keeping a conventional-commit subject. Delete the run branch
  after merge.
- **Security-sensitive changes get a second, deliberate pass** before merge — anything touching
  credentials, password hashing, JWT issuing or verification, role assignment, permission
  definition, the permission-resolution path, or the route guards. Re-read those diffs in full;
  do not skim them.
- When a second developer joins, the approval gate turns on: ≥1 approval, no self-merging, and
  CODEOWNERS over the security-sensitive paths.

## CI/CD

Not configured yet. Until it is, the definition-of-done checklist above is run **locally**
before merge — it is the gate.

When CI is added it must, at minimum: install, lint, typecheck, run backend and frontend tests,
and apply migrations against a throwaway database. At that point "all PRs must pass CI before
merge" becomes binding and the local checklist becomes a backstop rather than the gate.

## Security Policies

- **No secrets in code** — use environment variables or secret management
- Dependencies must be from trusted sources
- Security vulnerabilities addressed within SLA
- No credentials, API keys, or tokens in source control
- Password hashes are never returned in an API response, logged, or included in a read model

## Documentation

- Public APIs must be documented (Swagger decorators on every request/response class)
- Breaking changes require migration notes
- README kept up to date with setup instructions

## Scope Discipline

- `docs/scope.md` is the single source of truth for the Developer User Module
- Per scope.md §10, any functionality not defined in that scope is a **scope change**:
  it must be reviewed and added to the specification before implementation
- The AI agent must not expand scope based on assumptions

---
*Generated by specs.md - fabriqa.ai FIRE Flow*
