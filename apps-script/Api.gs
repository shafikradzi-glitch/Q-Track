/**
 * The one entry point the browser calls: google.script.run.api(action, payloadJson).
 * Every answer is a JSON string { ok, data } or { ok: false, code, message }.
 */

const ACTIONS = {
  bootstrap: bootstrap_,
  save: save_,
  remove: remove_,
  assessmentSubmit: (p) => assessmentMove_(p, 'submit'),
  assessmentApprove: (p) => assessmentMove_(p, 'approve'),
  assessmentReturn: (p) => assessmentMove_(p, 'return'),
  reportIssue: reportIssue_,
  configSave: configSave_,
  importRows: importRows_,
  auditList: auditList_,
};

function api(action, payloadJson) {
  try {
    const fn = ACTIONS[action];
    if (!fn) throw new AppError('BAD_ACTION', 'Unknown action ' + action);
    const payload = payloadJson ? JSON.parse(payloadJson) : {};
    return JSON.stringify({ ok: true, data: fn(payload) });
  } catch (e) {
    if (!(e instanceof AppError)) console.error(action, e && e.stack);
    return JSON.stringify({ ok: false, code: e.code || 'ERROR', message: e instanceof AppError ? e.message : 'Q-TRACK hit an unexpected problem: ' + (e && e.message) });
  }
}

function loadDb_(tables) {
  const db = {};
  (tables || Object.keys(TABLES)).forEach((t) => { db[t] = readTable_(t); });
  return db;
}

/* ---------------- read ---------------- */

function bootstrap_() {
  const db = loadDb_();
  const user = me_(db.Users);
  const cfg = readConfig_();
  const asOf = todayIso_();
  const data = {};
  Object.keys(TABLES).forEach((t) => { data[t] = visibleRows_(t, db[t], user).map(public_); });

  // The dashboard is built from what this role may see (a viewer sees approved assessments only).
  const seen = {};
  Object.keys(TABLES).forEach((t) => { seen[t] = visibleRows_(t, db[t], user); });
  if (user.role === 'VIEWER') { seen.Findings = db.Findings; seen.NCRs = db.NCRs; seen.Tasks = []; }
  const dash = buildDashboard(seen, asOf, cfg);
  if (user.role === 'VIEWER') dash.alerts = dash.alerts.filter((a) => a.severity === 'Critical' || a.severity === 'High').map((a) => Object.assign({}, a, { owner: '' }));

  const lastChange = Object.keys(TABLES).reduce((best, t) => db[t].reduce((b, r) => (String(r.updatedAt) > String(b.at) ? { at: r.updatedAt, by: r.updatedBy } : b), best), { at: '', by: '' });

  return {
    app: APP,
    me: public_(user),
    roles: ROLES,
    areas: AREAS,
    schema: TABLES,
    configFields: CONFIG_FIELDS,
    config: cfg,
    asOf: asOf,
    tz: tz_(),
    data: data,
    dashboard: dash,
    ownProjects: ownProjectIds_(user, db.Projects),
    lastChange: lastChange,
    sheetUrl: isLead_(user) ? ss_().getUrl() : '',
  };
}

function auditList_(p) {
  const u = me_();
  if (!isLead_(u)) throw new AppError('DENIED', 'The audit log is open to Lead – QA only.');
  const sh = sheetOf_(AUDIT_SHEET);
  const n = sh.getLastRow() - 1;
  if (n < 1) return [];
  const take = Math.min(n, (p && p.limit) || 500);
  return sh.getRange(sh.getLastRow() - take + 1, 1, take, AUDIT_COLUMNS.length).getValues().reverse()
    .map((r) => { const o = {}; AUDIT_COLUMNS.forEach((k, i) => { o[k] = fromCell_(r[i], null, k); }); return o; });
}

/* ---------------- validation ---------------- */

function resolveDefault_(def, u, today) {
  if (def === '$today') return today;
  if (def === '$me') return u.email;
  if (def === '$friday') return fridayOf_(today);
  return def;
}

