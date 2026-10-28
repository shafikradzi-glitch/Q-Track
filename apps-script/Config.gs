/**
 * Q-TRACK (Google Workspace edition) — configuration and data model.
 *
 * Every register is one tab in the backing Google Sheet. The field list below is the
 * single source of truth: setup() creates the tabs from it, the server validates every
 * write against it, and the browser builds its forms from it.
 */

const APP = {
  name: 'Q-TRACK',
  edition: 'Google Workspace edition',
  version: '2.0.0',
  tagline: 'Track Performance. Assure Quality. Drive Results.',
};

const ROLES = {
  HQ: 'Head – QA',
  AM: 'Assistant Manager',
  CLERK: 'Admin clerk',
  VIEWER: 'Management (read-only)',
};

/** The ten assurance areas of the Level 4 Reporting & Monitoring Mechanism (RMM §9.1). */
const AREAS = [
  { n: 1, short: 'PQP', title: 'Project QMS / PQP' },
  { n: 2, short: 'QA eff.', title: 'Project QA effectiveness' },
  { n: 3, short: 'QC eff.', title: 'Project QC effectiveness' },
  { n: 4, short: 'NCR', title: 'NCR management' },
  { n: 5, short: 'CAPA', title: 'CAPA effectiveness' },
  { n: 6, short: 'Contr. QMS', title: 'Contractor QMS' },
  { n: 7, short: 'Indicators', title: 'Indicator reliability' },
  { n: 8, short: 'Risks', title: 'Quality risks' },
  { n: 9, short: 'Records', title: 'Records' },
  { n: 10, short: 'T&C / HO', title: 'T&C / handover' },
];

const AREA_STATUS = ['Green', 'Amber', 'Red', 'Grey', 'N/A'];

const PROGRAMMES = ['PML', 'RTS', 'L4/L5', 'Other'];

/** Defaults for the Config tab. Thresholds stay Proposed until Head – QA approves them (RMM Annex A). */
const CONFIG_DEFAULTS = {
  orgName: 'MRT Corporation — HQ QA Unit',
  coverageTarget: 90,
  capaTarget: 80,
  ncrBand1: 30,
  ncrBand2: 60,
  ncrBand3: 90,
  thresholdsApproved: false,
  digestEnabled: false,
  sampleData: false,
};

const CONFIG_FIELDS = [
  { k: 'orgName', label: 'Organisation name shown in the header', type: 'text' },
  { k: 'coverageTarget', label: 'Assurance coverage target (%)', type: 'number' },
  { k: 'capaTarget', label: 'CAPA verified effective: Green when the Wilson lower bound reaches (%)', type: 'number' },
  { k: 'ncrBand1', label: 'NCR ageing band 1 (days past expected completion)', type: 'number' },
  { k: 'ncrBand2', label: 'NCR ageing band 2 (days)', type: 'number' },
  { k: 'ncrBand3', label: 'NCR ageing band 3 (days)', type: 'number' },
  { k: 'thresholdsApproved', label: 'Thresholds approved by Head – QA (removes the “Proposed” labels)', type: 'bool' },
  { k: 'digestEnabled', label: 'Send each person a daily e-mail of their open alerts', type: 'bool' },
];

/**
 * Field types: text, longtext, enum, date, month, number, bool, user (an e-mail from Users),
 * project (a Projects id), json (stored as JSON text; edited by a dedicated screen).
 * sys: true marks fields only the server sets (workflow fields).
 */
