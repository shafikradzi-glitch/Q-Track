/*
 * Q-TRACK server tests. Runs the real Apps Script code (apps-script/*.gs) under Node with the
 * in-memory mock in tools/gas-mock.js.  Usage: node tests/run.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const { makeMock } = require('../tools/gas-mock.js');

const ROOT = path.join(__dirname, '..', 'apps-script');
const ORDER = ['Config.gs', 'Rules.gs', 'Db.gs', 'Auth.gs', 'Api.gs', 'Setup.gs', 'Code.gs'];
const SOURCE = ORDER.map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n;\n');

const HQ = 'lead.qa@mrt.example';
const MGR = 'mgr.civil@sample.example';
const AM_CIVIL = 'am.civil@sample.example';
const AM_SYS = 'am.systems@sample.example';
const CLERK = 'clerk@sample.example';
const VIEWER = 'viewer@sample.example';

function fresh(withSample) {
  const mock = makeMock({ user: HQ, owner: HQ });
  const ctx = vm.createContext(Object.assign({ console: { log() {}, error() {} } }, mock.services));
  vm.runInContext(SOURCE, ctx, { filename: 'qtrack.gs' });
  ctx.setup();
  if (withSample) ctx.loadSampleData();
  const call = (user, action, payload) => {
    mock.setUser(user);
    return JSON.parse(ctx.api(action, JSON.stringify(payload || {})));
  };
  const ok = (user, action, payload) => {
    const r = call(user, action, payload);
    assert.ok(r.ok, action + ' as ' + user + ' should succeed, got ' + r.code + ': ' + r.message);
    return r.data;
  };
  const no = (user, action, payload, code) => {
    const r = call(user, action, payload);
    assert.ok(!r.ok, action + ' as ' + user + ' should fail');
    if (code) assert.strictEqual(r.code, code, 'expected ' + code + ', got ' + r.code + ': ' + r.message);
    return r;
  };
  return { ctx, mock, call, ok, no };
}

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

/* ---------------- rules ---------------- */
test('overall = worst applicable area, Grey rules', () => {
  const { ctx } = fresh(false);
  const o = ctx.overallFromAreas;
  const g = Array(10).fill('Green');
  assert.strictEqual(o(g), 'Green');
  assert.strictEqual(o(g.map((x, i) => (i === 3 ? 'Red' : x))), 'Red');
  assert.strictEqual(o(g.map((x, i) => (i < 3 ? 'Grey' : x))), 'Amber', '3 of 10 Grey is not more than a third');
  assert.strictEqual(o(g.map((x, i) => (i < 4 ? 'Grey' : x))), 'Grey', '4 of 10 Grey is more than a third');
  assert.strictEqual(o(['Grey', 'Grey', 'Red', 'Green', 'Green', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A']), 'Grey', 'Grey overall wins over Red when > 1/3 Grey');
  assert.strictEqual(o(Array(10).fill('N/A')), 'Not assessed');
  assert.strictEqual(o(['Green', 'N/A', 'Amber']), 'Amber');
});

test('client copy of the overall rule matches the server', () => {
  const { ctx } = fresh(false);
  const html = fs.readFileSync(path.join(ROOT, 'App.html'), 'utf8');
  const m = /function overallFromAreas\(statuses\) \{[\s\S]*?\n  \}/.exec(html);
  assert.ok(m, 'client overallFromAreas not found');
  const client = vm.runInNewContext('(' + m[0] + ')');
  const opts = ['Green', 'Amber', 'Red', 'Grey', 'N/A'];
  for (let n = 0; n < 4000; n++) {
    const s = Array.from({ length: 10 }, () => opts[Math.floor(Math.random() * 5)]);
    assert.strictEqual(client(s), ctx.overallFromAreas(s), s.join(','));
  }
});

test('moderation: one level, rationale required', () => {
  const { ctx } = fresh(false);
  assert.strictEqual(ctx.checkModeration('Red', '', ''), null);
  assert.ok(ctx.checkModeration('Red', 'Green', 'A long enough reason here'));
  assert.ok(ctx.checkModeration('Red', 'Amber', 'short'));
  assert.strictEqual(ctx.checkModeration('Red', 'Amber', 'Evidence of recovery accepted by HQ QA.'), null);
  assert.ok(ctx.checkModeration('Grey', 'Amber', 'Evidence of recovery accepted by HQ QA.'));
});

test('Wilson interval and c-chart', () => {
  const { ctx } = fresh(false);
  const w = ctx.wilson(13, 20);
  assert.ok(Math.abs(w.p - 0.65) < 1e-9);
  assert.ok(Math.abs(w.lo - 0.4329) < 0.001, 'lo ' + w.lo);
  assert.ok(Math.abs(w.hi - 0.8186) < 0.001, 'hi ' + w.hi);
  assert.strictEqual(ctx.wilson(0, 0).p, null);
  const c = ctx.cChart([4, 4, 4, 4, 20]);
  assert.ok(Math.abs(c.cl - 7.2) < 1e-9);
  assert.strictEqual(c.special.join(), 'false,false,false,false,true');
});

test('NCR ageing bands, median age and CAPA state', () => {
  const { ctx } = fresh(false);
  const asOf = '2026-11-30';
  const n = (raised, expected, status, extra) => Object.assign({ raisedDate: raised, expectedDate: expected, status: status || 'Open' }, extra || {});
  const s = ctx.ncrStats([
    n('2026-11-01', '2026-12-15'),
    n('2026-09-01', '2026-11-10'),
    n('2026-07-01', '2026-09-15'),
    n('2026-01-01', '2026-02-01'),
    n('2026-05-01', ''),
    n('2026-05-01', '2026-06-01', 'Closed', { capaCheck: 'Effective' }),
    n('2026-05-01', '2026-06-01', 'Cancelled'),
  ], asOf, { ncrBand1: 30, ncrBand2: 60, ncrBand3: 90, capaTarget: 80 });
  assert.strictEqual(s.issued, 6, 'cancelled excluded');
  assert.strictEqual(s.open, 5);
  assert.strictEqual(s.pastExpected, 3);
  assert.deepStrictEqual([s.bands.notPast, s.bands.b1, s.bands.b2, s.bands.b3, s.bands.over, s.bands.noDate], [1, 1, 0, 1, 1, 1]);
  assert.strictEqual(s.over90, 1);
  assert.strictEqual(s.oldest, 333);
  assert.strictEqual(s.capa.n, 1);
  assert.strictEqual(s.capa.state, 'watch', '1 of 1 effective: point ≥ 80% but lower bound below');
});

test('milestone status and variance', () => {
  const { ctx } = fresh(false);
  const st = (m) => ctx.milestoneStatus(m, '2026-11-30');
  assert.strictEqual(JSON.stringify(st({ baseline: '2026-12-01', forecast: '2026-12-11' })), JSON.stringify({ status: 'Late', variance: 10 }));
  assert.strictEqual(st({ baseline: '2026-11-20' }).status, 'Past baseline');
  assert.strictEqual(st({ baseline: '2026-10-01', actual: '2026-10-03' }).status, 'Achieved');
  assert.strictEqual(st({ baseline: '2026-12-20', forecast: '2026-12-20' }).status, 'On track');
  assert.strictEqual(st({}).status, 'Not reported');
});

/* ---------------- setup and access ---------------- */
test('setup creates every tab and the first Lead – QA', () => {
  const { ctx, mock, ok } = fresh(false);
  Object.keys(ctx.TABLES || {}).forEach(() => {});
  ['Users', 'Projects', 'Assessments', 'Findings', 'NCRs', 'Escalations', 'Milestones', 'Risks', 'Tasks', 'Weekly', 'Reports', 'Config', 'Audit'].forEach((t) => assert.ok(mock.spreadsheet.getSheetByName(t), t + ' tab'));
  const b = ok(HQ, 'bootstrap');
  assert.strictEqual(b.me.role, 'LEAD');
  assert.strictEqual(b.data.Users.length, 1);
  ctx.setup();
  assert.strictEqual(ok(HQ, 'bootstrap').data.Users.length, 1, 'setup is idempotent');
});

test('unregistered and empty identities are refused', () => {
  const { no } = fresh(true);
  const r = no('stranger@mrt.example', 'bootstrap', {}, 'NOT_REGISTERED');
  assert.strictEqual(r.message, 'stranger@mrt.example');
  no('', 'bootstrap', {}, 'NO_IDENTITY');
});

test('sample data loads and the dashboard is populated', () => {
  const { ok } = fresh(true);
  const b = ok(HQ, 'bootstrap');
  assert.strictEqual(b.config.sampleData, true);
  assert.strictEqual(b.data.Projects.length, 5);
  assert.ok(b.data.NCRs.length > 50);
  const d = b.dashboard;
  assert.strictEqual(d.heat.length, 5);
  const pml = d.heat.find((r) => r.code === 'DEMO-PML');
  assert.strictEqual(pml.overall, 'Red', 'PML sample: 3 of 9 applicable areas Grey is not more than a third, and area 4 is Red');
  assert.strictEqual(pml.change, 'worse', 'Amber last time');
  assert.strictEqual(d.heat.find((r) => r.code === 'DEMO-A').change, 'worse');
  assert.strictEqual(d.heat.find((r) => r.code === 'DEMO-C').overall, 'Not assessed');
  const rules = new Set(d.alerts.map((a) => a.rule));
  ['STOP_WORK', 'ESCALATION_NO_RESPONSE', 'FINDING_CRITICAL', 'FINDING_RESPONSE_OVERDUE', 'MILESTONE_AT_RISK', 'SYSTEMIC_SIGNAL', 'PQP_MISSING', 'TASK_OVERDUE'].forEach((r) => assert.ok(rules.has(r), 'alert rule ' + r));
  assert.ok(d.alerts.every((a, i, arr) => i === 0 || ({ Critical: 0, High: 1, Medium: 2, Low: 3 })[arr[i - 1].severity] <= ({ Critical: 0, High: 1, Medium: 2, Low: 3 })[a.severity]), 'alerts sorted by severity');
});

test('viewer sees only approved assessments and no working registers', () => {
  const { ok, no } = fresh(true);
  const b = ok(VIEWER, 'bootstrap');
  assert.strictEqual(b.data.Findings.length, 0);
  assert.strictEqual(b.data.NCRs.length, 0);
  assert.strictEqual(b.data.Tasks.length, 0);
  assert.ok(b.data.Assessments.length > 0 && b.data.Assessments.every((a) => a.state === 'Approved'));
  assert.ok(b.dashboard.alerts.every((a) => a.severity === 'Critical' || a.severity === 'High'));
  assert.ok(b.dashboard.programmes.find((p) => p.programme === 'Portfolio').ncr.open > 0, 'viewer still sees NCR aggregates');
  assert.strictEqual(b.sheetUrl, '');
  no(VIEWER, 'save', { table: 'Risks', record: { projectId: b.data.Projects[0].id, title: 'x', rating: 'Low' } }, 'DENIED');
});

/* ---------------- writes and permissions ---------------- */
test('Assistant Manager writes only on allocated projects', () => {
  const { ok, no } = fresh(true);
  const b = ok(AM_CIVIL, 'bootstrap');
  const pml = b.data.Projects.find((p) => p.code === 'DEMO-PML');
  const b2 = b.data.Projects.find((p) => p.code === 'DEMO-B');
  const f = ok(AM_CIVIL, 'save', { table: 'Findings', record: { projectId: pml.id, title: 'Test finding', severity: 'Minor', responsibleParty: 'Sample Contractor P' } });
  assert.ok(/^F-\d{5}$/.test(f.id));
  assert.strictEqual(f.qaOwner, AM_CIVIL, '$me default');
  assert.strictEqual(f.status, 'Open');
  assert.strictEqual(f.createdBy, AM_CIVIL);
  no(AM_CIVIL, 'save', { table: 'Findings', record: { projectId: b2.id, title: 'Elsewhere', severity: 'Minor', responsibleParty: 'X' } }, 'DENIED');
  no(AM_CIVIL, 'save', { table: 'Projects', record: Object.assign({}, pml, { tier: '2' }) }, 'DENIED');
  const p2 = ok(AM_CIVIL, 'save', { table: 'Projects', record: Object.assign({}, pml, { stage: 'S5 Testing & commissioning' }) });
  assert.strictEqual(p2.rev, pml.rev + 1);
  no(AM_CIVIL, 'save', { table: 'Projects', record: { code: 'NEW-1', name: 'n', programme: 'PML', tier: '1', status: 'Active' } }, 'DENIED');
  ok(CLERK, 'save', { table: 'Projects', record: { code: 'NEW-1', name: 'New project', programme: 'L4/L5', tier: '3', status: 'Active' } });
  no(CLERK, 'save', { table: 'Projects', record: { code: 'new-1', name: 'Dupe', programme: 'L4/L5', tier: '3', status: 'Active' } }, 'INVALID');
});

test('validation: required fields, enums, users, dates', () => {
  const { ok, no } = fresh(true);
  const b = ok(HQ, 'bootstrap');
  const pid = b.data.Projects[0].id;
  no(HQ, 'save', { table: 'Findings', record: { projectId: pid, severity: 'Minor', responsibleParty: 'X' } }, 'INVALID');
  no(HQ, 'save', { table: 'Findings', record: { projectId: pid, title: 't', severity: 'Huge', responsibleParty: 'X' } }, 'INVALID');
  no(HQ, 'save', { table: 'Findings', record: { projectId: pid, title: 't', severity: 'Minor', responsibleParty: 'X', qaOwner: 'nobody@x.y' } }, 'INVALID');
  no(HQ, 'save', { table: 'Findings', record: { projectId: pid, title: 't', severity: 'Minor', responsibleParty: 'X', responseDue: '31/12/2026' } }, 'INVALID');
  no(HQ, 'save', { table: 'Findings', record: { projectId: 'PRJ-999', title: 't', severity: 'Minor', responsibleParty: 'X' } }, 'INVALID');
  no(HQ, 'save', { table: 'Nope', record: {} }, 'BAD_TABLE');
});

test('optimistic locking rejects a stale edit', () => {
  const { ok, no } = fresh(true);
  const r = ok(HQ, 'bootstrap').data.Risks[0];
  ok(HQ, 'save', { table: 'Risks', record: Object.assign({}, r, { trend: 'Improving' }) });
  const c = no(AM_CIVIL, 'save', { table: 'Risks', record: Object.assign({}, r, { trend: 'Worsening' }) }, 'CONFLICT');
  assert.ok(/changed this record/.test(c.message));
});

test('values that look like formulas are stored as text', () => {
  const { ok, mock } = fresh(true);
  const pid = ok(HQ, 'bootstrap').data.Projects[0].id;
  const evil = '=IMPORTXML("http://x","//a")';
  const f = ok(HQ, 'save', { table: 'Findings', record: { projectId: pid, title: evil, severity: 'Minor', responsibleParty: '+cmd' } });
  const back = ok(HQ, 'bootstrap').data.Findings.find((x) => x.id === f.id);
  assert.strictEqual(back.title, evil);
  assert.strictEqual(back.responsibleParty, '+cmd');
  assert.ok(mock.spreadsheet.getSheetByName('Audit').getLastRow() > 1);
});

test('Manager works across every project, cannot approve, issue, manage users or delete', () => {
  const { ok, no } = fresh(true);
  const b = ok(MGR, 'bootstrap');
  assert.strictEqual(b.me.role, 'MGR');
  assert.strictEqual(b.ownProjects.length, 0, 'the sample Manager has no allocation and still works everywhere');
  const b2 = b.data.Projects.find((p) => p.code === 'DEMO-B');
  const f = ok(MGR, 'save', { table: 'Findings', record: { projectId: b2.id, title: 'Manager finding', severity: 'Minor', responsibleParty: 'Sample Contractor B' } });
  ok(MGR, 'save', { table: 'Risks', record: { projectId: b2.id, title: 'Manager risk', rating: 'Medium' } });
  ok(MGR, 'save', { table: 'NCRs', record: { projectId: b2.id, ref: 'MGR-1', type: 'NCR', raisedDate: '2026-10-01', status: 'Open' } });
  const p2 = ok(MGR, 'save', { table: 'Projects', record: Object.assign({}, b2, { stage: 'S6 Handover' }) });
  no(MGR, 'save', { table: 'Projects', record: Object.assign({}, p2, { tier: '1' }) }, 'DENIED');
  no(MGR, 'save', { table: 'Projects', record: { code: 'MGR-NEW', name: 'n', programme: 'PML', tier: '1', status: 'Active' } }, 'DENIED');
  no(MGR, 'save', { table: 'Users', record: { email: 'x@mrt.example', name: 'X', role: 'AM' } }, 'DENIED');
  no(MGR, 'save', { table: 'Reports', record: { period: '2026-09' } }, 'DENIED');
  no(MGR, 'remove', { table: 'Findings', id: f.id }, 'DENIED');
  no(MGR, 'configSave', { config: { coverageTarget: 50 } }, 'DENIED');
  no(MGR, 'auditList', {}, 'DENIED');
  no(MGR, 'importRows', { table: 'NCRs', rows: [], commit: false }, 'DENIED');
  // Tasks: assign to others, re-date, accept others' deliverables, not their own
  const t = ok(MGR, 'save', { table: 'Tasks', record: { title: 'Assigned by the Manager', assignee: AM_SYS, due: '2030-01-01', status: 'Not started' } });
  const t2 = ok(MGR, 'save', { table: 'Tasks', record: Object.assign({}, t, { due: '2030-02-01', assignee: AM_CIVIL }) });
  const t3 = ok(AM_CIVIL, 'save', { table: 'Tasks', record: Object.assign({}, t2, { status: 'Submitted' }) });
  ok(MGR, 'save', { table: 'Tasks', record: Object.assign({}, t3, { status: 'Accepted' }) });
  const mine = ok(MGR, 'save', { table: 'Tasks', record: { title: 'My own deliverable', assignee: MGR, status: 'Submitted' } });
  no(MGR, 'save', { table: 'Tasks', record: Object.assign({}, mine, { status: 'Accepted' }) }, 'DENIED');
  // Assessments: prepare and submit anywhere; approval stays with Lead – QA
  const a0 = { projectId: b2.id, period: '2030-03', a1: 'Green', a2: 'Green', a3: 'Green', a4: 'Green', a5: 'Green', a6: 'Green', a7: 'Green', a8: 'Green', a9: 'Green', a10: 'N/A', evidence: [], conclusion: 'Controls operating.', moderatedTo: 'Amber', moderationNote: 'A Manager may not moderate.' };
  let a = ok(MGR, 'save', { table: 'Assessments', record: a0 });
  assert.strictEqual(a.moderatedTo, '', 'moderation ignored for a Manager');
  a = ok(MGR, 'assessmentSubmit', { id: a.id, rev: a.rev });
  assert.strictEqual(a.state, 'Submitted');
  no(MGR, 'assessmentApprove', { id: a.id, rev: a.rev }, 'DENIED');
  no(MGR, 'assessmentReturn', { id: a.id, rev: a.rev, note: 'Not mine to return.' }, 'DENIED');
  assert.strictEqual(ok(MGR, 'bootstrap').data.Reports.length, 0, 'draft reports hidden from Managers');
});

test('assessment workflow: draft → submit → return → submit → approve, then frozen', () => {
  const { ok, no } = fresh(true);
  const b = ok(AM_CIVIL, 'bootstrap');
  const pml = b.data.Projects.find((p) => p.code === 'DEMO-PML');
  const rec = { projectId: pml.id, period: '2030-01', a1: 'Green', a2: 'Green', a3: 'Red', a4: 'Amber', a5: 'Green', a6: 'Green', a7: 'Green', a8: 'Green', a9: 'Green', a10: 'N/A', evidence: [], conclusion: '' };
  let a = ok(AM_CIVIL, 'save', { table: 'Assessments', record: rec });
  assert.strictEqual(a.state, 'Draft');
  assert.strictEqual(a.overall, 'Red');
  no(AM_CIVIL, 'save', { table: 'Assessments', record: Object.assign({}, rec) }, 'INVALID'); // duplicate project + period
  no(AM_CIVIL, 'assessmentSubmit', { id: a.id, rev: a.rev }, 'INVALID'); // evidence missing for areas 3 and 4
  const ev = []; ev[2] = 'Hold points released without records (F-00001).'; ev[3] = '18 NCRs past expected.';
  a = ok(AM_CIVIL, 'save', { table: 'Assessments', record: Object.assign({}, a, { evidence: ev, conclusion: 'QC control weak.' }) });
  no(AM_SYS, 'assessmentSubmit', { id: a.id, rev: a.rev }, 'DENIED');
  a = ok(AM_CIVIL, 'assessmentSubmit', { id: a.id, rev: a.rev });
  assert.strictEqual(a.state, 'Submitted');
  no(AM_CIVIL, 'save', { table: 'Assessments', record: Object.assign({}, a, { a3: 'Green' }) }, 'LOCKED');
  no(AM_CIVIL, 'assessmentApprove', { id: a.id, rev: a.rev }, 'DENIED');
  no(HQ, 'assessmentReturn', { id: a.id, rev: a.rev, note: '' }, 'INVALID');
  a = ok(HQ, 'assessmentReturn', { id: a.id, rev: a.rev, note: 'Add the sample size for area 4.' });
  assert.strictEqual(a.state, 'Returned');
  a = ok(AM_CIVIL, 'save', { table: 'Assessments', record: Object.assign({}, a, { moderatedTo: 'Green', moderationNote: 'An assessor may not moderate.' }) });
  assert.strictEqual(a.moderatedTo, '', 'moderation is Lead – QA only and is ignored for others');
  a = ok(AM_CIVIL, 'assessmentSubmit', { id: a.id, rev: a.rev });
  no(HQ, 'save', { table: 'Assessments', record: Object.assign({}, a, { moderatedTo: 'Green', moderationNote: 'Two levels is not allowed.' }) }, 'INVALID');
  const kept = ok(HQ, 'save', { table: 'Assessments', record: Object.assign({}, a, { a3: 'Green', conclusion: 'Rewritten by reviewer' }) });
  assert.strictEqual(kept.a3, 'Red', 'ratings stay as submitted at review');
  assert.strictEqual(kept.conclusion, a.conclusion);
  a = kept;
  a = ok(HQ, 'save', { table: 'Assessments', record: Object.assign({}, a, { moderatedTo: 'Amber', moderationNote: 'Recovery evidence accepted at the site visit.' }) });
  a = ok(HQ, 'assessmentApprove', { id: a.id, rev: a.rev });
  assert.strictEqual(a.state, 'Approved');
  assert.strictEqual(a.final, 'Amber');
  assert.strictEqual(a.approvedBy, HQ);
  no(HQ, 'save', { table: 'Assessments', record: a }, 'LOCKED');
  no(HQ, 'remove', { table: 'Assessments', id: a.id }, 'LOCKED');
  const heat = ok(HQ, 'bootstrap').dashboard.heat.find((r) => r.projectId === pml.id);
  assert.strictEqual(heat.overall, 'Amber');
  assert.strictEqual(heat.moderated, true);
  assert.strictEqual(heat.period, '2030-01');
});

test('tasks: owners update their own, only Lead – QA accepts or re-dates', () => {
  const { ok, no } = fresh(true);
  const t = ok(HQ, 'bootstrap').data.Tasks.find((x) => x.assignee === AM_SYS);
  no(AM_CIVIL, 'save', { table: 'Tasks', record: Object.assign({}, t, { status: 'Submitted' }) }, 'DENIED');
  no(AM_SYS, 'save', { table: 'Tasks', record: Object.assign({}, t, { status: 'Accepted' }) }, 'DENIED');
  no(AM_SYS, 'save', { table: 'Tasks', record: Object.assign({}, t, { due: '2031-01-01' }) }, 'DENIED');
  const t2 = ok(AM_SYS, 'save', { table: 'Tasks', record: Object.assign({}, t, { status: 'Submitted' }) });
  ok(HQ, 'save', { table: 'Tasks', record: Object.assign({}, t2, { status: 'Accepted' }) });
  no(AM_SYS, 'save', { table: 'Tasks', record: { title: 'For someone else', assignee: AM_CIVIL, status: 'Not started' } }, 'DENIED');
  ok(CLERK, 'save', { table: 'Tasks', record: { title: 'My own', status: 'Not started' } });
});

test('users: clerk cannot grant Lead – QA; last Lead – QA cannot demote themself', () => {
  const { ok, no } = fresh(true);
  no(CLERK, 'save', { table: 'Users', record: { email: 'new@mrt.example', name: 'New', role: 'LEAD' } }, 'DENIED');
  const u = ok(CLERK, 'save', { table: 'Users', record: { email: 'New.Person@MRT.example', name: 'New', role: 'AM' } });
  assert.strictEqual(u.email, 'new.person@mrt.example');
  no(CLERK, 'save', { table: 'Users', record: { email: 'new.person@mrt.example', name: 'Dupe', role: 'AM' } }, 'INVALID');
  const me = ok(HQ, 'bootstrap').data.Users.find((x) => x.email === HQ);
  no(HQ, 'save', { table: 'Users', record: Object.assign({}, me, { role: 'AM' }) }, 'INVALID');
  ok(HQ, 'bootstrap');
  const off = ok(HQ, 'save', { table: 'Users', record: Object.assign({}, u, { active: false }) });
  no('new.person@mrt.example', 'bootstrap', {}, 'NOT_REGISTERED');
  assert.strictEqual(off.active, false);
});

test('delete: Lead – QA only (own weekly updates excepted)', () => {
  const { ok, no } = fresh(true);
  const b = ok(HQ, 'bootstrap');
  no(AM_CIVIL, 'remove', { table: 'Risks', id: b.data.Risks[0].id }, 'DENIED');
  ok(HQ, 'remove', { table: 'Risks', id: b.data.Risks[0].id });
  assert.strictEqual(ok(HQ, 'bootstrap').data.Risks.length, b.data.Risks.length - 1);
  const w = b.data.Weekly.find((x) => x.createdBy === AM_CIVIL);
  no(AM_SYS, 'remove', { table: 'Weekly', id: w.id }, 'DENIED');
  ok(AM_CIVIL, 'remove', { table: 'Weekly', id: w.id });
});

test('monthly report: drafts hidden from staff; issue freezes a snapshot', () => {
  const { ok, no } = fresh(true);
  const r = ok(HQ, 'save', { table: 'Reports', record: { period: '2026-10', overall: 'Amber', confidence: 'Moderate', conclusion: 'Controls largely operating.' } });
  assert.strictEqual(r.state, 'Draft');
  assert.strictEqual(ok(AM_CIVIL, 'bootstrap').data.Reports.length, 0);
  no(AM_CIVIL, 'save', { table: 'Reports', record: Object.assign({}, r, { conclusion: 'x' }) }, 'DENIED');
  no(HQ, 'save', { table: 'Reports', record: { period: '2026-10' } }, 'INVALID');
  const iss = ok(HQ, 'reportIssue', { id: r.id, rev: r.rev });
  assert.strictEqual(iss.state, 'Issued');
  assert.ok(iss.snapshot && iss.snapshot.heat.length === 5 && iss.snapshot.asOf <= '2026-10-31');
  no(HQ, 'save', { table: 'Reports', record: iss }, 'LOCKED');
  assert.strictEqual(ok(VIEWER, 'bootstrap').data.Reports.length, 1);
});

test('import: all-or-nothing with row errors, project codes accepted', () => {
  const { ok, no } = fresh(true);
  const rows = [
    { 'Project': 'DEMO-PML', 'NCR / OBS reference': 'IMP-1', 'Type': 'NCR', 'Raised': '2026-10-01', 'Expected completion': '2026-10-30', 'Status': 'Open' },
    { projectId: 'DEMO-PML', ref: 'IMP-2', type: 'OBS', raisedDate: 'yesterday', status: 'Open' },
  ];
  no(AM_CIVIL, 'importRows', { table: 'NCRs', rows: rows, commit: false }, 'DENIED');
  const dry = ok(CLERK, 'importRows', { table: 'NCRs', rows: rows, commit: true });
  assert.strictEqual(dry.committed, false);
  assert.strictEqual(dry.errors.length, 1);
  assert.strictEqual(dry.errors[0].row, 3);
  const before = ok(HQ, 'bootstrap').data.NCRs.length;
  rows[1].raisedDate = '2026-10-02';
  const ok2 = ok(CLERK, 'importRows', { table: 'NCRs', rows: rows, commit: true });
  assert.strictEqual(ok2.committed, true);
  const after = ok(HQ, 'bootstrap').data.NCRs;
  assert.strictEqual(after.length, before + 2);
  assert.ok(after.some((n) => n.ref === 'IMP-2' && n.type === 'OBS'));
  const dupe = ok(CLERK, 'importRows', { table: 'NCRs', rows: [rows[0]], commit: false });
  assert.strictEqual(dupe.errors.length, 1, 'duplicate reference rejected');
});

test('settings: Lead – QA only, bands must increase', () => {
  const { ok, no } = fresh(true);
  no(AM_CIVIL, 'configSave', { config: { coverageTarget: 50 } }, 'DENIED');
  no(HQ, 'configSave', { config: { ncrBand1: 60, ncrBand2: 30 } }, 'INVALID');
  const c = ok(HQ, 'configSave', { config: { coverageTarget: 85, thresholdsApproved: true } });
  assert.strictEqual(c.coverageTarget, 85);
  assert.strictEqual(ok(AM_CIVIL, 'bootstrap').config.thresholdsApproved, true);
});

test('clearSampleData removes every sample record', () => {
  const { ctx, ok } = fresh(true);
  ctx.clearSampleData();
  const b = ok(HQ, 'bootstrap');
  ['Projects', 'Assessments', 'Findings', 'NCRs', 'Escalations', 'Milestones', 'Risks', 'Tasks', 'Weekly'].forEach((t) => assert.strictEqual(b.data[t].length, 0, t));
  assert.strictEqual(b.data.Users.length, 1);
  assert.strictEqual(b.config.sampleData, false);
});

test('daily digest e-mails owners their alerts', () => {
  const { ctx, mock, ok } = fresh(true);
  ctx.dailyDigest();
  assert.strictEqual(mock.mail.length, 0, 'off by default');
  ok(HQ, 'configSave', { config: { digestEnabled: true } });
  ctx.dailyDigest();
  assert.ok(mock.mail.length >= 3);
  assert.ok(mock.mail.every((m) => /^Q-TRACK: \d+ open alert/.test(m.subject)));
  assert.ok(mock.mail.some((m) => m.to === AM_CIVIL));
});

test('audit log is Lead – QA only', () => {
  const { ok, no } = fresh(true);
  ok(HQ, 'save', { table: 'Risks', record: { projectId: ok(HQ, 'bootstrap').data.Projects[0].id, title: 'Audited risk', rating: 'Low' } });
  const log = ok(HQ, 'auditList', { limit: 10 });
  assert.ok(log.length >= 1 && log[0].table === 'Risks' && log[0].action === 'create');
  no(AM_CIVIL, 'auditList', {}, 'DENIED');
});

/* ---------------- run ---------------- */
let failed = 0;
tests.forEach((t) => {
  try { t.fn(); console.log('  ✓ ' + t.name); } catch (e) { failed++; console.log('  ✗ ' + t.name + '\n      ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join('\n      ') : e)); }
});
console.log('\n' + (tests.length - failed) + ' of ' + tests.length + ' passed');
process.exit(failed ? 1 : 0);
