# Q-Track

Working repository for **Q-TRACK**, the MRTC HQ QA Unit's Level 4 assurance system, and the QA dashboards.

## Q-TRACK, Google Workspace edition

A web app that the Lead – QA and the QA team open with their MRTC Google accounts to keep the assurance registers up to date. A Google Sheet holds the data and the app enforces each person's role.

- **Command Centre:** the portfolio Level 4 position, the ten-area heat-map, key alerts, decisions required (escalation levels A–C), NCR & CAPA by programme with Wilson intervals, the NCR c-chart, and critical milestones (baseline vs forecast). Project data is labelled Level 2 throughout.
- **Level 4 assessments:** ten-area editor with the worst-area rule (Grey counts as Amber; Grey overall above one third), evidence required for every non-Green area, and context drawn from the records. Workflow: Draft → Submitted → Approved or Returned. The Lead – QA can moderate the overall by one level, with a rationale.
- **Registers:** projects, findings & CAPA refs, project NCR & OBS, escalations & decisions (stop-work / hold with lift conditions), critical milestones, quality risks, tasks & deliverables, and weekly updates. Each has search, filters, CSV export and a record drawer.
- **Alert engine:** rule-based alerts, recalculated on every load, that clear themselves when the condition is resolved. An optional daily e-mail sends each person their alerts.
- **Monthly management report** (RMM §21): six sections. Issuing it freezes a snapshot of the dashboard. It prints A4 landscape with a sign-off block.
- **Administration:** users and roles, settings (thresholds stay *Proposed* until approved), all-or-nothing CSV import, and an audit log of every change.
- **Five roles enforced on the server:** Lead – QA, Manager, Assistant Manager, Admin clerk and read-only Management (see `docs/DEPLOY.md` for what each can change).
- Light and dark themes, built for phone and desktop.

Deploy it with [`docs/DEPLOY.md`](docs/DEPLOY.md).

| Path | What it is |
|---|---|
| [`apps-script/`](apps-script/) | The app: paste these files into an Apps Script project bound to the Q-TRACK Sheet |
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | Step-by-step setup, roles, imports and updates |
| [`tests/run.js`](tests/run.js) | Server tests: rules, permissions, workflow, import and report (`node tests/run.js`) |
| [`tools/`](tools/) | Local preview with sample data (`node tools/preview/build.js` → `dist/preview.html`) and a browser walkthrough |
| [`docs/Q-TRACK_and_Dashboard_Compilation.md`](docs/Q-TRACK_and_Dashboard_Compilation.md) | Everything completed before this build: timeline, Q-TRACK 1.9 demo, dashboard reviews, open decisions |
| [`docs/sources/`](docs/sources/) | Full text of the two dashboard review documents of 27 Oct 2026 |
