# Q-TRACK and QA Dashboards: compilation of work to date

Compiled 28 Oct 2026 for Shafik Radzi, Head of QA, MRT Corporation (MRTC).

## 0. What this covers, and what it does not

This compilation is built from the work Claude produced for Q-TRACK and the QA dashboards, as it survives in your claude.ai account: seven artifacts (two docs, one dashboard, one design concept, one interactive demo, one slide deck and one evidence cross-check). Claude cannot open your past chat transcripts from this session, so anything that was discussed in a chat but never saved to an artifact is not here. The Q-TRACK Solution Documentation Pack v1.8 itself (22 Oct 2026) is referenced by these artifacts but is not among them, so it is described only as far as the reviews quote it.

The `Q-Track` GitHub repository was empty before this commit. Full text of the two review docs is in [`docs/sources/`](sources/).

| # | Artifact | Type | Date | Link |
|---|---|---|---|---|
| 1 | Q-TRACK 1.9 Demo | Interactive web demo (43 screens, 4 roles) | 28 Oct 2026 | https://claude.ai/artifact/SgW25EnEgyKQT4NVy5F4Lo |
| 2 | Q-TRACK Command Centre concept | Design canvas (1 interactive artboard) | 28 Oct 2026 | https://claude.ai/artifact/7QFPCDS37dvDGz63aCpQzW |
| 3 | QA Portfolio Command Centre | Live dashboard (10 datasets, 4 pages) | 27 Oct 2026 | https://claude.ai/artifact/QERFra5CWbfV5HwaMKgzik |
| 4 | Q-TRACK v1.8 vs Weekly Project Dashboards: Content Alignment Review | Doc | 27 Oct 2026 | https://claude.ai/artifact/DnMrWan18Vjpr6R8kh2MRv |
| 5 | QA Weekly Dashboard Review & Premium Dashboard Blueprint | Doc | 27 Oct 2026 | https://claude.ai/artifact/MMrs6Sfw9zuTFMT5q9r4Ho |
| 6 | PMO Standardisation — HOD Briefing | Slide deck (24 slides) | 23 Oct 2026 | https://claude.ai/artifact/C3XpUhh44P1GzYfroMTNJ5 |
| 7 | Pile Cap CAPA Evidence Cross-check | Evidence page (PML) | 15 Oct 2026 | https://claude.ai/artifact/GJDKh3Rihc4Us6asuz8en3 |

