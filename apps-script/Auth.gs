/**
 * Who is signed in, and what they may read and change.
 * The browser hides what a role cannot do; these checks are what actually enforce it.
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

/** Projects where the user is the QA lead or deputy. */
function ownProjectIds_(u, projects) {
  const e = String(u.email).toLowerCase();
  return projects.filter((p) => String(p.lead).toLowerCase() === e || String(p.deputy).toLowerCase() === e).map((p) => p.id);
}

/** Registers each role can see. */
const READ = {
  HQ: ['Users', 'Projects', 'Assessments', 'Findings', 'NCRs', 'Escalations', 'Milestones', 'Risks', 'Tasks', 'Weekly', 'Reports'],
  AM: ['Users', 'Projects', 'Assessments', 'Findings', 'NCRs', 'Escalations', 'Milestones', 'Risks', 'Tasks', 'Weekly', 'Reports'],
  CLERK: ['Users', 'Projects', 'Assessments', 'Findings', 'NCRs', 'Escalations', 'Milestones', 'Risks', 'Tasks', 'Weekly', 'Reports'],
  VIEWER: ['Users', 'Projects', 'Assessments', 'Escalations', 'Milestones', 'Risks', 'Reports'],
};

/** Row-level filtering on read. */
function visibleRows_(table, rows, u) {
  if (READ[u.role].indexOf(table) < 0) return [];
  if (u.role === 'VIEWER') {
    if (table === 'Assessments') return rows.filter((r) => r.state === 'Approved');
    if (table === 'Reports') return rows.filter((r) => r.state === 'Issued');
    if (table === 'Users') return rows.map((r) => ({ id: r.id, email: r.email, name: r.name, code: r.code, role: r.role, title: r.title, active: r.active }));
  }
  if (table === 'Reports' && u.role !== 'HQ') return rows.filter((r) => r.state === 'Issued');
  return rows;
}

/**
 * May this user create (before = null) or change this record into `after`?
 * Returns null when allowed, or the reason it is not.
 */
function writeDenied_(table, u, before, after, projects) {
  const role = u.role;
  if (role === 'VIEWER') return 'Your role is read-only.';
  if (role === 'HQ') return null;
  const own = ownProjectIds_(u, projects);
  const ownRec = (r) => !r || !r.projectId || own.indexOf(r.projectId) >= 0;
  const me = String(u.email).toLowerCase();
  const is = (v) => String(v || '').toLowerCase() === me;
  const same = (a, b) => String(a || '').toLowerCase() === String(b || '').toLowerCase();

  switch (table) {
    case 'Users':
      if (role !== 'CLERK') return 'Only Head – QA and the admin clerk manage users.';
      if (after.role === 'HQ' || (before && before.role === 'HQ')) return 'Only Head – QA can grant or change the Head – QA role.';
      return null;
    case 'Projects':
      if (role === 'CLERK') return null;
      if (!before) return 'Ask Head – QA or the admin clerk to add a project.';
      if (!ownRec({ projectId: before.id })) return 'You can update only projects where you are the QA lead or deputy.';
      if (!same(before.lead, after.lead) || !same(before.deputy, after.deputy) || String(before.tier) !== String(after.tier) || before.tierStatus !== after.tierStatus || before.code !== after.code) return 'Only Head – QA changes the project code, tier or QA allocation.';
      return null;
    case 'Assessments':
      if (role !== 'AM') return 'Assessments are prepared by the project’s QA lead or deputy and approved by Head – QA.';
      if (!ownRec(after) || (before && !ownRec(before))) return 'You can prepare assessments only for projects allocated to you.';
      return null;
    case 'Findings':
      if (role !== 'AM') return 'Findings are raised by QA officers.';
      if (ownRec(after) && (!before || ownRec(before))) return null;
      if (before && is(before.qaOwner) && is(after.qaOwner)) return null;
      return 'You can change findings on your projects, or ones you own.';
    case 'NCRs':
    case 'Milestones':
      if (role === 'CLERK') return null;
      return ownRec(after) && ownRec(before) ? null : 'You can update this register only for projects allocated to you.';
    case 'Escalations':
    case 'Risks':
      if (role !== 'AM') return 'Escalations and risks are recorded by QA officers.';
      return ownRec(after) && ownRec(before) ? null : 'You can update this register only for projects allocated to you.';
    case 'Tasks':
      if (!before) return is(after.assignee) ? null : 'Only Head – QA assigns tasks to other people.';
      if (!is(before.assignee)) return 'You can update only tasks assigned to you.';
      if (!is(after.assignee)) return 'Only Head – QA re-assigns tasks.';
      if (after.status === 'Accepted' && before.status !== 'Accepted') return 'Head – QA accepts deliverables.';
      if (before.due !== after.due) return 'Ask Head – QA to change a due date.';
      return null;
    case 'Weekly':
      return !before || is(before.createdBy) ? null : 'You can edit only your own weekly updates.';
    case 'Reports':
      return 'Only Head – QA prepares and issues the monthly report.';
  }
  return 'Not permitted.';
}

function canDelete_(table, u, rec) {
  if (u.role === 'HQ') return true;
  if (table === 'Weekly' && String(rec.createdBy).toLowerCase() === String(u.email).toLowerCase()) return true;
  return false;
}
