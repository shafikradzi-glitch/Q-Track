# Deploying Q-TRACK on Google Workspace

Q-TRACK runs as a Google Apps Script web app inside MRTC's Google Workspace. The data lives in one Google Sheet that Head – QA owns. Staff open a link, sign in with their MRTC Google account and work in the app. They never need access to the Sheet itself.

Time needed: about 20 minutes, once.

## What you need

- An MRTC Google Workspace account (the Head – QA account should own the deployment).
- Permission to run Apps Script. If the Workspace admin has blocked Apps Script or web apps, ask IT to allow them for your account.
- The files in [`apps-script/`](../apps-script/).

## 1. Create the Sheet and the script

1. In Google Drive, create a new Google Sheet named **Q-TRACK Data**. Keep it in your own Drive and do **not** share it with the team: the app works on their behalf.
2. In the Sheet, open **Extensions → Apps Script**. A script project opens, bound to the Sheet.
3. In the Apps Script editor:
   - Open **Project Settings** (gear icon) and tick **Show "appsscript.json" manifest file in editor**.
   - Back in **Editor**, replace the contents of `appsscript.json` with the file from this repository.
   - Rename the default `Code.gs` file to `Code` and paste in `apps-script/Code.gs`.
   - Add the other script files with **+ → Script**, using these names, and paste in each file: `Config`, `Rules`, `Db`, `Auth`, `Api`, `Setup`.
   - Add the page files with **+ → HTML**, using these names, and paste in each file: `Index`, `Styles`, `App`.
   - Save (Ctrl/Cmd + S).

   The file order in the editor does not matter.

   If you prefer the command line, use [clasp](https://github.com/google/clasp): `npm install -g @google/clasp`, then `clasp login`, then copy `apps-script/.clasp.json.example` to `apps-script/.clasp.json` and put in the Script ID (Project Settings → IDs). Finally, run `clasp push` from the `apps-script` folder.

## 2. Run setup once

1. In the editor's function list, choose **setup** and click **Run**.
2. Google asks you to authorise the script. Review the permissions:
   - edit this spreadsheet
   - see your e-mail address
   - send e-mail as you (only for the optional daily alert e-mail)
   - manage triggers
   - show a menu in the Sheet

   Then allow them.
3. Setup creates one tab per register (Users, Projects, Assessments, Findings, NCRs, Escalations, Milestones, Risks, Tasks, Weekly, Reports) plus Config and Audit. It also registers **you** as the first Head – QA.
4. Optional: to try the app with demonstration records, run **loadSampleData** (or use the **Q-TRACK** menu in the Sheet after reloading it). Every sample project code starts with `DEMO-` and every sample person has an `@sample.example` address. Remove them with **Q-TRACK → Remove sample data** before going live.

## 3. Deploy the web app

1. Click **Deploy → New deployment**. Choose the type **Web app**.
2. Description: `Q-TRACK 2.0`.
3. **Execute as: Me** (your Head – QA account). The app reads and writes the Sheet as you, and checks each person's role itself.
4. **Who has access: Anyone within MRT Corporation** (your Workspace domain). Do not choose "Anyone".
5. Click **Deploy** and copy the **Web app URL** (it ends in `/exec`). This is the Q-TRACK link for the team. Bookmark it, and add it to the team's Google Chat space or intranet.

## 4. Add your team

Open the web app and go to **Administration → Users & roles → Add user**. For each person, enter the Google account e-mail they sign in with, their name, a short code (for example S1, R1, I2) and their role:

| Role | Can see | Can change |
|---|---|---|
| Head – QA | Everything, including the audit log and settings | Everything. Approves or returns assessments, accepts tasks, moderates by one level, issues the monthly report, deletes records |
| Assistant Manager | Everything except draft reports and the audit log | Their allocated projects (as QA lead or deputy): assessments (prepare and submit), findings, NCR/OBS references, escalations, milestones, risks. Also their own tasks and weekly updates |
| Admin clerk | Everything except draft reports and the audit log | Users (except Head – QA), the project register, NCR/OBS references, milestones, bulk imports, their own tasks and weekly updates |
| Management (read-only) | Command Centre, approved assessments, escalations, milestones, risks, issued reports | Nothing |

Then allocate each project's QA lead and deputy in the **Project register**. Allocation is what gives an Assistant Manager the right to update that project.

Anyone who opens the link without being registered sees "Access not set up yet" with their e-mail address, so they can tell you what to add.

## 5. Load your registers

**Administration → Import data** loads CSV files into the project register, NCR/OBS references, milestones, findings, risks or users.

1. **Download template** gives the column names.
2. Projects can be given by project code.
3. Q-TRACK checks every row first and writes nothing unless every row passes.
4. Load the project register first, then the other registers.

## Updating Q-TRACK later

When a new version of the files arrives:

1. Paste the changed files into the editor (or run `clasp push`).
2. Go to **Deploy → Manage deployments**, edit the existing deployment, and set **Version: New version**. Then deploy.

The URL stays the same. Do not create a new deployment, or the link changes. If the new version adds fields, run **setup** again; it only adds what is missing.

## Good to know

- **Backups.** The Sheet keeps its own version history (File → Version history). For a monthly archive, make a copy of the Sheet (File → Make a copy).
- **Editing the Sheet directly.** It is possible, but the app is the safer route: it validates values, stops two people overwriting each other, and writes the audit trail. Never rename the header row of a tab.
- **Daily alert e-mail.** In the Sheet, choose **Q-TRACK → Turn on the daily alert e-mail**. Each person then gets their open alerts at about 07:00, and Head – QA also gets every Critical alert.
- **Thresholds.** Coverage target, CAPA target and NCR ageing bands are under **Administration → Settings**. They show as *Proposed* until you tick "Thresholds approved by Head – QA" (RMM Annex A).
- **Ownership.** The deployment runs as its owner. If Head – QA changes, the new Head – QA should make a copy of the Sheet with its script and deploy again, or IT can transfer ownership.
- **Limits.** Apps Script suits a unit-sized team: dozens of users and tens of thousands of rows. Each page load reads the registers fresh, so everyone always sees the latest records.

## Checking a change before deploying

From the repository root:

```bash
node tests/run.js            # server rules, permissions and workflow (no Google account needed)
node tools/preview/build.js  # builds dist/preview.html: the full app with sample data, in your browser
node tools/preview/shots.js  # optional: clicks through every screen in Chromium and saves screenshots
```