/** Cleans an incoming record against the schema. Unknown and system fields are dropped. */
function clean_(table, input, before, u, db, today) {
  const t = TABLES[table];
  const out = {};
  const errors = [];
  const users = db.Users.map((x) => String(x.email).toLowerCase());
  const projects = db.Projects.map((x) => x.id);
  t.fields.forEach((f) => {
    if (f.sys) return;
    if (f.leadOnly && !isLead_(u)) { out[f.k] = before ? before[f.k] : f.type === 'bool' ? false : f.type === 'json' ? f.def : ''; return; }
    let v = input.hasOwnProperty(f.k) ? input[f.k] : before ? before[f.k] : resolveDefault_(f.def, u, today);
    if (v === undefined || v === null) v = f.type === 'bool' ? false : f.type === 'json' ? f.def : '';
    switch (f.type) {
      case 'bool': v = v === true || v === 'true'; break;
      case 'number': v = v === '' ? null : Number(v); if (v !== null && isNaN(v)) errors.push(f.label + ' must be a number.'); break;
      case 'json': break;
      default:
        v = String(v).trim();
        if (v.length > (f.type === 'longtext' ? 5000 : 300)) errors.push(f.label + ' is too long.');
    }
    if (f.type === 'date' && v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) errors.push(f.label + ' must be a date (yyyy-mm-dd).');
    if (f.type === 'month' && v && !/^\d{4}-\d{2}$/.test(v)) errors.push(f.label + ' must be a month (yyyy-mm).');
    if (f.type === 'enum' && v !== '' && f.options.indexOf(v) < 0) errors.push(f.label + ': “' + v + '” is not one of the allowed values.');
    if (f.type === 'user' && v) { v = v.toLowerCase(); if (users.indexOf(v) < 0) errors.push(f.label + ': ' + v + ' is not a Q-TRACK user.'); }
    if (f.type === 'project' && v && projects.indexOf(v) < 0) errors.push(f.label + ': unknown project.');
    if (f.req && (v === '' || v === null)) errors.push(f.label + ' is required.');
    out[f.k] = v;
  });
  if (errors.length) throw new AppError('INVALID', errors.join(' '));
  return out;
}

function diffSummary_(table, before, after) {
  if (!before) return 'created';
  const t = TABLES[table];
  const ch = t.fields.filter((f) => JSON.stringify(before[f.k]) !== JSON.stringify(after[f.k])).map((f) => f.k + ': ' + String(JSON.stringify(before[f.k])).slice(0, 80) + ' → ' + String(JSON.stringify(after[f.k])).slice(0, 80));
  return ch.join('; ') || 'no change';
}

/* ---------------- table-specific rules ---------------- */

function hooks_(table, rec, before, u, db) {
  const dupe = (rows, pred) => rows.some((r) => r.id !== rec.id && pred(r));
  if (table === 'Users') {
    rec.email = rec.email.toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(rec.email)) throw new AppError('INVALID', 'Enter a valid e-mail address.');
    if (dupe(db.Users, (r) => String(r.email).toLowerCase() === rec.email)) throw new AppError('INVALID', rec.email + ' already has an account.');
    if (before && before.email.toLowerCase() === String(u.email).toLowerCase() && (rec.role !== 'LEAD' || rec.active === false) && isLead_(u) && db.Users.filter((x) => x.role === 'LEAD' && x.active !== false).length < 2) throw new AppError('INVALID', 'Keep at least one active Lead – QA account.');
  }
  if (table === 'Projects' && dupe(db.Projects, (r) => String(r.code).toLowerCase() === String(rec.code).toLowerCase())) throw new AppError('INVALID', 'Project code ' + rec.code + ' is already used.');
  if (table === 'NCRs' && dupe(db.NCRs, (r) => r.projectId === rec.projectId && String(r.ref).toLowerCase() === String(rec.ref).toLowerCase())) throw new AppError('INVALID', rec.ref + ' is already recorded for this project.');
  if (table === 'NCRs' && rec.status === 'Closed' && !rec.closedDate) throw new AppError('INVALID', 'Give the closed date for a closed NCR / OBS.');
  if (table === 'Reports') {
    if (before && before.state === 'Issued') throw new AppError('LOCKED', 'This report has been issued and is frozen.');
    if (dupe(db.Reports, (r) => r.period === rec.period)) throw new AppError('INVALID', 'A report for ' + rec.period + ' already exists.');
  }
  if (table === 'Assessments') {
    if (before && ['Draft', 'Returned'].indexOf(before.state) < 0 && !(isLead_(u) && before.state === 'Submitted')) throw new AppError('LOCKED', 'This assessment is ' + before.state.toLowerCase() + ' and can no longer be edited.');
    // At review Lead – QA may only moderate; the assessor's ratings and evidence stay as submitted.
    if (before && before.state === 'Submitted') TABLES.Assessments.fields.forEach((f) => { if (f.k !== 'moderatedTo' && f.k !== 'moderationNote') rec[f.k] = before[f.k]; });
    if (dupe(db.Assessments, (r) => r.projectId === rec.projectId && r.period === rec.period)) throw new AppError('INVALID', 'An assessment for this project and period already exists.');
    if (!Array.isArray(rec.evidence)) rec.evidence = [];
    rec.evidence = rec.evidence.slice(0, 10).map((s) => String(s || '').slice(0, 3000));
    rec.overall = overallFromAreas(areaStatuses(rec));
    const why = checkModeration(rec.overall, rec.moderatedTo, rec.moderationNote);
    if (why) throw new AppError('INVALID', why);
    rec.final = rec.moderatedTo || rec.overall;
    if (!before) rec.state = 'Draft';
  }
}

