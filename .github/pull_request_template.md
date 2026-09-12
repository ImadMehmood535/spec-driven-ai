<!--
One PR per FIRE run. See .specs-fire/standards/constitution.md → Pull Requests.
Title: conventional-commit style, naming the run's outcome.
-->

## Run

- **Run id**:
- **Work items closed**:
- **Walkthrough**: `.specs-fire/runs/<run-id>/walkthrough.md`

## Requirements satisfied

<!-- Requirement IDs from .specs-fire/intents/developer-user-module/brief.md, e.g. FR-U1, FR-AC5, FR-UI7 -->

-

## Left out

<!-- Anything deliberately not done in this run, and why. "Nothing" is a valid answer. -->

## Migration and seed notes

<!-- Required if either changed: what the migration does, whether down was tested, what the seed adds. Otherwise "No schema or seed changes." -->

---

## Definition of done

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
- [ ] Nothing outside this repository was modified
- [ ] No scope added beyond `docs/scope.md` and the intent brief

## Security-sensitive review

Does this PR touch credentials, password hashing, JWT issuing/verification, role assignment,
permission definition, the permission-resolution path, or the route guards?

- [ ] No
- [ ] Yes — and I re-read those diffs in full, not skimmed
