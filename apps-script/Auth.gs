/**
 * Who is signed in, and what they may read and change.
 * The browser hides what a role cannot do; these checks are what actually enforce it.
 *
 * Roles (Config.gs ROLES):
 *   LEAD   Lead – QA: everything. Approves, returns and moderates assessments, accepts
 *          deliverables, issues the monthly report, manages users, settings and deletions.
 *   MGR    Manager: works across every project (assessments, findings, NCR/OBS, escalations,
 *          milestones, risks), assigns and re-dates tasks for the team and accepts deliverables.
 *          Does not approve assessments, issue reports, manage users or delete.
 *   AM     Assistant Manager: the projects allocated to them as QA lead or deputy, plus their
 *          own tasks and weekly updates.
 *   CLERK  Admin clerk: users (not Lead – QA), the project register, NCR/OBS references,
 *          milestones and bulk imports, plus their own tasks and weekly updates.
 *   VIEWER Management: read-only, approved assessments and issued reports only.
 */

function currentEmail_() {
  return String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
}

function me_(users) {
  const email = currentEmail_();
  if (!email) throw new AppError('NO_IDENTITY', 'Q-TRACK could not read your Google account. Open it while signed in to your MRTC Google account.');
  const u = (users || readTable_('Users')).find((x) => String(x.email).toLowerCase() === email);
  if (!u || u.active === false) throw new AppError('NOT_REGISTERED', email);
  return u;
}

function isStaff_(u) { return u.role !== 'VIEWER'; }
function isLead_(u) { return u.role === 'LEAD'; }

/** Projects where the user is the QA lead or deputy. */
function ownProjectIds_(u, projects) {
  const e = String(u.email).toLowerCase();
  return projects.filter((p) => String(p.lead).toLowerCase() === e || String(p.deputy).toLowerCase() === e).map((p) => p.id);
}

/** Registers each role can see. */
const ALL_TABLES_ = ['Users', 'Projects', 'Assessments', 'Findings', 'NCRs', 'Escalations', 'Milestones', 'Risks', 'Tasks', 'Weekly', 'Reports'];
const READ = {
  LEAD: ALL_TABLES_,
  MGR: ALL_TABLES_,
  AM: ALL_TABLES_,
  CLERK: ALL_TABLES_,
  VIEWER: ['Users', 'Projects', 'Assessments', 'Escalations', 'Milestones', 'Risks', 'Reports'],
};

/** Row-level filtering on read. */
function visibleRows_(table, rows, u) {
  if ((READ[u.role] || []).indexOf(table) < 0) return [];
  if (u.role === 'VIEWER') {
    if (table === 'Assessments') return rows.filter((r) => r.state === 'Approved');
    if (table === 'Reports') return rows.filter((r) => r.state === 'Issued');
    if (table === 'Users') return rows.map((r) => ({ id: r.id, email: r.email, name: r.name, code: r.code, role: r.role, title: r.title, active: r.active }));
  }
  if (table === 'Reports' && !isLead_(u)) return rows.filter((r) => r.state === 'Issued');
  return rows;
}

/** Fields of a project that only Lead – QA may change. */
const PROJECT_LEAD_FIELDS_ = ['code', 'tier', 'tierStatus', 'lead', 'deputy'];

/**
 * May this user create (before = null) or change this record into `after`?
 * Returns null when allowed, or the reason it is not.
 */
function writeDenied_(table, u, before, after, projects) {
  const role = u.role;
  if (role === 'VIEWER') return 'Your role is read-only.';
  if (role === 'LEAD') return null;
  if (!READ[role]) return 'Unknown role.';
  const own = ownProjectIds_(u, projects);
  const me = String(u.email).toLowerCase();
  const is = (v) => String(v || '').toLowerCase() === me;
  const same = (a, b) => String(a || '').toLowerCase() === String(b || '').toLowerCase();
  // Record is within the user's project scope: Managers and the clerk reach every project,
  // Assistant Managers only the ones allocated to them.
  const scoped = (r) => !r || !r.projectId || role === 'MGR' || role === 'CLERK' || own.indexOf(r.projectId) >= 0;
  const inScope = (r) => scoped(r);

  switch (table) {
    case 'Users':
      if (role !== 'CLERK') return 'Only Lead – QA and the admin clerk manage users.';
      if (after.role === 'LEAD' || (before && before.role === 'LEAD')) return 'Only Lead – QA can grant or change the Lead – QA role.';
      return null;

    case 'Projects':
      if (role === 'CLERK') return null;
      if (!before) return 'Ask Lead – QA or the admin clerk to add a project.';
      if (role === 'AM' && own.indexOf(before.id) < 0) return 'You can update only projects where you are the QA lead or deputy.';
      if (PROJECT_LEAD_FIELDS_.some((k) => !same(before[k], after[k]))) return 'Only Lead – QA changes the project code, tier or QA allocation.';
      return null;

    case 'Assessments':
      if (role === 'CLERK') return 'Assessments are prepared by QA officers and approved by Lead – QA.';
      if (!inScope(after) || (before && !inScope(before))) return 'You can prepare assessments only for projects allocated to you.';
      return null;

    case 'Findings':
      if (role === 'CLERK') return 'Findings are raised by QA officers.';
      if (inScope(after) && (!before || inScope(before))) return null;
      if (before && is(before.qaOwner) && is(after.qaOwner)) return null;
      return 'You can change findings on your projects, or ones you own.';

    case 'NCRs':
    case 'Milestones':
      return inScope(after) && inScope(before) ? null : 'You can update this register only for projects allocated to you.';

    case 'Escalations':
    case 'Risks':
      if (role === 'CLERK') return 'Escalations and risks are recorded by QA officers.';
      return inScope(after) && inScope(before) ? null : 'You can update this register only for projects allocated to you.';

    case 'Tasks':
      if (role === 'MGR') {
        if (after.status === 'Accepted' && (!before || before.status !== 'Accepted') && is(after.assignee)) return 'Your own deliverables are accepted by Lead – QA.';
        return null;
      }
      if (!before) return is(after.assignee) ? null : 'Only Lead – QA or a Manager assigns tasks to other people.';
      if (!is(before.assignee)) return 'You can update only tasks assigned to you.';
      if (!is(after.assignee)) return 'Only Lead – QA or a Manager re-assigns tasks.';
      if (after.status === 'Accepted' && before.status !== 'Accepted') return 'Lead – QA or a Manager accepts deliverables.';
      if (before.due !== after.due) return 'Ask Lead – QA or a Manager to change a due date.';
      return null;

    case 'Weekly':
      return !before || is(before.createdBy) ? null : 'You can edit only your own weekly updates.';

    case 'Reports':
      return 'Only Lead – QA prepares and issues the monthly report.';
  }
  return 'Not permitted.';
}

/** May this user submit an assessment for approval? */
function canSubmitAssessment_(u, a, projects) {
  if (isLead_(u) || u.role === 'MGR') return true;
  return u.role === 'AM' && ownProjectIds_(u, projects).indexOf(a.projectId) >= 0;
}

function canDelete_(table, u, rec) {
  if (isLead_(u)) return true;
  if (table === 'Weekly' && String(rec.createdBy).toLowerCase() === String(u.email).toLowerCase()) return true;
  return false;
}
