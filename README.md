# TOK Marking Tools

A small hub of standalone Theory of Knowledge tools, published to GitHub Pages at
<https://rktrobinhood.github.io/TOK-Marking-Tools/>.

Every tool is a single self-contained `index.html`. Nothing is uploaded; student and
teacher work stays in the browser.

## Adding a tool

1. Create `tools/<Your Tool Name>/index.html`.
2. Commit and push to `main`.

That is the whole process. The homepage is generated at deploy time by scanning
`tools/*/index.html`, so a new folder appears on the hub automatically and lands in
the **More tools** group with a title derived from the folder name.

To give it a better title, description, and grouping, add an entry to
`hub-tools.json` keyed by the exact folder name:

```json
{
  "Your Tool Name": {
    "title": "Your Tool",
    "audience": "students",
    "description": "One sentence on what the tool does.",
    "kind": "planner"
  }
}
```

All fields are optional:

| Field         | Values                                | Default                        |
| ------------- | ------------------------------------- | ------------------------------ |
| `title`       | any text                              | folder name, minus `Tool`      |
| `audience`    | `teachers`, `students`                | grouped under **More tools**   |
| `description` | any text                              | `Open the <title> tool.`       |
| `kind`        | `essay`, `exhibition`, `planner`      | `planner` (chooses the icon)   |

`hub-tools.json` never controls *whether* a tool is listed — only how it reads. Keys
starting with `_` are ignored, and a key that matches no folder logs a build warning.

## Local development

```bash
npm test
npm run build
```

`npm run build` writes the deployable site to `dist/` (generated homepage plus a copy
of every tool). `dist/` is ignored by git — it is rebuilt by CI on each push to `main`.

To preview it, serve the folder rather than opening the file directly:

```bash
npx --yes serve dist
```

## How the deploy works

`.github/workflows/deploy.yml` runs on every push to `main`: it tests, builds `dist/`,
and uploads it to GitHub Pages. The homepage is **not** committed to the repo, so it
can never drift out of sync with the tools it lists.