/* ---------------- write ---------------- */

function save_(p) {
  const table = p.table;
  if (!TABLES[table]) throw new AppError('BAD_TABLE', 'Unknown register.');
  return withLock_(() => {
    const db = loadDb_(['Users', 'Projects'].concat(['Users', 'Projects'].indexOf(table) < 0 ? [table] : []));
    const u = me_(db.Users);
    const rows = db[table];
    const today = todayIso_();
    const input = p.record || {};
    const before = input.id ? rows.find((r) => r.id === input.id) : null;
    if (input.id && !before) throw new AppError('NOT_FOUND', 'That record no longer exists. It may have been deleted.');
    if (before && Number(before.rev) !== Number(input.rev)) throw new AppError('CONFLICT', 'Someone else changed this record (' + (before.updatedBy || 'unknown') + ', ' + before.updatedAt + ') after you opened it. Reload it and make your change again.');
    const after = Object.assign({}, before || {}, clean_(table, input, before, u, db, today));
    if (before) TABLES[table].fields.filter((f) => f.sys).forEach((f) => { after[f.k] = before[f.k]; });
    else TABLES[table].fields.filter((f) => f.sys).forEach((f) => { after[f.k] = f.def === undefined ? '' : f.def; });
    const denied = writeDenied_(table, u, before, after, db.Projects);
    if (denied) throw new AppError('DENIED', denied);
    hooks_(table, after, before, u, db);
    const stamp = nowStamp_();
    if (!before) { after.id = nextId_(table, rows); after.createdAt = stamp; after.createdBy = u.email; after.rev = 0; }
    after.rev = Number(after.rev || 0) + 1;
    after.updatedAt = stamp;
    after.updatedBy = u.email;
    after._row = writeRow_(table, after);
    audit_(u.email, before ? 'update' : 'create', table, after.id, diffSummary_(table, before, after));
    return public_(after);
  });
}

function remove_(p) {
  if (!TABLES[p.table]) throw new AppError('BAD_TABLE', 'Unknown register.');
  return withLock_(() => {
    const u = me_();
    const rows = readTable_(p.table);
    const rec = rows.find((r) => r.id === p.id);
    if (!rec) throw new AppError('NOT_FOUND', 'That record no longer exists.');
    if (!canDelete_(p.table, u, rec)) throw new AppError('DENIED', 'Only Lead – QA deletes records. Set the status to Closed or Cancelled instead.');
    if (p.table === 'Assessments' && rec.state === 'Approved') throw new AppError('LOCKED', 'Approved assessments are kept as the record of assurance.');
    if (p.table === 'Reports' && rec.state === 'Issued') throw new AppError('LOCKED', 'Issued reports are kept as the record.');
    deleteRow_(p.table, rec._row);
    audit_(u.email, 'delete', p.table, rec.id, JSON.stringify(public_(rec)).slice(0, 1800));
    return { id: rec.id };
  });
}

