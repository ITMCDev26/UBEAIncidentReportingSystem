/* ui.js — toast notifications + Bootstrap modal helper, shared across pages */

// Global safety net: if ANY uncaught error happens anywhere in the app
// (a bad field render, a failed fetch, a typo), surface it as a toast
// instead of leaving the person staring at a button that "does nothing."
window.addEventListener("error", (e) => {
  console.error("Uncaught error:", e.error || e.message);
  if (typeof Toast !== "undefined") Toast.show("Something went wrong: " + (e.message || "unknown error"), true);
});
window.addEventListener("unhandledrejection", (e) => {
  console.error("Unhandled promise rejection:", e.reason);
  if (typeof Toast !== "undefined") Toast.show("Something went wrong: " + (e.reason && e.reason.message ? e.reason.message : e.reason), true);
});

const Toast = {
  show(msg, isError) {
    let wrap = document.querySelector(".toast-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "toast-wrap";
      document.body.appendChild(wrap);
    }
    const t = document.createElement("div");
    t.className = "toast" + (isError ? " error" : "");
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => t.remove(), 4200);
  }
};

const Modal = {
  open(innerHTML, opts) {
    this.close();
    const el = document.createElement("div");
    el.className = "modal fade";
    el.id = "activeModal";
    el.tabIndex = -1;
    el.innerHTML = `<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">${innerHTML}</div></div>`;
    document.body.appendChild(el);
    this._instance = new bootstrap.Modal(el, { backdrop: (opts && opts.staticBackdrop) ? "static" : true });
    el.addEventListener("hidden.bs.modal", () => el.remove());
    this._instance.show();
  },
  close() {
    const el = document.getElementById("activeModal");
    if (el && this._instance) { this._instance.hide(); }
    else if (el) el.remove();
  }
};

/* Renders the shared app shell (sidebar + topbar + bottom tabs) into any
   authenticated page. Call AppShell.mount('history'|'new'|'admin'|'overview') */
const AppShell = {
  mount(active) {
    Auth.requireLogin();
    const session = Auth.getSession();
    const initials = (session.fullName || session.username || "?").slice(0, 2).toUpperCase();
    const isAdmin = session.role === "admin";

    const navItems = [
      { key: "overview", href: "dashboard.html#overview", icon: "📊", label: "Overview" },
      { key: "new", href: "new-report.html", icon: "➕", label: "New Report" },
      { key: "history", href: "dashboard.html#history", icon: "🗂️", label: "History" }
    ];
    if (isAdmin) navItems.push({ key: "admin", href: "admin.html", icon: "🛠️", label: "Admin" });

    const navHTML = navItems.map(n =>
      `<a class="nav-item ${n.key === active ? "active" : ""}" href="${n.href}">
        <span class="ic">${n.icon}</span><span>${n.label}</span></a>`).join("");

    document.querySelectorAll("[data-shell='sidebar']").forEach(el => {
      el.innerHTML = `
        <div class="login-brand"><div class="brand-mark">UB</div>
          <div><div class="login-title" style="font-size:15px;">${APP_CONFIG.orgName}</div>
          <div class="text-faint" style="font-size:11px;">Command Center</div></div></div>
        <nav>${navHTML}</nav>
        <div class="sidebar-foot">
          <div class="user-chip">
            <div class="user-avatar">${initials}</div>
            <div><div class="user-name">${session.fullName || session.username}</div>
            <div class="user-role">${isAdmin ? "Super Admin" : session.township}</div></div>
          </div>
          <button class="btn btn-ghost" style="width:100%;margin-top:10px;" onclick="Auth.logout()">Log Out</button>
          <div class="sidebar-status"><span class="status-dot"></span>SYSTEM ONLINE</div>
        </div>`;
    });

    document.querySelectorAll("[data-shell='bottomtabs']").forEach(el => {
      el.innerHTML = navHTML;
    });

    document.querySelectorAll("[data-shell='theme-btn']").forEach(el => {
      el.id = "themeToggle";
    });
  }
};
