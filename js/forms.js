/* ============================================================
   forms.js — renders Initial / Progress / Information forms
   from FORM_SCHEMAS, handles conditional fields, township
   carousel, icon-choice inputs, autofill/carry-forward between
   linked reports, and submission routing.

   Report linking rules implemented here (see README for full spec):
   - Initial report gets a fresh running number per township:
       <CODE>-IR_001, <CODE>-IR_002, ...   (assigned by the backend)
   - First Progress report on that incident reuses the same number:
       <CODE>-PR_001
     Additional progress updates on the SAME still-open incident:
       <CODE>-PR_001-2, <CODE>-PR_001-3, ...
   - Information report (outside-township, supported cases) starts
     its own counter and always carries a series suffix:
       <CODE>-IP_001-1, then follow-ups <CODE>-IP_001-2, -3, ...
       A new information incident becomes <CODE>-IP_002-1
   - Once a report's "resolved" value is Yes, every report tied to
     that incident number becomes read-only.
   ============================================================ */

const FormPage = {
  qs: new URLSearchParams(window.location.search),
  type: null,          // 'initial' | 'progress' | 'information'
  mode: null,           // 'new' | 'followup' | 'edit'
  refId: null,          // id of the report we're branching from / editing
  config: null,
  prefill: {},
  values: {},
  locked: false,

  async init() {
    Auth.requireLogin();
    this.type = this.qs.get("type") || "initial";
    this.mode = this.qs.get("mode") || "new";
    this.refId = this.qs.get("ref");

    document.getElementById("formTitle").textContent = this.titleFor(this.type, this.mode);

    try {
      this.config = (await API.getConfig()) || APP_CONFIG;
    } catch (e) {
      this.config = APP_CONFIG; // fallback so the form still renders offline
    }

    if (this.refId) {
      try {
        const ref = await API.getReport(this.refTypeFor(), this.refId);
        this.applyCarryForward(ref);
        if (this.mode === "edit") {
          this.values = { ...ref };
          this.locked = ref.resolved === "Yes";
        }
      } catch (e) {
        Toast.show("Could not load the source report: " + e.message, true);
      }
    }

    const session = Auth.getSession();
    if (!this.values.reportedBy) this.values.reportedBy = session.fullName || session.username;
    if (!this.values.township && session.township && session.township !== "ALL") {
      this.values.township = session.township;
    }

    this.render();
  },

  titleFor(type, mode) {
    const names = { initial: "Initial Report", progress: "Progress Report", information: "Information Report" };
    if (mode === "edit") return "Edit " + names[type];
    if (mode === "followup") return "New Update — " + names[type];
    return "New " + names[type];
  },

  refTypeFor() {
    // the report we branch FROM: initial->progress uses 'initial', a follow-up uses same type
    return this.type === "progress" && this.mode === "new" ? "initial" : this.type;
  },

  applyCarryForward(ref) {
    const carryList = (this.type === "progress" && this.mode === "new")
      ? CARRY_FROM_INITIAL_TO_PROGRESS
      : CARRY_FROM_PREVIOUS_SERIES;
    carryList.forEach(k => { if (ref[k] !== undefined) this.values[k] = ref[k]; });

    if (this.type === "progress" && this.mode === "followup") {
      // ref here is a PREVIOUS PROGRESS row, which already points back at
      // the original Initial report via its own linkId — reuse that so the
      // backend keeps counting updates under the same incident thread.
      this.values._linkId = ref.linkId;
    } else {
      // initial->progress (ref.id is the Initial report's own id), or an
      // information follow-up (ref.id is the previous entry in the series).
      this.values._linkId = ref.id;
    }
    this.values._linkTownship = ref.township;
  },

  render() {
    const root = document.getElementById("formRoot");
    root.innerHTML = "";
    if (this.locked) {
      document.getElementById("lockedBanner").classList.remove("hidden");
    }

    const fieldKeys = FORM_SCHEMAS[this.type];
    let currentSection = null;

    fieldKeys.forEach(key => {
      const field = FIELD_LIBRARY[key];
      if (!field) return;
      root.appendChild(this.renderField(field));
    });

    document.getElementById("submitBtn").disabled = this.locked;
    document.getElementById("submitBtn").onclick = () => this.submit();
    this.wireConditionals();
  },

  fieldWrap(field, inner) {
    const wrap = document.createElement("div");
    wrap.className = "field" + (["textarea", "township-carousel", "icon-choice", "yesno"].includes(field.type) ? " full" : "");
    wrap.dataset.key = field.key;
    if (field.showIf) wrap.dataset.showIf = JSON.stringify(field.showIf);
    const label = document.createElement("label");
    label.innerHTML = field.label + (field.required ? ' <span class="required-mark">*</span>' : "");
    wrap.appendChild(label);
    wrap.appendChild(inner);
    return wrap;
  },

  renderField(field) {
    const disabled = this.locked ? "disabled" : "";
    const val = this.values[field.key] ?? "";

    if (field.type === "select") {
      const sel = document.createElement("select");
      sel.id = "f_" + field.key; sel.disabled = this.locked;
      sel.innerHTML = '<option value="">Select…</option>' +
        (this.config[field.optionsFrom] || []).map(opt =>
          `<option value="${opt}" ${opt === val ? "selected" : ""}>${opt}</option>`).join("");
      sel.addEventListener("change", () => this.wireConditionals());
      return this.fieldWrap(field, sel);
    }

    if (field.type === "text") {
      const inp = document.createElement("input");
      inp.type = "text"; inp.id = "f_" + field.key; inp.value = val; inp.disabled = this.locked;
      return this.fieldWrap(field, inp);
    }

    if (field.type === "date") {
      const inp = document.createElement("input");
      inp.type = "date"; inp.id = "f_" + field.key;
      inp.value = val || new Date().toISOString().slice(0, 10);
      inp.disabled = this.locked;
      return this.fieldWrap(field, inp);
    }

    if (field.type === "time") {
      const inp = document.createElement("input");
      inp.type = "time"; inp.id = "f_" + field.key; inp.value = val; inp.disabled = this.locked;
      return this.fieldWrap(field, inp);
    }

    if (field.type === "textarea") {
      const ta = document.createElement("textarea");
      ta.id = "f_" + field.key; ta.value = val; ta.disabled = this.locked;
      return this.fieldWrap(field, ta);
    }

    if (field.type === "icon-choice") {
      const group = document.createElement("div");
      group.className = "icon-choice-group";
      group.id = "f_" + field.key;
      (this.config[field.optionsFrom] || []).forEach(opt => {
        const value = opt.value || opt;
        const icon = opt.icon || "";
        const cls = opt.className || "";
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "icon-choice" + (value === val ? " selected " + cls : "");
        btn.dataset.value = value; btn.dataset.cls = cls;
        btn.innerHTML = `<span class="ic">${icon}</span> ${opt.label || value}`;
        if (!this.locked) {
          btn.addEventListener("click", () => {
            [...group.children].forEach(c => { c.classList.remove("selected"); c.classList.remove(c.dataset.cls); });
            btn.classList.add("selected", cls);
            group.dataset.value = value;
          });
        } else btn.disabled = true;
        group.appendChild(btn);
      });
      group.dataset.value = val;
      return this.fieldWrap(field, group);
    }

    if (field.type === "yesno") {
      const group = document.createElement("div");
      group.className = "yesno-group icon-choice-group";
      group.id = "f_" + field.key;
      [{ v: "No", ic: "🟠" }, { v: "Yes", ic: "✅" }].forEach(o => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "icon-choice" + (o.v === val ? " selected" : "");
        btn.innerHTML = `<span class="ic">${o.ic}</span> ${o.v}`;
        btn.dataset.value = o.v;
        if (!this.locked) {
          btn.addEventListener("click", () => {
            [...group.children].forEach(c => c.classList.remove("selected"));
            btn.classList.add("selected");
            group.dataset.value = o.v;
          });
        } else btn.disabled = true;
        group.appendChild(btn);
      });
      group.dataset.value = val || "No";
      return this.fieldWrap(field, group);
    }

    if (field.type === "township-carousel") {
      const wrap = document.createElement("div");
      wrap.className = "township-carousel";
      wrap.id = "f_" + field.key;
      (this.config.townships || []).forEach(t => {
        const card = document.createElement("div");
        card.className = "township-card" + (t.name === val ? " selected" : "");
        card.dataset.value = t.name; card.dataset.code = t.code;
        card.innerHTML = `<div class="township-logo">${t.code.slice(0, 2)}</div>
          <div class="township-name">${t.name}</div><div class="township-code">${t.code}</div>`;
        if (!this.locked) {
          card.addEventListener("click", () => {
            [...wrap.children].forEach(c => c.classList.remove("selected"));
            card.classList.add("selected");
            wrap.dataset.value = t.name; wrap.dataset.code = t.code;
          });
        }
        wrap.appendChild(card);
      });
      const selected = (this.config.townships || []).find(t => t.name === val);
      if (selected) wrap.dataset.code = selected.code;
      wrap.dataset.value = val;
      return this.fieldWrap(field, wrap);
    }

    const fallback = document.createElement("input");
    fallback.id = "f_" + field.key; fallback.value = val;
    return this.fieldWrap(field, fallback);
  },

  wireConditionals() {
    document.querySelectorAll("[data-show-if]").forEach(wrap => {
      const cond = JSON.parse(wrap.dataset.showIf);
      const sourceEl = document.getElementById("f_" + cond.field);
      const sourceVal = sourceEl ? sourceEl.value : null;
      wrap.classList.toggle("hidden", sourceVal !== cond.equals);
    });
  },

  collect() {
    const data = {};
    FORM_SCHEMAS[this.type].forEach(key => {
      const field = FIELD_LIBRARY[key];
      const el = document.getElementById("f_" + key);
      if (!el) return;
      if (["icon-choice", "yesno", "township-carousel"].includes(field.type)) {
        data[key] = el.dataset.value || "";
      } else {
        data[key] = el.value || "";
      }
    });
    if (this.values._linkId) data._linkId = this.values._linkId;
    return data;
  },

  validate(data) {
    for (const key of FORM_SCHEMAS[this.type]) {
      const field = FIELD_LIBRARY[key];
      if (field.showIf) {
        const parentVal = data[field.showIf.field];
        if (parentVal !== field.showIf.equals) continue;
      }
      if (field.required && !data[key]) {
        Toast.show(`"${field.label}" is required.`, true);
        return false;
      }
    }
    return true;
  },

  async submit() {
    const data = this.collect();
    if (!this.validate(data)) return;
    const btn = document.getElementById("submitBtn");
    btn.disabled = true; btn.textContent = "Submitting…";
    try {
      let result;
      if (this.mode === "edit") {
        result = await API.updateReport(this.type, this.refId, data);
        Toast.show("Report updated: " + result.id);
      } else if (this.type === "initial") {
        result = await API.createInitialReport(data);
        Toast.show("Initial report filed: " + result.id);
      } else if (this.type === "progress") {
        result = await API.createProgressReport(data);
        Toast.show("Progress report filed: " + result.id);
      } else {
        result = await API.createInformationReport(data);
        Toast.show("Information report filed: " + result.id);
      }
      setTimeout(() => { window.location.href = "dashboard.html#history"; }, 900);
    } catch (e) {
      Toast.show(e.message || "Submission failed", true);
      btn.disabled = false; btn.textContent = "Submit Report";
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("formRoot")) FormPage.init();
});