function assessmentMove_(p, move) {
  return withLock_(() => {
    const db = loadDb_(['Users', 'Projects', 'Assessments']);
    const u = me_(db.Users);
    const a = db.Assessments.find((r) => r.id === p.id);
    if (!a) throw new AppError('NOT_FOUND', 'Assessment not found.');
    if (Number(a.rev) !== Number(p.rev)) throw new AppError('CONFLICT', 'This assessment changed since you opened it. Reload and try again.');
        const stamp = nowStamp_();
    if (move === 'submit') {
      if (!canSubmitAssessment_(u, a, db.Projects)) throw new AppError('DENIED', 'Only the project’s QA lead or deputy, a Manager or Lead – QA submits an assessment.');
      if (['Draft', 'Returned'].indexOf(a.state) < 0) throw new AppError('LOCKED', 'Only a draft or returned assessment can be submitted.');
      const missing = AREAS.filter((ar, i) => { const s = a['a' + (i + 1)]; return s !== 'N/A' && s !== 'Green' && !String((a.evidence || [])[i] || '').trim(); });
      if (missing.length) throw new AppError('INVALID', 'Give the evidence basis for every area that is not Green or N/A: ' + missing.map((m) => m.n).join(', ') + '.');
      if (!String(a.conclusion || '').trim()) throw new AppError('INVALID', 'Write the overall conclusion before submitting.');
      a.state = 'Submitted'; a.submittedAt = stamp; a.returnNote = '';
    } else {
      if (!isLead_(u)) throw new AppError('DENIED', 'Only Lead – QA approves or returns assessments.');
      if (a.state !== 'Submitted') throw new AppError('LOCKED', 'Only a submitted assessment can be ' + (move === 'approve' ? 'approved' : 'returned') + '.');
      if (move === 'approve') {
        a.state = 'Approved'; a.approvedBy = u.email; a.approvedAt = stamp; a.final = a.moderatedTo || a.overall;
      } else {
        if (!p.note || String(p.note).trim().length < 5) throw new AppError('INVALID', 'Say what needs to change.');
        a.state = 'Returned'; a.returnNote = String(p.note).slice(0, 1000);
      }
    }
    a.rev = Number(a.rev) + 1; a.updatedAt = stamp; a.updatedBy = u.email;
    writeRow_('Assessments', a);
    audit_(u.email, move, 'Assessments', a.id, 'state → ' + a.state + (a.returnNote ? ' (' + a.returnNote + ')' : ''));
    return public_(a);
  });
}

function reportIssue_(p) {
  return withLock_(() => {
    const db = loadDb_();
    const u = me_(db.Users);
    if (!isLead_(u)) throw new AppError('DENIED', 'Only Lead – QA issues the monthly report.');
    const r = db.Reports.find((x) => x.id === p.id);
    if (!r) throw new AppError('NOT_FOUND', 'Report not found.');
    if (r.state === 'Issued') throw new AppError('LOCKED', 'Already issued.');
    if (Number(r.rev) !== Number(p.rev)) throw new AppError('CONFLICT', 'This report changed since you opened it. Reload and try again.');
    if (!r.overall || !String(r.conclusion || '').trim()) throw new AppError('INVALID', 'Set the overall status and conclusion before issuing.');
    const end = shiftPeriod_(r.period, 1) + '-01';
    const asOf = addDays_(end, -1) < todayIso_() ? addDays_(end, -1) : todayIso_();
    const dash = buildDashboard(db, asOf, readConfig_());
    r.snapshot = {
      asOf: asOf,
      heat: dash.heat, counts: dash.counts, coverage: dash.coverage,
      programmes: dash.programmes.map((x) => ({ programme: x.programme, overall: x.overall, ncr: x.ncr, decisions: x.decisions })),
      monthly: dash.monthly,
      risks: db.Risks.filter((x) => x.status === 'Open').map(public_),
      findings: db.Findings.filter((f) => ['Closed', 'Verified effective'].indexOf(f.status) < 0 && (f.severity === 'Critical' || f.severity === 'Major')).map(public_),
      escalations: db.Escalations.filter((e) => e.status === 'Open').map(public_),
      projects: db.Projects.map((x) => ({ id: x.id, code: x.code, name: x.name, programme: x.programme })),
    };
    const stamp = nowStamp_();
    r.state = 'Issued'; r.issuedBy = u.email; r.issuedAt = stamp;
    r.rev = Number(r.rev) + 1; r.updatedAt = stamp; r.updatedBy = u.email;
    writeRow_('Reports', r);
    audit_(u.email, 'issue', 'Reports', r.id, 'issued ' + r.period);
    return public_(r);
  });
}

