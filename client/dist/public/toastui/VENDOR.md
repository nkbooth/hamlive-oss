# Vendored Toast UI Editor (self-hosted)

The notes editor on the **My Nets** page uses Toast UI Editor, served locally from this
directory. There is **no account, trial, or API key** — the editor loads entirely from
this instance (`/toastui/toastui-editor-all.min.js`, wired up in
`server/dist/views/partials/featureNotesEditorJs.ejs`).

- **Version:** @toast-ui/editor 3.2.2
- **License:** MIT (NHN Cloud) — the license header is retained at the top of the
  bundled files.
- **Source:** the official Toast UI CDN — <https://uicdn.toast.com/editor/3.2.2/>
  (the npm package ships only unminified builds; the minified bundles are CDN-only).

## What's vendored (and why)

The editor is initialized in `client/dist/public/js/byView/myNets/main.js` in WYSIWYG
mode with a Markdown tab, toolbar `bold / italic / ul`, and it follows the app's
light/dark theme.

| Path | Purpose |
| --- | --- |
| `toastui-editor-all.min.js` | Full UMD bundle (exposes the `toastui.Editor` global) |
| `toastui-editor.min.css` | Editor UI styles (light theme) |
| `toastui-editor-dark.min.css` | Dark theme overrides (`.toastui-editor-dark`) |

## Updating / re-vendoring

```bash
V=3.2.2   # pick the new version
DST=client/dist/public/toastui
curl -o "$DST/toastui-editor-all.min.js"  "https://uicdn.toast.com/editor/$V/toastui-editor-all.min.js"
curl -o "$DST/toastui-editor.min.css"     "https://uicdn.toast.com/editor/$V/toastui-editor.min.css"
curl -o "$DST/toastui-editor-dark.min.css" "https://uicdn.toast.com/editor/$V/theme/toastui-editor-dark.min.css"
```
