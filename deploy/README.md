# Q-TRACK: three files to paste

This folder is the whole app, bundled for the Apps Script editor. It is generated from `apps-script/` by `node tools/bundle.js`; do not edit these files by hand.

| File here | Goes into the Apps Script editor as |
|---|---|
| `Code.gs` | the script file **Code** (already there; replace its contents) |
| `Index.html` | a new HTML file named **Index** |
| `appsscript.json` | the manifest **appsscript.json** (shown after ticking *Show "appsscript.json" manifest file in editor* in Project Settings) |

## Steps

1. In Google Drive, create a Google Sheet named **Q-TRACK Data**. Do not share it with the team.
2. In the Sheet: **Extensions → Apps Script**.
3. **Project Settings** (gear icon) → tick **Show "appsscript.json" manifest file in editor**.
4. Back in **Editor**, for each file: open it on GitHub, click the **Copy raw file** button (top right of the file view), then in the editor select all (Ctrl/Cmd + A) and paste (Ctrl/Cmd + V).
   - `Code.gs` → into **Code.gs**
   - `appsscript.json` → into **appsscript.json**
   - `Index.html` → click **+ → HTML**, name it `Index` (the editor adds `.html`), then paste
5. Save (Ctrl/Cmd + S).
6. Choose the function **setup** in the toolbar and click **Run**. Allow the permissions Google asks for. You become the first Lead – QA.
7. Optional: run **loadSampleData** to try it with demonstration records (remove later with **clearSampleData**).
8. **Deploy → New deployment → Web app**. Execute as: **Me**. Who has access: **Anyone within MRT Corporation**. Click **Deploy** and copy the web app URL. That is the Q-TRACK link.

To update later: paste the new `Code.gs` and `Index.html` over the old ones, then **Deploy → Manage deployments → edit → Version: New version → Deploy**. The link stays the same.

Roles, imports and everything else: [`docs/DEPLOY.md`](../docs/DEPLOY.md).
