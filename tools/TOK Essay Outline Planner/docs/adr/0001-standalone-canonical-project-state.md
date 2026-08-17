# ADR 0001: Standalone application with canonical Project State

- Status: Accepted
- Date: 2026-08-13

## Context

Students need a portable planner that works on school and personal devices without accounts, servers, or network access. Editing, autosave, Working Copy generation, print/PDF, AI prompt export, history, and UI restoration must not drift into separate representations.

## Decision

Ship the planner as one standards-based `index.html` file. Maintain one explicitly versioned, JSON-serializable Project State as the semantic source of truth. Render the editor from that state and generate all persistence/export forms from it.

A Working Copy is the complete application document with current Project State embedded as safely escaped JSON. Browser storage remains a recovery aid. Teacher PDF uses the browser's print pipeline and print-specific CSS so the application has no runtime dependency.

## Consequences

- The production file opens offline and can be copied or renamed like a document.
- Schema changes require explicit migrations and round-trip fixtures.
- The single file is larger than a componentized application, so functions should remain organized around clear state, editor, persistence, and export responsibilities.
- Browser security policies may restrict clipboard access or in-place file replacement; downloads remain the compatible save mechanism.
- Browser-level tests are the primary confidence seam because they exercise both canonical state and visible behavior.

