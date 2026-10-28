/**
 * One-time setup and sample data. Run setup() once from the Apps Script editor
 * (or Q-TRACK → Set up or repair tabs in the Sheet). It is safe to run again.
 */

function setup() {
  const ss = ss_();
  PropertiesService.getScriptProperties().setProperty('QTRACK_SHEET_ID', ss.getId());
  Object.keys(TABLES).forEach((t) => {
    const sh = ss.getSheetByName(t) || ss.insertSheet(t);
    headOf_(t);
    sh.getRange(1, 1, Math.max(sh.getMaxRows(), 2), sh.getMaxColumns()).setNumberFormat('@');
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, sh.getLastColumn()).setFontWeight('bold').setBackground('#0B2A6F').setFontColor('#FFFFFF');
  });
  if (!ss.getSheetByName(CONFIG_SHEET)) writeConfig_(CONFIG_DEFAULTS);
  const audit = ss.getSheetByName(AUDIT_SHEET) || ss.insertSheet(AUDIT_SHEET);
  if (audit.getLastRow() === 0) audit.getRange(1, 1, 1, AUDIT_COLUMNS.length).setValues([AUDIT_COLUMNS]).setFontWeight('bold');
  audit.setFrozenRows(1);
  const blank = ss.getSheetByName('Sheet1');
  if (blank && blank.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(blank);

  // The person running setup becomes the first Head – QA.
  const email = String(Session.getEffectiveUser().getEmail() || '').toLowerCase();
  const users = readTable_('Users');
  if (email && !users.some((u) => String(u.email).toLowerCase() === email)) {
    const stamp = nowStamp_();
    writeRow_('Users', { id: nextId_('Users', users), email: email, name: email.split('@')[0], code: 'HQ', role: 'HQ', title: 'Head of QA', active: true, rev: 1, createdAt: stamp, createdBy: email, updatedAt: stamp, updatedBy: email });
    audit_(email, 'setup', 'Users', '', 'first Head – QA account');
  }
  notify_('Q-TRACK is set up. Next: Deploy → New deployment → Web app (Execute as: Me; Who has access: Anyone within your organisation).');
}

function notify_(msg) {
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { console.log(msg); }
}

/* ---------------- sample data ---------------- */

/**
 * Illustrative records for trying Q-TRACK. Every project code starts with DEMO- and every
 * sample person has an @sample.example address, so clearSampleData() can remove them cleanly.
 * Dates are relative to today so the alerts and charts look current.
 */
