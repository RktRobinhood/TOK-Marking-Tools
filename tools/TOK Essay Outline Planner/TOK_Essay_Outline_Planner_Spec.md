# TOK Essay Outline Planner — Product & Implementation Specification

**Triage label:** `ready-for-agent`  
**Status:** Ready for implementation planning  
**Source:** Synthesized from the current TOK Essay Marking Tool and the completed requirements discussion.  
**Primary implementation target:** Standalone, portable HTML application with no server dependency.

---

## Product Amendments — 14 August 2026

These user-directed amendments supersede conflicting requirements later in this document:

- The former required Backbone Blocks are now **removable Starter Blocks**. Students may delete every Block and work from a blank slate.
- On first run, a skippable visual wizard offers Guided starter, Discussion-led, Comparison-led, and Blank slate layouts. All questions and metadata fields are optional.
- The visual usage guide remains available later through Help and does not modify the Project.
- Dragging a Toolbox card exposes insertion lines throughout the visible hierarchy so a new Block can be placed at its intended sibling/nesting position in one operation. The explicit `+` control remains the touch/click alternative and appends to the active Section.
- Project State schema version 2 records onboarding completion and the chosen Starter layout, and migrates version 1 Backbone Blocks to removable Starter Blocks without changing their content, IDs, order, or nesting.

---

## Product Amendments — Feedback modes and tutorial

These user-directed amendments supersede conflicting requirements later in this document. They do not change Project State and therefore do not change the schema version.

- The single **Generate AI Logic Review Prompt** control is replaced by **Ask AI for Feedback**, which opens a chooser before exporting.
- The chooser offers three **Feedback Modes**, described by the stage the student has reached rather than by prompt name. Interface wording must stay approachable to every student; only the exported prompt text may be technical.
- The existing AI Logic Review prompt is retained unchanged as the **Review** mode. Sections 18–20 continue to govern it exactly.
- A new **Interview** mode adapts the interrogation pattern from the `grilling` skill: one question at a time, wait for the answer, recommend an answer with each question, establish facts from the outline rather than asking, refuse vague answers, and close with a student-agreed change list keyed to block IDs.
- A new **Readiness Check** mode performs a short pre-drafting gap audit.
- All three modes share the block legend, project metadata, full ordered outline, and the section 19 reviewer guardrails. No mode may generate replacement content.
- The Help guide becomes a paged **Tutorial** rather than a single card grid, and still never mutates the Project.

### 18a. Feedback mode selection

- `Ask AI for Feedback` opens a modal chooser and exports nothing until the student confirms.
- Each choice states the stage it suits ("While you are still thinking", "Once your outline is built", "Just before you start writing") above a plain-language description of the help given.
- The Interview mode is preselected, being the mode that most resists outsourcing the thinking.
- Cancelling exports nothing and leaves the Project untouched.
- Each mode downloads to a distinct filename suffix: `_AI_Questions.txt`, `_AI_Logic_Review.txt`, `_AI_Readiness_Check.txt`.

### 20a. Interview mode contract

The Interview prompt must instruct the external LLM to:

- ask exactly one question at a time and wait for the student's answer before continuing;
- begin with a question rather than a summary or verdict;
- offer its own provisional answer with each question while making clear the decision is the student's;
- proceed in dependency order — title, then thesis, then claims, then evidence, then analysis;
- establish from the outline anything the outline already contains, rather than asking the student to repeat it;
- name vagueness and ask again rather than accepting the first vague answer;
- decline requests to write, draft, or supply answers, and never answer its own question on the student's behalf;
- offer to close the session after roughly ten to fifteen exchanges;
- end with a single `WHAT TO CHANGE IN THE PLANNER` list of agreed, block-ID-keyed actions phrased in the student's own words.

### 20b. Readiness Check contract

The Readiness Check prompt must request a blunt, brief response covering: a one-word verdict with a one-sentence reason; empty or undeveloped blocks; unsupported claims; examples described rather than analyzed; sections missing an explicit link to the title; places with no counterclaim, perspective, evaluation, or limitation; and at most three items to fix first. It judges only what the outline actually records.

### 23a. Tutorial

- Help opens a paged tutorial that always starts at the first step and can be closed at any point.
- Each step carries a heading, an illustration, and either explanatory prose or a short list of points.
- Progress is shown as a step count and dots; Back is disabled on the first step and the final step's forward control closes the guide.
- The tutorial covers, in order: what the planner is for, adding a Block, nesting, reordering and removing, writing inside a Block, swapping the AOKs, saving work, printing, asking AI for feedback, and a recap.
- The tutorial explains that the AI never returns content into the planner and never supplies arguments, examples, or prose.

---

## Problem Statement

Students need a way to develop and revise the *logic* of a Theory of Knowledge essay before they turn that logic into prose. The current teacher marking tool is useful for evaluating finished or draft essays, but its structure is teacher-facing, hard-codes a particular exam session's prescribed titles, and uses large comment fields rather than a flexible argument-planning model.

The student-facing tool must support the way TOK essays actually evolve. Students usually begin with incomplete ideas, then add examples, analysis, methodological distinctions, counter-positions, comparisons, evaluation, and implications as their thinking develops. A rigid claim/counterclaim worksheet would be too prescriptive, while a blank document would provide too little scaffolding.

The desired tool is therefore a structured argument editor: it should preserve a simple common TOK essay backbone while letting students add, rename, nest, move, duplicate, retype, and remove optional reasoning blocks. The visual outline should make the essay's argumentative architecture immediately legible to both students and teachers.

The tool must also be portable. Students need to be able to save their current state as a populated HTML file, reopen that file later, autosave locally as a safety net, and export a complete teacher-facing PDF that preserves the logic and hierarchy of the outline.

Finally, students should be able to generate a detailed prompt for an external LLM to review the *argument architecture* of the outline. That review must be diagnostic and Socratic, not generative: it must not supply replacement arguments, replacement examples, substantive TOK content, or rewritten prose.

---

## Solution

Build a universal, exam-session-independent TOK Essay Outline Planner as a standalone HTML application.

The planner will organize the essay into four top-level sections:

1. Introduction / Unpacking
2. AOK 1
3. AOK 2
4. Conclusion / Implications

The Introduction and Conclusion remain fixed in position. The two AOK sections may swap positions. Within each section, students work with visually coded outline blocks. A small required backbone remains present so the student cannot accidentally delete the essential structure, while a context-aware toolbox offers optional analytical moves. Students can also create fully custom blocks.

Blocks support up to two nested levels beneath a parent, drag/reorder behavior, explicit move/indent controls for touch devices, editing of block type and title, duplication, collapse/expand, undo/redo, and lightweight rich-text formatting. Default block types provide temporary contextual scaffolding while editing. If a student renames a default block, its generic helper prompt is removed because the original scaffold may no longer match the student's intent.

The application will maintain one serializable project-state model. That state is the source of truth for the editor, autosave, portable HTML save, PDF export, AI-review prompt generation, undo/redo, AOK swapping, block nesting, and UI-state restoration.

The PDF export will be a clean hybrid academic outline: professional and printable, but still visually coded enough to communicate Claim / Example / Analysis / Methodology / Perspective / Evaluation / Implication relationships and nesting. The PDF always exports the student's full work, regardless of collapsed UI state.

The LLM-review export will include the full ordered and nested outline, block types, student-edited titles, all notes, prescribed title, AOK metadata, and a strict review contract. The model will diagnose structure, sequencing, support, comparison, evaluation, missing reasoning moves, and potentially clichéd TOK examples. It may recommend structural actions and ask Socratic questions, but it may not provide replacement content.

---

## User Stories

