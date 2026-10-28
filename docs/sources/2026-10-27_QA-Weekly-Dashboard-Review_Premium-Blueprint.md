> Exported from the Claude doc "QA Weekly Dashboard Review & Premium Dashboard Blueprint"
> (https://claude.ai/artifact/MMrs6Sfw9zuTFMT5q9r4Ho), revision 14, on 28 Oct 2026. Text only; the doc is the master copy.

# QA Weekly Dashboard Review & Premium Dashboard Blueprint

PML · RTS Link · KGL Refurbishment — reporting week 17–23 October 2026

2026-10-27 · Shafik Radzi


## 1. Executive summary

The three dashboards prove the QA Unit is busy, but they do not yet prove the QA Unit is decisive. They report activity (meetings attended, documents counted) far more than outcome (risk removed, rework avoided, decisions management must take). Several data-integrity defects would undermine credibility the moment a senior reader cross-checks a number.

**Verdict by project (week 17–23 Oct 2026)**

| Project | Dashboard maturity | Project quality risk | Headline management must hear |
|---|---|---|---|
| Penang Mutiara Line (PML) | Low: about 11 weeks stale | **Critical** | CMC1 elevated concrete works under SWO since 28 Jul 2026; 80% of pile caps were cast after the first NCR; RFI closure 2.6% |
| RTS Link | Medium–High: best of the three | **High** | 126 NCRs (46% of open) overdue by more than 1 month; Sunway MSPR 18% and Rohas 21% closure; handover drawings 64% still under review |
| KGL Refurbishment | Low: generic narrative, internal contradictions | **Moderate** | 38 NCR + 42 OBS with about 44% still open; headline figures conflict (RFI 214 vs 682; engagements 182 vs 271 vs 539) |

**Top five findings**

1. **Stale data presented as current.** The PML dashboard is dated 17–23 Oct but its document table is as at 07/08/2026, its look-ahead lists 24–27 Aug activities and the STC kick-off of 2 Sep as future. RTS System Assurance reports the 13–17 April period.
2. **Contradictory technical limits on the most serious issue.** PML Key Highlight states a 75°C concrete acceptance limit; the SWO conditions state 70°C. Management cannot be shown two limits for the issue that has stopped the works.
3. **Calculation error in week-on-week trends.** PML trend percentages divide increases by this week's value and decreases by last week's. Code 1 growth is reported as 26.9%; the correct figure is 36.8%. Total submissions rose 23.5%, not 19.1%.
4. **Numbers that do not reconcile.** RTS WIR categories leave 588 items unaccounted; RTS open-NCR ageing leaves 32 unaccounted; KGL quotes three different engagement totals and two RFI totals.
5. **No targets, no RAG, no asks.** Only one KPI (RTS WIR, target 85%) carries a target. No dashboard states the decision or support required from management.

**What management should take away after the fix:** one standard QA scorecard across all projects, each KPI shown against a target with a trend, the top three quality risks with their cost and schedule exposure, and a clear Decisions Required box. The rebuilt dashboards delivered with this review demonstrate that format.


## 2. Review method and scorecard

Each dashboard was scored 1–5 against eight criteria a board-level reader applies in the first 30 seconds. RTS Link scores highest (3.0 of 5); PML and KGL score 2.0 and 1.7.

The statistics applied were: arithmetic reconciliation of every total against its parts; recomputation of every rate and percentage change; closure-rate and ageing analysis; Pareto concentration of NCR categories; a Shewhart individuals control chart on monthly engagement counts; and backlog clearance-time projection (remaining items ÷ observed weekly throughput).

| Criterion (weight) | What good looks like | PML | RTS Link | KGL |
|---|---|---|---|---|
| Data currency (15%) | Every figure dated within the reporting week | 1 | 2 | 3 |
| Data integrity (20%) | Totals reconcile, rates recomputable, no contradictions | 2 | 3 | 1 |
| Outcome focus (15%) | Shows risk, rework, compliance, not just activity | 3 | 3 | 1 |
| Targets and RAG (10%) | Each KPI against a target with status colour | 1 | 3 | 1 |
| Trend (10%) | Week-on-week and 6–12 week trend | 2 | 4 | 2 |
| Insight (10%) | Explains why, not only what | 3 | 3 | 2 |
| Management ask (10%) | Decisions or support required are stated | 2 | 2 | 1 |
| Visual clarity (10%) | One message per panel, readable at a glance | 2 | 4 | 3 |
| **Weighted score (of 5)** |  | **2.0** | **3.0** | **1.7** |

Scores of 1 are concentrated in currency, integrity and targets. These are process defects, not design defects: a better template alone will not fix them. Section 7 sets out the governance that will.


## 3. Penang Mutiara Line (PML)

PML carries the portfolio's most serious quality event, yet its dashboard is the least current. The concrete temperature issue on CMC1 is a systemic contractor quality-control failure, and the dashboard should present it as such with numbers, not as narrative.


### 3.1 Data integrity findings

| # | Finding | Evidence on slide | Severity | Fix |
|---|---|---|---|---|
| P1 | Content is 8–11 weeks old | Document table as at 07/08/2026 vs 24/7/2026; look-ahead dated 24–27 Aug; STC kick-off 2 Sep shown as planned; key highlight as of 8 Jul 2026 | Critical | Data cut-off date on every panel; reject dashboard if any panel is older than 7 days |
| P2 | Two different temperature limits | Key Highlight: acceptance limit 75°C. SWO conditions: 70°C maximum | Critical | Confirm the specification clause; state one limit with clause reference |
| P3 | Trend formula error | Increases divided by this week, decreases by last week | High | Use (This week − Last week) ÷ Last week for every row |
| P4 | Review rate T/W equals L/W on every line | 43.9 / 33.2 / 15.7 / 6.7 / 0.6% identical both weeks | High | Recompute; identical values signal a copied cell |
| P5 | Pie and table disagree | Pie: 890 completed of about 1,633; table total 2,047 | High | Drive both visuals from one source table |
| P6 | RFI categories sum to 472, not 478 | 14+32+115+282+17+12 = 472 | Medium | Add an Other or Unclassified line |
| P7 | System Assurance items unchanged since January | SAP/RMP pending DC transmittal since 29 Jan 2026 (about 9 months) | High | Escalate as an overdue action with owner and date, or close it |
| P8 | SWO status not stated for this week | SWO issued 28 Jul 2026; no status, conditions met or forecast lift date | Critical | Add an SWO tracker: 3 conditions, status of each, forecast date |


### 3.2 Corrected week-on-week trend (CMC1 document review)

| Status | Last week | This week | Reported | Correct | Error |
|---|---|---|---|---|---|
| Code 1 Accepted | 372 | 509 | +26.9% | **+36.8%** | understated by 9.9 pts |
| Pending review start | 118 | 245 | +51.8% | **+107.6%** | understated by 55.8 pts |
| Un-restrained | 414 | 484 | +14.5% | **+16.9%** | understated |
| Rejected by DCC | 0 | 104 | +100% | **new (not computable)** | misleading |
| Awaiting review / release | 480 | 445 | −7.3% | −7.3% | correct |
| **Total** | 1,657 | 2,047 | +19.1% | **+23.5%** | understated |

The more important signal is that pending-review items more than doubled in one period. That is a capacity warning for MRTM reviewers and should be shown, not buried.


### 3.3 What the numbers actually say

- **Systemic non-conformance.** Of 46 pile caps cast, 37 (80.4%) were cast after the first NCR. At least 8 (17.4%) are formally recorded above 70°C (6 IORs + 2 advance notices). This is evidence of an ineffective corrective action, which is itself an ISO 9001 clause 10.2 finding against the contractor.
- **RFI pipeline is blocked at compilation, not inspection.** Closure is 2.6% (12 Code 1 ÷ 461 non-cancelled). 282 of 478 RFIs (59%) sit at pending compilation. The constraint is contractor paperwork, which QA can target directly.
- **NCR closure 25.9%.** 112 NCRs issued, 29 closed, 83 open. Quality category is about 70% of all NCRs, driven by work without approval and repeated temperature exceedance.
- **76 reviewed documents are not yet transmitted.** They inflate Outstanding and represent an internal MRTM bottleneck that QA controls.


### 3.4 What management should see instead

A single red banner: SWO day count (91 days as at 27 Oct 2026), the three lift conditions and their status, pile caps affected, and the decision required (for example: approve independent DEF testing, or instruct remedial programme). Supporting tiles: NCR closure vs target, RFI funnel, document review backlog trend.


## 4. RTS Link

RTS Link is the template the other projects should learn from: it shows week-on-week movement, a target with RAG legend, and contractor-level breakdowns. Its weaknesses are reconciliation gaps, stale handover and System Assurance content, and an NCR ageing problem that is not escalated.


### 4.1 Data integrity findings

| # | Finding | Evidence | Severity | Fix |
|---|---|---|---|---|
| R1 | WIR categories do not sum to total | 67,316 + 9,195 + 1,413 = 77,924 vs 78,512 (588 missing) | Medium | Show the residual category or correct the total |
| R2 | Open NCR ageing does not sum to open count | 23 + 126 + 92 = 241 vs 273 open (32 missing) | Medium | Reconcile the ageing buckets to the open count |
| R3 | System Assurance reports the 13–17 April period | V&V figures are about 27 weeks old | High | Weekly V&V burn-down with current-week data |
| R4 | Handover table conflicts with Key Highlight | PKG 5 CPC: 30 Jul 2026 (highlight) vs 30 Jun 2025 (handover table); PKG 7 CPC by Mar 2026 and PKG 10 by 31 Dec 2025 both already past | High | Single CPC register; past-due dates shown red with revised forecast |
| R5 | 72% of consultant NCRs classed as Others | 555 of 771 | Medium | Mandatory taxonomy (Workmanship, Material, Documentation, Method, Safety, Environment) |
| R6 | MSA Code 3 nearly doubled | 23 to 41; aged Code 3 22 to 41 | Watch | Contractor-level drill-down and an owner |


### 4.2 What the numbers actually say

- **WIR closure 87.3% vs 85% target (green).** Correct base excludes withdrawn: 67,316 ÷ 77,099. On the full 78,512 base it is 85.7%, still green.
- **NCR ageing is the real risk.** 126 of 273 open MRTS NCRs (46.2%) are more than one month overdue, with Safety the largest category. Overall closure is 71.1%.
- **Two contractors drag the average.** Sunway (MSPR) at 18% and Rohas at 21% closure. A contractor league table with these two highlighted is the single most persuasive visual for management.
- **Handover is the next cliff.** 64.3% of Advance Check Print drawings are still under review; only 18.5% are Code 1. As-built progress is nil for PKG 1A, 2A, 2B.
- **System Assurance V&V.** PKG 4 remaining 2,601 vs plan 2,417 (7.6% behind). At 218 closures per week, clearance needs about 12 weeks. PKG 6 achieved 132 vs a 371 weekly target (35.6%).
- **External audits: 9 findings (2 NCR, 7 OBS), all still open** months after audits in May, June and July 2026.


## 5. KGL Refurbishment Programme

KGL has the weakest narrative and the most internal contradictions. A management reader comparing the boxed totals with the bullet text will find three different engagement totals on one slide, which damages trust in every other figure.


### 5.1 Data integrity findings

| # | Finding | Evidence | Severity | Fix |
|---|---|---|---|---|
| K1 | Three engagement totals | Monthly bars sum to 182 (Jan–Jul); box shows 271; text says 539 | Critical | One definition, one number, with date range |
| K2 | Two RFI totals | Box: 214; text: 682 | Critical | Separate cumulative vs reporting-period clearly |
| K3 | Two document totals | Total submission 2,352 vs total documents 2,052, with a cut-off third number beneath | High | Define submission vs document; remove overflow |
| K4 | Chart labels appear to differ from narrative | Text: meetings 66.7%, RFI closed 86%, construction 57.7%; pie labels read about 59%, 80%, 61% | High | Generate narrative from the chart data, not typed separately |
| K5 | Observer audits: 2 or 3 | Box: Total Observer 2; text: three participations | Medium | Reconcile |
| K6 | Activity lists duplicated | Every This Week and Look Ahead line appears twice | Medium | De-duplicate |
| K7 | Empty and placeholder panels | Train Delivery Status blank; two empty headers; placeholder text Add a visible | High | Remove or populate before issue |
| K8 | Monthly chart stops at July | October dashboard shows no Aug–Oct data | High | Rolling 12-month view |
| K9 | Audit highlight is 12 months old | Meiden audit 4–5 Nov 2025 presented as current | Medium | Show FY2026 audit plan vs actual |
| K10 | Gantt screenshots unreadable | Tool screenshots at a size nobody can read | Medium | Replace with a milestone list: on track / late / complete |


### 5.2 What the numbers actually say

Engagement rose from 19.3 to 31.0 a month from April (+60%), all within control limits. That is useful context but it is an input measure. Management cares about the outputs it bought: NCR 38 and OBS 42 with about 44% still open, document turnaround 93% ahead or on time, and 7 L4/L5 projects completed in 2026. Those belong at the top of the page; the engagement chart belongs at the bottom.


## 6. Portfolio patterns and the so-what for management

Across the portfolio, the QA Unit's strongest story is not being told: QA is detecting systemic contractor failures early, but closure is weak and the dashboards do not ask management to act on it.

**Five patterns across all three dashboards**

1. **Three templates, three vocabularies.** PML uses RFI, RTS uses WIR, KGL uses RFI for inspections. Closure rate is defined differently in each. Management cannot compare projects.
2. **Activity over outcome.** Meeting counts and engagement charts occupy prime space. Not one dashboard quantifies rework, cost of poor quality, or schedule days at risk.
3. **Narrative typed separately from the data.** Text quotes figures that no longer match the charts, which is how stale and contradictory numbers survive into the issued slide.
4. **Detection is strong, enforcement is weak.** Over 1,900 NCRs and OBS issued portfolio-wide, but open items are ageing (RTS: 126 over a month overdue; PML: 74% open).
5. **No escalation path on the page.** The PML SWO and the RTS overdue NCRs are exactly what a Project Director wants flagged with an owner, a date and a decision needed.

**The so-what in one sentence for the Board:** QA has found the problems; the company now needs to enforce closure, and the QA dashboard should be the instrument that drives that enforcement.


## 7. Recommendations: making QA's impact visible to management

Shift the dashboard from "what QA did" to "what QA prevented, what is at risk, and what we need from you". Ten recommendations, sequenced so the first four can be in place for the 31 Oct–6 Nov issue.


### 7.1 Standard QA KPI set (all projects, same definitions)

| Tier | KPI | Definition | Proposed target | Why management cares |
|---|---|---|---|---|
| Lagging | NCR closure rate | Closed ÷ issued, cumulative | ≥ 80% | Contractor responsiveness |
| Lagging | NCR overdue > 30 days | Open NCRs past due date by > 30 days | ≤ 10% of open | Enforcement effectiveness |
| Lagging | Repeat NCR rate | NCRs on a root cause already raised | ≤ 5% | Corrective action works or not |
| Leading | Inspection request closure | Closed ÷ (issued − cancelled/withdrawn) | ≥ 85% | Works being verified, not just built |
| Leading | Submission Code 1 first-time rate | Code 1 at first submission ÷ all first submissions | ≥ 70% | Contractor document quality |
| Leading | QA review turnaround | % responded within contractual period | ≥ 95% | MRTC is not the bottleneck |
| Assurance | Audit programme compliance | Audits done ÷ planned (FY) | 100% | Assurance coverage |
| Assurance | Audit finding closure | Findings closed within 60 days | ≥ 90% | Audit has teeth |
| Value | Cost of poor quality (COPQ) | Estimated rework + delay cost from NCRs | Trend down | Money language for the Board |
| Readiness | Handover document readiness | ACP / as-built at Code 1 ÷ required | Per CPC plan | Opening-day risk |


### 7.2 A single Quality Health Index (QHI) per project

Combine the KPIs into one 0–100 score so the Board sees one number per project, with RAG thresholds of 80 (green) and 60 (amber).

```
QHI = 0.25·S_NCR + 0.20·S_insp + 0.15·S_doc + 0.15·S_audit + 0.15·S_age + 0.10·S_repeat
```

Each S is the KPI's achievement against its target, capped at 100. S_audit averages programme compliance and finding closure; S_age = share of open NCRs not overdue > 30 days, scaled to the 10% allowance. Indicative QHI from this week's data: RTS Link 79 (amber), KGL 69 (amber), PML 29 (red). Inputs not reported this week (repeat rate, some ageing and audit data) are scored a neutral 50; PML repeat rate is scored 0 given the recurring temperature NCRs.


### 7.3 Ten recommendations

| # | Recommendation | Impact | Effort | When |
|---|---|---|---|---|
| 1 | Data cut-off date on every panel; QA Manager signs off currency before issue | High | Low | Next issue |
| 2 | Fix the trend formula and reconcile every total to its parts (checklist in section 9) | High | Low | Next issue |
| 3 | Add a Decisions Required box: max 3 items, each with owner and date | High | Low | Next issue |
| 4 | PML: SWO tracker as the banner (days, 3 conditions, forecast lift) and confirm the 70°C vs 75°C limit | Critical | Low | Next issue |
| 5 | Adopt the standard KPI set and one template for all projects | High | Medium | 4 weeks |
| 6 | Contractor league table (closure %, overdue, repeat) per project | High | Medium | 4 weeks |
| 7 | Cost of Poor Quality estimate on top NCRs (e.g. PML pile caps: remedial + SWO delay days × daily prolongation cost) | Very high | Medium | 6 weeks |
| 8 | Mandatory NCR taxonomy and root-cause code; retire "Others" | Medium | Medium | 6 weeks |
| 9 | Generate narrative from data (no typed numbers) inside Q-TRACK | High | High | Q1 2027 |
| 10 | Monthly portfolio QA report to Management Committee with QHI trend | Very high | Medium | From Dec 2026 |


### 7.4 How QA shows significant impact

- **Talk in money and days.** One credible COPQ figure (for example, rework and delay exposure on 46 PML pile caps) earns more attention than a year of meeting counts.
- **Show prevention.** Record defects caught at hold points before covering-up, and Code 3 submissions stopped before construction. Count them as "defects prevented".
- **Close the loop visibly.** Track repeat NCRs. A falling repeat rate is proof that QA's corrective-action enforcement works.
- **Rank contractors.** A league table converts QA data into a commercial lever (performance reviews, tender pre-qualification).
- **Link to corporate KPIs.** Map each QA KPI to the corporate scorecard: safe, on-time, on-budget, operationally ready.


## 8. Premium dashboard blueprint

Every project uses one page template so a Director can move between projects without relearning. The design follows the inverted pyramid used by investment-grade SaaS analytics: verdict first, evidence second, activity last.


### 8.1 Layout

A reader gets the answer from Z1 in five seconds, confirms it in Z2 in fifteen, and only goes to Z3–Z5 if they want the evidence. A Portfolio page sits above the three project pages: one row per project with QHI, RAG, the six KPIs and the critical issue.


### 8.2 Data visualisation style

| Data question | Chart | Rule |
|---|---|---|
| Is the project healthy? | Radial gauge (QHI) | One per page, thresholds at 60 and 80 drawn on the ring |
| Is a KPI on target? | KPI tile with bullet bar + sparkline | Target as a tick mark; delta arrow coloured by direction of good |
| How is a backlog moving? | Area (open) + line (closed), 12 weeks | Never pie charts for status over time |
| Where are problems concentrated? | Pareto bar + cumulative line | Sorted descending, 80% line |
| How old is the backlog? | Horizontal stacked bar | Sequential single hue, darker = older |
| Where does work get stuck? | Funnel | Width proportional to count; conversion % between stages |
| Which contractor is worst? | Sorted horizontal bar (league table) | Worst at top; target line; bottom two red |
| Status of many small items | Pill chips, not pies | Pies only for two-part splits, if at all |

**Colour discipline.** Neutral slate canvas, one brand blue accent (MRT navy #0B2A6F with interactive #2563EB), and status colours reserved strictly for meaning: green #16A34A on target, amber #D97706 watch, red #DC2626 action. No decorative colour.


### 8.3 Design tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| --bg | #F6F7FB | #0B1020 | Page canvas |
| --surface | #FFFFFF | #121A2E | Cards |
| --border | #E4E7EF | #1F2A44 | 1 px card edge |
| --text | #0F172A | #E6EAF2 | Primary text |
| --muted | #64748B | #8A96AD | Labels, axes |
| --brand | #0B2A6F | #8FB0FF | Header, active tab |
| --accent | #2563EB | #60A5FA | Primary data series |
| --good / --warn / --bad | #16A34A / #D97706 / #DC2626 | #4ADE80 / #FBBF24 / #F87171 | Status only |
| Type | Inter 400/500/600; tabular numerals | same | KPI numbers 32/600, labels 12/500 uppercase 0.04em |
| Spacing | 4 px base: 8, 12, 16, 24, 32 | same | Card padding 20, grid gap 16 |
| Radius / shadow | 14 px cards; shadow 0 1px 2px rgba(15,23,42,.06) | border only | Soft, not slideware |


### 8.4 Component hierarchy

1. **AppShell**: TopBar (Logo, ProjectSwitcher, WeekPicker, FreshnessBadge, ExportButton) and Router.
2. **PortfolioPage**: PortfolioHeader, ProjectRow × n (QHIChip, KPIMiniTiles, CriticalIssueChip).
3. **ProjectPage**:
  1. HeroBand: QHIGauge, VerdictCard (RiskChip × 3, CriticalBanner), DecisionsCard (DecisionItem × ≤ 3).
  2. KPIStrip: KPITile × 6 (Value, TargetBullet, DeltaBadge, Sparkline).
  3. AnalyticsGrid: NCRTrendChart, AgeingBar, ParetoChart, IssueTracker.
  4. PipelineRow: SubmissionFunnel, InspectionFunnel, ContractorLeague.
  5. ActivityDrawer (collapsed): AuditPlanVsActual, LookAheadList, PhotoAppendix.
  6. Footer: DataSources, CutOffDate, PreparedBy / ReviewedBy / ApprovedBy.

4. **Shared primitives**: Card, Chip, Tooltip, EmptyState, Skeleton, ThemeToggle.

**Interaction.** Every tile is clickable to its drill-down; hover shows definition, formula and source; empty states say "Data not submitted this week" in amber instead of showing stale numbers.


## 9. Build sequence and data contract

Build data first, design second, polish last. The sequence below takes the working prototype delivered with this review into Q-TRACK on MRTC's Google Cloud with Workspace SSO in about eight weeks.


### 9.1 Step-by-step build sequence

1. **Week 1 — Lock definitions.** Approve the 10 KPIs in section 7.1, their formulas, targets and RAG thresholds. One page, signed by Head of QA.
2. **Week 1 — Data contract.** One weekly Google Sheet (or Q-TRACK form) per project with the fields in 9.2. Cut-off Friday 17:00; submission Monday 10:00.
3. **Week 2 — Validation rules.** Automatic checks: totals equal sum of parts; no field older than cut-off; trend computed by formula; deltas outside ±30% flagged for explanation.
4. **Week 2 — Design tokens.** Implement the token table in 8.3 as CSS variables with light and dark themes.
5. **Week 3 — Primitives.** Card, Chip, KPITile, DeltaBadge, Sparkline, Tooltip, EmptyState, Skeleton.
6. **Week 3 — Hero band.** QHIGauge, VerdictCard, DecisionsCard, CriticalBanner.
7. **Week 4 — Charts.** NCR trend, ageing bar, Pareto, funnels, contractor league (one charting library, e.g. Apache ECharts or Chart.js).
8. **Week 5 — Project pages.** Assemble PML, RTS Link, KGL from the same template; per-project config only.
9. **Week 5 — Portfolio page.** One row per project; click-through to project page.
10. **Week 6 — Narrative generation.** Verdict and bullet text generated from data with templates; no typed numbers.
11. **Week 6 — Export.** One-click A3 landscape PDF for management packs, with sign-off footer.
12. **Week 7 — Access and hosting.** Deploy to GCP (Cloud Run + Firestore or BigQuery), Workspace SSO, role-based views (QA team edit, management view-only).
13. **Week 7 — Parallel run.** Issue both old slides and new dashboard for two weeks; collect HOD feedback.
14. **Week 8 — Go-live and retire slides.** Weekly dashboard replaces PowerPoint; monthly portfolio report to Management Committee generated from it.


### 9.2 Weekly data contract (minimum fields per project)

| Group | Fields |
|---|---|
| Meta | project, package, week_ending, data_cutoff, prepared_by, reviewed_by |
| NCR | issued_cum, closed_cum, open_by_age (<30, 30–60, >60 days), by_category, by_contractor, repeat_flag |
| Inspection (RFI/WIR) | issued, cancelled_withdrawn, pending_compilation, pending_inspection, rejected, closed |
| Submissions | received, under_review, code1, code2, code3, first_time_code1, responded_within_sla |
| Audit | planned_fy, conducted, findings_ncr, findings_obs, findings_closed |
| Critical issues | id, title, start_date, conditions[], status, forecast_close, decision_required |
| Handover | acp_required, acp_code1, asbuilt_required, asbuilt_code1, cpc_planned, cpc_forecast |
| COPQ | ncr_id, rework_cost_estimate, delay_days, basis |


### 9.3 Pre-issue checklist (applies from next week)

- Every panel shows a data cut-off within the reporting week
- Every total equals the sum of its parts
- Every percentage change uses last week as the base
- Narrative figures match the charts
- No empty panels, placeholder text or duplicated lines
- Past-due dates shown red with revised forecast
- Decisions Required box completed (or "None this week")
- Reviewed and signed by the QA Manager before issue


## 10. Action register and approval

Eight actions close the findings in this review; the first four are due before the next weekly issue.

| # | Action | Project | Owner | Due | Status |
|---|---|---|---|---|---|
| A1 | Refresh all panels to the reporting week; add cut-off dates | PML | PML QA Asst. Manager | 30 Oct 2026 | Not started |
| A2 | Confirm concrete temperature limit and specification clause; state SWO status and lift forecast | PML | PML QA Asst. Manager | 30 Oct 2026 | Not started |
| A3 | Correct the trend formula and the pie/table mismatch | PML | PML QA team | 30 Oct 2026 | Not started |
| A4 | Reconcile engagement, RFI and document totals; remove empty panels and duplicates | KGL | Systems QA Manager | 30 Oct 2026 | Not started |
| A5 | Reconcile WIR and NCR ageing totals; update CPC register and System Assurance V&V to current week | RTS Link | RTS QA Asst. Manager | 6 Nov 2026 | Not started |
| A6 | Escalate the 126 overdue NCRs and the Sunway/Rohas closure rates to the Project Director | RTS Link | RTS QA Asst. Manager | 6 Nov 2026 | Not started |
| A7 | Approve standard KPI set, targets and QHI | All | Head of QA | 13 Nov 2026 | Not started |
| A8 | Migrate weekly dashboards into Q-TRACK per section 9 | All | Head of QA / Data Analytics Officer | Dec 2026 | Not started |

|  | Name | Designation | Signature | Date |
|---|---|---|---|---|
| Prepared by | Shafik | Senior Quality Manager, Head of QA |  |  |
| Reviewed by |  | Head of Department, Standard & Compliance |  |  |
| Approved by |  | Division Head, Business & Sustainability |  |  |