function sampleRecords_(today, hqEmail) {
  const d = (n) => addDays_(today, n);
  const per = (n) => shiftPeriod_(periodOf_(today), n);
  const U = (k) => k + '@sample.example';
  const users = [
    { email: U('am.civil'), name: 'Aina Rahman (sample)', code: 'S1', role: 'AM', title: 'QA Assistant Manager — Civil', active: true },
    { email: U('am.systems'), name: 'Daniel Lim (sample)', code: 'R1', role: 'AM', title: 'QA Assistant Manager — Systems', active: true },
    { email: U('am.buildings'), name: 'Farid Hassan (sample)', code: 'I2', role: 'AM', title: 'QA Assistant Manager — Buildings, M&E, IT', active: true },
    { email: U('clerk'), name: 'Siti Noor (sample)', code: 'C1', role: 'CLERK', title: 'Admin clerk', active: true },
    { email: U('viewer'), name: 'Management viewer (sample)', code: 'V1', role: 'VIEWER', title: 'Head of Department, Standard & Compliance', active: true },
  ];
  const projects = [
    { code: 'DEMO-PML', name: 'SAMPLE New line — civil packages and STC', programme: 'PML', category: 'New line', tier: '1', tierStatus: 'Provisional', stage: 'S4 Construction', status: 'Active', lead: U('am.civil'), deputy: '', contractor: 'Sample Contractor P', pqp: 'Approved', startDate: d(-700), endDate: d(900) },
    { code: 'DEMO-RTS', name: 'SAMPLE Cross-border link — readiness', programme: 'RTS', category: 'Systems', tier: '1', tierStatus: 'Approved', stage: 'S5 Testing & commissioning', status: 'Active', lead: U('am.systems'), deputy: U('am.civil'), contractor: 'Sample Systems JV', pqp: 'Approved', startDate: d(-900), endDate: d(120) },
    { code: 'DEMO-A', name: 'SAMPLE Signalling interlocking upgrade', programme: 'L4/L5', category: 'Systems', tier: '1', tierStatus: 'Approved', stage: 'S4 Construction', status: 'Active', lead: U('am.systems'), deputy: '', contractor: 'Sample Contractor A', pqp: 'In review', startDate: d(-300), endDate: d(200) },
    { code: 'DEMO-B', name: 'SAMPLE Station building services refurbishment', programme: 'L4/L5', category: 'Refurbishment', tier: '2', tierStatus: 'Approved', stage: 'S4 Construction', status: 'Active', lead: U('am.buildings'), deputy: '', contractor: 'Sample Contractor B', pqp: 'Approved', startDate: d(-200), endDate: d(-12) },
    { code: 'DEMO-C', name: 'SAMPLE Station signage replacement', programme: 'L4/L5', category: 'Supply', tier: '3', tierStatus: 'Provisional', stage: 'S3 Procurement', status: 'Active', lead: U('am.buildings'), deputy: '', contractor: '', pqp: 'Not submitted', startDate: d(-40), endDate: d(160) },
  ];
  const A = (code, period, areas, extra) => {
    const o = { projectCode: code, period: period, confidence: 'Moderate', conclusion: '', reasons: '', limitations: '', evidence: [] };
    areas.split('').forEach((c, i) => {
      o['a' + (i + 1)] = { G: 'Green', A: 'Amber', R: 'Red', '?': 'Grey', '-': 'N/A' }[c];
      o.evidence[i] = c === 'G' || c === '-' ? '' : 'SAMPLE evidence for area ' + (i + 1) + ': see linked findings and NCR references.';
    });
    return Object.assign(o, extra || {});
  };
  const ok = (by, at) => ({ state: 'Approved', approvedBy: by, approvedAt: at, submittedAt: at });
  const assessments = [
    A('DEMO-PML', per(-2), 'GAAAGGGAG-', Object.assign({ conclusion: 'SAMPLE: QC hold points mostly respected; NCR ageing building.', reasons: 'SAMPLE reasons.', limitations: 'SAMPLE: contractor register 6 days old.' }, ok(hqEmail, d(-40) + ' 10:00'))),
    A('DEMO-PML', per(-1), 'A??R?GGAG-', Object.assign({ conclusion: 'SAMPLE: the same workmanship defect returned after corrective action; CAPA is not effective.', reasons: 'SAMPLE: (1) 5 of 14 re-checked lots failed; (2) 61% of open NCRs past expected; (3) RFI backlog at compilation.', limitations: 'SAMPLE: QA and QC evidence largely not provided (Grey).' }, ok(hqEmail, d(-22) + ' 16:20'))),
    A('DEMO-RTS', per(-1), 'GGAG?GGGAA', Object.assign({ confidence: 'High', conclusion: 'SAMPLE: controls largely operating; V&V on one package behind plan.', reasons: 'SAMPLE reasons.', limitations: 'SAMPLE: V&V figures cover one week only.' }, ok(hqEmail, d(-21) + ' 11:05'))),
    A('DEMO-A', per(-2), 'GGGGGGGGG-', Object.assign({ confidence: 'High', conclusion: 'SAMPLE: controls operating.' }, ok(hqEmail, d(-45) + ' 09:30'))),
    A('DEMO-A', per(-1), 'GARAGGGAG-', Object.assign({ conclusion: 'SAMPLE: hold points released without inspection records.', reasons: 'SAMPLE: SQ-001 hold points; test sheet signed before witness.', limitations: 'SAMPLE.' }, ok(hqEmail, d(-20) + ' 15:10'))),
    A('DEMO-B', per(-3), 'GGGGGGGGG-', Object.assign({ confidence: 'High', conclusion: 'SAMPLE: controls operating.' }, ok(hqEmail, d(-75) + ' 10:00'))),
    A('DEMO-RTS', per(0), 'GGAGAGGGAA', { state: 'Draft', conclusion: 'SAMPLE draft for this month.' }),
  ];
  const findings = [
    { projectCode: 'DEMO-A', title: 'SAMPLE hold points released without inspection records', severity: 'Major', area: '3', responsibleParty: 'Sample Contractor A', raisedDate: d(-30), responseDue: d(-9), status: 'Open', systemic: true, qaOwner: U('am.systems'), capaRef: 'CA-NCR-0142', description: 'SAMPLE: three hold points released on the strength of verbal confirmation.' },
    { projectCode: 'DEMO-RTS', title: 'SAMPLE test sheet signed before witness', severity: 'Major', area: '3', responsibleParty: 'Sample Systems JV', raisedDate: d(-25), responseDue: d(-4), status: 'Response received', systemic: true, qaOwner: U('am.systems'), capaRef: 'SJV-NCR-311' },
    { projectCode: 'DEMO-PML', title: 'SAMPLE inspection hold point skipped on pier cap pour', severity: 'Critical', area: '3', responsibleParty: 'Sample Contractor P', raisedDate: d(-18), responseDue: d(3), status: 'Open', systemic: true, qaOwner: U('am.civil'), capaRef: 'P-NCR-0089' },
    { projectCode: 'DEMO-PML', title: 'SAMPLE CAPA for repeat workmanship NCRs not effective', severity: 'Major', area: '5', responsibleParty: 'Sample Contractor P', raisedDate: d(-12), responseDue: d(9), status: 'Implemented', effectivenessDue: d(4), qaOwner: U('am.civil') },
    { projectCode: 'DEMO-B', title: 'SAMPLE commissioning records incomplete', severity: 'Minor', area: '9', responsibleParty: 'Sample Contractor B', raisedDate: d(-50), responseDue: d(-30), status: 'Verified effective', effectivenessDue: d(-10), effectivenessResult: 'Effective', qaOwner: U('am.buildings') },
  ];
  const cats = ['Workmanship', 'Workmanship', 'Document / record', 'Inspection / supervision missed', 'Material', 'Safety control', 'Method', 'Workmanship', 'Safety control', 'Document / record'];
  const ncrs = [];
  const mk = (code, n, contractor, opts) => {
    for (let i = 0; i < n; i++) {
      const raised = d(-((i * 37) % 330) - 5);
      const expected = addDays_(raised, 30);
      const closed = i % 3 === 0 ? addDays_(raised, 20 + (i % 5) * 9) : '';
      const isClosed = closed && closed <= today;
      ncrs.push({
        projectCode: code, ref: code.replace('DEMO-', '') + '-NCR-' + String(i + 1).padStart(4, '0'), type: i % 4 === 3 ? 'OBS' : 'NCR',
        category: cats[(i + opts.shift) % cats.length], contractor: contractor, raisedDate: raised, expectedDate: expected,
        closedDate: isClosed ? closed : '', status: isClosed ? 'Closed' : 'Open', awaitingResponse: !isClosed && i % 5 === 1,
        repeat: !!opts.repeat && !isClosed && i % 6 === 0, capaCheck: isClosed ? (i % 4 === 0 && opts.weak ? 'Not effective' : 'Effective') : 'Not checked',
        title: 'SAMPLE ' + cats[(i + opts.shift) % cats.length].toLowerCase() + ' non-conformance',
      });
    }
  };
  mk('DEMO-PML', 26, 'Sample Contractor P', { shift: 0, repeat: true, weak: true });
  mk('DEMO-RTS', 22, 'Sample Systems JV', { shift: 5 });
  mk('DEMO-A', 9, 'Sample Contractor A', { shift: 2 });
  mk('DEMO-B', 5, 'Sample Contractor B', { shift: 3 });
  const escalations = [
    { projectCode: 'DEMO-PML', level: 'C', ask: 'SAMPLE: Require an independent root-cause review of the repeat workmanship defects before further lots are released.', why: 'SAMPLE: the same defect returned on 5 of 14 lots re-checked.', owner: 'Project Director, PML (sample)', hqAction: 'Verify the review scope and re-check the next lots.', raisedDate: d(-10), dueDate: d(4), status: 'Open', stopWork: true, conditions: 'Independent root-cause review accepted\nRe-check of all lots cast since the first NCR\nRevised method statement approved' },
    { projectCode: 'DEMO-PML', level: 'B', ask: 'SAMPLE: Agree a weekly RFI backlog reduction target with the contractor.', why: 'SAMPLE: 158 RFIs wait at compilation.', owner: 'Package Manager, PML (sample)', hqAction: 'Monitor weekly; raise a finding if missed twice.', raisedDate: d(-16), dueDate: d(-2), status: 'Open' },
    { projectCode: 'DEMO-RTS', level: 'B', ask: 'SAMPLE: Approve a V&V recovery plan for PKG 6 with weekly targets.', why: 'SAMPLE: closures at 61% of the weekly plan.', owner: 'Project Director, RTS (sample)', hqAction: 'Track closures against the plan weekly.', raisedDate: d(-6), dueDate: d(8), status: 'Open' },
    { projectCode: 'DEMO-A', level: 'A', ask: 'SAMPLE: Submit the revised hold-point register.', owner: 'Package Manager, DEMO-A (sample)', raisedDate: d(-20), dueDate: d(-12), status: 'Responded', response: 'SAMPLE: register received; under review.' },
  ];
  const milestones = [
    { projectCode: 'DEMO-RTS', item: 'SAMPLE PKG 6 readiness statement', critical: true, baseline: d(30), forecast: d(44), note: 'Forecast moved two weeks.' },
    { projectCode: 'DEMO-RTS', item: 'SAMPLE PKG 4 CPC', critical: true, baseline: d(51), forecast: d(51) },
    { projectCode: 'DEMO-RTS', item: 'SAMPLE PKG 2 CPC', critical: true, baseline: d(-14), actual: d(-16) },
    { projectCode: 'DEMO-PML', item: 'SAMPLE Pier cap zone 3 complete', critical: true, baseline: d(23), forecast: d(37), note: 'Rework of failed lots.' },
    { projectCode: 'DEMO-PML', item: 'SAMPLE Design review gate 2', critical: true, baseline: d(48) },
    { projectCode: 'DEMO-B', item: 'SAMPLE Handover to operations', critical: true, baseline: d(-12), note: 'On-going past end date.' },
    { projectCode: 'DEMO-A', item: 'SAMPLE Factory acceptance test', critical: true, baseline: d(33), forecast: d(33) },
  ];
  const risks = [
    { projectCode: 'DEMO-PML', title: 'SAMPLE repeat workmanship defects after corrective action', rating: 'Critical', trend: 'Worsening', control: 'Inadequate', response: 'Independent root-cause review; re-check every lot.', owner: U('am.civil'), status: 'Open' },
    { projectCode: 'DEMO-PML', title: 'SAMPLE RFI compilation backlog delays verification', rating: 'High', trend: 'Stable', control: 'Partly adequate', response: 'Weekly backlog target with the contractor.', owner: U('am.civil'), status: 'Open' },
    { projectCode: 'DEMO-RTS', title: 'SAMPLE PKG 6 V&V behind plan', rating: 'High', trend: 'Worsening', control: 'Partly adequate', response: 'Recovery plan from the package manager.', owner: U('am.systems'), status: 'Open' },
    { projectCode: 'DEMO-A', title: 'SAMPLE hold points released without records', rating: 'High', trend: 'Worsening', control: 'Inadequate', response: 'Direct project QC resourcing review.', owner: U('am.systems'), status: 'Open' },
    { projectCode: 'DEMO-B', title: 'SAMPLE handover records incomplete', rating: 'Medium', trend: 'Improving', control: 'Partly adequate', response: 'Handover checklist tracked weekly.', owner: U('am.buildings'), status: 'Open' },
  ];
  const tasks = [
    { title: 'SAMPLE NCR closure verification log — this month', projectCode: 'DEMO-RTS', assignee: U('am.systems'), due: d(-3), priority: 'High', status: 'In progress', func: 'L4-F15' },
    { title: 'SAMPLE pre-award QA review of RFP package 12', projectCode: 'DEMO-C', assignee: U('am.buildings'), due: d(6), priority: 'Normal', status: 'Not started', func: 'L4-F05' },
    { title: 'SAMPLE monthly assessment DEMO-PML', projectCode: 'DEMO-PML', assignee: U('am.civil'), due: d(2), priority: 'High', status: 'Submitted', func: 'L4-F02' },
    { title: 'SAMPLE update the L4/L5 register load', projectCode: '', assignee: U('clerk'), due: d(1), priority: 'Normal', status: 'In progress', func: 'L4-F21' },
  ];
  const weekly = [
    { weekEnd: fridayOf_(d(-7)), projectCode: 'DEMO-PML', func: 'L4-F15', exceptions: 'SAMPLE: two further lots failed re-check; escalated at Level C.', escalate: true, author: U('am.civil') },
    { weekEnd: fridayOf_(d(-7)), projectCode: 'DEMO-RTS', func: 'L4-F14', exceptions: 'SAMPLE: PKG 6 V&V at 61% of weekly plan.', escalate: false, author: U('am.systems') },
  ];
  return { users: users, projects: projects, assessments: assessments, findings: findings, ncrs: ncrs, escalations: escalations, milestones: milestones, risks: risks, tasks: tasks, weekly: weekly };
}

