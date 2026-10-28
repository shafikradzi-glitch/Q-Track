/*
 * Builds dist/preview.html: the real Q-TRACK client and server code in one page, with the
 * Google services replaced by tools/gas-mock.js and the sample data loaded. Nothing is saved.
 * Usage: node tools/preview/build.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'apps-script');
const OUT = path.join(ROOT, 'dist');
const read = (f) => fs.readFileSync(path.join(SRC, f), 'utf8');
const ORDER = ['Config.gs', 'Rules.gs', 'Db.gs', 'Auth.gs', 'Api.gs', 'Setup.gs', 'Code.gs'];

const server = ORDER.map(read).join('\n;\n');
const mock = fs.readFileSync(path.join(ROOT, 'tools', 'gas-mock.js'), 'utf8');

const PEOPLE = [
  ['lead.qa@mrt.example', 'Lead – QA'],
  ['mgr.civil@sample.example', 'Manager (Civil)'],
  ['am.civil@sample.example', 'Assistant Manager (Civil)'],
  ['am.systems@sample.example', 'Assistant Manager (Systems)'],
  ['clerk@sample.example', 'Admin clerk'],
  ['viewer@sample.example', 'Management (read-only)'],
];

const glueTemplate = `
(function () {
  var M = GasMock.makeMock({ user: 'lead.qa@mrt.example', owner: 'lead.qa@mrt.example' });
  Object.keys(M.services).forEach(function (k) { window[k] = M.services[k]; });
  window.__QT_MOCK__ = M;
})();
</script>
<script>
@@SERVER@@
</script>
<script>
(function () {
  var M = window.__QT_MOCK__;
  setup();
  loadSampleData();
  // Rename the first Lead – QA so the preview reads naturally.
  (function () {
    var sh = M.spreadsheet.getSheetByName('Users'), head = sh.data[0];
    sh.data.forEach(function (r, i) { if (i && r[head.indexOf('email')] === 'lead.qa@mrt.example') { r[head.indexOf('name')] = 'Shafik Radzi (preview)'; r[head.indexOf('title')] = 'Senior Quality Manager, Lead – QA'; } });
  })();
  var PEOPLE = @@PEOPLE@@;
  try { var who = new URLSearchParams(location.search).get('as'); if (who) { var p = PEOPLE.find(function (x) { return x[0].indexOf(who) === 0; }); if (p) M.setUser(p[0]); } } catch (e) {}
  function runner(hs) {
    return {
      withSuccessHandler: function (fn) { return runner(Object.assign({}, hs, { s: fn })); },
      withFailureHandler: function (fn) { return runner(Object.assign({}, hs, { f: fn })); },
      api: function (a, p) { setTimeout(function () { var out; try { out = api(a, p); } catch (e) { if (hs.f) hs.f(e); return; } if (hs.s) hs.s(out); }, 90); },
    };
  }
  window.google = { script: { run: runner({}) } };
  document.addEventListener('DOMContentLoaded', function () {
    var bar = document.createElement('div');
    bar.className = 'preview-bar no-print';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Preview controls');
    var lab = document.createElement('label'); lab.textContent = 'Preview · view as'; lab.htmlFor = 'pv-as';
    var sel = document.createElement('select'); sel.id = 'pv-as';
    PEOPLE.forEach(function (p) { var o = document.createElement('option'); o.value = p[0]; o.textContent = p[1]; if (p[0] === M.getUser()) o.selected = true; sel.appendChild(o); });
    sel.addEventListener('change', function () { M.setUser(sel.value); window.QTRACK.state.view = 'command'; window.QTRACK.state.history = []; window.QTRACK.boot(); });
    var note = document.createElement('span'); note.textContent = 'Sample data in this browser only — nothing is saved.';
    bar.append(lab, sel, note);
    document.body.appendChild(bar);
  });
})();
`;

// Spliced in without a template literal, so backslashes in the server code survive unchanged.
const glue = glueTemplate.split('@@SERVER@@').join(server.replace(/<\/script/gi, '<\\/script')).split('@@PEOPLE@@').join(JSON.stringify(PEOPLE));

const previewCss = `<style>
.preview-bar { position: fixed; left: calc(12px + env(safe-area-inset-left, 0px)); bottom: calc(12px + env(safe-area-inset-bottom, 0px)); z-index: 70; display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; background: #0F172A; color: #E2E8F0; padding: 8px 12px; border-radius: 12px; font: 12px/1.3 Inter, system-ui, sans-serif; box-shadow: 0 8px 30px rgba(0,0,0,.25); max-width: calc(100vw - 24px); }
.preview-bar select { background: #1E293B; color: #fff; border: 1px solid #334155; border-radius: 7px; padding: 4px 6px; font: inherit; min-height: 30px; }
.preview-bar span { color: #94A3B8; }
@media (max-width: 620px) { .preview-bar span { display: none; } }
</style>`;

let html = read('Index.html')
  .replace("<?!= include('Styles'); ?>", () => read('Styles.html') + previewCss) // functions: no $-patterns in replacements
  .replace("<?!= include('App'); ?>", () => '<script>\n' + mock + '\n' + glue + '\n</script>\n' + read('App.html'));
if (/<\?/.test(read('Index.html').replace(/<\?!= include\('(Styles|App)'\); \?>/g, ''))) throw new Error('Unresolved template tag in Index.html');
html = html.replace('<title>Q-TRACK</title>', '<title>Q-TRACK Preview</title>');
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'preview.html'), html);
console.log('Wrote dist/preview.html (' + Math.round(html.length / 1024) + ' KB)');

// --artifact <file>: the same page as body content only, for hosting as a claude.ai artifact,
// where printing and downloads are blocked (the app says so instead of failing silently).
const ai = process.argv.indexOf('--artifact');
if (ai > 0) {
  const target = process.argv[ai + 1];
  const head = /<head>([\s\S]*?)<\/head>/.exec(html)[1]
    .replace(/<base[^>]*>/, '').replace(/<meta charset[^>]*>/, '').replace(/<meta name="viewport"[^>]*>/, '')
    .replace('<title>Q-TRACK Preview</title>', '<title>Q-TRACK Workspace Preview</title>\n<meta name="claude:viewport-fit-sides" content="cover">');
  const body = /<body>([\s\S]*)<\/body>/.exec(html)[1];
  const page = head.trim() + '\n<script>window.QTRACK_PREVIEW = true;</script>\n' + body.trim() + '\n';
  fs.writeFileSync(target, page);
  console.log('Wrote ' + target + ' (' + Math.round(page.length / 1024) + ' KB)');
}
