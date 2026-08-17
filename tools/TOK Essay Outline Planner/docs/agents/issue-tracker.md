# Issue tracker: Local Markdown

Issues and PRDs for this project live as Markdown files in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- The PRD is `.scratch/<feature-slug>/PRD.md`
- Implementation issues are `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`
- Triage state is recorded as a `Status:` line near the top of each issue file
- Comments and decisions append under a `## Comments` heading

## Skill operations

- To publish work, create the appropriate Markdown file under `.scratch/<feature-slug>/`.
- To fetch a ticket, read the referenced path or issue number.
- Blocking edges use a `Blocked by: NN, NN` line. A ticket is unblocked when all listed tickets are complete.
- There is no pull-request request surface while this project remains local-only.

