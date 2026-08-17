# ADR 0002: Removable Starter Blocks and visual onboarding

- Status: Accepted
- Date: 2026-08-14
- Supersedes: the earlier product requirement for non-removable Backbone Blocks

## Context

A fixed backbone gives useful scaffolding but can also prescribe an argument shape too early. Students need permission to begin from nothing, while less certain students still benefit from a guided starting point and a visual explanation of the editor.

Dragging a Toolbox Block only to the end of a Section also forces an unnecessary second reordering step.

## Decision

- Treat all initial Blocks as removable **Starter Blocks** rather than required Backbone Blocks.
- Offer Guided, Discussion-led, Comparison-led, and Blank slate layouts in a skippable first-run wizard.
- Keep wizard metadata optional and expose a non-mutating visual guide through Help.
- Show position-aware insertion lines during Toolbox drags, including nested sibling collections up to the existing depth limit.
- Advance Project State to schema 2. Persist the chosen Starter layout so progress follows the prompts actually supplied. Migration clears legacy `required` flags, preserves the rest of each Block, and marks onboarding complete for existing users.

## Consequences

- A completely empty outline is valid.
- Completion text describes development of suggested reasoning moves, not mandatory structure.
- Existing users are not interrupted by first-run onboarding after migration.
- Onboarding completion is lifecycle state rather than an undoable editing action.
- Precise drag insertion is pointer-oriented; the explicit `+` button and existing move/indent controls remain the keyboard/touch alternative.
- Template changes stay inside the first-run flow so Help cannot overwrite student work.