1. As a TOK student, I want to paste my prescribed title into the planner, so that I can use the same tool in any exam session.
2. As a TOK student, I want to enter my first Area of Knowledge, so that the planner reflects the essay I am actually planning.
3. As a TOK student, I want to enter my second Area of Knowledge, so that the planner can structure both sides of my essay.
4. As a TOK student, I want to enter my name, so that saved and exported work can be identified by my teacher.
5. As a TOK student, I want to optionally enter my class/course, so that my teacher can organize outlines across classes.
6. As a TOK student, I want to optionally enter my teacher's name, so that the exported outline contains useful context.
7. As a teacher, I want the student's name, prescribed title, and both AOKs to be required before PDF export, so that submitted outlines are identifiable and usable.
8. As a teacher, I want the planner to remain generic rather than tied to one examination session, so that I do not have to rebuild it whenever new titles are released.
9. As a student, I want the overall essay structure to remain visible as Introduction / Unpacking, AOK 1, AOK 2, and Conclusion / Implications, so that I retain a clear mental model of the essay.
10. As a student, I want the Introduction section to stay first, so that the tool preserves a sensible essay architecture.
11. As a student, I want the Conclusion / Implications section to stay last, so that the tool preserves a sensible essay architecture.
12. As a student, I want to swap the order of AOK 1 and AOK 2, so that I can decide which AOK should lead the essay.
13. As a student, I want all content, formatting, and nested blocks to move with an AOK when I swap AOK order, so that nothing becomes detached from its context.
14. As a student, I want a small required backbone in each section, so that I have enough scaffolding to begin planning.
15. As a student, I want required backbone blocks to be non-deletable, so that I do not accidentally remove essential planning elements.
16. As a student, I want required blocks to remain reorderable and collapsible where appropriate, so that required does not mean rigid.
17. As a student, I want the Introduction / Unpacking section to focus on unpacking the title rather than forcing a formulaic thesis structure, so that I can develop my interpretation naturally.
18. As a student, I want optional Introduction blocks such as key term, ambiguity, thesis/position, scope, assumption, and AOK comparison setup, so that I can add sophistication when it is useful.
19. As a student, I want each AOK to begin with a lean backbone of Main Idea / Line of Argument, Example or Case, Analysis / Explanation, and Link to Prescribed Title, so that I have a usable starting structure without being forced into one essay formula.
20. As a student, I want optional AOK blocks such as Claim, Counterclaim, Example, Analysis, Methodology, Perspective, Evaluation, Assumption, Comparison to Other AOK, Implication, and Link to Title, so that I can assemble the reasoning pattern that fits my argument.
21. As a student, I want the Conclusion / Implications section to require only an Overall Answer to the Prescribed Title and Implications / Why This Matters, so that the conclusion stays flexible rather than formulaic.
22. As a student, I want optional conclusion blocks such as Cross-AOK Comparison, Qualification, Limitation, Unresolved Tension, and Further Question, so that I can deepen the ending where appropriate.
23. As a student, I want a context-aware toolbox that prioritizes the block types most relevant to the section I am editing, so that the interface scaffolds my thinking without overwhelming me.
24. As a student, I want access to additional block types beyond the prioritized suggestions, so that context-aware guidance does not become a hard restriction.
25. As a student, I want to create a custom block when none of the predefined TOK block types match my thinking, so that the planner remains genuinely flexible.
26. As a student, I want custom blocks to have editable titles and content, so that I can represent reasoning moves that the predefined vocabulary does not anticipate.
27. As a teacher, I want predefined TOK block types to remain visually distinguishable from custom blocks, so that I can quickly understand the student's argument architecture.
28. As a student, I want each block type to have a restrained visual identity, so that I can visually distinguish claims, examples, analysis, methodology, evaluation, implications, and other reasoning moves.
29. As a teacher, I want the same block-type logic to remain visible in exported PDFs, so that I can see the formulation of the student's argument without opening the interactive HTML.
30. As a student, I want visual distinctions to rely on labels and structural styling in addition to color, so that the outline remains understandable in grayscale and for users with color-vision differences.
31. As a student, I want to drag blocks to reorder them, so that I can revise argument sequencing without copy-pasting text.
32. As an iPad user, I want explicit move-up and move-down controls, so that I can reorder content even when touch dragging is inconvenient.
33. As a student, I want to indent and outdent blocks, so that I can show that one reasoning move supports or belongs beneath another.
34. As an iPad user, I want explicit indent and outdent controls, so that nesting does not depend on precise drag gestures.
35. As a student, I want nesting to be limited to two levels beneath a parent, so that I can show logical hierarchy without creating an unreadable tree.
36. As a student, I want the planner to prevent illegal deeper nesting, so that structural constraints remain predictable.
37. As a student, I want to move nested blocks together with their children, so that an argument group can be repositioned as one conceptual unit.
38. As a student, I want to duplicate a block, so that I can reuse a useful planning pattern without recreating it.
39. As a student, I want to duplicate an entire nested group, so that I can create parallel reasoning structures efficiently.
40. As a student, I want duplicated content to become independently editable, so that changing the duplicate does not alter the original.
41. As a student, I want to delete optional blocks immediately, so that editing remains fast.
42. As a student, I want Undo to restore a block I deleted accidentally, so that immediate deletion is safe.
43. As a student, I want destructive whole-outline reset actions to require confirmation, so that I cannot lose the project accidentally.
44. As a student, I want Undo and Redo buttons in a simple toolbar, so that revision is easy to discover.
45. As a student, I want standard keyboard shortcuts for Undo and Redo, so that the planner behaves like familiar editing software.
46. As a student, I want Undo/Redo to include structural operations such as move, delete, nest, rename, retype, duplicate, and AOK swap, so that structural experimentation is reversible.
47. As a student, I want each default block to display a short guiding question while I am actively editing it, so that I understand the intended reasoning move without cluttering the full outline.
48. As a student, I want helper text to disappear when I leave the block, so that the finished outline stays visually clean.
49. As a student, I want the helper prompt to disappear if I rename a default block, so that irrelevant generic guidance is not shown beside my custom intent.
50. As a student, I want a small pencil/edit control on each block, so that I can modify its title or type without recreating it.
51. As a student, I want to change an existing block from one predefined type to another without losing its content, so that my classification can evolve as my thinking develops.
52. As a student, I want to convert a predefined block into a Custom block, so that I can depart from the scaffold when necessary.
53. As a student, I want block-type changes to update the block's visual coding, so that the outline continues to represent its logic accurately.
54. As a student, I want block-type changes to update the default helper guidance when the original title has not been customized, so that scaffolding remains contextually appropriate.
55. As a student, I want to write in bullet points by default, so that the interface encourages outlining rather than drafting.
56. As a student, I want to use short free-text passages when a bullet cannot capture a nuanced thought, so that the outline is not artificially restrictive.
57. As a student, I want basic rich-text formatting such as bold, italic, underline, bullet lists, and numbered lists, so that I can emphasize and structure my notes.
58. As a student, I want a small, restrained set of font colors, so that I can annotate my own thinking without overwhelming the structural color system.
59. As a student, I want a small, restrained set of highlight colors, so that I can mark important notes or uncertainties.
60. As a teacher, I want block-type visual coding to remain more visually dominant than student-applied text colors, so that the argument architecture remains legible.
61. As a student, I want the rich-text toolbar to appear only when I am editing a block, so that the normal workspace stays uncluttered.
62. As a student, I want rich-text formatting to survive saving and reopening, so that my annotations are not lost.
63. As a teacher, I want meaningful rich-text formatting to survive PDF export, so that emphasis present in the working outline is visible in the submitted version.
64. As a student, I do not want a visible word count, so that I am not encouraged to treat the planner as a drafting target.
65. As a student, I want a minimal completion indicator for each major section, so that I know whether the core structure is present.
66. As a student, I want completion to be based only on required backbone elements, so that adding more optional blocks is not treated as automatically better.
67. As a student, I want completion feedback to remain subtle, such as “Core structure: 3 of 4 present,” so that the planner does not feel gamified.
68. As a student, I want to collapse individual blocks or groups, so that I can reduce visual clutter while reorganizing the outline.
69. As a student, I want a small Collapse All / Expand All utility, so that I can switch quickly between overview and detail.
70. As a student, I want the collapsed/expanded state to be remembered when I save my working copy, so that reopening the project restores my workspace.
71. As a student, I want a collapsible toolbox/sidebar, so that I can gain horizontal working space when I do not need the toolbox.
72. As a student, I want the sidebar's open/closed state to be remembered, so that the interface resumes where I left it.
73. As a student, I want a floating “+ Add block” control when the sidebar is collapsed, so that I can add content without reopening the full toolbox.
74. As a student, I want light and dark interface modes, so that I can choose a comfortable working environment.
75. As a student, I want my light/dark preference to persist, so that I do not have to reset it each session.
76. As a teacher, I want PDF exports to use a controlled light print theme regardless of the student's interface theme, so that submissions remain consistent and readable.
77. As a student, I want the planner to work well on laptops and desktop browsers, so that it is usable on normal school devices.
78. As an iPad user, I want the planner to remain fully usable on tablet-sized screens, so that I am not disadvantaged by device choice.
79. As a developer, I do not need to optimize version 1 for phone-sized screens, so that implementation effort can focus on the actual classroom device range.
80. As a student, I want my work to autosave to browser storage as a safety net, so that an accidental refresh does not automatically destroy my outline.
81. As a student, I want the planner to detect recoverable browser-saved work, so that I can resume an interrupted session.
82. As a student, I want to save a portable working copy as an HTML file, so that I can store, rename, move, and reopen my outline independently of browser storage.
83. As a student, I want the saved HTML file to reopen as a live editable planner rather than a static snapshot, so that the file itself acts as my project document.
84. As a student, I want the saved HTML file to contain my entire project state, so that no external database or server is required to continue working.
85. As a student, I want the saved working copy to preserve block order, nesting, types, titles, content, formatting, collapse state, sidebar state, theme, AOK order, and metadata, so that reopening feels like continuing the same workspace.
86. As a student, I want to rename the downloaded HTML file using normal operating-system controls, so that I can organize versions in a way that makes sense to me.
87. As a student, I want the project to track a last-edited timestamp automatically, so that saved and exported versions can be distinguished.
88. As a teacher, I want a PDF export of the full outline, so that students can submit a stable version for review.
89. As a teacher, I want the PDF to export every block even if the student has collapsed parts of the workspace, so that no work is accidentally hidden from me.
90. As a teacher, I want PDF hierarchy and indentation to match the interactive outline, so that the logic I see in the export reflects the student's actual structure.
91. As a teacher, I want PDF block labels and restrained visual coding to remain visible, so that I can scan the argument architecture quickly.
92. As a teacher, I want the PDF to be printable and readable in grayscale, so that visual styling does not depend on color printing.
93. As a student, I want PDF generation to refuse export until Student Name, Prescribed Title, AOK 1, and AOK 2 are supplied, so that I do not accidentally submit an unidentifiable outline.
94. As a student, I want missing required PDF metadata to be clearly identified, so that I know what I need to fill in.
95. As a student, I want a generated LLM-review prompt based on my current outline, so that I can request feedback on the logic of my argument.
96. As a student, I want the generated prompt to include the full prescribed title and both AOKs, so that the reviewer understands the question being answered.
97. As a student, I want the generated prompt to include the full ordered outline, so that the reviewer can judge sequencing rather than isolated ideas.
98. As a student, I want the prompt to preserve nesting and indentation, so that the reviewer understands which ideas support which other ideas.
99. As a student, I want the prompt to include each block's underlying type, so that the reviewer understands the intended argumentative function.
100. As a student, I want the prompt to include each block's student-edited title, so that the reviewer sees my own conceptual framing.
101. As a student, I want the prompt to include all of my notes rather than a compressed summary, so that feedback can be based on what I actually planned.
102. As a student, I want the prompt to include a concise legend explaining the intended role of predefined block types, so that an LLM interprets the structure consistently.
103. As a student, I want the LLM to evaluate argument logic, sequencing, support, comparison, evaluation, missing reasoning, and redundancy, so that feedback focuses on the outline rather than prose quality.
104. As a student, I want the LLM to assess whether examples are being used analytically rather than descriptively, so that I can improve the relationship between evidence and argument.
105. As a student, I want the LLM to assess whether counterclaims or alternative perspectives actually challenge or qualify the argument, so that I avoid token counterclaims.
106. As a student, I want the LLM to assess whether methodological differences between AOKs explain differences in how the prescribed title operates, so that cross-AOK comparison becomes substantive.
107. As a student, I want the LLM to assess whether my AOK sections address the same prescribed title rather than functioning as two unrelated mini-essays, so that the essay has overall coherence.
108. As a student, I want the LLM to assess whether evaluation follows from prior reasoning, so that evaluative claims are earned rather than appended.
109. As a student, I want the LLM to identify missing reasoning moves only when they are genuinely needed, so that the review does not reward unnecessary complexity.
110. As a student, I want the LLM to identify redundant or duplicated reasoning, so that I can tighten the outline.
111. As a student, I want the LLM to identify blocks that appear misplaced, so that I can reconsider argument sequence.
112. As a student, I want the LLM to suggest structural actions such as Move, Add, Split, Merge, Clarify, or Connect, so that feedback is directly actionable.
113. As a student, I want the LLM to pair structural diagnoses with Socratic questions, so that I remain responsible for supplying the missing thinking.
114. As a student, I want the LLM to classify feedback as High, Medium, or Low priority, so that I know what to revise first.
115. As a student, I want High-priority feedback to represent broken, missing, or unsupported logic, so that the priority label has a clear meaning.
116. As a student, I want Medium-priority feedback to represent reasoning that exists but needs strengthening or repositioning, so that I can distinguish repair from refinement.
117. As a student, I want Low-priority feedback to represent clarity or sophistication refinements, so that minor issues do not distract from structural problems.
118. As a student, I want the LLM review to include a brief overall argument-architecture diagnosis, so that I understand the outline at the macro level.
119. As a student, I want the LLM review to identify structural strengths, so that I know which parts of the reasoning should be preserved.
120. As a student, I want the LLM review to limit its priority issues to a manageable set, so that feedback does not become an overwhelming catalogue.
121. As a student, I want the LLM review to explicitly assess cross-AOK coherence, so that comparison is not treated as an optional afterthought.
122. As a student, I want the LLM to flag potentially overused or clichéd TOK examples, so that I can reconsider whether my example is sufficiently specific and purposeful.
123. As a student, I want the LLM to distinguish between an overused example and an inherently invalid example, so that familiar material is not rejected automatically.
124. As a student, I want the LLM to ask me to narrow, research, justify, or reconsider an overused example, so that I do the intellectual work myself.
125. As a student, I do not want the LLM to suggest a replacement example, so that the review does not supply substantive essay content.
126. As a student, I do not want the LLM to supply new arguments or claims, so that ownership of the essay remains mine.
127. As a student, I do not want the LLM to rewrite my prose, so that the review remains about reasoning rather than authorship.
128. As a student, I do not want the LLM to draft missing sections for me, so that the planner does not become an essay-generation tool.
129. As a teacher, I want the AI-review workflow to remain separate from the planner, so that the student remains the person who interprets feedback and decides what to change.
130. As a teacher, I do not want AI feedback items imported into the planner or marked automatically as resolved, so that the tool does not create a closed AI revision loop.
131. As a student, I want the generated review prompt to be easy to copy or download, so that I can use it with the LLM available to me.
132. As a student, I want the planner itself to remain neutral about clichéd examples while I am building, so that exploratory thinking is not interrupted by premature warnings.
133. As a teacher, I want the interface to feel academically professional rather than playful or gamified, so that it is appropriate for IB-level essay planning.
134. As a student, I want the visual design to be clean, restrained, and familiar, so that the interface does not distract from thinking.
135. As a stakeholder, I want subtle visual inspiration from Ikast-Brande Gymnasium's website and an IB-adjacent academic aesthetic without explicit school branding, so that the tool feels at home in the school context while remaining reusable elsewhere.
136. As a stakeholder, I do not want the school logo embedded in the core tool, so that the template remains universal.
137. As a student, I want the interface to feel like a structured editor or workspace rather than a long form, so that I think in movable reasoning units.
138. As a student, I want optional blocks to resemble compact outline/code-style nodes rather than large essay text areas, so that the interface encourages concise planning.
139. As a teacher, I want to understand a student's reasoning path by scanning the block sequence, indentation, labels, and titles, so that conferences can focus quickly on structural decisions.
140. As a developer, I want all exports and persistence mechanisms to consume the same canonical project state, so that separate agents can implement features without creating incompatible data models.

