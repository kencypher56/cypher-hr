/* ═══ CYPHER-HR Employee Module ═══ */
const Employee = {
  async showDashboard() {
    App.setView(this.layout('dashboard', await this.dashboardContent()));
    this.bindNav();
  },

  layout(active, content) {
    const navItems = [
      { id: 'dashboard', icon: 'home', label: 'Dashboard' },
      { id: 'apply', icon: 'plus', label: 'Apply Leave' },
      { id: 'history', icon: 'clock', label: 'Leave History' },
      { id: 'reports', icon: 'report', label: 'My Reports' },
    ];
    return `
    <div class="app-layout">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="brand-logo">${icon('shield', 20)}</div>
          <span>CYPHER-HR</span>
        </div>
        <nav class="sidebar-nav">
          ${navItems.map(n => `
            <a class="nav-item ${active === n.id ? 'active' : ''}" data-view="${n.id}">
              ${icon(n.icon, 20)}<span>${n.label}</span>
            </a>`).join('')}
        </nav>
        <div class="sidebar-footer">
          <div class="user-info">
            ${App.avatar(App.user)}
            <div><strong>${App.user.first_name} ${App.user.last_name}</strong><small>${App.user.position || 'Employee'}</small></div>
          </div>
          <a class="nav-item" onclick="App.logout()">${icon('logout', 20)}<span>Logout</span></a>
        </div>
      </aside>
      <main class="main-content">
        <header class="topbar">
          <h2>${navItems.find(n=>n.id===active)?.label || 'Dashboard'}</h2>
          <div class="topbar-right">
            <button class="btn btn-icon-sm" id="themeToggleBtn" onclick="App.toggleTheme()" style="margin-right:12px">${icon(App.theme === 'light' ? 'moon' : 'sun', 18)}</button>
            <span class="greeting">Hello, ${App.user.first_name}!</span>
          </div>
        </header>
        <div class="content-area" id="contentArea">${content}</div>
      </main>
    </div>`;
  },

  bindNav() {
    document.querySelectorAll('.nav-item[data-view]').forEach(el => {
      el.addEventListener('click', () => this.navigate(el.dataset.view));
    });
  },

  async navigate(view) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`[data-view="${view}"]`)?.classList.add('active');
    document.querySelector('.topbar h2').textContent =
      { dashboard: 'Dashboard', apply: 'Apply Leave', history: 'Leave History', reports: 'My Reports' }[view];
    const area = document.getElementById('contentArea');
    area.style.opacity = '0';
    setTimeout(async () => {
      if (view === 'dashboard') area.innerHTML = await this.dashboardContent();
      else if (view === 'apply') area.innerHTML = await this.applyContent();
      else if (view === 'history') area.innerHTML = await this.historyContent();
      else if (view === 'reports') area.innerHTML = await Reports.employeeView();
      area.style.opacity = '1';
    }, 200);
  },

  async dashboardContent() {
    try {
      const [balances, leaves] = await Promise.all([
        App.api('/api/balances'),
        App.api('/api/leaves')
      ]);
      const recent = leaves.slice(0, 5);
      const pending = leaves.filter(l => l.status === 'pending').length;
      const approved = leaves.filter(l => l.status === 'approved').length;

      return `
        <div class="emp-profile-card">
          <div class="emp-profile-info">
            ${App.avatar(App.user)}
            <div>
              <h3>${App.user.first_name} ${App.user.last_name}</h3>
              <p>${App.user.position || ''} ${App.user.department ? '• ' + App.user.department : ''}</p>
              <p class="text-muted">${App.user.email}</p>
            </div>
          </div>
          <div class="emp-quick-stats">
            <div class="quick-stat"><span class="qs-num">${pending}</span><span class="qs-label">Pending</span></div>
            <div class="quick-stat"><span class="qs-num">${approved}</span><span class="qs-label">Approved</span></div>
            <div class="quick-stat"><span class="qs-num">${leaves.length}</span><span class="qs-label">Total</span></div>
          </div>
        </div>

        <h3 class="section-title">Leave Allowances</h3>
        <div class="balances-grid">
          ${balances.filter(b => b.is_enabled).map(b => {
            const pct = b.monthly_limit > 0 ? Math.round((b.balance / b.monthly_limit) * 100) : 0;
            const color = pct > 50 ? '#10b981' : pct > 20 ? '#f59e0b' : '#ef4444';
            return `
            <div class="balance-card">
              <div class="balance-card-header">
                <span>${b.leave_type}</span>
                <span class="balance-fraction" style="color:${color}">${b.balance}/${b.monthly_limit}</span>
              </div>
              <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${color}"></div></div>
            </div>`;
          }).join('')}
        </div>

        <h3 class="section-title">Recent Requests</h3>
        <div class="card">
          <div class="card-body">
            ${recent.length === 0 ? '<p class="empty-state">No leave requests yet</p>' :
              `<table class="table"><thead><tr><th>Type</th><th>Dates</th><th>Reason</th><th>Status</th></tr></thead><tbody>
              ${recent.map(l => `<tr>
                <td>${l.leave_type}</td>
                <td>${App.formatDate(l.start_date)} - ${App.formatDate(l.end_date)}</td>
                <td>${l.reason || '—'}</td>
                <td>${App.statusBadge(l.status)}</td>
              </tr>`).join('')}
              </tbody></table>`}
          </div>
        </div>`;
    } catch (err) { return `<div class="error-state">${err.message}</div>`; }
  },

  async applyContent() {
    try {
      const [policies, balances] = await Promise.all([
        App.api('/api/policies'),
        App.api('/api/balances')
      ]);
      const enabled = policies.filter(p => p.is_enabled);
      return `
        <div class="card" style="max-width:600px">
          <div class="card-header"><h3>${icon('calendar', 20)} Apply for Leave</h3></div>
          <div class="card-body">
            <form id="applyForm" onsubmit="Employee.submitLeave(event)">
              <div class="form-group">
                <label>Leave Type</label>
                <select id="leaveType" required>
                  <option value="">Select leave type</option>
                  ${enabled.map(p => {
                    const bal = balances.find(b => b.leave_policy_id === p.id);
                    const remaining = bal ? bal.balance : 0;
                    return `<option value="${p.id}" ${remaining <= 0 ? 'disabled' : ''}>${p.leave_type} (${remaining} remaining)</option>`;
                  }).join('')}
                </select>
              </div>
              <div class="form-row">
                <div class="form-group" style="position:relative"><label>Start Date</label>${dateInput('leaveStart', true)}</div>
                <div class="form-group" style="position:relative"><label>End Date</label>${dateInput('leaveEnd', true)}</div>
              </div>
              <div class="form-group"><label>Reason</label><textarea id="leaveReason" rows="3" placeholder="Describe your reason..."></textarea></div>
              <button type="submit" class="btn btn-primary btn-full">Submit Request ${icon('chevronRight', 18)}</button>
              <div id="applyError" class="form-error" style="display:none"></div>
            </form>
          </div>
        </div>`;
    } catch (err) { return `<div class="error-state">${err.message}</div>`; }
  },

  async submitLeave(e) {
    e.preventDefault();
    const err = document.getElementById('applyError');
    err.style.display = 'none';
    try {
      await App.api('/api/leaves', {
        method: 'POST',
        body: JSON.stringify({
          leave_policy_id: parseInt(document.getElementById('leaveType').value),
          start_date: parseDateInput('leaveStart'),
          end_date: parseDateInput('leaveEnd'),
          reason: document.getElementById('leaveReason').value
        })
      });
      App.toast('Leave request submitted!');
      this.navigate('history');
    } catch (error) { err.textContent = error.message; err.style.display = 'block'; }
  },

  async historyContent() {
    try {
      const leaves = await App.api('/api/leaves');
      return `
        <div class="card">
          <div class="card-header"><h3>All Leave Requests</h3></div>
          <div class="card-body">
            ${leaves.length === 0 ? '<p class="empty-state">No leave history</p>' :
              `<table class="table"><thead><tr><th>Type</th><th>Start</th><th>End</th><th>Reason</th><th>Status</th><th>Remarks</th></tr></thead><tbody>
              ${leaves.map(l => `<tr>
                <td>${l.leave_type}</td>
                <td>${App.formatDate(l.start_date)}</td>
                <td>${App.formatDate(l.end_date)}</td>
                <td>${l.reason || '—'}</td>
                <td>${App.statusBadge(l.status)}</td>
                <td>${l.admin_remarks || '—'}</td>
              </tr>`).join('')}
              </tbody></table>`}
          </div>
        </div>`;
    } catch (err) { return `<div class="error-state">${err.message}</div>`; }
  }
};
