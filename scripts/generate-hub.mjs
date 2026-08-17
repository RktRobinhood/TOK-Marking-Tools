import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);

export async function generateHub() {
  const [template, toolsJson] = await Promise.all([
    readFile(new URL("hub.template.html", root), "utf8"),
    readFile(new URL("hub-tools.json", root), "utf8"),
  ]);
  const tools = JSON.parse(toolsJson);
  const cards = tools.map(renderCard).join("\n");
  return template.replace("{{TOOL_CARDS}}", cards).replaceAll("{{TOOL_COUNT}}", String(tools.length));
}

function renderCard(tool, index) {
  return `        <a class="tool-card tool-card--${escapeAttribute(tool.accent)}" href="${escapeAttribute(tool.href)}" aria-label="Open ${escapeAttribute(tool.title)}" style="--card-index: ${index}">
          <span class="tool-card__glow" aria-hidden="true"></span>
          <span class="tool-card__topline">
            <span class="tool-card__icon" aria-hidden="true">${iconFor(tool.kind)}</span>
            <span class="tool-card__audience">${escapeHtml(tool.eyebrow)}</span>
          </span>
          <span class="tool-card__content">
            <strong>${escapeHtml(tool.title)}</strong>
            <span>${escapeHtml(tool.description)}</span>
          </span>
          <span class="tool-card__action">Open tool <span aria-hidden="true">↗</span></span>
        </a>`;
}

function iconFor(kind) {
  const icons = {
    essay: '<svg viewBox="0 0 24 24"><path d="M7 3.75h7l3 3v13.5H7z"/><path d="M14 3.75v3h3M9.5 11h5M9.5 14h5M9.5 17h3"/></svg>',
    exhibition: '<svg viewBox="0 0 24 24"><path d="M4 8.5 12 4l8 4.5-8 4.5zM6.5 12v5L12 20l5.5-3v-5"/><path d="M20 8.5v6"/></svg>',
    planner: '<svg viewBox="0 0 24 24"><path d="M6 4.5h12v15H6zM9 2.75v3.5M15 2.75v3.5M9 10h6M9 13.5h6M9 17h3"/></svg>',
  };
  return icons[kind] ?? icons.planner;
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('"', "&quot;");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await writeFile(new URL("index.html", root), await generateHub());
  console.log("Generated index.html");
}