---

## Implementation Decisions

### 1. Application shape

- Build the planner as a standalone HTML application that can be opened locally in a modern browser.
- Version 1 must not depend on a backend, account system, database, or school-specific service.
- The working HTML file is both the application and a portable project container when the student chooses **Save Working Copy**.
- The implementation should favor standards-based browser APIs and avoid dependencies that prevent the exported HTML from functioning offline.

### 2. Canonical project-state contract

- Use one serializable project-state model as the source of truth for all meaningful behavior.
- The project state must contain at minimum:
  - schema/version identifier;
  - project metadata: student name, class/course, teacher, prescribed title, AOK names, last-edited timestamp;
  - top-level section order, with Intro fixed first, Conclusion fixed last, and the two AOK sections swappable;
  - all blocks and stable block IDs;
  - block type and student-visible title;
  - rich-text content in a safely serializable format;
  - parent/child relationships and sibling order;
  - nesting depth;
  - required-vs-optional status;
  - custom-vs-predefined status;
  - collapsed/expanded state;
  - AOK order;
  - sidebar state;
  - theme preference;
  - other UI state that is intentionally part of the resumable workspace.
- Save/reopen, browser autosave, portable HTML export, PDF export, AI-review prompt generation, undo/redo, AOK swapping, and structural editing must all operate from this same state representation.
- The state schema must be explicitly versioned so future revisions can migrate older saved HTML projects rather than silently breaking them.

