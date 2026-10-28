/**
 * Q-TRACK assurance rules. Pure functions over plain records: no Sheets, no Session.
 * Dates are ISO strings (yyyy-mm-dd); periods are yyyy-mm.
 */

const STATUS_RANK = { Green: 0, Amber: 1, Red: 2 };

/* ---------------- dates ---------------- */

function isoToDay_(iso) {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso));
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) / 864e5 : null;
}

function daysBetween_(fromIso, toIso) {
  const a = isoToDay_(fromIso), b = isoToDay_(toIso);
  return a == null || b == null ? null : b - a;
}

function addDays_(iso, n) {
  const d = new Date((isoToDay_(iso) + n) * 864e5);
  return d.toISOString().slice(0, 10);
}

const MONTH_NAMES_ = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** 2026-10-26 → 26 Oct 2026; 2026-10 → Oct 2026 (for alert text). */
function nice_(iso) {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(String(iso || ''));
  if (!m) return iso ? String(iso) : '—';
  return (m[3] ? +m[3] + ' ' : '') + MONTH_NAMES_[+m[2] - 1] + ' ' + m[1];
}

function periodOf_(iso) { return String(iso).slice(0, 7); }

function shiftPeriod_(period, n) {
  const y = +period.slice(0, 4), m = +period.slice(5, 7) - 1 + n;
  const d = new Date(Date.UTC(y, m, 1));
  return d.toISOString().slice(0, 7);
}

/** The Friday that ends the week containing iso (weeks run Saturday–Friday). */
function fridayOf_(iso) {
  const day = new Date(isoToDay_(iso) * 864e5).getUTCDay(); // 0 Sun … 5 Fri
  return addDays_(iso, (5 - day + 7) % 7);
}

/* ---------------- Level 4 overall (RMM §9) ---------------- */

/**
 * Overall = worst applicable area. Grey counts as Amber. Grey overall when more than a
 * third of applicable areas are Grey. No applicable areas = Not assessed.
 */
function overallFromAreas(statuses) {
  const applicable = statuses.filter((s) => s && s !== 'N/A');
  if (!applicable.length) return 'Not assessed';
  const n = (s) => applicable.filter((x) => x === s).length;
  const grey = n('Grey');
  if (grey > applicable.length / 3) return 'Grey';
  if (n('Red')) return 'Red';
  if (n('Amber') + grey) return 'Amber';
  return 'Green';
}

function areaStatuses(a) {
  const out = [];
  for (let i = 1; i <= 10; i++) out.push(a['a' + i] || 'Grey');
  return out;
}

/** Head – QA may move the overall result by one level, with a recorded rationale (RMM §9.2). */
function checkModeration(overall, moderatedTo, note) {
  if (!moderatedTo) return null;
  if (!(overall in STATUS_RANK) || !(moderatedTo in STATUS_RANK)) return 'Only a Green, Amber or Red result can be moderated.';
  if (Math.abs(STATUS_RANK[overall] - STATUS_RANK[moderatedTo]) !== 1) return 'Moderation may move the result by one level only.';
  if (!note || String(note).trim().length < 10) return 'Give the moderation rationale (at least a sentence).';
  return null;
}

/* ---------------- statistics ---------------- */