/** Writes the sample records into the Sheet. */
function loadSampleData() {
  setup();
  withLock_(() => {
    const today = todayIso_();
    const hq = String(Session.getEffectiveUser().getEmail() || '').toLowerCase();
    const s = sampleRecords_(today, hq);
    const stamp = nowStamp_();
    const sys = (by) => ({ rev: 1, createdAt: stamp, createdBy: by || hq, updatedAt: stamp, updatedBy: by || hq });
    const put = (table, list) => {
      const rows = readTable_(table);
      const head = headOf_(table), fm = fieldMap_(table);
      const out = list.map((r) => { const rec = Object.assign({}, r, { id: nextId_(table, rows) }); rows.push(rec); return rec; });
      if (!out.length) return out;
      sheetOf_(table).getRange(sheetOf_(table).getLastRow() + 1, 1, out.length, head.length).setNumberFormat('@').setValues(out.map((r) => head.map((h) => toCell_(r[h], fm[h]))));
      return out;
    };
    const have = readTable_('Users').map((u) => String(u.email).toLowerCase());
    put('Users', s.users.filter((u) => have.indexOf(u.email) < 0).map((u) => Object.assign(u, sys())));
    const existing = readTable_('Projects').map((p) => p.code);
    put('Projects', s.projects.filter((p) => existing.indexOf(p.code) < 0).map((p) => Object.assign(p, sys())));
    const pid = {};
    readTable_('Projects').forEach((p) => { pid[p.code] = p.id; });
    const link = (r) => { const o = Object.assign({}, r, { projectId: r.projectCode ? pid[r.projectCode] : '' }); delete o.projectCode; return o; };
    put('Assessments', s.assessments.map((a) => { const o = link(a); o.overall = overallFromAreas(areaStatuses(o)); o.final = o.overall; o.state = o.state || 'Draft'; return Object.assign(o, sys(a.state === 'Approved' ? hq : undefined)); }));
    put('Findings', s.findings.map((r) => Object.assign(link(r), sys(r.qaOwner))));
    put('NCRs', s.ncrs.map((r) => Object.assign(link(r), sys('clerk@sample.example'))));
    put('Escalations', s.escalations.map((r) => Object.assign(link(r), sys())));
    put('Milestones', s.milestones.map((r) => Object.assign(link(r), sys())));
    put('Risks', s.risks.map((r) => Object.assign(link(r), sys(r.owner))));
    put('Tasks', s.tasks.map((r) => Object.assign(link(r), sys())));
    put('Weekly', s.weekly.map((r) => { const o = link(r); const by = o.author; delete o.author; return Object.assign(o, sys(by)); }));
    const cfg = readConfig_(); cfg.sampleData = true; writeConfig_(cfg);
    audit_(hq, 'sample', '', '', 'sample data loaded');
  });
  notify_('Sample data loaded. Every sample project code starts with DEMO-. Use Q-TRACK → Remove sample data before going live.');
}

/** Removes every sample record (projects coded DEMO-…, people @sample.example and everything linked to them). */
function clearSampleData() {
  withLock_(() => {
    const demo = readTable_('Projects').filter((p) => /^DEMO-/i.test(p.code)).map((p) => p.id);
    Object.keys(TABLES).forEach((t) => {
      const rows = readTable_(t);
      const kill = rows.filter((r) => (t === 'Projects' ? demo.indexOf(r.id) >= 0 : t === 'Users' ? /@sample\.example$/i.test(r.email) : r.projectId && demo.indexOf(r.projectId) >= 0) || (t === 'Tasks' && /@sample\.example$/i.test(r.assignee)) || (t === 'Weekly' && /@sample\.example$/i.test(r.createdBy)));
      kill.map((r) => r._row).sort((a, b) => b - a).forEach((n) => deleteRow_(t, n));
    });
    const cfg = readConfig_(); cfg.sampleData = false; writeConfig_(cfg);
    audit_(currentEmail_() || String(Session.getEffectiveUser().getEmail()), 'sample', '', '', 'sample data removed');
  });
  notify_('Sample data removed.');
}
