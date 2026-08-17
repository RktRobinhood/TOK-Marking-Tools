# TOK Essay Outline Planner context

## Purpose

The TOK Essay Outline Planner helps a student develop and revise the logic of a Theory of Knowledge essay before drafting prose. It is a structured argument editor, not an essay writer or marking tool.

## Canonical vocabulary

- **Project:** one student's saved outline workspace.
- **Section:** Introduction / Unpacking, an AOK Candidate, or Conclusion / Implications.
- **AOK Candidate:** one official Area of Knowledge with its own stable identity and Blocks.
- **Selected AOK:** either of the two AOK Candidates currently included in the essay, Teacher PDF, and AI feedback exports.
- **Exploration Tray:** the right-side tray for opening AOK Candidates and selecting the essay's active pair; a persistent right-edge tab reopens it after closing.
- **Exploration Workspace:** the editable, explicitly non-exported Section for an unselected AOK Candidate.
- **Starter Block:** a removable predefined Block supplied by a starting layout.
- **Optional Block:** predefined, removable reasoning block.
- **Custom Block:** student-defined reasoning block.
- **Block Type:** semantic category such as Analysis, Methodology, Evaluation, or Example.
- **Block Title:** editable student-visible label.
- **Helper Prompt:** temporary scaffold shown while editing an unchanged predefined block.
- **Toolbox:** context-aware block picker.
- **Project State:** canonical serialized representation of the entire resumable workspace.
- **Working Copy:** populated standalone HTML file containing the application and Project State.
- **Teacher PDF:** complete print-friendly outline snapshot.
- **Feedback Request:** the student's choice of which kind of external AI help to export, made in student-facing language rather than by naming a prompt.
- **Feedback Mode:** one of the three exportable prompts — Interview, Review, or Readiness Check.
- **Interview Prompt:** a grilling session that makes the external LLM ask one question at a time and wait, ending in a student-agreed change list.
- **AI Logic Review Prompt:** exported prompt for external diagnostic and Socratic review, returned as a written report.
- **Readiness Check Prompt:** a short pre-drafting gap check over the outline.
- **Tutorial:** the paged visual walkthrough behind Help; explains the planner and never changes the Project.

## Core invariants

- Project State is the source of truth for editing, persistence, history, print, and AI prompt generation.
- A Project contains exactly two Selected AOK slots, while additional AOK Candidates may be explored without losing their Blocks.
- Exploration becomes available only after both Selected AOK slots contain different official AOKs.
- An official AOK may appear at most once among all AOK Candidates in a Project.
- Introduction is always first and Conclusion is always last in the exportable essay; the two Selected AOKs may swap.
- AOK names come from the five official choices: History, Human Sciences, Natural Sciences, The Arts, and Mathematics.
- A block may be nested no more than two levels beneath a root block.
- Every Block is removable; an empty Section and a completely blank outline are valid Project states.
- A first-run guide may seed one of several Starter layouts, but it never blocks entry to the workspace.
- A Working Copy must reopen offline as an editable planner.
- A Working Copy contains every AOK Candidate, including unselected exploration work.
- Teacher PDF and AI prompt exports contain the full selected outline regardless of collapsed UI state, and never include unselected AOK Candidates.
- AI review is diagnostic only and must not generate replacement arguments, examples, or prose.
- Every Feedback Mode carries the same outline, block legend, and non-generative guardrails; only the requested help differs.
- Feedback Modes are chosen in student-facing language describing the stage of work, never by prompt name or technical label.
- AI output never returns into the Project automatically; the student remains the connecting layer.
- Help and the Tutorial never mutate Project State.

## Testing seam

The agreed primary seam is Project State round-trip plus user-visible browser behavior: load state, interact through the editor, serialize, reopen, and verify the resulting editor and exports.
