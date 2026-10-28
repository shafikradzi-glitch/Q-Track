/*
 * In-memory stand-ins for the Google Apps Script services Q-TRACK uses, so the real server
 * code can run under Node (tests) and in a browser (local preview). Not used in production.
 */
(function (root) {
  'use strict';

  function makeMock(opts) {
    opts = opts || {};
    const tzOffsetMin = opts.tzOffsetMin === undefined ? 480 : opts.tzOffsetMin; // Asia/Kuala_Lumpur
    let activeEmail = opts.user || 'hq@mrt.example';
    const ownerEmail = opts.owner || 'hq@mrt.example';
    const mail = [];
    const props = {};

    class Range {
      constructor(sheet, r, c, nr, nc) { this.sheet = sheet; this.r = r; this.c = c; this.nr = nr; this.nc = nc; }
      getValues() {
        const out = [];
        for (let i = 0; i < this.nr; i++) {
          const row = [];
          for (let j = 0; j < this.nc; j++) { const v = (this.sheet.data[this.r - 1 + i] || [])[this.c - 1 + j]; row.push(v === undefined ? '' : v); }
          out.push(row);
        }
        return out;
      }
      setValues(vals) {
        if (vals.length !== this.nr || vals.some((r) => r.length !== this.nc)) throw new Error('The number of rows or columns in the data does not match the range');
        vals.forEach((row, i) => {
          const rr = this.r - 1 + i;
          while (this.sheet.data.length <= rr) this.sheet.data.push([]);
          row.forEach((v, j) => {
            if (typeof v === 'string' && v.charAt(0) === "'") v = v.slice(1);
            else if (typeof v === 'string' && v.charAt(0) === '=') throw new Error('Formula written to sheet: ' + v);
            this.sheet.data[rr][this.c - 1 + j] = v;
          });
        });
        return this;
      }
      setNumberFormat() { return this; }
      setFontWeight() { return this; }
      setBackground() { return this; }
      setFontColor() { return this; }
    }
    class Sheet {
      constructor(name) { this.name = name; this.data = []; }
      getName() { return this.name; }
      getLastRow() { let n = this.data.length; while (n > 0 && !(this.data[n - 1] || []).some((v) => v !== '' && v !== undefined && v !== null)) n--; return n; }
      getLastColumn() { return this.data.reduce((m, r) => { let n = r.length; while (n > 0 && (r[n - 1] === '' || r[n - 1] === undefined)) n--; return Math.max(m, n); }, 0); }
      getMaxRows() { return Math.max(1000, this.data.length); }
      getMaxColumns() { return Math.max(26, this.getLastColumn()); }
      getDataRange() { return new Range(this, 1, 1, Math.max(1, this.getLastRow()), Math.max(1, this.getLastColumn())); }
      getRange(r, c, nr, nc) { return new Range(this, r, c, nr || 1, nc || 1); }
      appendRow(row) { this.data.splice(this.getLastRow(), 0, row.map((v) => (typeof v === 'string' && v.charAt(0) === "'" ? v.slice(1) : v))); return this; }
      deleteRow(n) { this.data.splice(n - 1, 1); return this; }
      clearContents() { this.data = []; return this; }
      setFrozenRows() { return this; }
    }
    class Spreadsheet {
      constructor() { this.sheets = []; }
      getId() { return 'mock-sheet'; }
      getUrl() { return 'https://docs.google.com/spreadsheets/d/mock-sheet/edit'; }
      getSpreadsheetTimeZone() { return 'Asia/Kuala_Lumpur'; }
      getSheetByName(n) { return this.sheets.find((s) => s.name === n) || null; }
      getSheets() { return this.sheets.slice(); }
      insertSheet(n) { const s = new Sheet(n); this.sheets.push(s); return s; }
      deleteSheet(s) { this.sheets = this.sheets.filter((x) => x !== s); }
    }
    const ss = new Spreadsheet();

    const pad = (n) => String(n).padStart(2, '0');
    const services = {
      SpreadsheetApp: { getActive: () => ss, getActiveSpreadsheet: () => ss, openById: () => ss, getUi: () => { throw new Error('No UI in mock'); } },
      Utilities: {
        formatDate(d, tz, fmt) {
          const x = new Date(d.getTime() + tzOffsetMin * 60000);
          const Y = x.getUTCFullYear(), M = pad(x.getUTCMonth() + 1), D = pad(x.getUTCDate()), hh = pad(x.getUTCHours()), mm = pad(x.getUTCMinutes());
          return fmt.replace('yyyy', Y).replace('MM', M).replace('dd', D).replace('HH', hh).replace('mm', mm);
        },
        getUuid: () => 'xxxxxxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16)),
      },
      Session: {
        getActiveUser: () => ({ getEmail: () => activeEmail }),
        getEffectiveUser: () => ({ getEmail: () => ownerEmail }),
        getScriptTimeZone: () => 'Asia/Kuala_Lumpur',
      },
      LockService: { getScriptLock: () => ({ tryLock: () => true, waitLock: () => {}, releaseLock: () => {} }) },
      PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k in props ? props[k] : null), setProperty: (k, v) => { props[k] = v; } }) },
      HtmlService: { createHtmlOutputFromFile: () => ({ getContent: () => '' }), createTemplateFromFile: () => ({ evaluate: () => ({}) }), XFrameOptionsMode: { DEFAULT: 0 } },
      MailApp: { sendEmail: (m) => mail.push(m) },
      ScriptApp: { getService: () => ({ getUrl: () => 'https://script.google.com/a/macros/mock/exec' }), getProjectTriggers: () => [], newTrigger: () => ({ timeBased: () => ({ everyDays: () => ({ atHour: () => ({ create: () => {} }) }) }) }), deleteTrigger: () => {} },
    };
    return {
      services: services,
      spreadsheet: ss,
      mail: mail,
      setUser(email) { activeEmail = email; },
      getUser() { return activeEmail; },
    };
  }

  const api = { makeMock: makeMock };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GasMock = api;
})(this);
