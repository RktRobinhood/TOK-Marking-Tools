# ADR 0003: Staged feedback modes and a paged tutorial

- Status: Accepted
- Date: 2026-08-14
- Extends: the single AI Logic Review prompt defined in specification sections 18–20

## Context

The planner exported exactly one prompt: a structured written diagnosis of the finished outline. That prompt is well suited to a student who has already built an argument and wants it audited, and it is the shape a teacher can read alongside the Teacher PDF.

It is a poor fit for the student who has not yet worked out what they think. Handed a report, that student receives conclusions before they have formed a position — precisely the moment at which outsourcing the thinking is most tempting and most damaging.

The `grilling` skill describes a different and better-suited interaction for that stage: interview relentlessly, one question at a time, wait for each answer, recommend an answer with every question, look up facts rather than asking for them, and do not act until a shared understanding is reached. Applied to a TOK outline, this makes the student supply every piece of reasoning while the model supplies only pressure.

A single export could not serve both stages, and a mode chooser aimed at students cannot be labelled with prompt names or internal vocabulary.

## Decision

- Replace the single export control with **Ask AI for Feedback**, which opens a chooser and exports nothing until confirmed.
- Offer three Feedback Modes, each named by the stage of work rather than by prompt or technique:
  - **Interview** — the grilling pattern, for a student still forming a position. Preselected.
  - **Review** — the existing prompt, byte-for-byte unchanged, for a built outline.
  - **Readiness Check** — a short gap audit immediately before drafting.
- Keep every mode-independent element shared: block legend, project metadata, the full ordered outline, and the section 19 guardrails. Modes differ only in the help they request.
- Express all interface wording in plain student language; permit technical precision only inside the exported prompt text.
- Expand Help from a three-card grid into a paged, ten-step tutorial covering the whole workflow, including what the AI will and will not do.

## Consequences

- Feedback becomes stage-appropriate, and the mode most resistant to outsourcing is the default.
- The Review prompt remains exactly as specified, so sections 18–20 and the teacher-facing workflow are unaffected. A regression check asserts byte-identity against the pre-refactor text.
- Prompt text is now assembled from shared constants rather than one literal. Guardrail changes must be made once, in `PROMPT_GUARDRAILS`, and apply to every mode.
- The Interview mode produces a conversation rather than a document, so there is nothing to hand a teacher from that mode. This is intentional: the student's revised outline is the artefact.
- Adding a fourth mode is now a matter of one prompt builder plus one chooser card.
- No Project State is involved in mode selection or in the tutorial, so the schema version is unchanged and Working Copies remain compatible in both directions.
