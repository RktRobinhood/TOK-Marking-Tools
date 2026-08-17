# TOK Essay Outline Planner

An offline-first argument planner for Theory of Knowledge essays. Students assemble and revise an essay's reasoning structure, save the live project as a standalone HTML file, print a complete teacher-facing outline, and export a constrained prompt for external AI feedback.

Use the published planner from the [TOK Tools Hub](https://rktrobinhood.github.io/TOK-Marking-Tools/) or open this folder's `index.html` directly for offline use.

## Use the planner

Open [`index.html`](./index.html) in a modern browser. No installation, account, network connection, or server is required for normal use.

- **Save Working Copy** downloads a new self-contained `.html` file with the current Project State embedded.
- **Export PDF / Print** opens the browser print dialog. Choose “Save as PDF” to create the Teacher PDF.
- **Ask AI for Feedback** asks which kind of help the student wants, then downloads a `.txt` prompt and attempts to copy it to the clipboard. The three modes are an interview that grills the student one question at a time, the written logic review, and a pre-drafting readiness check.
- Drag Toolbox cards onto the colored Section frame, or use a card's `+` button for deliberate click/touch addition.
- While dragging, use the highlighted insertion lines to place a Block directly between or beneath existing Blocks.
- On first run, choose a suggested layout or a blank slate; every Starter Block is removable. Reopen the ten-step visual tutorial with `?` in the top bar.
- Choose AOKs from the five official options. Use **Explore another AOK** and the AOK combinations tray to develop alternatives; only the selected pair appears in teacher and AI exports.
- Browser autosave is a recovery aid; the downloaded Working Copy is the portable project document.

The browser must permit downloads, printing, clipboard access, and local storage for the corresponding features. Clipboard access may be unavailable when the file is opened directly; the prompt still downloads.

## Develop and test

The shipped application is deliberately one file. There is no runtime build step.

```powershell
npm install
npm test
```

The browser suite uses Playwright and an installed Chromium-family browser. If none is available, install Playwright's browser once with `npx playwright install chromium`.

Before changing behavior, read:

- [`AGENTS.md`](./AGENTS.md) for repository workflow.
- [`CONTEXT.md`](./CONTEXT.md) for canonical language and invariants.
- [`TOK_Essay_Outline_Planner_Spec.md`](./TOK_Essay_Outline_Planner_Spec.md) for product requirements.
- [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md) for the iterative workflow and release checklist.
- [`docs/adr/`](./docs/adr/) for architectural decisions.

## Project map

| Path | Purpose |
| --- | --- |
| `index.html` | Production application and portable Working Copy template |
| `tests/planner.test.cjs` | Browser-level regression suite at the Project State/editor seam |
| `.scratch/tok-outline-planner/` | Local PRD and implementation ticket |
| `docs/agents/` | Matt Pocock skill configuration |
| `docs/adr/` | Durable architectural decisions |
