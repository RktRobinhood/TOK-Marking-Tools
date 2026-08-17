const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const projectRoot = path.resolve(__dirname, '..');
const appPath = path.join(projectRoot, 'index.html');
let browser;
let server;
let baseUrl;

function installedBrowserPath() {
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  ].filter(Boolean);
  return candidates.find(candidate => fs.existsSync(candidate));
}

async function openPlanner(viewport = { width: 1280, height: 900 }, { skipOnboarding = true } = {}) {
  const context = await browser.newContext({ acceptDownloads: true, viewport });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  if (skipOnboarding && await page.locator('#onboarding-dialog').isVisible()) {
    await page.getByRole('button', { name: 'Skip for now' }).click();
  }
  return { context, page };
}

async function projectState(page) {
  await page.waitForTimeout(500);
  return page.evaluate(() => JSON.parse(localStorage.getItem('TOK_OUTLINE_PLANNER_V01')));
}

async function dropToolboxBlock(source, target) {
  const sourceHandle = await source.elementHandle();
  const targetHandle = await target.elementHandle();
  await source.page().evaluate(([sourceElement, targetElement]) => {
    const transfer = new DataTransfer();
    sourceElement.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: transfer }));
    targetElement.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: transfer }));
    targetElement.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }));
    sourceElement.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: transfer }));
  }, [sourceHandle, targetHandle]);
}

async function requestFeedbackPrompt(page, choiceLabel) {
  await page.getByRole('button', { name: 'Ask AI for Feedback' }).click();
  await page.getByLabel(choiceLabel).check({ force: true });
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Get my prompt' }).click();
  const download = await downloadPromise;
  return fs.readFileSync(await download.path(), 'utf8');
}

function flattenBlocks(blocks) {
  return blocks.flatMap(block => [block, ...flattenBlocks(block.children)]);
}