### 3. Primary testing seam

- Treat the serialized project state plus user-visible editor behavior as the main seam for implementation and integration testing.
- Prefer testing feature behavior through state transitions and rendered outcomes rather than testing internal helper functions independently.
- A feature is not complete if it updates the UI without producing the correct canonical state, or updates state without round-tripping through save/reopen.
- This seam is deliberately broad so separate agents can implement editor behavior, export, prompt generation, and persistence against one contract.

### 4. Top-level essay model

- The top-level sections are fixed conceptually:
  1. Introduction / Unpacking
  2. AOK 1
  3. AOK 2
  4. Conclusion / Implications
- Intro and Conclusion cannot be moved from their first/last positions.
- AOK 1 and AOK 2 can swap positions through a clear dedicated control rather than arbitrary top-level drag behavior.
- Swapping AOKs moves the complete section state, including metadata, blocks, formatting, nesting, and collapse state.

### 5. Required backbone

- Required backbone items cannot be deleted.
- They may be collapsed and, where it does not violate top-level meaning, reordered within their section.
- Introduction / Unpacking uses a minimal required unpacking-oriented scaffold rather than forcing thesis, ambiguity, scope, or other advanced moves.
- Each AOK requires:
  - Main Idea / Line of Argument
  - Example or Case
  - Analysis / Explanation
  - Link to Prescribed Title
- Conclusion / Implications requires:
  - Overall Answer to Prescribed Title
  - Implications / Why This Matters
- Optional blocks provide sophistication rather than being counted as mandatory completion criteria.

### 6. Block registry and context-aware toolbox

- Maintain a registry of predefined TOK block types with at least:
  - stable internal type identifier;
  - default visible title;
  - semantic category;
  - short helper/scaffold prompt;
  - visual treatment token;
  - sections in which the type should be prioritized;
  - sections in which the type should be hidden if it is genuinely nonsensical.
- Likely predefined block vocabulary includes:
  - Key Term
  - Ambiguity
  - Thesis / Position
  - Scope
  - Assumption
  - AOK Comparison Setup
  - Main Idea / Line of Argument
  - Claim
  - Counterclaim
  - Example / Case
  - Analysis / Explanation
  - Methodology
  - Perspective / Alternative Perspective
  - Evaluation
  - Comparison to Other AOK
  - Implication
  - Link to Prescribed Title
  - Qualification
  - Limitation
  - Unresolved Tension
  - Further Question
  - Free Note
  - Custom
- The toolbox is context-aware but non-exclusive:
  - “Suggested for this section” appears first;
  - “More block types” exposes the broader valid registry;
  - Custom is always available.
- The toolbox must scaffold without implying that every offered block should be used.

### 7. Block title, type, and helper behavior

- Each block has an underlying type and a student-visible title.
- Predefined blocks begin with the default title and have an associated helper prompt.
- Helper prompts are visible only while the block is active/editing or through a compact tooltip affordance.
- If the student manually renames the block title, hide the generic helper prompt because it may no longer match the student's intended use.
- The underlying predefined type may remain recorded after a title rename for export/visual coding unless the student explicitly changes the type to Custom.
- A pencil/edit action allows the student to:
  - rename the title;
  - change the predefined block type;
  - convert the block to Custom.
- Changing type preserves the student's content.
- Changing type refreshes visual coding and, when appropriate, default helper text.

### 8. Structural editing

- Blocks can be reordered within sections.
- Drag-and-drop is supported on pointer-capable devices.
- Explicit Move Up / Move Down controls are available as a reliable alternative, especially on iPad.
- Blocks can be indented/outdented.
- Maximum nesting is two levels beneath a parent.
- The UI must prevent invalid nesting rather than silently creating deeper trees.
- Moving a parent moves its descendants as one subtree.
- Blocks and nested groups can be duplicated.
- Duplicates receive new stable IDs and become independent from their source.
- Optional blocks delete immediately.
- Whole-project reset or equivalent destructive bulk operations require confirmation.

### 9. Undo/redo

- Undo/redo covers both content editing and structural editing where technically feasible without compromising editor stability.
- At minimum, structural history includes:
  - create block;
  - delete block/group;
  - reorder;
  - indent/outdent;
  - duplicate;
  - rename;
  - type change;
  - AOK swap.
- Provide visible Undo/Redo icons.
- Support common keyboard shortcuts:
  - Ctrl/Cmd+Z for Undo;
  - Ctrl/Cmd+Shift+Z and/or platform-standard redo equivalent for Redo.