const TABLES = {
  Users: {
    title: 'Users',
    prefix: 'U',
    pad: 3,
    describe: 'People who can sign in, their role and reporting code.',
    fields: [
      { k: 'email', label: 'Google account e-mail', type: 'text', req: true, list: true },
      { k: 'name', label: 'Name', type: 'text', req: true, list: true },
      { k: 'code', label: 'Short code', type: 'text', list: true, hint: 'For example HQ, S1, R1' },
      { k: 'role', label: 'Role', type: 'enum', options: Object.keys(ROLES), labels: ROLES, req: true, list: true },
      { k: 'title', label: 'Designation', type: 'text', list: true },
      { k: 'active', label: 'Can sign in', type: 'bool', def: true, list: true },
    ],
  },

  Projects: {
    title: 'Project register',
    prefix: 'PRJ',
    pad: 3,
    describe: 'Projects under HQ QA assurance, with tier, stage and allocated QA lead.',
    fields: [
      { k: 'code', label: 'Project code', type: 'text', req: true, list: true },
      { k: 'name', label: 'Project name', type: 'text', req: true, list: true },
      { k: 'programme', label: 'Programme', type: 'enum', options: PROGRAMMES, req: true, list: true },
      { k: 'category', label: 'Category', type: 'enum', options: ['New line', 'Systems', 'Refurbishment', 'Civil works', 'Maintenance', 'Supply', 'Other'] },
      { k: 'tier', label: 'Assurance tier', type: 'enum', options: ['1', '2', '3'], req: true, list: true, hint: 'Tier 1 assessed monthly, Tier 2 quarterly, Tier 3 at milestones' },
      { k: 'tierStatus', label: 'Tier status', type: 'enum', options: ['Provisional', 'Approved'], def: 'Provisional' },
      { k: 'stage', label: 'Lifecycle stage', type: 'enum', options: ['S0 Initiation', 'S1 Feasibility', 'S2 Planning & design', 'S3 Procurement', 'S4 Construction', 'S5 Testing & commissioning', 'S6 Handover', 'S7 Post-project review'] },
      { k: 'status', label: 'Status', type: 'enum', options: ['Active', 'On hold', 'Pending award', 'Completed', 'Terminated'], def: 'Active', req: true, list: true },
      { k: 'lead', label: 'QA lead', type: 'user', list: true },
      { k: 'deputy', label: 'QA deputy', type: 'user' },
      { k: 'contractor', label: 'Main contractor', type: 'text' },
      { k: 'pqp', label: 'Project Quality Plan', type: 'enum', options: ['Approved', 'In review', 'Not submitted', 'N/A'], def: 'Not submitted', list: true },
      { k: 'startDate', label: 'Start date', type: 'date' },
      { k: 'endDate', label: 'Planned end date', type: 'date' },
      { k: 'notes', label: 'Notes', type: 'longtext' },
    ],
  },

  Assessments: {
    title: 'Level 4 assessments',
    prefix: 'PA',
    pad: 5,
    describe: 'HQ QA’s independent conclusion on each project against the ten assurance areas.',
    fields: [
      { k: 'projectId', label: 'Project', type: 'project', req: true, list: true },
      { k: 'period', label: 'Period', type: 'month', req: true, list: true },
      { k: 'a1', label: AREAS[0].title, type: 'enum', options: AREA_STATUS, def: 'Grey' },
      { k: 'a2', label: AREAS[1].title, type: 'enum', options: AREA_STATUS, def: 'Grey' },
      { k: 'a3', label: AREAS[2].title, type: 'enum', options: AREA_STATUS, def: 'Grey' },
      { k: 'a4', label: AREAS[3].title, type: 'enum', options: AREA_STATUS, def: 'Grey' },
      { k: 'a5', label: AREAS[4].title, type: 'enum', options: AREA_STATUS, def: 'Grey' },
      { k: 'a6', label: AREAS[5].title, type: 'enum', options: AREA_STATUS, def: 'Grey' },
      { k: 'a7', label: AREAS[6].title, type: 'enum', options: AREA_STATUS, def: 'Grey' },
      { k: 'a8', label: AREAS[7].title, type: 'enum', options: AREA_STATUS, def: 'Grey' },
      { k: 'a9', label: AREAS[8].title, type: 'enum', options: AREA_STATUS, def: 'Grey' },
      { k: 'a10', label: AREAS[9].title, type: 'enum', options: AREA_STATUS, def: 'Grey' },
      { k: 'evidence', label: 'Evidence basis by area', type: 'json', def: [] },
      { k: 'confidence', label: 'Confidence', type: 'enum', options: ['High', 'Moderate', 'Limited'], def: 'Moderate' },
      { k: 'conclusion', label: 'Overall conclusion (HQ QA assessment)', type: 'longtext' },
      { k: 'reasons', label: 'Three principal reasons (facts)', type: 'longtext' },
      { k: 'limitations', label: 'Limitations and uncertainty', type: 'longtext' },
      { k: 'validator', label: 'Independent validator', type: 'user' },
      { k: 'moderatedTo', label: 'Moderated overall (Head – QA, one level)', type: 'enum', options: ['', 'Green', 'Amber', 'Red'], hqOnly: true },
      { k: 'moderationNote', label: 'Moderation rationale', type: 'longtext', hqOnly: true },
      { k: 'overall', label: 'Overall (worst area)', type: 'text', sys: true, list: true },
      { k: 'final', label: 'Final overall', type: 'text', sys: true },
      { k: 'state', label: 'State', type: 'text', sys: true, def: 'Draft', list: true },
      { k: 'submittedAt', label: 'Submitted', type: 'text', sys: true },
      { k: 'approvedBy', label: 'Approved by', type: 'text', sys: true },
      { k: 'approvedAt', label: 'Approved', type: 'text', sys: true },
      { k: 'returnNote', label: 'Returned with', type: 'text', sys: true },
    ],
  },

  Findings: {
    title: 'Findings & CAPA refs',
    prefix: 'F',
    pad: 5,
    describe: 'Independent HQ QA findings. The responsible party owns the corrective action; QA monitors, assesses adequacy and verifies effectiveness.',
    fields: [
      { k: 'projectId', label: 'Project', type: 'project', req: true, list: true },
      { k: 'title', label: 'Finding', type: 'text', req: true, list: true },
      { k: 'severity', label: 'Severity', type: 'enum', options: ['Critical', 'Major', 'Minor', 'Observation'], req: true, list: true },
      { k: 'area', label: 'Assurance area', type: 'enum', options: AREAS.map((a) => String(a.n)), labels: AREAS.reduce((o, a) => { o[a.n] = a.n + '. ' + a.title; return o; }, {}) },
      { k: 'description', label: 'Detail and evidence', type: 'longtext' },
      { k: 'responsibleParty', label: 'Responsible party (owns the corrective action)', type: 'text', req: true, list: true },
      { k: 'raisedDate', label: 'Raised', type: 'date', req: true, def: '$today' },
      { k: 'responseDue', label: 'Response due', type: 'date', list: true },
      { k: 'status', label: 'Status', type: 'enum', options: ['Open', 'Response received', 'Implemented', 'Verified effective', 'Not effective', 'Closed'], def: 'Open', req: true, list: true },
      { k: 'effectivenessDue', label: 'Effectiveness check due', type: 'date' },
      { k: 'capaRef', label: 'Contractor NCR / CAPA reference', type: 'text' },
      { k: 'systemic', label: 'Systemic (same root cause elsewhere)', type: 'bool', def: false },
      { k: 'qaOwner', label: 'HQ QA owner', type: 'user', def: '$me', list: true },
    ],
  },

  NCRs: {
    title: 'Project NCR & OBS',
    prefix: 'N',
    pad: 5,
    level2: true,
    describe: 'References to project / contractor NCRs and observations. Level 2 records owned by the project; HQ QA holds the reference and assesses adequacy and effectiveness.',
    fields: [
      { k: 'projectId', label: 'Project', type: 'project', req: true, list: true },
      { k: 'ref', label: 'NCR / OBS reference', type: 'text', req: true, list: true },
      { k: 'type', label: 'Type', type: 'enum', options: ['NCR', 'OBS'], def: 'NCR', req: true, list: true },
      { k: 'category', label: 'Category / root cause', type: 'enum', options: ['Workmanship', 'Material', 'Document / record', 'Method', 'Inspection / supervision missed', 'Safety control', 'Design', 'Environment', 'Other'], list: true },
      { k: 'contractor', label: 'Owner (contractor)', type: 'text', list: true },
      { k: 'title', label: 'Description', type: 'text' },
      { k: 'raisedDate', label: 'Raised', type: 'date', req: true },
      { k: 'expectedDate', label: 'Expected completion', type: 'date', list: true },
      { k: 'closedDate', label: 'Closed', type: 'date' },
      { k: 'status', label: 'Status', type: 'enum', options: ['Open', 'Closed', 'Cancelled'], def: 'Open', req: true, list: true },
      { k: 'awaitingResponse', label: 'Awaiting contractor response', type: 'bool', def: false },
      { k: 'repeat', label: 'Repeat (same category, same project, within six months)', type: 'bool', def: false },
      { k: 'capaCheck', label: 'HQ QA check of CAPA effectiveness', type: 'enum', options: ['Not checked', 'Effective', 'Not effective'], def: 'Not checked' },
      { k: 'notes', label: 'Notes', type: 'longtext' },
    ],
  },

  Escalations: {
    title: 'Escalations & decisions',
    prefix: 'ESC',
    pad: 3,
    describe: 'HQ QA escalations. Level A is chased by the QA officer, Level B goes to the Project Director, Level C to senior management. HQ QA escalates and verifies; the project owns the action.',
    fields: [
      { k: 'projectId', label: 'Project', type: 'project', req: true, list: true },
      { k: 'level', label: 'Escalation level', type: 'enum', options: ['A', 'B', 'C'], req: true, list: true },
      { k: 'ask', label: 'Decision or action required', type: 'longtext', req: true, list: true },
      { k: 'why', label: 'Why (evidence)', type: 'longtext' },
      { k: 'owner', label: 'Accountable executive', type: 'text', req: true, list: true },
      { k: 'hqAction', label: 'HQ QA action', type: 'longtext' },
      { k: 'raisedDate', label: 'Raised', type: 'date', def: '$today' },
      { k: 'dueDate', label: 'Response due', type: 'date', req: true, list: true },
      { k: 'status', label: 'Status', type: 'enum', options: ['Open', 'Responded', 'Closed'], def: 'Open', req: true, list: true },
      { k: 'response', label: 'Response received', type: 'longtext' },
      { k: 'stopWork', label: 'Stop-work order or hold in force', type: 'bool', def: false },
      { k: 'conditions', label: 'Conditions to lift (one per line)', type: 'longtext' },
    ],
  },

  Milestones: {
    title: 'Critical milestones',
    prefix: 'M',
    pad: 4,
    describe: 'Readiness and completion milestones. Schedule variance = forecast − baseline.',
    fields: [
      { k: 'projectId', label: 'Project', type: 'project', req: true, list: true },
      { k: 'item', label: 'Milestone', type: 'text', req: true, list: true },
      { k: 'critical', label: 'Critical readiness milestone', type: 'bool', def: true },
      { k: 'baseline', label: 'Baseline', type: 'date', list: true },
      { k: 'forecast', label: 'Forecast', type: 'date', list: true },
      { k: 'actual', label: 'Actual', type: 'date', list: true },
      { k: 'note', label: 'Note', type: 'text' },
    ],
  },

  Risks: {
    title: 'Quality risks',
    prefix: 'R',
    pad: 4,
    describe: 'Quality risks per project, with control adequacy and the response.',
    fields: [
      { k: 'projectId', label: 'Project', type: 'project', req: true, list: true },
      { k: 'title', label: 'Risk', type: 'text', req: true, list: true },
      { k: 'rating', label: 'Rating', type: 'enum', options: ['Critical', 'High', 'Medium', 'Low'], req: true, list: true },
      { k: 'trend', label: 'Trend', type: 'enum', options: ['Worsening', 'Stable', 'Improving'], def: 'Stable', list: true },
      { k: 'control', label: 'Control adequacy', type: 'enum', options: ['Adequate', 'Partly adequate', 'Inadequate'], list: true },
      { k: 'response', label: 'Response / decision required', type: 'longtext' },
      { k: 'owner', label: 'HQ QA owner', type: 'user', def: '$me' },
      { k: 'status', label: 'Status', type: 'enum', options: ['Open', 'Closed'], def: 'Open', list: true },
    ],
  },

  Tasks: {
    title: 'Tasks & deliverables',
    prefix: 'T',
    pad: 5,
    describe: 'Work assigned within the QA Unit. Head – QA accepts or returns submitted deliverables.',
    fields: [
      { k: 'title', label: 'Task or deliverable', type: 'text', req: true, list: true },
      { k: 'projectId', label: 'Project', type: 'project', list: true },
      { k: 'assignee', label: 'Assigned to', type: 'user', req: true, def: '$me', list: true },
      { k: 'due', label: 'Due', type: 'date', list: true },
      { k: 'priority', label: 'Priority', type: 'enum', options: ['High', 'Normal', 'Low'], def: 'Normal' },
      { k: 'status', label: 'Status', type: 'enum', options: ['Not started', 'In progress', 'Submitted', 'Accepted', 'Returned'], def: 'Not started', req: true, list: true },
      { k: 'func', label: 'Level 4 function code', type: 'text', hint: 'For example L4-F15' },
      { k: 'notes', label: 'Notes / review comments', type: 'longtext' },
    ],
  },

  Weekly: {
    title: 'Weekly updates',
    prefix: 'W',
    pad: 5,
    describe: 'Exception-based weekly HQ QA updates, by Tuesday 12:00 (RMM §11). Escalate material issues immediately.',
    fields: [
      { k: 'weekEnd', label: 'Week ending (Friday)', type: 'date', req: true, def: '$friday', list: true },
      { k: 'projectId', label: 'Project', type: 'project', list: true },
      { k: 'func', label: 'Level 4 function', type: 'text' },
      { k: 'exceptions', label: 'Exceptions this week', type: 'longtext', req: true, list: true },
      { k: 'escalate', label: 'Needs escalation', type: 'bool', def: false, list: true },
    ],
  },

  Reports: {
    title: 'Monthly management reports',
    prefix: 'MR',
    pad: 3,
    describe: 'Monthly management assurance report (RMM §21).',
    fields: [
      { k: 'period', label: 'Month', type: 'month', req: true, list: true },
      { k: 'overall', label: 'Overall portfolio status', type: 'enum', options: ['Green', 'Amber', 'Red', 'Grey'], list: true },
      { k: 'confidence', label: 'Confidence', type: 'enum', options: ['High', 'Moderate', 'Limited'] },
      { k: 'conclusion', label: 'Overall conclusion (HQ QA assessment)', type: 'longtext' },
      { k: 'reasons', label: 'Three principal reasons (facts)', type: 'longtext' },
      { k: 'limitations', label: 'Limitations and uncertainty', type: 'longtext' },
      { k: 'decisions', label: 'Management decisions required (one per line)', type: 'longtext' },
      { k: 'state', label: 'State', type: 'text', sys: true, def: 'Draft', list: true },
      { k: 'snapshot', label: 'Frozen dashboard', type: 'json', sys: true, def: null },
      { k: 'issuedBy', label: 'Issued by', type: 'text', sys: true },
      { k: 'issuedAt', label: 'Issued', type: 'text', sys: true },
    ],
  },
};

/** System columns kept on every register. */
const SYS_COLUMNS = ['id', 'rev', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy'];

/** Internal tabs that are not registers. */
const CONFIG_SHEET = 'Config';
const AUDIT_SHEET = 'Audit';
const AUDIT_COLUMNS = ['at', 'email', 'action', 'table', 'id', 'summary'];
