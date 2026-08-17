import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

import { generateHub } from "../scripts/generate-hub.mjs";

test("the generated hub links every configured tool and includes accessible motion", async () => {
  const html = await generateHub();
  const tools = JSON.parse(await readFile(new URL("../hub-tools.json", import.meta.url), "utf8"));

  for (const tool of tools) {
    assert.match(html, new RegExp(`href=["']${escapeRegExp(tool.href)}["']`));
    assert.match(html, new RegExp(escapeRegExp(escapeHtml(tool.title))));
    assert.match(html, new RegExp(escapeRegExp(escapeHtml(tool.description))));
  }

  assert.match(html, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(html, /aria-label="Open [^"]+"/);
  assert.doesNotMatch(html, /\{\{TOOL_CARDS\}\}/);
});

test("each configured tool points to a real standalone page", async () => {
  const tools = JSON.parse(await readFile(new URL("../hub-tools.json", import.meta.url), "utf8"));

  for (const tool of tools) {
    const pageUrl = new URL(`../${decodeURIComponent(tool.href)}`, import.meta.url);
    const page = await readFile(pageUrl, "utf8");
    assert.match(page, /<!DOCTYPE html>/i, `${tool.title} should point to an HTML page`);
  }
});

test("every standalone tool is represented on the hub", async () => {
  const tools = JSON.parse(await readFile(new URL("../hub-tools.json", import.meta.url), "utf8"));
  const configuredFolders = tools
    .map((tool) => decodeURIComponent(tool.href).replace(/^tools\//, "").replace(/\/index\.html$/, ""))
    .sort();
  const entries = await readdir(new URL("../tools/", import.meta.url), { withFileTypes: true });
  const standaloneFolders = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      await access(new URL(`../tools/${entry.name}/index.html`, import.meta.url));
      standaloneFolders.push(entry.name);
    } catch {
      // Folders without an index page are not standalone hub tools.
    }
  }

  assert.deepEqual(configuredFolders, standaloneFolders.sort());
});

test("the checked-in homepage matches the generated hub", async () => {
  const [generated, checkedIn] = await Promise.all([
    generateHub(),
    readFile(new URL("../index.html", import.meta.url), "utf8"),
  ]);

  assert.equal(checkedIn, generated);
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
