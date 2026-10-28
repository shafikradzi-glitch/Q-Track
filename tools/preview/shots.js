/*
 * Drives dist/preview.html in Chromium: walks every screen for each role, runs the main flows,
 * fails on any page error, and saves screenshots.  Usage: node tools/preview/shots.js [outDir]
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..', '..');
const OUT = process.argv[2] || path.join(ROOT, 'dist', 'shots');
const URL = 'file://' + path.join(ROOT, 'dist', 'preview.html');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const results = [];
  const page0 = async (opts) => {
    const ctx = await browser.newContext(Object.assign({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 }, opts || {}));
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|ERR_|net::/.test(m.text())) errors.push('console: ' + m.text()); });
    return page;
  };
  const shot = async (page, name, full) => { await page.waitForTimeout(250); await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: full !== false }); results.push(name); };
  const nav = async (page, label) => { await page.locator('#nav button', { hasText: label }).first().click(); await page.waitForTimeout(250); };
  const ready = async (page) => { await page.waitForSelector('#content .ph', { timeout: 15000 }); await page.waitForTimeout(300); };

  // Head – QA, desktop
  let p = await page0();
  await p.goto(URL); await ready(p);
  await shot(p, '01-command-centre');
  await p.locator('.pills button', { hasText: 'Penang Mutiara Line' }).first().click().catch(() => {});
  await p.locator('.prog', { hasText: 'Penang' }).first().click().catch(() => {});
  await p.waitForTimeout(250);
  await shot(p, '02-command-centre-pml');
  await p.locator('.pills button', { hasText: 'Portfolio' }).first().click();
  for (const [label, name] of [['My work', '03-my-work-hq'], ['Heat-map & assessments', '04-assessments'], ['Findings & CAPA refs', '05-findings'], ['Escalations & decisions', '06-escalations'], ['Project register', '07-projects'], ['Project NCR & OBS', '08-ncr'], ['Critical milestones', '09-milestones'], ['Quality risks', '10-risks'], ['Tasks & deliverables', '11-tasks'], ['Weekly updates', '12-weekly'], ['Alerts', '13-alerts'], ['Monthly report', '14-report'], ['Administration', '15-admin'], ['Audit log', '16-audit']]) {
    await nav(p, label); await shot(p, name);
  }
  // Project page
  await nav(p, 'Project register');
  await p.locator('.tbl tbody tr', { hasText: 'DEMO-PML' }).first().click();
  await p.waitForSelector('.tabs'); await shot(p, '17-project-pml');
  // Assessment editor on a submitted/draft one
  await nav(p, 'Heat-map & assessments');
  await p.locator('.tbl tbody tr', { hasText: 'Draft' }).first().click();
  await p.waitForSelector('.areas'); await shot(p, '18-assessment-draft');
  // Record drawer
  await nav(p, 'Escalations & decisions');
  await p.locator('.tbl tbody tr', { hasText: 'ESC-001' }).first().click();
  await p.waitForSelector('.drawer.on'); await shot(p, '19-drawer-escalation', false);
  await p.keyboard.press('Escape');
  // Start the monthly report and issue it
  await nav(p, 'Monthly report');
  const start = p.locator('button', { hasText: /^Start the / });
  if (await start.count()) { await start.click(); await p.waitForSelector('#r-conclusion'); }
  await p.fill('#r-conclusion', 'Portfolio controls largely operating; QC hold-point control and NCR ageing on PML need management attention.');
  await p.locator('button', { hasText: 'Save sections 1 and 6' }).click();
  await p.waitForSelector('.toast.ok');
  await shot(p, '20-report-draft');
  // Theme: dark
  await p.locator('button[aria-label="Change theme"]').click();
  await nav(p, 'Command Centre'); await shot(p, '21-command-centre-dark');
  await p.close();

  // Assistant Manager flow: raise a finding, then prepare and submit an assessment
  p = await page0();
  await p.goto(URL + '?as=am.civil'); await ready(p);
  await shot(p, '22-am-command');
  await nav(p, 'My work'); await shot(p, '23-am-my-work');
  await nav(p, 'Findings & CAPA refs');
  await p.locator('button', { hasText: 'Raise finding' }).click();
  await p.waitForSelector('.drawer.on');
  await p.selectOption('#d-projectId', { label: 'DEMO-PML — SAMPLE New line — civil packages and STC' });
  await p.fill('#d-title', 'Preview test: curing records missing for lot 15');
  await p.selectOption('#d-severity', 'Minor');
  await p.fill('#d-responsibleParty', 'Sample Contractor P');
  await shot(p, '24-am-new-finding', false);
  await p.locator('.drawer button', { hasText: 'Create' }).click();
  await p.waitForSelector('.toast.ok');
  if (!(await p.locator('.tbl', { hasText: 'Preview test: curing records' }).count())) throw new Error('New finding not listed');
  await nav(p, 'Heat-map & assessments');
  await p.locator('button', { hasText: 'Start an assessment' }).click();
  await p.waitForSelector('.areas');
  await p.selectOption('#f-projectId', { label: 'DEMO-PML — SAMPLE New line — civil packages and STC' });
  await p.waitForSelector('.areas');
  await p.fill('#f-period', '2030-02');
  for (let i = 1; i <= 10; i++) await p.locator('#area-' + i + ' .seg button', { hasText: i === 4 ? 'R' : i === 10 ? 'N/A' : 'G' }).first().click();
  await p.locator('#area-4 textarea').fill('31 of 51 open NCRs past expected completion; oldest 142 days.');
  await p.fill('#f-conclusion', 'NCR management is weak; other controls operating.');
  const ov = await p.locator('.sticky .cell.ov').first().textContent();
  if (ov.trim() !== 'Red') throw new Error('Overall should be Red, got ' + ov);
  await shot(p, '25-am-assessment-editor');
  await p.locator('button', { hasText: 'Submit for approval' }).click();
  await p.waitForSelector('.toast.ok');
  await p.waitForTimeout(400);
  await shot(p, '26-am-assessment-submitted');
  const assessId = (await p.locator('#crumb').textContent()).split(' · ')[0];
  // Same browser session: switch to Head – QA and approve it
  await p.selectOption('#pv-as', 'head.qa@mrt.example');
  await ready(p);
  await nav(p, 'My work');
  await p.locator('button.li', { hasText: assessId }).first().click();
  await p.waitForSelector('.areas');
  await p.locator('button', { hasText: /^Approve$/ }).click();
  await p.locator('.modal button', { hasText: 'Approve' }).click();
  await p.waitForSelector('.toast.ok');
  await p.waitForTimeout(500);
  await shot(p, '27-hq-approved');
  await p.close();

  // Viewer
  p = await page0();
  await p.goto(URL + '?as=viewer'); await ready(p);
  const navText = await p.locator('#nav').textContent();
  if (/Findings|Audit|Administration|NCR/.test(navText)) throw new Error('Viewer sees staff menu items: ' + navText);
  await shot(p, '28-viewer-command');
  await p.close();

  // Phone
  p = await page0({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(URL); await ready(p);
  await shot(p, '29-phone-command');
  await p.locator('.menu-btn').click(); await p.waitForTimeout(250); await shot(p, '30-phone-menu', false);
  await p.locator('#nav button', { hasText: 'Heat-map & assessments' }).click(); await p.waitForTimeout(300);
  await p.locator('.tbl tbody tr', { hasText: 'Draft' }).first().click(); await p.waitForSelector('.areas');
  await shot(p, '31-phone-assessment');
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 1) errors.push('Horizontal page overflow on phone: ' + overflow + 'px');
  await p.close();

  await browser.close();
  console.log('Screens: ' + results.length + ' → ' + OUT);
  if (errors.length) { console.log('ERRORS:\n' + errors.join('\n')); process.exit(1); }
  console.log('No page errors.');
})().catch((e) => { console.error(e); process.exit(1); });