before(async () => {
  server = http.createServer((request, response) => {
    if (request.url !== '/' && request.url !== '/index.html') {
      response.writeHead(404).end('Not found');
      return;
    }
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(appPath).pipe(response);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/index.html`;
  const executablePath = installedBrowserPath();
  browser = await chromium.launch(executablePath ? { headless: true, executablePath } : { headless: true });
});

after(async () => {
  await browser?.close();
  await new Promise(resolve => server?.close(resolve));
});

test('new Project renders removable Starter Blocks in fixed Sections', async () => {
  const { context, page } = await openPlanner();
  assert.deepEqual(await page.locator('.section-card h2').allTextContents(), [
    'Introduction / Unpacking', 'AOK 1', 'AOK 2', 'Conclusion / Implications'
  ]);
  assert.equal(await page.locator('.section-card .required-tag').count(), 0);
  assert.equal(await page.locator('.block-wrap').count(), 12);
  assert.equal(await page.locator('.block-wrap [data-act="delete"]').count(), 12);
  await page.locator('[data-section="intro"] .block-wrap').first().getByRole('button', { name: /Delete Unpack/ }).click();
  assert.equal(await page.locator('[data-section="intro"] .block-wrap').count(), 1);
  await context.close();
});

test('Optional Block changes are reversible through visible controls', async () => {
  const { context, page } = await openPlanner();
  await page.getByRole('button', { name: 'Add Key Term' }).click();
  assert.equal(await page.locator('[data-section="intro"] .block-title').allTextContents().then(x => x.filter(t => t === 'Key Term').length), 1);
  await page.getByRole('button', { name: 'Delete Key Term' }).click();
  assert.equal(await page.getByText('Key Term', { exact: true }).count(), 1); // toolbox only
  await page.getByRole('button', { name: 'Undo' }).click();
  assert.equal(await page.locator('[data-section="intro"] .block-title').allTextContents().then(x => x.filter(t => t === 'Key Term').length), 1);
  await page.getByRole('button', { name: 'Redo' }).click();
  assert.equal(await page.locator('[data-section="intro"] .block-title').allTextContents().then(x => x.filter(t => t === 'Key Term').length), 0);
  await context.close();
});

test('Project State round-trips through a standalone Working Copy', async () => {
  const { context, page } = await openPlanner();
  await page.getByLabel('Student name *').fill('Ada Student');
  await page.getByLabel('Prescribed title *').fill('To what extent is interpretation reliable?');
  await page.getByLabel('AOK 1 *').selectOption({ label: 'History' });
  await page.getByLabel('AOK 2 *').selectOption({ label: 'The Arts' });
  await page.getByRole('button', { name: 'Add Key Term' }).click();
  const keyTerm = page.locator('[data-section="intro"] .block-wrap').last();
  await keyTerm.locator('.editor').evaluate(editor => {
    editor.innerHTML = '<ul><li><strong>Interpretation</strong></li><li><em>Reliability</em></li></ul>';
    editor.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, inputType: 'insertText' }));
    editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
  });
  await page.getByRole('button', { name: 'Swap AOK order' }).first().click();
  await page.getByRole('button', { name: 'Toggle light or dark mode' }).click();
  await page.getByRole('button', { name: 'Collapse reasoning toolbox' }).click();
  const expected = await projectState(page);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save Working Copy (.html)' }).click();
  const download = await downloadPromise;
  const savedPath = path.join(os.tmpdir(), `tok-working-copy-${Date.now()}.html`);
  await download.saveAs(savedPath);
  const html = fs.readFileSync(savedPath, 'utf8');
  const match = html.match(/<script id="embedded-state">window\.__EMBEDDED_PROJECT_STATE__ = ([\s\S]*?);<\/script>/);
  assert.ok(match, 'Working Copy contains embedded Project State');
  const restored = JSON.parse(match[1]);
  assert.deepEqual(restored.metadata, expected.metadata);
  assert.deepEqual(restored.selectedAokIds, expected.selectedAokIds);
  assert.deepEqual(restored.aokCandidates, expected.aokCandidates);
  assert.deepEqual(restored.sectionOrder, ['intro', 'aok2', 'aok1', 'conclusion']);
  assert.equal(restored.ui.theme, 'dark');
  assert.equal(restored.ui.sidebarCollapsed, true);
  assert.equal(restored.sections.intro.blocks.at(-1).depth, 0);
  assert.equal(restored.sections.intro.blocks.at(-1).isCustom, false);
  assert.match(restored.sections.intro.blocks.at(-1).content, /<strong>Interpretation<\/strong>/);
  assert.match(restored.sections.intro.blocks.at(-1).content, /<em>Reliability<\/em>/);

  const reopened = await context.newPage();
  await reopened.goto(pathToFileURL(savedPath).href, { waitUntil: 'domcontentloaded' });
  assert.equal(await reopened.getByLabel('Student name *').inputValue(), 'Ada Student');
  assert.equal(await reopened.getByLabel('AOK 1 *').inputValue(), 'The Arts');
  assert.equal(await reopened.getByLabel('AOK 2 *').inputValue(), 'History');
  assert.deepEqual(await reopened.locator('.section-card h2').allTextContents(), [
    'Introduction / Unpacking', 'AOK 1 — The Arts', 'AOK 2 — History', 'Conclusion / Implications'
  ]);
  fs.rmSync(savedPath, { force: true });
  await context.close();
});

test('nesting rejects a subtree that would exceed two levels', async () => {
  const { context, page } = await openPlanner();
  for (let i = 0; i < 3; i += 1) await page.getByRole('button', { name: 'Add Key Term' }).click();
  const intro = page.locator('[data-section="intro"]');
  await intro.locator('.blocks > .block-wrap').nth(3).locator('[data-act="indent"]').click();
  await intro.locator('.blocks > .block-wrap').nth(3).locator('[data-act="indent"]').click();
  const firstOptional = intro.locator('.blocks > .block-wrap').nth(2);
  await firstOptional.locator(':scope > .block-wrap').nth(1).locator(':scope > .block-card [data-act="indent"]').click();
  await firstOptional.locator(':scope > .block-card [data-act="indent"]').click();
  assert.equal(await intro.locator('.block-wrap.depth-2').count(), 1);
  assert.match(await page.locator('#toast').textContent(), /cannot be nested deeper than two levels/i);
  const state = await projectState(page);
  const depths = [];
  const walk = (blocks, depth = 0) => blocks.forEach(block => { depths.push(depth); walk(block.children, depth + 1); });
  walk(state.sections.intro.blocks);
  assert.equal(Math.max(...depths), 2);
  await context.close();
});

test('rich text is sanitized and content undo restores the editing baseline', async () => {
  const { context, page } = await openPlanner();
  const editor = page.locator('[data-section="intro"] .editor').first();
  await editor.evaluate(element => {
    element.innerHTML = '<div><unknown><img src=x onerror="window.pwned=1"><b onclick="window.pwned=1">Safe</b></unknown></div>';
    element.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, inputType: 'insertText' }));
    element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
  });
  let state = await projectState(page);
  assert.equal(state.sections.intro.blocks[0].content, '<div><b>Safe</b></div>');
  await page.evaluate(() => { window.pwned = undefined; });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Restore' }).click();
  assert.equal(await page.evaluate(() => window.pwned), undefined);
  assert.equal(await page.locator('[data-section="intro"] .editor').first().innerHTML(), '<div><b>Safe</b></div>');
  const restoredEditor = page.locator('[data-section="intro"] .editor').first();
  await restoredEditor.fill('Changed');
  await restoredEditor.press('Control+z');
  state = await projectState(page);
  assert.equal(state.sections.intro.blocks[0].content, '<div><b>Safe</b></div>');
  await context.close();
});

test('AI Logic Review Prompt preserves list items and enforces the reviewer contract', async () => {
  const { context, page } = await openPlanner();
  const editor = page.locator('[data-section="intro"] .editor').first();
  await editor.evaluate(element => {
    element.innerHTML = '<ul><li>First distinction</li><li>Second distinction</li></ul>';
    element.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, inputType: 'insertText' }));
    element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
  });
  const prompt = await requestFeedbackPrompt(page, 'Show me what is weak or missing');
  assert.match(prompt, /^TOK OUTLINE LOGIC REVIEW/);
  assert.match(prompt, /CONTENT: First distinction\s+CONTENT: Second distinction/);
  assert.match(prompt, /Do NOT supply replacement examples/);
  assert.match(prompt, /Socratic question/);
  assert.match(prompt, /Cross-AOK Coherence/);
  assert.match(prompt, /Example Caution Flags/);
  await context.close();
});

test('feedback modes share the outline and guardrails but ask for different help', async () => {
  const { context, page } = await openPlanner();
  const editor = page.locator('[data-section="intro"] .editor').first();
  await editor.fill('Certainty depends on method');

  const interview = await requestFeedbackPrompt(page, 'Ask me questions about my thinking');
  assert.match(interview, /^TOK OUTLINE GRILLING SESSION/);
  assert.match(interview, /Ask exactly ONE question at a time/);
  assert.match(interview, /wait for the student's answer/);
  assert.match(interview, /WHAT TO CHANGE IN THE PLANNER/);
  assert.doesNotMatch(interview, /RESPONSE FORMAT/);

  const readiness = await requestFeedbackPrompt(page, 'Check whether I am ready to write');
  assert.match(readiness, /^TOK OUTLINE READINESS CHECK/);
  assert.match(readiness, /Ready to write \/ Nearly ready \/ Not yet/);
  assert.match(readiness, /Fix These First/);

  // Every mode carries the full outline, the block legend and the non-generative guardrails.
  for (const prompt of [interview, readiness]) {
    assert.match(prompt, /CONTENT: Certainty depends on method/);
    assert.match(prompt, /BLOCK LEGEND/);
    assert.match(prompt, /Do NOT supply replacement examples/);
    assert.match(prompt, /Do NOT rewrite the student's prose or draft missing sections/);
    assert.match(prompt, /END OUTLINE/);
  }
  await context.close();
});

test('the help tutorial pages through every step without touching the project', async () => {
  const { context, page } = await openPlanner();
  const before = await projectState(page);

  await page.getByRole('button', { name: 'Help and visual guide' }).click();
  assert.equal(await page.locator('#help-dialog').isVisible(), true);
  const total = await page.locator('#help-dialog [data-tutorial-step]').count();
  assert.ok(total >= 8, `expected a multi-step tutorial, saw ${total} steps`);
  assert.equal(await page.locator('#tutorial-count').textContent(), `Step 1 of ${total}`);
  assert.equal(await page.locator('#tutorial-prev').isDisabled(), true);

  for (let step = 1; step < total; step++) {
    await page.getByRole('button', { name: /^(Next|Finish)$/ }).click();
    assert.equal(await page.locator('#tutorial-count').textContent(), `Step ${step + 1} of ${total}`);
    assert.equal(await page.locator('#help-dialog [data-tutorial-step].active').count(), 1);
  }
  assert.equal(await page.locator('#tutorial-next').textContent(), 'Finish');
  await page.getByRole('button', { name: 'Finish' }).click();
  assert.equal(await page.locator('#help-dialog').isVisible(), false);

  // Reopening returns to the first step, and nothing in the project moved.
  await page.getByRole('button', { name: 'Help and visual guide' }).click();
  assert.equal(await page.locator('#tutorial-count').textContent(), `Step 1 of ${total}`);
  await page.getByRole('button', { name: 'Close guide' }).click();
  assert.deepEqual((await projectState(page)).sections, before.sections);
  await context.close();
});

test('Block retyping preserves content and duplicated groups remain independent', async () => {
  const { context, page } = await openPlanner();
  await page.getByRole('button', { name: 'Add Key Term' }).click();
  let block = page.locator('[data-section="intro"] .block-wrap').last();
  await block.locator('.editor').fill('Keep this reasoning');
  await block.getByRole('button', { name: /Edit Key Term title or type/ }).click();
  await page.getByLabel('Block type').selectOption('analysis');
  await page.getByLabel('Visible title').fill('Interpretive lens');
  await page.getByRole('button', { name: 'Save changes' }).click();
  block = page.locator('[data-section="intro"] .block-wrap').last();
  assert.equal(await block.locator('.block-type').textContent(), 'Analysis');
  assert.equal(await block.locator('.editor').textContent(), 'Keep this reasoning');
  await block.getByRole('button', { name: 'Duplicate Interpretive lens' }).click();
  let state = await projectState(page);
  const originals = state.sections.intro.blocks.slice(-2);
  assert.notEqual(originals[0].id, originals[1].id);
  assert.equal(originals[0].content, originals[1].content);
  await page.locator('[data-section="intro"] .block-wrap').nth(-2).locator('.editor').fill('Changed independently');
  state = await projectState(page);
  assert.equal(state.sections.intro.blocks.at(-2).content, 'Changed independently');
  assert.equal(state.sections.intro.blocks.at(-1).content, 'Keep this reasoning');
  await context.close();
});

test('Starter Blocks can be retyped while Section validity remains enforced', async () => {
  const { context, page } = await openPlanner();
  const starterBlock = page.locator('[data-section="aok1"] .block-wrap').first();
  await starterBlock.getByRole('button', { name: /Edit Main Idea/ }).click();
  assert.equal(await page.getByLabel('Block type').isDisabled(), false);
  await page.getByLabel('Block type').selectOption('claim');
  await page.getByLabel('Visible title').fill('My line of argument');
  await page.getByRole('button', { name: 'Save changes' }).click();
  let state = await projectState(page);
  assert.equal(state.sections.aok1.blocks[0].type, 'claim');
  assert.equal(state.sections.aok1.blocks[0].title, 'My line of argument');

  await page.getByRole('button', { name: 'Add block to AOK 1' }).click();
  await page.locator('#sidebar details').evaluate(element => { element.open = true; });
  await page.locator('#sidebar').getByRole('button', { name: 'Add Key Term' }).click();
  const optional = page.locator('[data-section="aok1"] .block-wrap').last();
  await optional.getByRole('button', { name: /Edit Key Term/ }).click();
  assert.equal(await page.getByLabel('Block type').locator('option[value="overallAnswer"]').count(), 0);
  assert.equal(await page.getByLabel('Block type').locator('option[value="unpack"]').count(), 0);
  await page.getByRole('button', { name: 'Cancel' }).click();
  await context.close();
});

test('duplicated Starter Blocks remain removable and do not change starter progress', async () => {
  const { context, page } = await openPlanner();
  const intro = page.locator('[data-section="intro"]');
  await intro.locator('.block-wrap').first().getByRole('button', { name: /Duplicate Unpack/ }).click();
  let state = await projectState(page);
  assert.equal(Object.hasOwn(state.sections.intro.blocks[0], 'required'), false);
  assert.equal(Object.hasOwn(state.sections.intro.blocks[1], 'required'), false);
  assert.equal(await intro.locator('.required-tag').count(), 0);
  assert.equal(await intro.locator('.block-wrap').nth(1).getByRole('button', { name: /Delete Unpack/ }).isVisible(), true);
  assert.match(await intro.locator('.section-progress').textContent(), /0 of 2 developed/);
  await context.close();
});

test('print mode reveals the complete outline even when the workspace is collapsed', async () => {
  const { context, page } = await openPlanner();
  await page.getByRole('button', { name: 'Toggle light or dark mode' }).click();
  await page.getByRole('button', { name: 'Collapse All' }).click();
  assert.equal(await page.locator('.block-body').first().isVisible(), false);
  await page.emulateMedia({ media: 'print' });
  assert.equal(await page.locator('.block-body').first().isVisible(), true);
  assert.equal(await page.locator('.topbar').isVisible(), false);
  assert.equal(await page.locator('.block-controls').first().isVisible(), false);
  assert.equal(await page.locator('.section-card').first().evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(255, 255, 255)');
  await context.close();
});

test('PDF validation identifies required metadata before printing', async () => {
  const { context, page } = await openPlanner();
  await page.getByRole('button', { name: 'Export PDF / Print' }).click();
  const alert = page.getByRole('alert');
  assert.match(await alert.textContent(), /Student name, Prescribed title, AOK 1, AOK 2/);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'student-name');
  await context.close();
});

test('AOK Sections use the five official choices and reject duplicate selection', async () => {
  const { context, page } = await openPlanner();
  const aok1 = page.getByLabel('AOK 1 *');
  const aok2 = page.getByLabel('AOK 2 *');
  const exploreAnother = page.getByRole('button', { name: 'Explore another AOK' });
  assert.deepEqual(await aok1.locator('option').allTextContents(), [
    'Choose an AOK', 'History', 'Human Sciences', 'Natural Sciences', 'The Arts', 'Mathematics'
  ]);
  assert.equal(await aok1.evaluate(element => element.tagName), 'SELECT');
  assert.equal(await exploreAnother.isEnabled(), false);
  await aok1.selectOption({ label: 'History' });
  assert.equal(await exploreAnother.isEnabled(), false);
  assert.equal(await aok2.locator('option', { hasText: 'History' }).isDisabled(), true);
  await aok2.selectOption({ label: 'The Arts' });
  assert.equal(await exploreAnother.isEnabled(), true);
  assert.deepEqual((await projectState(page)).aokCandidates.map(candidate => candidate.name), ['History', 'The Arts']);

  await exploreAnother.click();
  const additionalAok = page.getByLabel('Area of Knowledge to explore');
  const addToTray = page.getByRole('button', { name: 'Add to exploration tray' });
  assert.equal(await additionalAok.inputValue(), '');
  assert.equal(await addToTray.isEnabled(), false);
  assert.equal(await additionalAok.locator('option', { hasText: 'History' }).count(), 0);
  assert.equal(await additionalAok.locator('option', { hasText: 'The Arts' }).count(), 0);
  await additionalAok.selectOption({ label: 'Mathematics' });
  assert.equal(await addToTray.isEnabled(), true);
  await addToTray.click();
  await page.getByRole('button', { name: 'Close AOK combinations' }).click();
  const reopenTray = page.getByRole('button', { name: 'Open AOK combinations' });
  assert.equal(await reopenTray.isVisible(), true);
  assert.match(await reopenTray.textContent(), /AOK options\s*\(3\)/);
  await reopenTray.click();
  assert.equal(await page.locator('#aok-tray').isVisible(), true);
  await page.getByRole('button', { name: 'Close AOK combinations' }).click();
  await exploreAnother.click();
  assert.equal(await additionalAok.locator('option', { hasText: 'History' }).count(), 0);
  assert.equal(await additionalAok.locator('option', { hasText: 'The Arts' }).count(), 0);
  assert.equal(await additionalAok.locator('option', { hasText: 'Mathematics' }).count(), 0);
  const candidateNames = (await projectState(page)).aokCandidates.map(candidate => candidate.name).filter(Boolean);
  assert.equal(new Set(candidateNames).size, candidateNames.length);
  await context.close();
});

test('students can develop a third AOK in the tray and select a different pair without losing work', async () => {
  const { context, page } = await openPlanner();
  await page.getByLabel('AOK 1 *').selectOption({ label: 'History' });
  await page.getByLabel('AOK 2 *').selectOption({ label: 'The Arts' });
  await page.getByRole('button', { name: 'Explore another AOK' }).click();
  await page.getByLabel('Area of Knowledge to explore').selectOption({ label: 'Mathematics' });
  await page.getByRole('button', { name: 'Add to exploration tray' }).click();

  assert.equal(await page.locator('#aok-tray').isVisible(), true);
  assert.match(await page.locator('#exploration-root').getByRole('heading', { level: 2 }).textContent(), /Mathematics/);
  const exploratoryEditor = page.locator('#exploration-root .editor').first();
  await exploratoryEditor.fill('Proof establishes certainty within an axiomatic system.');

  let review = await requestFeedbackPrompt(page, 'Show me what is weak or missing');
  assert.match(review, /AOK 1: History/);
  assert.match(review, /AOK 2: The Arts/);
  assert.doesNotMatch(review, /Proof establishes certainty/);
  await page.emulateMedia({ media: 'print' });
  assert.equal(await page.locator('#exploration-root').isVisible(), false);
  await page.emulateMedia({ media: 'screen' });

  await page.locator('#aok-tray').getByRole('button', { name: 'Use Mathematics as AOK 2' }).click();
  assert.equal(await page.getByLabel('AOK 2 *').inputValue(), 'Mathematics');
  assert.match(await page.locator('#exploration-root').getByRole('heading', { level: 2 }).textContent(), /The Arts/);

  review = await requestFeedbackPrompt(page, 'Show me what is weak or missing');
  assert.match(review, /AOK 1: History/);
  assert.match(review, /AOK 2: Mathematics/);
  assert.match(review, /Proof establishes certainty within an axiomatic system/);
  assert.doesNotMatch(review, /## AOK 2 — The Arts/);

  const state = await projectState(page);
  assert.equal(state.schemaVersion, 3);
  assert.equal(state.aokCandidates.length, 3);
  assert.equal(state.sections.aok3.blocks[0].content, 'Proof establishes certainty within an axiomatic system.');
  await context.close();
});

test('tablet layout keeps the toolbox and structural controls usable', async () => {
  const { context, page } = await openPlanner({ width: 768, height: 1024 });
  assert.equal(await page.locator('#sidebar').isVisible(), true);
  assert.equal(await page.getByRole('button', { name: 'Undo' }).isVisible(), true);
  assert.equal(await page.getByRole('button', { name: 'Redo' }).isVisible(), true);
  assert.equal(await page.getByRole('button', { name: /Indent Unpack/ }).isVisible(), true);
  await page.getByRole('button', { name: 'Collapse reasoning toolbox' }).click();
  assert.equal(await page.getByRole('button', { name: 'Expand reasoning toolbox' }).textContent(), '▶');
  assert.equal(await page.getByRole('button', { name: 'Add a block to the active section' }).isVisible(), true);
  await page.getByRole('button', { name: 'Add a block to the active section' }).click();
  assert.equal(await page.locator('#quick-add-dialog').isVisible(), true);
  assert.equal(await page.locator('#layout').evaluate(element => element.classList.contains('sidebar-collapsed')), true);
  await page.locator('#quick-add-dialog').getByRole('button', { name: 'Add Key Term' }).click();
  assert.equal(await page.locator('#layout').evaluate(element => element.classList.contains('sidebar-collapsed')), true);
  assert.equal(await page.locator('[data-section="intro"] .block-title').allTextContents().then(x => x.filter(t => t === 'Key Term').length), 1);
  await context.close();
});

test('toolbox offers only section-valid Block Types', async () => {
  const { context, page } = await openPlanner();
  await page.getByRole('button', { name: 'Add block to Conclusion / Implications' }).click();
  assert.equal(await page.getByRole('button', { name: 'Add Overall Answer to Prescribed Title' }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Add Unpack the Prescribed Title' }).count(), 0);
  await page.getByRole('button', { name: 'Add block to AOK 1' }).click();
  assert.equal(await page.getByRole('button', { name: 'Add Overall Answer to Prescribed Title' }).count(), 0);
  await context.close();
});

test('Toolbox cards require deliberate plus clicks or drag-and-drop', async () => {
  const { context, page } = await openPlanner();
  const intro = page.locator('[data-section="intro"]');
  const card = page.locator('#sidebar [data-block-type="keyTerm"]');
  const initialCount = await intro.locator('.block-wrap').count();
  await card.click();
  assert.equal(await intro.locator('.block-wrap').count(), initialCount);
  await card.getByRole('button', { name: 'Add Key Term' }).click();
  assert.equal(await intro.locator('.block-wrap').count(), initialCount + 1);

  await page.getByRole('button', { name: 'Add block to AOK 1' }).click();
  const aok = page.locator('[data-section="aok1"]');
  assert.equal(await aok.evaluate(element => element.classList.contains('active-section')), true);
  const beforeDrag = await aok.locator('.block-wrap').count();
  await dropToolboxBlock(page.locator('#sidebar [data-block-type="claim"]'), aok.locator('.blocks > .insert-zone').last());
  assert.equal(await aok.locator('.block-wrap').count(), beforeDrag + 1);
  assert.equal(await aok.locator('.block-title').last().textContent(), 'Claim');
  await page.locator('[data-section="conclusion"] .editor').first().focus();
  assert.equal(await page.locator('[data-section="conclusion"]').evaluate(element => element.classList.contains('active-section')), true);
  assert.equal(await aok.evaluate(element => element.classList.contains('active-section')), false);
  assert.match(await page.locator('#sidebar h3').last().textContent(), /Conclusion \/ Implications/);
  await context.close();
});

test('Toolbox drag inserts at a chosen sibling position', async () => {
  const { context, page } = await openPlanner();
  const intro = page.locator('[data-section="intro"]');
  const titlesBefore = await intro.locator('.blocks > .block-wrap .block-title').allTextContents();
  assert.deepEqual(titlesBefore.slice(0, 2), ['Unpack the Prescribed Title', 'AOK Framing']);
  await dropToolboxBlock(page.locator('#sidebar [data-block-type="keyTerm"]'), intro.locator('.blocks > .insert-zone').nth(1));
  assert.deepEqual((await intro.locator('.blocks > .block-wrap .block-title').allTextContents()).slice(0, 3), [
    'Unpack the Prescribed Title', 'Key Term', 'AOK Framing'
  ]);
  const state = await projectState(page);
  assert.deepEqual(state.sections.intro.blocks.slice(0, 3).map(block => block.type), ['unpack', 'keyTerm', 'aokFraming']);
  await dropToolboxBlock(page.locator('#sidebar [data-block-type="ambiguity"]'), intro.locator('.blocks > .block-wrap').first().locator(':scope > .insert-zone').first());
  const nestedState = await projectState(page);
  assert.equal(nestedState.sections.intro.blocks[0].children[0].type, 'ambiguity');
  assert.equal(nestedState.sections.intro.blocks[0].children[0].depth, 1);
  await context.close();
});

test('first-run wizard is visual, optional, and can create a blank Project', async () => {
  const { context, page } = await openPlanner({ width: 1280, height: 900 }, { skipOnboarding: false });
  assert.equal(await page.locator('#onboarding-dialog').isVisible(), true);
  assert.ok(await page.locator('#onboarding-dialog svg').count() >= 1);
  assert.equal(await page.getByRole('button', { name: 'Open the full Help guide' }).isVisible(), true);
  await page.getByRole('button', { name: 'Open the full Help guide' }).click();
  assert.equal(await page.locator('#help-dialog').isVisible(), true);
  await page.getByRole('button', { name: 'Close guide' }).click();
  assert.equal(await page.locator('#onboarding-dialog').isVisible(), true);
  await page.getByRole('button', { name: 'Choose a starting layout' }).click();
  await page.getByLabel('Blank slate').check({ force: true });
  await page.getByRole('button', { name: 'Add optional project details' }).click();
  await page.getByLabel('Wizard prescribed title').fill('How reliable is interpretation?');
  await page.getByLabel('Wizard AOK 1').selectOption({ label: 'History' });
  await page.getByRole('button', { name: 'Start planning' }).click();
  assert.equal(await page.locator('.block-wrap').count(), 0);
  assert.equal(await page.getByLabel('Prescribed title *').inputValue(), 'How reliable is interpretation?');
  assert.equal(await page.getByLabel('AOK 1 *').inputValue(), 'History');
  const state = await projectState(page);
  assert.equal(state.schemaVersion, 3);
  assert.equal(state.ui.onboardingComplete, true);
  assert.equal(state.ui.starterTemplate, 'blank');
  assert.equal(await page.getByRole('button', { name: 'Undo' }).isDisabled(), true);
  assert.ok((await page.locator('.section-progress').allTextContents()).every(text => /0 of 0 developed/.test(text)));
  await page.getByRole('button', { name: 'Help and visual guide' }).click();
  assert.equal(await page.locator('#help-dialog').isVisible(), true);
  assert.ok(await page.locator('#help-dialog svg').count() >= 2);
  assert.equal(await page.locator('.block-wrap').count(), 0);
  await context.close();
});

test('starter progress follows the selected layout', async () => {
  const { context, page } = await openPlanner({ width: 1280, height: 900 }, { skipOnboarding: false });
  await page.getByRole('button', { name: 'Choose a starting layout' }).click();
  await page.getByLabel('Discussion-led').check({ force: true });
  await page.getByRole('button', { name: 'Add optional project details' }).click();
  await page.getByRole('button', { name: 'Start planning' }).click();
  assert.deepEqual(await page.locator('.section-progress').allTextContents(), [
    'Starter prompts: 0 of 2 developed',
    'Starter prompts: 0 of 6 developed',
    'Starter prompts: 0 of 6 developed',
    'Starter prompts: 0 of 3 developed'
  ]);
  assert.equal((await projectState(page)).ui.starterTemplate, 'discussion');
  await context.close();
});

test('corrupt browser recovery data fails visibly without overwriting it', async () => {
  const { context, page } = await openPlanner();
  await page.close();
  const recoveryPage = await context.newPage();
  await recoveryPage.addInitScript(() => localStorage.setItem('TOK_OUTLINE_PLANNER_V01', '{broken'));
  await recoveryPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await recoveryPage.getByRole('button', { name: 'Restore' }).click();
  const recoveryAlert = recoveryPage.locator('#validation');
  assert.equal(await recoveryAlert.isVisible(), true);
  assert.match(await recoveryAlert.textContent(), /could not be restored/i);
  assert.equal(await recoveryPage.evaluate(() => localStorage.getItem('TOK_OUTLINE_PLANNER_V01')), '{broken');
  await context.close();
});

test('schema 1 Projects migrate Starter Blocks and AOK Sections to schema 3 state', async () => {
  const { context, page } = await openPlanner();
  const legacy = await projectState(page);
  const legacyFirstBlock = legacy.sections.intro.blocks[0];
  legacyFirstBlock.content = '<b>Legacy reasoning survives</b>';
  const legacySectionIds = Object.keys(legacy.sections).sort();
  legacy.schemaVersion = 1;
  legacy.metadata.aok1 = 'History';
  legacy.metadata.aok2 = 'The Arts';
  legacy.sectionOrder = ['intro', 'aok1', 'aok2', 'conclusion'];
  delete legacy.aokCandidates;
  delete legacy.selectedAokIds;
  delete legacy.ui.onboardingComplete;
  flattenBlocks(Object.values(legacy.sections).flatMap(section => section.blocks)).forEach(block => { block.required = true; });
  await page.evaluate(value => localStorage.setItem('TOK_OUTLINE_PLANNER_V01', JSON.stringify(value)), legacy);
  const migratedPage = await context.newPage();
  await migratedPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await migratedPage.getByRole('button', { name: 'Restore' }).click();
  const migrated = await projectState(migratedPage);
  assert.equal(migrated.schemaVersion, 3);
  assert.equal(migrated.ui.onboardingComplete, true);
  assert.equal(migrated.ui.starterTemplate, 'guided');
  assert.deepEqual(Object.keys(migrated.sections).sort(), legacySectionIds);
  assert.deepEqual(migrated.selectedAokIds, ['aok1', 'aok2']);
  assert.deepEqual(migrated.aokCandidates.map(candidate => candidate.id), ['aok1', 'aok2']);
  assert.deepEqual(migrated.aokCandidates.map(candidate => candidate.name), ['History', 'The Arts']);
  assert.equal(migrated.sections.intro.blocks[0].id, legacyFirstBlock.id);
  assert.equal(migrated.sections.intro.blocks[0].content, legacyFirstBlock.content);
  assert.ok(flattenBlocks(Object.values(migrated.sections).flatMap(section => section.blocks)).every(block => !Object.hasOwn(block, 'required')));
  assert.equal(await migratedPage.locator('#onboarding-dialog').isVisible(), false);
  await context.close();
});
