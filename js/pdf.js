/* pdf.js — builds a print-friendly preview of a report and triggers
   the browser's native "Save as PDF" via window.print(). No external
   library needed, keeping the whole app dependency-free. */
const ReportPrint = {
  labelFor(key) {
    return (FIELD_LIBRARY[key] && FIELD_LIBRARY[key].label) || key;
  },

  buildRows(report, type) {
    const keys = FORM_SCHEMAS[type] || Object.keys(report);
    return keys
      .filter(k => report[k] !== undefined && report[k] !== "")
      .map(k => `<div class="pr-row"><div class="pr-label">${this.labelFor(k)}</div>
        <div class="pr-value">${String(report[k]).replace(/</g, "&lt;")}</div></div>`)
      .join("");
  },

  preview(report, type) {
    const title = { initial: "Initial Report", progress: "Progress Report", information: "Information Report" }[type];
    const html = `
      <div class="modal-head">
        <h3 style="margin:0;">Report Preview</h3>
        <button class="icon-btn" onclick="Modal.close()">✕</button>
      </div>
      <div id="printArea" class="print-sheet">
        <h2>${title} — <span class="mono">${report.id}</span></h2>
        <div style="color:#666;margin-bottom:12px;">${APP_CONFIG.orgName}</div>
        ${this.buildRows(report, type)}
      </div>
      <div class="form-footer" style="border:none;">
        <button class="btn btn-ghost" onclick="Modal.close()">Close</button>
        <button class="btn btn-primary" onclick="window.print()">🖨️ Print / Save as PDF</button>
      </div>`;
    Modal.open(html);
  }
};
