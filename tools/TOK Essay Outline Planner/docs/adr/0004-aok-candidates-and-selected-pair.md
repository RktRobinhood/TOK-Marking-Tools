# ADR 0004: AOK Candidates with a selected essay pair

- Status: Accepted
- Date: 2026-08-17

## Context

Students often need to develop more than two Areas of Knowledge before deciding which combination best answers the prescribed title. The original Project State permanently identified two Sections as `aok1` and `aok2`, so trying a third AOK required overwriting work or maintaining another Working Copy. Free-text AOK names also allowed entries outside the five official TOK Areas of Knowledge.

Teacher PDF and AI feedback must still assess a coherent essay with exactly two AOKs. Exploratory work must remain recoverable without leaking into those outputs.

## Decision

- Represent each AOK Candidate as a stable ID, an official AOK name, and its own Section of Blocks.
- Store the ordered pair in `selectedAokIds`; its order determines the student-visible AOK 1 and AOK 2 labels.
- Offer only History, Human Sciences, Natural Sciences, The Arts, and Mathematics in AOK selectors.
- Enable additional exploration only after two different official AOKs are selected, and open the additional selector with no default choice.
- Keep official AOK names unique across selected and exploratory candidates.
- Show a side Exploration Tray after a third candidate is created. Editing an unselected candidate happens in a visually separate Exploration Workspace.
- When the Exploration Tray is closed, keep a right-edge AOK options tab visible so the combination controls remain discoverable.
- Keep all candidates in the Working Copy, history, and browser recovery state.
- Generate the Teacher PDF and all AI Feedback Modes from Introduction, the two Selected AOKs, and Conclusion only.
- Advance Project State to schema 3. Migrate schema 1 and 2 `aok1` / `aok2` Sections into selected candidates without changing their Block IDs or content. Preserve an unrecognized legacy AOK label as migration information while requiring a new official selection.

## Consequences

- Selecting a replacement AOK is lossless: the displaced candidate returns to exploration.
- AOK 1 and AOK 2 are positions, not permanent identities. Swapping changes `selectedAokIds`, not candidate data.
- Rendering, validation, print, and prompt generation share `sectionOrder`, which contains only the selected essay.
- The Tutorial and first-run onboarding must explain how to reach Help, distinguish exploration from selection, and state which content is exported.
- Browser tests cover official choices, duplicate prevention, exploratory editing, pair replacement, selected-only exports, Working Copy round-trip, and legacy migration.
