import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildTools,
  discoverToolFolders,
  generateHub,
  renderHub,
  unmatchedOverrides,
} from "../scripts/generate-hub.mjs";

const overrides = JSON.parse(await readFile(new URL("../hub-tools.json", import.meta.url), "utf8"));
const template = await readFile(new URL("../hub.template.html", import.meta.url), "utf8");

test("every tool folder reaches the hub without being registered by hand", async () => {
  const folders = await discoverToolFolders();
  const html = await generateHub();

  assert.ok(folders.length > 0, "expected at least one tool folder");
  for (const folder of folders) {
    const href = `tools/${encodeURIComponent(folder)}/index.html`;
    assert.ok(html.includes(`href="${href}"`), `${folder} should be linked from the hub`);
  }
});

test("a folder with no hub-tools.json entry still gets a usable card", () => {
  const [tool] = buildTools(["Brand New Marking Tool"], {});

  assert.equal(tool.title, "Brand New Marking");
  assert.equal(tool.href, "tools/Brand%20New%20Marking%20Tool/index.html");
  assert.equal(tool.audience, "other");

  const html = renderHub(template, [tool]);
  assert.ok(html.includes("More tools"), "unlabelled tools land in the catch-all group");
  assert.ok(html.includes("Brand New Marking"));
  assert.ok(!html.includes("{{"), "no placeholder should survive rendering");
});

test("hub-tools.json only refines discovered folders", async () => {
  const folders = await discoverToolFolders();

  assert.deepEqual(unmatchedOverrides(folders, overrides), []);
});

test("metadata controls the copy and grouping of a discovered tool", async () => {
  const folders = await discoverToolFolders();
  const tools = buildTools(folders, overrides);

  for (const [folder, meta] of Object.entries(overrides)) {
    if (folder.startsWith("_")) continue;
    const tool = tools.find((candidate) => candidate.folder === folder);
    assert.ok(tool, `${folder} should be discovered`);
    assert.equal(tool.title, meta.title);
    assert.equal(tool.description, meta.description);
    assert.equal(tool.audience, meta.audience);
  }
});

test("titles and descriptions are escaped into the markup", () => {
  const html = renderHub(template, buildTools(["Marking & <Feedback> Tool"], {}));

  assert.ok(html.includes("Marking &amp; &lt;Feedback&gt;"), "markup should be escaped");
  assert.ok(!html.includes("<Feedback>"), "raw markup should never reach the page");
});

test("each discovered tool points at a real standalone page", async () => {
  const folders = await discoverToolFolders();

  for (const folder of folders) {
    const page = await readFile(new URL(`../tools/${folder}/index.html`, import.meta.url), "utf8");
    assert.match(page, /<!DOCTYPE html>/i, `${folder} should be an HTML page`);
  }
});

test("the hub stays accessible", async () => {
  const html = await generateHub();

  assert.ok(html.includes("prefers-reduced-motion: reduce"), "motion should be reducible");
  assert.ok(html.includes('class="skip-link"'), "keyboard users need a skip link");
  assert.ok(html.includes('aria-labelledby="group-'), "groups should be labelled");
  assert.ok(html.includes('<html lang="en">'), "the page needs a language");
});
