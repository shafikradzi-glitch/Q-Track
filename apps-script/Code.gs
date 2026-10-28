/**
 * Q-TRACK web app entry points.
 * Deploy: Deploy → New deployment → Web app · Execute as: Me · Who has access: Anyone within your organisation.
 */

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Q-TRACK')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

/** Used by the HTML templates: <?!= include('Styles') ?> */
function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

/** Adds a Q-TRACK menu to the backing Sheet. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Q-TRACK')
    .addItem('Set up or repair tabs', 'setup')
    .addItem('Load sample data', 'loadSampleData')
    .addItem('Remove sample data', 'clearSampleData')
    .addSeparator()
    .addItem('Turn on the daily alert e-mail', 'installDigestTrigger')
    .addToUi();
}

/* ---------------- daily alert digest (optional) ---------------- */

function installDigestTrigger() {
  ScriptApp.getProjectTriggers().filter((t) => t.getHandlerFunction() === 'dailyDigest').forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('dailyDigest').timeBased().everyDays(1).atHour(7).create();
  const cfg = readConfig_();
  cfg.digestEnabled = true;
  writeConfig_(cfg);
}

/** Sends each active user the open alerts they own; Lead – QA also gets every Critical alert. */
function dailyDigest() {
  const cfg = readConfig_();
  if (!cfg.digestEnabled) return;
  const db = loadDb_();
  const dash = buildDashboard(db, todayIso_(), cfg);
  const url = ScriptApp.getService().getUrl();
  const proj = {};
  db.Projects.forEach((p) => { proj[p.id] = p; });
  db.Users.filter((u) => u.active !== false && u.role !== 'VIEWER').forEach((u) => {
    const mine = dash.alerts.filter((a) => String(a.owner).toLowerCase() === String(u.email).toLowerCase() || (isLead_(u) && a.severity === 'Critical'));
    if (!mine.length) return;
    const lines = mine.slice(0, 30).map((a) => '• [' + a.severity + '] ' + (proj[a.projectId] ? proj[a.projectId].code + ' — ' : '') + a.title + '\n   ' + a.detail);
    MailApp.sendEmail({
      to: u.email,
      subject: 'Q-TRACK: ' + mine.length + ' open alert' + (mine.length > 1 ? 's' : '') + ' for you',
      body: 'Good morning ' + u.name + ',\n\nThese Q-TRACK alerts are open and assigned to you:\n\n' + lines.join('\n') + (mine.length > 30 ? '\n… and ' + (mine.length - 30) + ' more.' : '') + '\n\nOpen Q-TRACK: ' + url + '\n\nAlerts clear themselves when the condition is resolved in the records.',
    });
  });
}