function configSave_(p) {
  return withLock_(() => {
    const u = me_();
    if (!isLead_(u)) throw new AppError('DENIED', 'Only Lead – QA changes settings.');
    const cfg = readConfig_();
    CONFIG_FIELDS.forEach((f) => {
      if (!(f.k in (p.config || {}))) return;
      const v = p.config[f.k];
      cfg[f.k] = f.type === 'bool' ? v === true : f.type === 'number' ? Math.max(0, Number(v) || CONFIG_DEFAULTS[f.k]) : String(v).slice(0, 200);
    });
    if (!(cfg.ncrBand1 < cfg.ncrBand2 && cfg.ncrBand2 < cfg.ncrBand3)) throw new AppError('INVALID', 'The NCR ageing bands must increase (for example 30, 60, 90).');
    writeConfig_(cfg);
    audit_(u.email, 'config', CONFIG_SHEET, '', JSON.stringify(cfg));
    return cfg;
  });
}

/**
 * Bulk load rows into a register. dryRun returns what would happen; commit writes all or nothing.
 * Rows are objects keyed by field key or field label.
 */
function importRows_(p) {
  const table = p.table;
  if (['Projects', 'NCRs', 'Milestones', 'Findings', 'Risks', 'Users'].indexOf(table) < 0) throw new AppError('BAD_TABLE', 'This register cannot be imported.');
  const run = () => {
    const db = loadDb_(['Users', 'Projects'].concat(['Users', 'Projects'].indexOf(table) < 0 ? [table] : []));
    const u = me_(db.Users);
    if (!isLead_(u) && u.role !== 'CLERK') throw new AppError('DENIED', 'Imports are run by Lead – QA or the admin clerk.');
    const t = TABLES[table];
    const byLabel = {};
    t.fields.forEach((f) => { byLabel[f.k.toLowerCase()] = f.k; byLabel[f.label.toLowerCase()] = f.k; });
    const codeToId = {};
    db.Projects.forEach((x) => { codeToId[String(x.code).toLowerCase()] = x.id; codeToId[x.id.toLowerCase()] = x.id; });
    const today = todayIso_();
    const results = [];
    const staged = db[table].slice();
    (p.rows || []).slice(0, 2000).forEach((raw, i) => {
      const rec = {};
      Object.keys(raw).forEach((h) => { const k = byLabel[String(h).trim().toLowerCase()]; if (k) rec[k] = raw[h]; });
      if (rec.projectId) rec.projectId = codeToId[String(rec.projectId).trim().toLowerCase()] || rec.projectId;
      try {
        const after = clean_(table, rec, null, u, db, today);
        TABLES[table].fields.filter((f) => f.sys).forEach((f) => { after[f.k] = f.def === undefined ? '' : f.def; });
        const denied = writeDenied_(table, u, null, after, db.Projects);
        if (denied) throw new AppError('DENIED', denied);
        const dbView = Object.assign({}, db); dbView[table] = staged;
        hooks_(table, after, null, u, dbView);
        after.id = nextId_(table, staged);
        staged.push(after);
        results.push({ row: i + 2, ok: true, id: after.id, rec: after });
      } catch (e) {
        results.push({ row: i + 2, ok: false, message: e.message });
      }
    });
    const bad = results.filter((r) => !r.ok);
    if (!p.commit || bad.length) return { committed: false, total: results.length, errors: bad, preview: results.filter((r) => r.ok).slice(0, 20).map((r) => r.rec) };
    const stamp = nowStamp_();
    const sh = sheetOf_(table);
    const head = headOf_(table);
    const fm = fieldMap_(table);
    const out = results.map((r) => {
      const rec = Object.assign(r.rec, { rev: 1, createdAt: stamp, createdBy: u.email, updatedAt: stamp, updatedBy: u.email });
      return head.map((h) => toCell_(rec[h], fm[h]));
    });
    if (out.length) sh.getRange(sh.getLastRow() + 1, 1, out.length, head.length).setNumberFormat('@').setValues(out);
    audit_(u.email, 'import', table, '', out.length + ' rows');
    return { committed: true, total: out.length, errors: [] };
  };
  return p.commit ? withLock_(run) : run();
}
