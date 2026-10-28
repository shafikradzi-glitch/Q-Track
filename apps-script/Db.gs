/**
 * Sheet storage. Each register is a tab whose first row holds the column keys.
 * Columns are found by name, so people may reorder or add columns in the Sheet.
 */

class AppError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

let SS_CACHE_ = null;

/** The backing Sheet: the container of this script, or the one recorded by setup(). */
function ss_() {
  if (SS_CACHE_) return SS_CACHE_;
  SS_CACHE_ = SpreadsheetApp.getActive();
  if (!SS_CACHE_) {
    const id = PropertiesService.getScriptProperties().getProperty('QTRACK_SHEET_ID');
    if (!id) throw new AppError('NOT_SET_UP', 'Q-TRACK has no Sheet yet. Head – QA should run setup() from the Apps Script editor of the Sheet.');
    SS_CACHE_ = SpreadsheetApp.openById(id);
  }
  return SS_CACHE_;
}

let TZ_CACHE_ = null;
function tz_() {
  if (!TZ_CACHE_) TZ_CACHE_ = ss_().getSpreadsheetTimeZone() || Session.getScriptTimeZone() || 'Asia/Kuala_Lumpur';
  return TZ_CACHE_;
}

function todayIso_() { return Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd'); }
function nowStamp_() { return Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd HH:mm'); }

function columnsOf_(table) {
  return SYS_COLUMNS.slice(0, 1).concat(TABLES[table].fields.map((f) => f.k), SYS_COLUMNS.slice(1));
}

function fieldMap_(table) {
  const m = {};
  TABLES[table].fields.forEach((f) => { m[f.k] = f; });
  return m;
}

function sheetOf_(name) {
  const sh = ss_().getSheetByName(name);
  if (!sh) throw new AppError('NOT_SET_UP', 'The “' + name + '” tab is missing. Head – QA should run setup() from the Apps Script editor.');
  return sh;
}

/** Converts a raw cell value to the field's type. */
function fromCell_(v, f, key) {
  if (v instanceof Date) {
    const withTime = /At$/.test(key);
    return Utilities.formatDate(v, tz_(), withTime ? 'yyyy-MM-dd HH:mm' : f && f.type === 'month' ? 'yyyy-MM' : 'yyyy-MM-dd');
  }
  if (typeof v === 'string' && v.charAt(0) === "'") v = v.slice(1);
  if (!f) return key === 'rev' ? Number(v) || 0 : v === null || v === undefined ? '' : String(v);
  switch (f.type) {
    case 'bool': return v === true || /^(true|yes|y|1)$/i.test(String(v));
    case 'number': return v === '' || v === null ? null : Number(v);
    case 'json':
      if (v === '' || v === null) return f.def === undefined ? null : f.def;
      try { return JSON.parse(v); } catch (e) { return f.def === undefined ? null : f.def; }
    default: return v === null || v === undefined ? '' : String(v).trim();
  }
}

function toCell_(v, f) {
  if (f && f.type === 'json') return v === null || v === undefined ? '' : JSON.stringify(v);
  if (f && f.type === 'bool') return v ? 'TRUE' : 'FALSE';
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /^[=+\-@]/.test(s) ? "'" + s : s; // never let a value become a formula
}

/** Reads a whole register as records. Each record carries its sheet row in _row. */
function readTable_(table) {
  const sh = sheetOf_(table);
  const values = sh.getDataRange().getValues();
  if (values.length < 1) return [];
  const head = values[0].map((h) => String(h).trim());
  const fm = fieldMap_(table);
  const out = [];
  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const idCol = head.indexOf('id');
    if (idCol < 0 || !row[idCol]) continue;
    const rec = { _row: r + 1 };
    head.forEach((h, c) => { if (h) rec[h] = fromCell_(row[c], fm[h], h); });
    TABLES[table].fields.forEach((f) => { if (!(f.k in rec)) rec[f.k] = f.def === undefined ? '' : f.def; });
    out.push(rec);
  }
  return out;
}

/** The tab's header row, adding any schema columns that are missing. */
function headOf_(table) {
  const sh = sheetOf_(table);
  const head = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0].map((h) => String(h).trim());
  const missing = columnsOf_(table).filter((k) => head.indexOf(k) < 0);
  if (missing.length) {
    const start = head.filter(Boolean).length === 0 ? 1 : head.length + 1;
    if (start === 1) head.length = 0;
    sh.getRange(1, start, 1, missing.length).setValues([missing]);
    missing.forEach((k) => head.push(k));
  }
  return head;
}

function writeRow_(table, rec) {
  const sh = sheetOf_(table);
  const head = headOf_(table);
  const fm = fieldMap_(table);
  const row = head.map((h) => (h ? toCell_(rec[h], fm[h]) : ''));
  const rowNum = rec._row || sh.getLastRow() + 1;
  const range = sh.getRange(rowNum, 1, 1, head.length);
  range.setNumberFormat('@');
  range.setValues([row]);
  return rowNum;
}

function deleteRow_(table, rowNum) { sheetOf_(table).deleteRow(rowNum); }

function nextId_(table, rows) {
  const t = TABLES[table];
  let max = 0;
  rows.forEach((r) => {
    const m = new RegExp('^' + t.prefix + '-(\\d+)$').exec(r.id);
    if (m) max = Math.max(max, +m[1]);
  });
  return t.prefix + '-' + String(max + 1).padStart(t.pad || 4, '0');
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new AppError('BUSY', 'Q-TRACK is busy saving someone else’s change. Try again in a moment.');
  try { return fn(); } finally { lock.releaseLock(); }
}

function audit_(email, action, table, id, summary) {
  const sh = ss_().getSheetByName(AUDIT_SHEET);
  if (!sh) return;
  sh.appendRow([nowStamp_(), email, action, table, id, toCell_(String(summary || '').slice(0, 2000))]);
}

function readConfig_() {
  const cfg = Object.assign({}, CONFIG_DEFAULTS);
  const sh = ss_().getSheetByName(CONFIG_SHEET);
  if (!sh) return cfg;
  sh.getDataRange().getValues().slice(1).forEach((r) => {
    const k = String(r[0]).trim();
    if (!(k in CONFIG_DEFAULTS)) return;
    const d = CONFIG_DEFAULTS[k];
    cfg[k] = typeof d === 'boolean' ? r[1] === true || /^true$/i.test(String(r[1])) : typeof d === 'number' ? Number(r[1]) || d : String(r[1]);
  });
  return cfg;
}

function writeConfig_(cfg) {
  const sh = ss_().getSheetByName(CONFIG_SHEET) || ss_().insertSheet(CONFIG_SHEET);
  const rows = [['key', 'value']].concat(Object.keys(CONFIG_DEFAULTS).map((k) => [k, String(cfg[k] === undefined ? CONFIG_DEFAULTS[k] : cfg[k])]));
  sh.clearContents();
  sh.getRange(1, 1, rows.length, 2).setNumberFormat('@').setValues(rows);
}

/** Copies a record without internal keys, for sending to the browser. */
function public_(rec) {
  const o = {};
  Object.keys(rec).forEach((k) => { if (k.charAt(0) !== '_') o[k] = rec[k]; });
  return o;
}
