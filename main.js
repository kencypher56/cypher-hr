/* ═══ CYPHER-HR Main Application Module ═══ */
const API = '';
const App = {
  token: localStorage.getItem('cypher_hr_token'),
  user: JSON.parse(localStorage.getItem('cypher_hr_user') || 'null'),
  theme: localStorage.getItem('cypher_hr_theme') || 'light',

  async init() {
    this.applyTheme(this.theme);
    if (this.token) {
      try {
        const me = await this.api('/api/auth/me');
        this.user = me;
        localStorage.setItem('cypher_hr_user', JSON.stringify(me));
        if (me.role === 'admin') Admin.showDashboard();
        else Employee.showDashboard();
      } catch { this.logout(); }
    } else {
      const status = await this.api('/api/system/status');
      if (!status.setupComplete) Setup.init(status);
      else Login.show();
    }
  },

  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('cypher_hr_theme', this.theme);
    this.applyTheme(this.theme);
    // Update theme icon in topbar
    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.innerHTML = icon(this.theme === 'light' ? 'moon' : 'sun', 18);
  },

  applyTheme(theme) {
    if (theme === 'dark') document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
  },

  async api(url, options = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    const res = await fetch(API + url, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  login(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem('cypher_hr_token', token);
    localStorage.setItem('cypher_hr_user', JSON.stringify(user));
    if (user.role === 'admin') Admin.showDashboard();
    else Employee.showDashboard();
  },

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('cypher_hr_token');
    localStorage.removeItem('cypher_hr_user');
    Login.show();
  },

  setView(html) {
    document.getElementById('app').innerHTML = html;
  },

  toast(msg, type = 'success') {
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `${icon(type === 'success' ? 'checkCircle' : 'x', 16)} <span>${msg}</span>`;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
  },

  formatDate(d) {
    if (!d) return '—';
    const dt = new Date(d);
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();
    return `${dd}:${mm}:${yyyy}`;
  },

  statusBadge(status) {
    const map = { pending: 'warning', approved: 'success', rejected: 'danger' };
    return `<span class="badge badge-${map[status] || 'info'}">${status.charAt(0).toUpperCase()+status.slice(1)}</span>`;
  },

  avatar(user) {
    const c = user.avatar_color || '#1570ef';
    const initials = (user.first_name?.[0] || '') + (user.last_name?.[0] || '');
    return `<div class="avatar" style="background:${c}">${initials.toUpperCase()}</div>`;
  }
};

/* ═══ Modal Utility ═══ */
function showModal(title, content, footer = '') {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header"><h3>${title}</h3><button class="btn-icon" onclick="closeModal()">${icon('x')}</button></div>
      <div class="modal-body">${content}</div>
      ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  requestAnimationFrame(() => overlay.classList.add('show'));
}

function closeModal() {
  const m = document.querySelector('.modal-overlay');
  if (m) { m.classList.remove('show'); setTimeout(() => m.remove(), 200); }
}

document.addEventListener('DOMContentLoaded', () => App.init());