- Undo history does not need to survive closing and reopening the project unless implementation makes this essentially free; persisted project state is the durability mechanism.

### 10. Editing model and rich text

- Default content-entry behavior should encourage bullet-point outlining.
- Short free text is permitted where needed.
- Do not show word counts.
- Support restrained rich-text functions:
  - bold;
  - italic;
  - underline;
  - bullet list;
  - numbered list;
  - small fixed font-color palette;
  - small fixed highlight-color palette.
- The rich-text toolbar appears only for the active editor.
- Student-applied color must remain subordinate to block-type structural coding.
- Rich text must serialize safely and round-trip through project save/reopen.
- PDF export should preserve meaningful rich-text emphasis while normalizing anything that harms print contrast/readability.

### 11. Visual system

- Overall tone: clean, restrained, academic, IB-adjacent, and workspace/editor oriented.
- Use subtle inspiration from Ikast-Brande Gymnasium's public visual language without explicit logo use or school-specific branding in the core template.
- The tool must remain reusable across schools and exam sessions.
- Use compact block cards/nodes, clear indentation, subtle borders, and disciplined spacing rather than large worksheet-style textareas.
- Block types receive distinct but restrained visual accents.
- Never rely on color alone: retain text labels and structural cues.
- Ensure acceptable grayscale rendering for PDF/print.
- Support light and dark interface themes.
- Light is the default.
- Theme preference persists in project state/browser state.
- PDF always uses a controlled light print theme.

### 12. Sidebar and workspace utilities

- Provide a collapsible context-aware toolbox/sidebar.
- Persist sidebar collapsed/expanded state.
- When collapsed, show a compact floating “+ Add block” action associated with the active/relevant section.
- Provide Collapse All / Expand All as a small utility control.
- Individual groups/blocks can still be collapsed independently.
- Focus mode is not a version-1 core feature; it may be left as a future settings-level enhancement.

### 13. Completion indicator

- Each main section shows a minimal core-completion status.
- Completion is based only on required backbone blocks being meaningfully populated/present according to a simple, transparent rule.
- Do not score optional blocks or imply that more blocks mean a better essay.
- Avoid gamification, badges, large progress bars, or percentage-driven UX.
- Preferred presentation is compact text such as “Core structure: 3 of 4 present.”

### 14. Responsive behavior

- Primary supported layouts: laptop/desktop and iPad/tablet.
- Do not optimize version 1 for phone-sized screens.
- At tablet widths, sidebar/toolbox and block controls must remain usable without horizontal overflow that blocks editing.
- Touch-friendly explicit structural controls are required even if drag-and-drop also works.

### 15. Autosave and browser restoration

- Continue the useful pattern already present in the marking tool: local browser persistence as a safety net.
- Autosave canonical project state after meaningful edits with appropriate debouncing.
- Provide a clear but unobtrusive save-status indicator.
- Detect an available browser-saved session and allow restoration.
- Browser persistence is not the canonical portable-save mechanism; the downloadable HTML working copy is.

### 16. Save Working Copy (.html)

- “Save Working Copy” downloads a complete standalone HTML file containing the application plus embedded current project state.
- Reopening the file must restore the student into an editable workspace with the saved state already populated.
- The saved file must function without the original source file and without network access for core editing/save/export behavior, subject to browser security limitations around local files.
- Preserve:
  - content;
  - block types/titles;
  - ordering;
  - nesting;
  - rich-text formatting;
  - collapsed/expanded state;
  - AOK order;
  - sidebar state;
  - theme;
  - metadata;
  - schema version.
- Students may rename the file normally after download.
- Updating the current local file in place is not required; generating a new populated copy is acceptable and more compatible with browser security models.

### 17. PDF export

- PDF is a teacher-facing complete snapshot, not a screenshot of the editor.
- Required metadata before export:
  - Student Name
  - Prescribed Title
  - AOK 1
  - AOK 2
- Optional metadata:
  - Class / Course
  - Teacher
- Last-edited timestamp is generated automatically.
- If required metadata is missing, block export and point clearly to the missing fields.
- PDF ignores collapse state and always renders the full outline.
- Preserve:
  - top-level section hierarchy;
  - AOK order;
  - block order;
  - nesting/indentation;
  - block type labels;
  - student-edited block titles;
  - content;
  - meaningful rich-text formatting;
  - restrained block-type visual accents.
- Use a hybrid academic/visual-outline style: professional, printable, but structurally expressive.
- PDF must remain intelligible in grayscale.
- PDF output must use a light print theme regardless of interface theme.

### 18. AI Logic Review prompt generator

- The planner does not perform embedded AI analysis in version 1.
- It generates a detailed prompt for use with an external LLM.
- The generated prompt includes:
  - prescribed title;
  - AOK names and order;
  - full ordered outline;
  - nesting structure;
  - stable block references/IDs or concise exported block labels sufficient for actionable feedback;
  - underlying block type;
  - student-edited title;
  - all student-entered notes/content;
  - a concise semantic legend for predefined block types;
  - strict reviewer instructions.
- Do not compress the outline unnecessarily; richer context is preferred because outline size is expected to remain manageable.

### 19. AI reviewer contract

The generated prompt must instruct the LLM to act as an **argument-architecture reviewer and Socratic coach**, not an essay writer.

The reviewer evaluates:
- overall argument architecture;
- sequencing;
- whether examples support claims;
- whether examples are analyzed rather than merely described;
- whether counterclaims/alternative perspectives genuinely interact with the main argument;
- methodological distinctions within and across AOKs;
- whether key terms or the title operate differently across AOKs and whether that difference is explained;
- cross-AOK coherence;
- links back to the prescribed title;
- evaluation;
- implications;
- assumptions;
- missing reasoning moves;
- misplaced blocks;
- redundancy/repetition;
- potentially overused/clichéd TOK examples.

The reviewer may:
- identify a problem;
- explain why it is structurally important;
- recommend structural actions such as Move, Add, Split, Merge, Clarify, or Connect;
- ask Socratic questions that require the student to supply the missing reasoning;
- ask the student to narrow, research, justify, or reconsider an overused example.

