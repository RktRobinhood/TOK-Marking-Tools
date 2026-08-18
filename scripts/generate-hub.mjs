import { access, cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);

// Section order on the hub. Anything without a recognised audience lands in "other".
export const AUDIENCES = [
  { id: "teachers", heading: "For teachers" },
  { id: "students", heading: "For students" },
  { id: "other", heading: "More tools" },
];

/** Every folder under tools/ that has its own index.html is a hub tool. */
export async function discoverToolFolders() {
  const entries = await readdir(new URL("tools/", root), { withFileTypes: true });
  const folders = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      await access(new URL(`tools/${entry.name}/index.html`, root));
      folders.push(entry.name);
    } catch {
      // Folders without an index page are not standalone hub tools.
    }
  }

  return folders.sort((a, b) => a.localeCompare(b));
}

/**
 * Turn discovered folders into hub tools. hub-tools.json only ever refines the
 * defaults, so a brand new folder still appears on the hub without any edits.
 */
export function buildTools(folders, overrides = {}) {
  return folders.map((folder) => {
    const meta = overrides[folder] ?? {};
    const title = meta.title ?? defaultTitle(folder);
    return {
      folder,
      title,
      description: meta.description ?? `Open the ${title} tool.`,
      audience: AUDIENCES.some((audience) => audience.id === meta.audience) ? meta.audience : "other",
      kind: meta.kind ?? "planner",
      href: `tools/${encodeURIComponent(folder)}/index.html`,
    };
  });
}

/** hub-tools.json keys that no longer match a folder, so typos surface at build time. */
export function unmatchedOverrides(folders, overrides = {}) {
  return Object.keys(overrides)
    .filter((folder) => !folder.startsWith("_"))
    .filter((folder) => !folders.includes(folder));
}

export async function generateHub() {
  const [template, overrides, folders] = await Promise.all([
    readFile(new URL("hub.template.html", root), "utf8"),
    readOverrides(),
    discoverToolFolders(),
  ]);

  for (const folder of unmatchedOverrides(folders, overrides)) {
    console.warn(`hub-tools.json describes "${folder}", but tools/${folder}/index.html does not exist.`);
  }

  return renderHub(template, buildTools(folders, overrides));
}

export function renderHub(template, tools) {
  const sections = AUDIENCES.map((audience) => renderSection(audience, tools)).filter(Boolean).join("\n");
  return template
    .replace("{{TOOL_SECTIONS}}", sections)
    .replaceAll("{{TOOL_COUNT}}", String(tools.length));
}

function renderSection(audience, tools) {
  const matching = tools.filter((tool) => tool.audience === audience.id);
  if (matching.length === 0) return "";

  return `      <section class="group" aria-labelledby="group-${audience.id}">
        <h2 class="group__heading" id="group-${audience.id}">${escapeHtml(audience.heading)}</h2>
        <ul class="tool-grid">
${matching.map(renderCard).join("\n")}
        </ul>
      </section>`;
}

function renderCard(tool) {
  return `          <li class="tool">
            <a class="tool__link" href="${escapeAttribute(tool.href)}">
              <span class="tool__icon" aria-hidden="true">${iconFor(tool.kind)}</span>
              <h3 class="tool__title">${escapeHtml(tool.title)}</h3>
              <p class="tool__description">${escapeHtml(tool.description)}</p>
              <span class="tool__action">Open<span class="tool__arrow" aria-hidden="true">→</span></span>
            </a>
          </li>`;
}

function defaultTitle(folder) {
  return folder.replace(/\s+Tool$/i, "").trim() || folder;
}

async function readOverrides() {
  try {
    const parsed = JSON.parse(await readFile(new URL("hub-tools.json", root), "utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    // Keys starting with "_" are documentation, not tools.
    return Object.fromEntries(Object.entries(parsed).filter(([key]) => !key.startsWith("_")));
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
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

/** Clear the contents but keep the folder, so a running preview server never locks the build. */
async function emptyDir(dir) {
  const base = fileURLToPath(dir);
  for (const entry of await readdir(base)) {
    await rm(join(base, entry), { recursive: true, force: true });
  }
}

/** Assemble the deployable site: generated homepage plus every tool, copied as-is. */
export async function build(outDir = new URL("dist/", root)) {
  const html = await generateHub();
  await mkdir(outDir, { recursive: true });
  await emptyDir(outDir);
  await writeFile(new URL("index.html", outDir), html);
  await cp(new URL("tools/", root), new URL("tools/", outDir), { recursive: true });
  // Folder names contain spaces and underscores; skip Jekyll entirely.
  await writeFile(new URL(".nojekyll", outDir), "");
  return html;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await build();
  console.log("Built dist/");
}