function median_(xs) {
  if (!xs.length) return null;
  const s = xs.slice().sort((a, b) => a - b), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Wilson score interval for k successes in n trials, 95%. */
function wilson(k, n, z) {
  z = z || 1.96;
  if (!n) return { p: null, lo: null, hi: null };
  const p = k / n, z2 = z * z, den = 1 + z2 / n;
  const centre = (p + z2 / (2 * n)) / den;
  const half = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / den;
  return { p: p, lo: Math.max(0, centre - half), hi: Math.min(1, centre + half) };
}

/** c-chart over monthly counts: centre line c̄ and UCL = c̄ + 3√c̄; LCL floored at 0. */
function cChart(counts) {
  const cl = counts.length ? counts.reduce((a, b) => a + b, 0) / counts.length : 0;
  const ucl = cl + 3 * Math.sqrt(cl), lcl = Math.max(0, cl - 3 * Math.sqrt(cl));
  return { cl: cl, ucl: ucl, lcl: lcl, special: counts.map((c) => c > ucl) };
}

/* ---------------- NCR & CAPA (Level 2 references) ---------------- */

function ncrStats(ncrs, asOf, cfg) {
  const b1 = +cfg.ncrBand1 || 30, b2 = +cfg.ncrBand2 || 60, b3 = +cfg.ncrBand3 || 90;
  const live = ncrs.filter((r) => r.status !== 'Cancelled');
  const open = live.filter((r) => r.status === 'Open');
  const bands = { notPast: 0, b1: 0, b2: 0, b3: 0, over: 0, noDate: 0 };
  const ages = [];
  let past = 0, oldest = 0;
  open.forEach((r) => {
    const age = daysBetween_(r.raisedDate, asOf);
    if (age != null) { ages.push(age); oldest = Math.max(oldest, age); }
    const late = r.expectedDate ? daysBetween_(r.expectedDate, asOf) : null;
    if (late == null) bands.noDate++;
    else if (late <= 0) bands.notPast++;
    else {
      past++;
      if (late <= b1) bands.b1++; else if (late <= b2) bands.b2++; else if (late <= b3) bands.b3++; else bands.over++;
    }
  });
  const checked = live.filter((r) => r.capaCheck === 'Effective' || r.capaCheck === 'Not effective');
  const eff = checked.filter((r) => r.capaCheck === 'Effective').length;
  const w = wilson(eff, checked.length);
  const target = (+cfg.capaTarget || 80) / 100;
  const capaState = !checked.length ? 'none' : w.lo >= target ? 'good' : w.p >= target ? 'watch' : 'action';

  const byCat = {};
  live.forEach((r) => { const c = r.category || 'Not classified'; byCat[c] = (byCat[c] || 0) + 1; });
  const pareto = Object.keys(byCat).map((k) => ({ label: k, value: byCat[k] })).sort((a, b) => b.value - a.value);

  const byOwner = {};
  live.forEach((r) => { const c = r.contractor || 'Not stated'; (byOwner[c] = byOwner[c] || { label: c, issued: 0, open: 0, past: 0 }).issued++; });
  open.forEach((r) => {
    const o = byOwner[r.contractor || 'Not stated']; o.open++;
    if (r.expectedDate && daysBetween_(r.expectedDate, asOf) > 0) o.past++;
  });

  return {
    issued: live.length,
    open: open.length,
    pastExpected: past,
    pastPct: open.length ? past / open.length : null,
    over90: bands.over,
    medianAge: median_(ages),
    oldest: oldest,
    awaiting: open.filter((r) => r.awaitingResponse === true).length,
    repeat: live.filter((r) => r.repeat === true).length,
    bands: bands,
    bandEdges: [b1, b2, b3],
    capa: { k: eff, n: checked.length, p: w.p, lo: w.lo, hi: w.hi, state: capaState, target: target },
    pareto: pareto,
    owners: Object.keys(byOwner).map((k) => byOwner[k]).sort((a, b) => b.open - a.open),
  };
}

/** NCR/OBS raised per month over the last n months ending with asOf's month. */
function ncrMonthly(ncrs, asOf, n) {
  n = n || 12;
  const end = periodOf_(asOf), months = [];
  for (let i = n - 1; i >= 0; i--) months.push(shiftPeriod_(end, -i));
  const counts = months.map((m) => ncrs.filter((r) => r.status !== 'Cancelled' && r.raisedDate && periodOf_(r.raisedDate) === m).length);
  const closed = months.map((m) => ncrs.filter((r) => r.closedDate && periodOf_(r.closedDate) === m).length);
  return { months: months, raised: counts, closed: closed, chart: cChart(counts) };
}

/* ---------------- assessments, coverage, milestones ---------------- */

function latestApproved(assessments, projectId, beforePeriod) {
  return assessments
    .filter((a) => a.projectId === projectId && a.state === 'Approved' && (!beforePeriod || a.period < beforePeriod))
    .sort((a, b) => (a.period < b.period ? 1 : -1))[0] || null;
}

function finalOf(a) { return a ? a.final || a.overall : null; }

/** Is a Level 4 assessment due for this project in this period? Tier 1 monthly; Tier 2 quarterly (Mar, Jun, Sep, Dec); Tier 3 at milestones. */
function assessmentDue(project, period) {
  if (project.status !== 'Active') return false;
  if (String(project.tier) === '1') return true;
  if (String(project.tier) === '2') return ['03', '06', '09', '12'].indexOf(period.slice(5, 7)) >= 0;
  return false;
}

function coverage(projects, assessments, period) {
  const due = projects.filter((p) => assessmentDue(p, period));
  const done = due.filter((p) => assessments.some((a) => a.projectId === p.id && a.period === period && a.state === 'Approved'));
  return { period: period, due: due.length, done: done.length, pct: due.length ? done.length / due.length : null, missing: due.filter((p) => done.indexOf(p) < 0).map((p) => p.id) };
}

function milestoneStatus(m, asOf) {
  if (m.actual) return { status: 'Achieved', variance: m.baseline ? daysBetween_(m.baseline, m.actual) : null };
  if (m.baseline && m.forecast) {
    const v = daysBetween_(m.baseline, m.forecast);
    if (v > 0) return { status: 'Late', variance: v };
    if (daysBetween_(m.forecast, asOf) > 0) return { status: 'Past forecast', variance: daysBetween_(m.baseline, asOf) };
    return { status: 'On track', variance: v };
  }
  if (m.baseline && daysBetween_(m.baseline, asOf) > 0) return { status: 'Past baseline', variance: daysBetween_(m.baseline, asOf) };
  if (!m.forecast) return { status: 'Not reported', variance: null };
  return { status: 'On track', variance: null };
}

/* ---------------- alert engine ---------------- */

const SEVERITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };

/**
 * Alerts are derived from the records each time; they clear themselves when the condition clears.
 * Each alert: { id, rule, severity, band, projectId, title, detail, date, owner, link }.
 */
function computeAlerts(db, asOf, cfg) {
  const out = [];
  const proj = {};
  db.Projects.forEach((p) => { proj[p.id] = p; });
  const active = (id) => proj[id] && proj[id].status === 'Active';
  const leadOf = (id) => (proj[id] && proj[id].lead) || '';
  const push = (a) => { a.id = a.rule + ':' + (a.ref || a.projectId || ''); out.push(a); };

  // Findings
  db.Findings.forEach((f) => {
    if (!active(f.projectId)) return;
    if (f.severity === 'Critical' && f.status !== 'Closed' && f.status !== 'Verified effective') {
      push({ rule: 'FINDING_CRITICAL', ref: f.id, severity: 'Critical', band: 'Assurance assessment', projectId: f.projectId, title: 'Critical finding open: ' + f.title, detail: f.id + ' · responsible party ' + (f.responsibleParty || '—'), date: f.raisedDate, owner: f.qaOwner, link: { view: 'Findings', id: f.id } });
    }
    if (f.status === 'Open' && f.responseDue && daysBetween_(f.responseDue, asOf) > 0) {
      push({ rule: 'FINDING_RESPONSE_OVERDUE', ref: f.id, severity: f.severity === 'Critical' || f.severity === 'Major' ? 'High' : 'Medium', band: 'Assurance assessment', projectId: f.projectId, title: f.severity + ' finding without a response', detail: f.id + ' — response from ' + (f.responsibleParty || 'the responsible party') + ' was due ' + nice_(f.responseDue) + '.', date: f.responseDue, owner: f.qaOwner, link: { view: 'Findings', id: f.id } });
    }
    if (f.status === 'Implemented' && f.effectivenessDue) {
      const d = daysBetween_(f.effectivenessDue, asOf);
      if (d > 0) push({ rule: 'EFFECTIVENESS_OVERDUE', ref: f.id, severity: 'High', band: 'Assurance assessment', projectId: f.projectId, title: 'Effectiveness check overdue', detail: f.id + ' was due for verification on ' + nice_(f.effectivenessDue) + '.', date: f.effectivenessDue, owner: f.qaOwner, link: { view: 'Findings', id: f.id } });
      else if (d > -7) push({ rule: 'EFFECTIVENESS_DUE', ref: f.id, severity: 'Medium', band: 'Assurance assessment', projectId: f.projectId, title: 'Effectiveness check due within 7 days', detail: f.id + ' — due ' + nice_(f.effectivenessDue) + '.', date: f.effectivenessDue, owner: f.qaOwner, link: { view: 'Findings', id: f.id } });
    }
  });

  // Systemic signal: the same area raised as a finding on three or more projects
  const byArea = {};
  db.Findings.filter((f) => active(f.projectId) && f.area && ['Closed', 'Verified effective'].indexOf(f.status) < 0)
    .forEach((f) => { (byArea[f.area] = byArea[f.area] || []).push(f); });
  Object.keys(byArea).forEach((k) => {
    const fs = byArea[k], ps = {};
    fs.forEach((f) => { ps[f.projectId] = 1; });
    if (Object.keys(ps).length >= 3) {
      const area = AREAS[+k - 1];
      push({ rule: 'SYSTEMIC_SIGNAL', ref: 'area' + k, severity: 'High', band: 'Assurance assessment', projectId: '', title: 'Systemic signal: ' + (area ? area.title : 'area ' + k), detail: fs.length + ' open findings across ' + Object.keys(ps).length + ' projects (' + fs.map((f) => f.id).join(', ') + ').', date: fs.map((f) => f.raisedDate).sort()[0], owner: '', link: { view: 'Findings' } });
    }
  });

  // NCR ageing, per project (Level 2 references)
  const byProj = {};
  db.NCRs.forEach((r) => { (byProj[r.projectId] = byProj[r.projectId] || []).push(r); });
  Object.keys(byProj).forEach((pid) => {
    if (!active(pid)) return;
    const s = ncrStats(byProj[pid], asOf, cfg);
    if (s.over90) push({ rule: 'NCR_OVER_TOP_BAND', projectId: pid, severity: 'High', band: 'NCR & CAPA', title: s.over90 + ' NCR/OBS more than ' + s.bandEdges[2] + ' days past expected completion', detail: s.open + ' open · ' + s.pastExpected + ' past expected · oldest ' + s.oldest + ' days. Level 2 records owned by the project.', date: asOf, owner: leadOf(pid), link: { view: 'NCRs', projectId: pid } });
    else if (s.bands.b2 + s.bands.b3) push({ rule: 'NCR_AGEING', projectId: pid, severity: 'Medium', band: 'NCR & CAPA', title: (s.bands.b2 + s.bands.b3) + ' NCR/OBS more than ' + s.bandEdges[0] + ' days past expected completion', detail: s.open + ' open · median age ' + Math.round(s.medianAge || 0) + ' days.', date: asOf, owner: leadOf(pid), link: { view: 'NCRs', projectId: pid } });
    if (s.capa.state === 'action' && s.capa.n >= 5) push({ rule: 'CAPA_NOT_EFFECTIVE', projectId: pid, severity: 'High', band: 'NCR & CAPA', title: 'CAPA verified effective below target', detail: Math.round(s.capa.p * 100) + '% of ' + s.capa.n + ' checked (target ' + Math.round(s.capa.target * 100) + '%).', date: asOf, owner: leadOf(pid), link: { view: 'NCRs', projectId: pid } });
    const rep = byProj[pid].filter((r) => r.repeat === true && r.status === 'Open');
    if (rep.length) push({ rule: 'REPEAT_SIGNAL', projectId: pid, severity: rep.length >= 3 ? 'Critical' : 'High', band: 'NCR & CAPA', title: 'Repeat NCRs after corrective action', detail: rep.length + ' open repeat NCR/OBS (' + rep.slice(0, 4).map((r) => r.ref).join(', ') + (rep.length > 4 ? ', …' : '') + ').', date: rep.map((r) => r.raisedDate).sort()[0], owner: leadOf(pid), link: { view: 'NCRs', projectId: pid } });
  });

  // Escalations
  db.Escalations.forEach((e) => {
    if (e.status !== 'Open') return;
    if (e.stopWork) push({ rule: 'STOP_WORK', ref: e.id, severity: 'Critical', band: 'Projects', projectId: e.projectId, title: 'Stop-work / hold in force', detail: e.ask + (e.raisedDate ? ' · day ' + daysBetween_(e.raisedDate, asOf) : ''), date: e.raisedDate, owner: leadOf(e.projectId), link: { view: 'Escalations', id: e.id } });
    if (e.dueDate && daysBetween_(e.dueDate, asOf) > 0) push({ rule: 'ESCALATION_NO_RESPONSE', ref: e.id, severity: e.level === 'C' ? 'Critical' : 'High', band: 'Assurance assessment', projectId: e.projectId, title: 'Level ' + e.level + ' escalation without response', detail: (e.owner || 'Accountable executive') + ' — due ' + nice_(e.dueDate) + '.', date: e.dueDate, owner: leadOf(e.projectId), link: { view: 'Escalations', id: e.id } });
  });

  // Milestones
  db.Milestones.forEach((m) => {
    if (!active(m.projectId) || m.critical === false) return;
    const st = milestoneStatus(m, asOf);
    if (st.status === 'Late' || st.status === 'Past baseline' || st.status === 'Past forecast') push({ rule: 'MILESTONE_AT_RISK', ref: m.id, severity: 'High', band: 'Projects', projectId: m.projectId, title: 'Critical milestone at risk: ' + m.item, detail: 'Baseline ' + nice_(m.baseline) + ', forecast ' + (m.forecast ? nice_(m.forecast) : 'not reported') + (st.variance ? ' (' + st.variance + ' days)' : '') + '.', date: m.baseline || asOf, owner: leadOf(m.projectId), link: { view: 'Milestones', id: m.id } });
  });

  // Assessments: last completed period due and not approved; latest approved Red
  const lastPeriod = shiftPeriod_(periodOf_(asOf), -1);
  const lateFrom = +String(asOf).slice(8, 10) > 7;
  db.Projects.forEach((p) => {
    if (p.status !== 'Active') return;
    if (lateFrom && assessmentDue(p, lastPeriod) && !db.Assessments.some((a) => a.projectId === p.id && a.period === lastPeriod && a.state === 'Approved')) {
      push({ rule: 'ASSESSMENT_OVERDUE', projectId: p.id, severity: 'High', band: 'Assurance assessment', title: 'Level 4 assessment for ' + nice_(lastPeriod) + ' not approved', detail: 'Tier ' + p.tier + ' — submit by working day 3, approve by working day 5.', date: lastPeriod + '-07', owner: p.lead, link: { view: 'Assessments', projectId: p.id } });
    }
    const la = latestApproved(db.Assessments, p.id);
    if (la && finalOf(la) === 'Red') push({ rule: 'PROJECT_RED', projectId: p.id, severity: 'High', band: 'Assurance assessment', title: 'Level 4 position Red', detail: 'Approved for ' + nice_(la.period) + ' — management intervention or heightened assurance required.', date: la.approvedAt ? String(la.approvedAt).slice(0, 10) : la.period + '-01', owner: p.lead, link: { view: 'Assessment', id: la.id } });
    if ((String(p.tier) === '1' || String(p.tier) === '2') && p.pqp !== 'Approved' && p.pqp !== 'N/A') push({ rule: 'PQP_MISSING', projectId: p.id, severity: 'Medium', band: 'Projects', title: 'No approved Project Quality Plan', detail: 'Tier ' + p.tier + ' project · PQP ' + (p.pqp || 'not recorded') + '.', date: p.startDate || asOf, owner: p.lead, link: { view: 'Project', id: p.id } });
  });

  // Tasks
  db.Tasks.forEach((t) => {
    if (['Accepted'].indexOf(t.status) >= 0 || !t.due) return;
    if (t.status !== 'Submitted' && daysBetween_(t.due, asOf) > 0) push({ rule: 'TASK_OVERDUE', ref: t.id, severity: t.priority === 'High' ? 'High' : 'Low', band: 'Work & performance', projectId: t.projectId || '', title: 'Task overdue: ' + t.title, detail: t.id + ' was due ' + nice_(t.due) + '.', date: t.due, owner: t.assignee, link: { view: 'Tasks', id: t.id } });
  });

  return out.sort((a, b) => (SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]) || String(a.date || '').localeCompare(String(b.date || '')));
}