The reviewer must not:
- supply a replacement example;
- provide a new substantive TOK argument;
- invent content that the student could insert;
- rewrite the student's prose;
- draft missing sections;
- complete the reasoning on the student's behalf.

### 20. AI-review response format

The prompt should request a structured response with:

1. **Overall Argument Architecture** — concise macro diagnosis.
2. **Structural Strengths** — what is already working and should be preserved.
3. **Priority Issues** — ideally 3–5 most important issues, each containing:
   - priority: High / Medium / Low;
   - affected block(s);
   - diagnosis;
   - why it matters;
   - structural action when useful;
   - Socratic question.
4. **Missing Reasoning Moves** — only where genuinely necessary.
5. **Cross-AOK Coherence** — explicit assessment of how the AOKs answer and interact around the title.
6. **Example Caution Flags** — overused/generic/potentially superficial examples, without replacements.
7. **Revision Checklist** — short ordered list of next actions.

Priority meanings:
- **High:** logic is broken, missing, unsupported, or substantially mis-sequenced.
- **Medium:** reasoning exists but needs strengthening, clarification, or repositioning.
- **Low:** refinement, clarity, or sophistication.

### 21. Separation of planner and AI feedback

- Do not import AI feedback into the planner.
- Do not create AI-generated revision tasks inside the project.
- Do not track whether AI feedback has been “resolved.”
- Do not automatically alter the outline from AI output.
- The student is explicitly the connecting layer between receiving diagnostic feedback and deciding how to revise the planner.

### 22. Relationship to the existing marking tool

- Preserve useful high-level concepts from the current marking tool:
  - clear section navigation;
  - Introduction & Interpretation / unpacking;
  - separate AOK analysis areas;
  - Evaluation & Implications orientation;
  - browser autosave and restoration;
  - explicit export actions;
  - AI prompt generation as an external-workflow bridge.
- Replace teacher-facing concepts that do not belong in the student planner:
  - hard-coded prescribed-title configuration;
  - automatic AOK locking based on title configuration;
  - rubric keyword checklist;
  - automated band prediction;
  - final mark selection;
  - teacher summative-comment workflow;
  - teacher feedback prompt wording.
- The student planner is a conceptual sibling/rework of the current marking tool, not merely a restyled version of the same form.

### 23. Accessibility and robustness

- All core structural actions available through dragging must also have explicit button/keyboard/touch alternatives where practical.
- Controls require accessible labels/tooltips.
- Block-type meaning must not rely on color alone.
- Print/PDF contrast must remain acceptable after student-applied text/highlight colors are normalized.
- Required controls and metadata validation must be understandable without relying only on color changes.

### 24. Nonfunctional implementation guidance for multi-agent work

- Agents should coordinate through the canonical project-state schema and block registry contract.
- Exporters should be pure consumers of canonical state wherever possible rather than scraping editor DOM state.
- Prompt generation should consume canonical state, not rendered HTML.
- PDF rendering should consume the same semantic outline model, ensuring hidden/collapsed UI state never removes content.
- Persistence should serialize canonical state directly and be independently round-trippable.
- UI agents may change presentation as long as state and behavior contracts remain stable.
- Prefer deterministic stable IDs for existing restored blocks and newly generated unique IDs for duplicated/new blocks.
- Avoid coupling core project state to DOM element IDs from the current marking tool.

---

## Testing Decisions

### Testing philosophy

- Test external behavior and observable state contracts, not implementation details.
- Prefer the highest practical seam: load a project state, perform a user-visible action, and assert the resulting visible outline and serialized project state/export.
- The most important invariant is **round-trip fidelity**: a project that is saved and reopened must represent the same student work and workspace state.
- Avoid creating many isolated low-level seams when one end-to-end state/editor seam can cover the behavior reliably.
- Internal helper functions should be unit-tested only when they contain nontrivial logic that is difficult to validate clearly through the higher seam.

### Primary seam: project-state round trip

Test one canonical project state through:

1. render into the editor;
2. user edits/reorders/nests/retypes/renames content;
3. serialize;
4. restore into a fresh application instance;
5. compare externally meaningful state and rendered structure;
6. feed the same state into PDF and AI prompt exporters and verify semantic consistency.

This is the preferred seam because it exercises the contract shared by all implementation agents.

### Editor behavior tests

Test externally visible behavior for:
- required backbone blocks appearing in a new project;
- required blocks not being deletable;
- optional block add/delete;
- custom block creation;
- context-aware toolbox prioritization;
- block rename;
- helper prompt visibility while editing;
- helper prompt removal after custom rename;
- block type conversion without content loss;
- custom conversion;
- drag reorder where browser automation supports it;
- explicit Move Up / Move Down behavior;
- indent/outdent;
- rejection/prevention of nesting deeper than two levels beneath parent;
- parent subtree move behavior;
- block/group duplication with independent IDs/content;
- AOK swap behavior;
- fixed Intro/Conclusion positions;
- collapse/expand and Collapse All / Expand All;
- sidebar collapse and floating Add Block availability;
- theme toggle;
- rich-text persistence;
- minimal core-completion status.

### Undo/redo tests

At the editor seam, verify that the user can undo and redo:
- add;
- delete;
- reorder;
- indent/outdent;
- duplicate;
- rename;
- type change;
- AOK swap.

Confirm that destructive whole-project reset still requires confirmation and is not triggered by ordinary block deletion behavior.

### Persistence tests

Test:
- autosave updates browser storage after meaningful edits;
- restoration from browser state reproduces the outline;
- portable HTML save embeds the full project state;
- reopening the generated HTML produces an editable application with the same project data;
- collapse state, sidebar state, theme, AOK order, formatting, titles, block types, nesting, and metadata survive the round trip;
- schema version is present;
- corrupted/unsupported state fails gracefully rather than silently discarding work.

### PDF export tests

Use a representative outline containing:
- both AOKs;
- multiple block types;
- two levels of nesting;
- renamed predefined blocks;
- custom blocks;
- bold/italic/underline;
- lists;
- font color/highlight;
- collapsed UI groups.

