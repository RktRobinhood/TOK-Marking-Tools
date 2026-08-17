# Iterative development guide

## Source of truth

The authoritative behavior is described in `TOK_Essay_Outline_Planner_Spec.md`. The production artifact is `index.html`; a saved Working Copy is a clone of that document with serialized Project State embedded in `#embedded-state`.

Project State—not the rendered DOM—is the semantic source for persistence, history, section order, print output, and AI prompt generation. The UI may be refactored, but a feature is incomplete unless its state survives a Working Copy round trip.

## Working loop

1. Read `CONTEXT.md`, the relevant ADRs, and the local ticket.
2. Add or change one browser-level test at the agreed Project State/editor seam.
3. Observe the test fail for the intended reason.
4. Make the smallest behavior change that passes it.
5. Run the focused test, then `npm test`.
6. Review the diff separately for repository standards and specification fidelity.
7. Update the ticket and documentation when behavior, vocabulary, schema, or operational assumptions change.
8. Commit one coherent slice with an intentional message.

## Project State evolution

- `SCHEMA_VERSION` must change when an existing Working Copy cannot be read without transformation.
- Add an explicit migration before increasing the version. Never silently replace unsupported Project State with an empty Project.
- Preserve stable Block IDs during migration; generate new IDs only when one is absent or duplicated.
- Normalize restored rich text and enforce the two-level nesting invariant at the state boundary.
- Extend the round-trip test with representative old state before shipping a migration.

## Review checklist

- Introduction remains first and Conclusion remains last.
- AOK Sections swap as complete units.
- Starter Blocks can be deleted or retyped, and a blank Project remains valid.
- Schema 1 Projects migrate to schema 2 without changing Block content, IDs, order, or nesting.
- First-run onboarding remains skippable, and neither Help nor the tutorial mutates Project State.
- The tutorial opens on its first step, pages both ways, and closes from any step.
- Toolbox insertion lines place new Blocks at the selected sibling/nesting position.
- No hierarchy exceeds two levels beneath a root Block.
- Undo/redo covers any new structural operation.
- Working Copy reopen preserves content, formatting, hierarchy, UI state, and metadata.
- Print reveals collapsed content and contains no editor controls.
- Every Feedback Mode export includes all Blocks, the block legend, and the non-generative reviewer guardrails.
- Feedback Mode choices read as stages a student recognizes, never as prompt names or internal vocabulary.
- Guardrail wording is edited once in `PROMPT_GUARDRAILS`, never per mode.
- Primary workflows work at desktop and 768 × 1024 tablet widths.
- Controls introduced by the change have accessible names and keyboard/touch alternatives.
- `npm test` passes.

## Local issue workflow

Use `.scratch/<feature>/PRD.md` and numbered tickets under `.scratch/<feature>/issues/`. Record blocking edges and status in each ticket. Finished tickets remain as the local decision/history trail.