Also related but not opened for this compilation: *LRT Mutiara Hot Block Thermal Analysis* (14 Oct 2026, https://claude.ai/artifact/RbF39bmgP79nAotKLkEjqF), the thermal work behind item 7.

## 1. Timeline

| Date | What was completed |
|---|---|
| 14 Oct 2026 | Hot block thermal analysis for LRT Mutiara (PML) concrete. |
| 15 Oct 2026 | Pile cap CAPA evidence cross-check: tests the PML review report (Rev 1) against twelve hot block records; adds two new findings (T-18, T-19) and corrections to the TQ and QO drafts. |
| 21 Oct 2026 | Q-TRACK L4/L5 workbook load (the reconciled source used by the later reviews). |
| 22 Oct 2026 | Q-TRACK Solution Documentation Pack v1.8 issued (referenced; not in the artifacts). |
| 23 Oct 2026 | PMO Standardisation HOD briefing deck: 24 slides with speaker notes; Q-TRACK named as the reporting tool for framework KPIs. |
| 27 Oct 2026 | **Weekly dashboard review and premium blueprint** (doc): scores the PML, RTS Link and KGL weekly slides for 17–23 Oct, lists data defects, proposes a KPI set, a QHI index, a page blueprint and an 8-week build plan. |
| 27 Oct 2026 | **QA Portfolio Command Centre** (dashboard): four pages (Portfolio, PML, RTS Link, L4/L5) built from the 17–23 Oct slides and the 21 Oct Q-TRACK load. Data last updated 20:55. |
| 27 Oct 2026 | **Q-TRACK v1.8 alignment review** (doc): tests the dashboards against v1.8 rules; finds 2 of 18 highlights fully covered, 9 partly, 5 missed, 2 in conflict. The dashboard was then revised (decisions reworded as HQ QA escalations, Level 4 heat-map added). |
| 28 Oct 2026 | **Command Centre concept** (design): the Command Centre placed inside the Q-TRACK shell, each panel tagged LIVE / EXTEND / NEW against the v1.8 database. |
| 28 Oct 2026 | **Q-TRACK 1.9 demo**: the development build's screens with labelled sample data, role switcher, and the Command Centre running inside Q-TRACK with workbook load, confirmation and submission outputs. |

## 2. How the thinking moved

The work ran in three steps, and the later step overrides the earlier one where they disagree.

1. **Blueprint (27 Oct, first doc).** Treated the weekly dashboards as a design and data-quality problem. Recommended one standard KPI set across projects, a composite **Quality Health Index (QHI)** per project, and NCR closure rate as a headline KPI.
2. **Alignment review (27 Oct, second doc).** Checked that against Q-TRACK v1.8 and reversed two of those recommendations: the headline must be HQ QA's own **Level 4 ten-area assessment** (overall = worst area), not a composite index, and NCR performance is judged by **ageing past expected completion, median age, repeat rate and CAPA verified effective**, not by closure rate. Project counts (NCR, RFI, WIR, Code 1) are **Level 2 project performance**, labelled as such and never presented as QA output.
3. **Concept and 1.9 demo (28 Oct).** Built the Command Centre to those rules inside Q-TRACK: worst-area roll-up, key alerts with escalation dates, decisions worded as HQ QA escalations (levels A–C), NCR & CAPA band with Wilson intervals, and a weekly data workbook that Head of QA confirms before management sees it.

**Superseded items to avoid reusing:** the QHI formula and its 80/60 thresholds, "unreported inputs scored 50", NCR closure % against an 80% target as a headline, and decision wording such as "instruct contractor to clear 282 RFIs".

## 3. Q-TRACK

### 3.1 What Q-TRACK is

Q-TRACK ("Track Performance. Assure Quality. Drive Results.") is the HQ QA Unit's system for Level 4 assurance: HQ QA assures the effectiveness of Levels 1–3, does not act as contractor QC, does not issue contractor NCRs and does not own or close contractor corrective actions (v1.8 Part 1 §1). It is designed for MRTC's Google Cloud with MRTC Google sign-in and database row-level security. As of 22–28 Oct 2026 it is a development build: **nothing is deployed on MRTC infrastructure and every threshold and the RMM are still Proposed** (gap Q5).

### 3.2 Governing rules (from v1.8, as quoted in the alignment review)

| Rule | Source | Effect on any dashboard |
|---|---|---|
| L4/L5 is a project category; Level 4 is the HQ QA assurance level | DR-01 | Say "L4/L5 Projects"; never call project data "Level 4" |
| Level 2 counts are project performance, never HQ QA output | DR-02 | Label every figure drawn from project registers |
| HQ QA does not own project NCRs | DR-03 | Show NCR status as the project's; HQ QA shows its adequacy and effectiveness assessment beside it |
| No personal results on the executive view | DR-07 | Officer KPIs and GPS goals stay on the Performance dashboard |
| Grey is never shown as Green | RMM §9 | Insufficient evidence is its own status |
| Overall = worst applicable area; Grey counts as Amber; Grey overall if more than a third of areas are Grey; Head of QA may moderate by one level with rationale | RMM §9, §9.2 | Built into the 1.9 heat-map and Command Centre |
| Missing data is excluded, not scored; below 60% of weight with data = "Insufficient data" | Part 8 §3 | No neutral 50s |
| Unapproved thresholds are Provisional | Part 8; RMM Annex A | Every target carries a Proposed label |
| Every chart states its method; every figure traces to records | Part 9 §1 | Method line and source date on each figure |
| Contractor KPI figures are restricted | Part 4 §9 | Head of QA and admin clerk only |

The ten RMM §9 assurance areas: 1 QMS / PQP, 2 QA effectiveness, 3 QC effectiveness, 4 NCR management, 5 CAPA effectiveness, 6 Contractor QMS, 7 Indicator reliability, 8 Quality risks, 9 Records, 10 T&C / handover.

The monthly management assurance report (RMM §21) has six sections: overall conclusion (status, confidence, three reasons, limitations); portfolio dashboard (frozen heat-map); top five quality risks; significant findings, overdue actions and escalations; NCR / CAPA trends labelled as project performance; management decisions required.

### 3.3 Q-TRACK 1.9 demo: what was built

The demo shows the development build's screens with clearly labelled sample data. Nothing is saved. A role switcher shows the menu and permissions for **Head – QA**, **Assistant Manager**, **Admin clerk** and **Management (read-only)**; closed screens show "Not available for this role", mirroring the database's row-level security.

**Menu and screens (43 captured views)**

| Group | Screens |
|---|---|
| Dashboard | Command Centre (Portfolio, PML, RTS Link, L4/L5 pages); My desk (Assistant Manager, Admin clerk) |
| Projects | Project assurance register; project page with tabs (overview, assurance plan, deliverables, reviews and evidence, Level 4 assurance, findings and actions, risks and milestones, KPI contributions, change history); L4/L5 project register monitoring (workbook load; document reviews, inspections and OIL, NCR & OBS, audits and contractor KPI, projects and timeline, engagements, pre-award, data quality); Project NCR & OBS governance (L4-F15/F16/F17: ageing bands 30/60/90, recurrence by contractor, root cause) |
| Assurance assessment | Portfolio heat-map (ten areas, change vs last month, escalations, triggers); Project assessments (Tier 1 monthly, Tier 2 quarterly, Tier 3 at milestones; submit by working day 3, approve by day 5); Assurance statistics (c-chart, backlog trend, root-cause Pareto, coverage by tier, findings by severity, milestone variance); Assurance plan and reviews (8-step review workflow, coverage vs 90%); Findings & CAPA refs; Assurance registers (systemic issues, escalations, tier review triggers, evidence requests, maturity and competency, lessons and improvements, RMM §15–§20) |
| Work & performance | Performance dashboard (Head – QA only: KPI by subordinate, workload, weekly updates); Level 4 function register (28 functions, owner and deputy) and weekly exception updates (due Tuesday 12:00, RMM §11); Tasks and deliverables (list, Kanban, calendar, workload); KPI and scorecards; Risk and alert engine (23 rules, auto-resolve, history) |
| Governance & reporting | Monthly management assurance report (RMM §21, six sections); Scorecard & effectiveness review (RMM §22, §24, unit level, no personal attribution); Management review (meetings, approvals queue, decision log); Management actions (MRTC-owned only; contractor CAPA stays with the responsible party); Reports and export (CSV, Excel, print to PDF) |
| System | Administration (onboarding checklist, users and roles, KPI definitions, periods, configuration of thresholds, rubrics, risk model and tiers, audit log); Import data (upload → preview and validate → commit); Command Centre data (load the weekly workbook) |

**Command Centre inside Q-TRACK (new in 1.9)**

- The weekly data comes from a Google Sheet downloaded as `.xlsx` and loaded at Administration › Command Centre data. Q-TRACK runs the Sheet's own checks, records the file's SHA-256 and who loaded it, and **Head – QA confirms the week** before management sees it. A new load of the same week replaces an unconfirmed one. Workbook tabs: projects, areas, alerts, ncr, series, milestones, risks, decisions, kpis, notes.
- Outputs: Print for submission (cover page plus sign-off block), Download PDF, Full pack PDF (all four pages), Download data (Excel), Save to submission record (PDF with reference and SHA-256), Copy link.
- A "Live in Q-TRACK" card reads Q-TRACK's own records: approved heat-map, coverage this month vs 90%, open HQ QA findings by severity, escalations and evidence requests, NCR c-chart special causes, CAPA verified effective with Wilson 95% interval, NCR/OBS ageing, root-cause Pareto.
- Sample week shown: 7–13 Nov 2026 (illustrative figures only, not MRTC records).

### 3.4 Command Centre concept (design, 28 Oct)

One interactive artboard of the Command Centre inside the Q-TRACK shell (week ending 30 Oct 2026, status Draft awaiting Head – QA confirmation). Each panel is tagged with where its data would come from:

| Panel | Source tag |
|---|---|
| Assurance conclusion by programme | EXTEND · `qa.assurance_reports` (+ programme key) |
| Level 4 heat-map, ten areas by programme | LIVE · `qa.assurance_assessments` + `qa.assessment_areas`; programme roll-up is a new view |
| Key alerts | LIVE · `qa.notifications` |
| Decisions required (Level C to senior management, B to Project Director, A chased by QA) | LIVE · `qa.escalations` + `qa.management_decisions` |
| NCR & CAPA by programme (CAPA effective with 95% CI, 80% reference) | LIVE · `qa.corrective_action_references` via ncrAnalytics |
| Critical milestones, baseline vs forecast | LIVE · `qa.milestones` (critical = true) |
| NCR / OBS c-chart (UCL = c̄ + 3√c̄) | LIVE · ncrAnalytics + `stats.cChart` / `mannKendall` |
| Programme measures (Level 2 weekly series) | NEW · programme measures register, weekly import |
| Top five quality risks | EXTEND · `qa.assurance_reports.top_risks` |
| Data integrity watchlist | NEW · validation rules over registers and imports |

Footer wording: "Prepared independently by the QA Unit for management and internal use. It does not stop work; authority stays with the Project Director."

## 4. The QA dashboards

### 4.1 Weekly dashboard review (17–23 Oct 2026)

Verdict: the three weekly slide dashboards show the QA Unit is busy, not that it is decisive; several data defects would fail a senior reader's cross-check.

| Project | Dashboard score (of 5) | Project quality risk | Headline |
|---|---|---|---|
| Penang Mutiara Line (PML) | 2.0 | Critical | CMC1 elevated works under SWO since 28 Jul 2026; 37 of 46 pile caps (80%) cast after the first NCR; RFI closure 2.6% |
| RTS Link | 3.0 | High | 126 of 273 open NCRs (46%) more than a month overdue; Sunway MSPR 18% and Rohas 21% closure; 64% of ACP drawings under review |
| KGL / L4/L5 | 1.7 | Moderate | 38 NCR + 42 OBS, about 44% open; conflicting totals (RFI 214 vs 682; engagements 182 / 271 / 539) |

Top defects: stale data (PML document table at 7 Aug; RTS System Assurance at 13–17 Apr); two temperature limits for the SWO issue (75 °C vs 70 °C); a trend formula error (Code 1 growth reported +26.9%, correct +36.8%; total +19.1%, correct +23.5%); totals that do not reconcile (RTS WIR 588 missing, RTS NCR ageing 32 missing); almost no targets, RAG or management asks.

Still valid from the blueprint: the pre-issue checklist (cut-off date on every panel, totals equal parts, last week as the base for % change, narrative matches charts, no empty panels, past-due dates red with forecast, Decisions Required box, QA Manager sign-off); the chart style rules; the design tokens (MRT navy #0B2A6F, accent #2563EB, status colours for meaning only); the weekly data contract fields; and the 8-week build sequence to Cloud Run with Workspace SSO.

### 4.2 QA Portfolio Command Centre (dashboard, 27 Oct)

Four pages built from the 17–23 Oct slides and the 21 Oct Q-TRACK L4/L5 load, all data fixed (not live). Each page leads with HQ QA's position and labels project data as Level 2.

- **Portfolio:** assurance conclusion; Level 4 heat-map (ten areas per programme, indicative, hover for evidence); key alerts by days open; NCR & CAPA by programme; decisions required (escalation level, owner, days to due); "Awaiting Q-TRACK records" for measures only Q-TRACK can supply.
- **Each programme page (PML, RTS Link, L4/L5):** Level 4 assessment tiles; key alerts; decisions; top five quality risks; critical milestones (days late vs baseline); three evidence charts; data integrity watchlist (feeds area 7).
  - PML charts: three in four NCRs open; most RFIs stuck at compilation; pending reviews more than doubled.
  - RTS Link charts: most open NCRs past expected completion; safety control drives half of NCRs; WIR closure above 85% target; MST up, MSA down; PKG 6 far behind weekly V&V target.
  - L4/L5 charts: nine open findings past expected; four in five projects lack a PQP; open RFIs stalled past 90 days; most open issues have no target date.
- Area ratings are labelled indicative, not an approved assessment.

### 4.3 Key figures (17–23 Oct slides and 21 Oct Q-TRACK load)

**L4/L5 Projects (Q-TRACK load, 21 Oct):** 97 projects (40 on-going, 34 completed, 17 pending FAL, 5 pending award, 1 terminated); **PQP in place on 8 of 40 on-going (20%)**; 782 RFIs (614 closed, 78.5%; 145 open, 138 of them inspected over 90 days ago; 111 with no result); 80 NCR/OBS (36 open, 9 past expected completion by up to 355 days, 27 awaiting contractor response, 26 from the Aug 2026 ET reconditioning audit); SMH Rail holds 65 of 80; 2,348 submissions since May 2023 (Code 1 49%, Code 2 38%, Code 3 6%; 95.6% answered by deadline, median 6 days); OIL 161 open of 309 (45 past target, 116 with no target date); 4 on-going projects past end date, 6 ending within 60 days; 18 of 66 RFPs with QA review not started.

**PML:** SWO day count 91 at 27 Oct; 112 NCRs, 29 closed (25.9%); RFIs 282 of 478 at pending compilation; at least 8 pile caps formally above 70 °C.

**RTS Link:** WIR closure 87.3% (85.7% on the full base) vs 85% target; 126 NCRs over a month overdue; 9 external audit findings (2 NCR, 7 OBS) open; PKG 4 V&V 7.6% behind; PKG 6 at 35.6% of weekly target.

**Composite index under Q-TRACK rules:** RTS Link and L4/L5 would turn Green under the missing-data rule, yet both carry Red-level control weaknesses under the worst-area rule. That is the main evidence for dropping the index as the headline.

## 5. Open decisions and actions (consolidated)

### 5.1 Decisions for Head of QA (alignment review §9)

1. Retire the composite index as the headline, or keep it only as a labelled Level 2 indicator under the Part 8 missing-data rule.
2. Adopt Q-TRACK's NCR measures (ageing bands, median age, repeat, systemic, CAPA effective) in place of NCR closure rate on all three projects.
3. Make the Q-TRACK L4/L5 load the only source for the L4/L5 page, and decide whether to extend imports to PML and RTS submissions and inspections (gap Q1).

### 5.2 Actions from the weekly review (status as recorded on 27 Oct)

| # | Action | Project | Owner | Due | Status |
|---|---|---|---|---|---|
| A1 | Refresh all panels to the reporting week; add cut-off dates | PML | PML QA Asst. Manager | 30 Oct 2026 | Not started |
| A2 | Confirm concrete temperature limit and clause; state SWO status and lift forecast | PML | PML QA Asst. Manager | 30 Oct 2026 | Not started |
| A3 | Correct the trend formula and the pie/table mismatch | PML | PML QA team | 30 Oct 2026 | Not started |
| A4 | Reconcile engagement, RFI and document totals; remove empty panels and duplicates | L4/L5 (KGL) | Systems QA Manager | 30 Oct 2026 | Not started |
| A5 | Reconcile WIR and NCR ageing totals; update CPC register and V&V to current week | RTS Link | RTS QA Asst. Manager | 6 Nov 2026 | Not started |
| A6 | Escalate the 126 overdue NCRs and Sunway/Rohas closure to the Project Director | RTS Link | RTS QA Asst. Manager | 6 Nov 2026 | Not started |
| A7 | Approve standard KPI set and targets (QHI part superseded, see §2) | All | Head of QA | 13 Nov 2026 | Not started |
| A8 | Migrate weekly dashboards into Q-TRACK | All | Head of QA / Data Analytics Officer | Dec 2026 | Not started on 27 Oct; the Command Centre now runs inside the 1.9 demo (compiler's note) |

### 5.3 Realignment actions (alignment review §9)

- Reword every decision and risk so HQ QA escalates and verifies and the project or contractor owns closure (X4, X5). *Reflected in the dashboard and the 1.9 Command Centre.*
- Mark all targets and bands Proposed until thresholds are approved (X6).
- Add the overall assurance conclusion with confidence and limitations to each page. *Reflected in the dashboard and 1.9.*
- Raise the PML temperature NCRs as an HQ QA finding, test them against the repeat rule, and log the SWO as a Level C escalation.
- Record RTS CPC and handover dates as critical milestones so schedule variance can be shown.
- Put PQP coverage (8 of 40), overdue NCR/OBS and stalled RFIs at the top of the L4/L5 page. *Shown on the dashboard's L4/L5 page.*
- Move engagement counts and activity lists off the management pages (X7).
- Complete the first approved Level 4 assessments so the heat-map can replace the index.

### 5.4 Gaps in Q-TRACK v1.8 to close before go-live

| # | Gap | Suggested change |
|---|---|---|
| Q1 | PML and RTS import only NCR/OBS references; submissions, WIR/RFI and handover registers are not imported | Add those imports with the Level 2 banner |
| Q2 | No record type for stop-work orders or holds | Escalation sub-type "Stop work / hold" with start date, conditions, lift date |
| Q3 | NCR Monitor scoring not built; six NCR goals still read the tracker | Build NCR Monitor scoring (Part 2 §6) |
| Q4 | System assurance V&V burn-down not modelled | Milestone-type record for V&V closure, plan vs actual |
| Q5 | All thresholds and the RMM still Proposed; nothing deployed | Settle decisions C-1 to C-6 and approve thresholds (Part 2 §11) |

The Command Centre concept adds two items to build: a programme measures register (weekly Level 2 import) and validation rules for the data integrity watchlist.

## 6. Related work

**PMO Standardisation — HOD Briefing (23 Oct).** 24 slides for the HOD, Standard & Compliance (ref. MRTC/BSD/SCD/QA/PMO-STD/001 Rev. 0): one lifecycle of 8 stages (S0–S7) and 7 gates (G0–G6) with a QA Gate Assurance Statement at G2–G6; four document tiers; project tiers A–D by size and risk; 8 pillars (QA leads Quality, IMS leads Documents); 9 workstreams; 27 SOPs (QA writes 7); pilot Jul–Sep 2027; go-live January 2028; staff time from existing teams. Success KPIs are to be reported quarterly to the Steering Committee **through Q-TRACK**. Five decisions requested (D1–D5, 13 Nov 2026 to Feb 2027).

**Pile Cap CAPA Evidence Cross-check (15 Oct).** Tests the PML review report on NCR PML-MRTC-CMC1-S08L-NCR-000001 (pile cap S08-P1, 83.4 °C) against the hot block records. The data support the review. New gap: the TCP's heat input is from the coolest of six mixes tested (Masterpave G40S3); SMC and MDC G40S3 give about 77–79 °C at 28 °C placing instead of 75.3 °C. Five edits for Rev 2 plus corrections to the TQ and QO drafts. This is the evidence behind the PML critical issue on the dashboards.

## 7. Suggested next steps

1. Take the three Head of QA decisions in §5.1; most of the remaining realignment follows from them.
2. Replace the 1.9 demo's sample week with the first real weekly workbook (week ending 30 Oct 2026 or later) and run the load, confirm and save cycle once.
3. Resolve the PML 70 °C vs 75 °C limit (A2) before the next issue; it affects the SWO banner on every page.
4. Decide whether gap Q1 (PML and RTS imports) is in scope for go-live, since half of the PML and RTS slide content cannot be traced in Q-TRACK without it.
5. Small clean-up in the 1.9 Command Centre code: `cc-qa.js` still contains an unused QHI gauge helper from the superseded blueprint.