Verify externally that:
- export is blocked if required metadata is absent;
- missing metadata is identified;
- all blocks appear in the PDF even if collapsed in the UI;
- order and nesting match project state;
- block labels/titles remain visible;
- print theme is light even if UI is dark;
- hierarchy remains understandable in grayscale;
- no UI-only controls appear in the PDF.

### AI prompt-generation tests

For a known canonical outline, verify that generated prompt text contains:
- prescribed title;
- both AOKs and their order;
- every outline block;
- correct order and nesting representation;
- underlying block types;
- student-edited titles;
- student notes/content;
- block legend;
- strict prohibition against replacement content, examples, arguments, or rewriting;
- required diagnostic categories;
- priority definitions;
- example-caution instruction;
- structured response contract.

Use snapshot/golden-output testing only for stable semantic sections, not incidental whitespace or wording that would make harmless copy edits break tests.

### Responsive and accessibility tests

At minimum verify the primary workflows at:
- normal laptop/desktop viewport;
- iPad/tablet-class viewport.

Verify:
- toolbox access;
- editing;
- adding blocks;
- structural move/indent controls;
- toolbar access;
- PDF/save actions;
- no critical content hidden behind fixed UI.

Check keyboard navigation and accessible names for primary structural controls.

### Prior art from the current codebase

The existing marking tool provides behavioral prior art rather than a formal test suite:
- browser localStorage save and restore;
- save-status feedback;
- explicit reset behavior;
- content-to-export generation;
- content-to-AI-prompt generation;
- responsive sidebar behavior.

The new implementation should preserve these observable strengths while moving the underlying architecture to canonical project state rather than direct reads from hard-coded DOM fields.

---

## Out of Scope

- Hard-coded prescribed titles for a particular TOK exam session.
- Automatic AOK locking based on prescribed-title configuration.
- Teacher marking rubric, rubric keywords, predicted bands, or score calculation.
- Teacher summative feedback workflow from the current marking tool.
- Embedded LLM/API calls inside the planner in version 1.
- Automatic application of AI feedback to the outline.
- AI-generated arguments, examples, substantive TOK content, rewritten prose, or drafted essay sections.
- AI feedback task tracking, “resolved” states, or automated revision loops.
- Live AI warnings while the student is constructing the outline.
- Full essay drafting or word-processing functionality.
- Visible word counts or target-length gamification.
- Phone-first or small-screen mobile optimization.
- Dedicated focus mode as a version-1 feature.
- Real-time multi-user collaboration.
- Cloud sync, school login, user accounts, or server-side storage.
- LMS integration.
- School-specific branding or embedded Ikast-Brande Gymnasium logo.
- In-place overwriting of an already-open local HTML file, because browsers do not reliably permit that workflow without additional file-system permissions.
- Complex freeform visual mind-mapping or canvas-style graph layouts; this remains a hierarchical outline editor.
- Unlimited nesting.
- Automatic assessment of whether an essay would receive a particular TOK mark or grade.

---

## Further Notes

### Current codebase observations

The available codebase is currently a single standalone HTML marking tool. Its strongest reusable concepts are its single-file deployment model, side navigation, localStorage autosave/restore workflow, explicit action buttons, and external-AI prompt generation. The present implementation reads and writes directly from individual DOM fields and hard-codes exam-session titles and rubric logic. The outline planner should move away from that field-centric model toward a canonical data model representing sections, blocks, hierarchy, and editor state.

### Product vocabulary

Use the following vocabulary consistently across UI, code-facing documentation, tests, and agent handoffs:
- **Project** — one student's saved TOK essay outline workspace.
- **Section** — one of the four top-level essay areas.
- **AOK Section** — either of the two swappable Areas of Knowledge sections.
- **Backbone Block** — required, non-deletable structural block.
- **Optional Block** — predefined but removable reasoning block.
- **Custom Block** — student-defined reasoning block.
- **Block Type** — semantic category such as Analysis, Methodology, Evaluation, or Example.
- **Block Title** — editable student-visible label.
- **Helper Prompt** — temporary scaffold shown while editing a default predefined block.
- **Toolbox** — context-aware block picker.
- **Project State** — canonical serialized representation of the entire editable workspace.
- **Working Copy** — populated standalone HTML file containing both application and saved Project State.
- **Teacher PDF** — complete, print-friendly outline snapshot.
- **AI Logic Review Prompt** — exported prompt for external diagnostic/Socratic review.

### Suggested agent boundaries

Multiple agents can work in parallel if they share the canonical Project State and Block Registry contracts. A sensible split is:

- **State & persistence agent:** project schema, migration/versioning, browser autosave, restore, Working Copy save/reopen, history integration contract.
- **Editor interaction agent:** section shell, block rendering, add/edit/delete, nesting, reorder, duplicate, collapse, AOK swap, responsive/touch controls.
- **Rich-text & visual-system agent:** inline editing, formatting toolbar, theme, block visual tokens, accessibility, print-safe styles.
- **PDF export agent:** semantic outline-to-print rendering and PDF creation behavior.
- **AI prompt agent:** semantic outline serialization, block legend, strict review instructions, structured review format.
- **Integration/test agent:** round-trip fixtures, cross-feature invariants, tablet behavior, regression checks.

These boundaries are implementation conveniences, not permission to create separate state models. All agents must consume or mutate the same canonical Project State contract.

### Preferred integration order

1. Establish Project State schema and block registry.
2. Render a static outline from Project State.
3. Add structural editing and history.
4. Add persistence and Working Copy round trip.
5. Add rich-text and visual/theme behavior.
6. Add PDF export from canonical state.
7. Add AI Logic Review prompt generation from canonical state.
8. Complete responsive/accessibility/integration testing.

### Issue tracker publication status

This specification is formatted to be pasted directly into a project issue and should receive only the triage label `ready-for-agent`.

The current environment does not expose a repository identifier or connected issue-creation action for the target project, and the requested `/setup-matt-pocock-skills` setup command is not installed. Therefore the spec has been prepared as an issue-ready artifact but has not been published automatically.