/* ---------------- Command Centre roll-up ---------------- */

function worstOf_(statuses) {
  if (statuses.indexOf('Red') >= 0) return 'Red';
  if (statuses.indexOf('Amber') >= 0 || statuses.indexOf('Grey') >= 0) return 'Amber';
  if (statuses.indexOf('Green') >= 0) return 'Green';
  return 'Not assessed';
}

function buildDashboard(db, asOf, cfg) {
  const alerts = computeAlerts(db, asOf, cfg);
  const period = periodOf_(asOf);
  const covPeriod = shiftPeriod_(period, -1);
  const active = db.Projects.filter((p) => p.status === 'Active');

  const heat = active.map((p) => {
    const la = latestApproved(db.Assessments, p.id);
    const prev = la ? latestApproved(db.Assessments, p.id, la.period) : null;
    const now = finalOf(la), before = finalOf(prev);
    let change = '';
    if (now && before && now in STATUS_RANK && before in STATUS_RANK) change = STATUS_RANK[now] > STATUS_RANK[before] ? 'worse' : STATUS_RANK[now] < STATUS_RANK[before] ? 'better' : 'same';
    const pending = db.Assessments.filter((a) => a.projectId === p.id && (a.state === 'Submitted' || a.state === 'Draft')).length;
    return {
      projectId: p.id, code: p.code, name: p.name, programme: p.programme, tier: p.tier, tierStatus: p.tierStatus, lead: p.lead,
      assessmentId: la ? la.id : null, period: la ? la.period : null, areas: la ? areaStatuses(la) : null,
      overall: now || 'Not assessed', moderated: !!(la && la.moderatedTo), change: change, pending: pending,
      escalations: db.Escalations.filter((e) => e.projectId === p.id && e.status === 'Open').length,
      critMaj: db.Findings.filter((f) => f.projectId === p.id && (f.severity === 'Critical' || f.severity === 'Major') && ['Closed', 'Verified effective'].indexOf(f.status) < 0).length,
    };
  });

  const count = (s) => heat.filter((h) => h.overall === s).length;
  const programmes = ['Portfolio'].concat(PROGRAMMES).map((prog) => {
    const ids = active.filter((p) => prog === 'Portfolio' || p.programme === prog).map((p) => p.id);
    if (prog !== 'Portfolio' && !ids.length) return null;
    const inP = (r) => ids.indexOf(r.projectId) >= 0;
    const rows = heat.filter(inP);
    const al = alerts.filter((a) => (a.projectId ? inP(a) : prog === 'Portfolio'));
    return {
      programme: prog,
      projects: ids.length,
      overall: worstOf_(rows.map((r) => r.overall)),
      assessed: rows.filter((r) => r.overall !== 'Not assessed').length,
      ncr: ncrStats(db.NCRs.filter(inP), asOf, cfg),
      decisions: db.Escalations.filter((e) => inP(e) && e.status === 'Open' && (e.level === 'B' || e.level === 'C')).length,
      alerts: { total: al.length, critical: al.filter((a) => a.severity === 'Critical').length, high: al.filter((a) => a.severity === 'High').length },
      top: al[0] || null,
    };
  }).filter(Boolean);

  const milestones = db.Milestones.filter((m) => m.critical !== false && active.some((p) => p.id === m.projectId))
    .map((m) => Object.assign({}, m, milestoneStatus(m, asOf)))
    .sort((a, b) => String(a.forecast || a.baseline || '9').localeCompare(String(b.forecast || b.baseline || '9')));

  const findingsOpen = db.Findings.filter((f) => ['Closed', 'Verified effective'].indexOf(f.status) < 0);
  const bySev = {};
  findingsOpen.forEach((f) => { bySev[f.severity] = (bySev[f.severity] || 0) + 1; });

  return {
    asOf: asOf,
    period: period,
    counts: { Red: count('Red'), Amber: count('Amber'), Green: count('Green'), Grey: count('Grey'), 'Not assessed': count('Not assessed') },
    overall: worstOf_(heat.map((h) => h.overall)),
    heat: heat,
    programmes: programmes,
    alerts: alerts,
    coverage: coverage(db.Projects, db.Assessments, covPeriod),
    findings: { open: findingsOpen.length, bySeverity: bySev, effectivenessDue: db.Findings.filter((f) => f.status === 'Implemented').length },
    escalations: { open: db.Escalations.filter((e) => e.status === 'Open').length, stopWork: db.Escalations.filter((e) => e.status === 'Open' && e.stopWork).length },
    milestones: milestones,
    monthly: ncrMonthly(db.NCRs, asOf, 12),
  };
}
