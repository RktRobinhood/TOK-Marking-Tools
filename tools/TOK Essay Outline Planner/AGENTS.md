# Project instructions

## Agent skills

### Issue tracker

Work is tracked as local Markdown under `.scratch/`; there is no remote PR request surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the standard Matt Pocock triage vocabulary without aliases. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context project. Read `CONTEXT.md` and relevant decisions in `docs/adr/` before implementation. See `docs/agents/domain.md`.

## Development

- Preserve `index.html` as a standalone, offline-capable application.
- Treat serialized Project State and user-visible browser behavior as the primary test seam.
- Keep generated working copies compatible with the canonical schema or add an explicit migration.
- Run `npm test` before committing application changes.
- Record hard-to-reverse architectural decisions as ADRs under `docs/adr/`.

