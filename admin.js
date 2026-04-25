/* ═══ CYPHER-HR Admin Module ═══ */
const Admin = {
  async showDashboard() {
    App.setView(this.layout('dashboard', await this.dashboardContent()));
    this.bindNav();
  },

  layout(active, content) {
    const navItems = [
      { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
      { id: 'employees', icon: 'users', label: 'Employees' },
      { id: 'leaves', icon: 'calendar', label: 'Leave Requests' },
      { id: 'policies', icon: 'settings', label: 'Policies' },
      { id: 'reports', icon: 'report', label: 'Reports' },
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
            <div><strong>${App.user.first_name} ${App.user.last_name}</strong><small>Administrator</small></div>
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
      { dashboard: 'Dashboard', employees: 'Employees', leaves: 'Leave Requests', policies: 'Policies', reports: 'Reports' }[view];
    const area = document.getElementById('contentArea');
    area.style.opacity = '0';
    setTimeout(async () => {
      if (view === 'dashboard') area.innerHTML = await this.dashboardContent();
      else if (view === 'employees') area.innerHTML = await this.employeesContent();
      else if (view === 'leaves') area.innerHTML = await this.leavesContent();
      else if (view === 'policies') area.innerHTML = await this.policiesContent();
      else if (view === 'reports') area.innerHTML = await Reports.adminView();
      area.style.opacity = '1';
    }, 200);
  },

  async dashboardContent() {
    try {
      const stats = await App.api('/api/dashboard/stats');
      const leaves = await App.api('/api/leaves');
      const pending = leaves.filter(l => l.status === 'pending').slice(0, 5);
      return `
        <div class="stats-grid">
          <div class="stat-card stat-purple"><div class="stat-icon">${icon('users', 28)}</div><div class="stat-info"><span class="stat-num">${stats.totalEmployees}</span><span class="stat-label">Total Employees</span></div></div>
          <div class="stat-card stat-green"><div class="stat-icon">${icon('check', 28)}</div><div class="stat-info"><span class="stat-num">${stats.activeEmployees}</span><span class="stat-label">Active Employees</span></div></div>
          <div class="stat-card stat-amber"><div class="stat-icon">${icon('clock', 28)}</div><div class="stat-info"><span class="stat-num">${stats.pendingLeaves}</span><span class="stat-label">Pending Requests</span></div></div>
          <div class="stat-card stat-blue"><div class="stat-icon">${icon('calendar', 28)}</div><div class="stat-info"><span class="stat-num">${stats.approvedToday}</span><span class="stat-label">Approved Today</span></div></div>
        </div>
        <div class="card">
          <div class="card-header"><h3>Recent Pending Requests</h3></div>
          <div class="card-body">
            ${pending.length === 0 ? '<p class="empty-state">No pending requests</p>' :
              `<table class="table"><thead><tr><th>Employee</th><th>Leave Type</th><th>Dates</th><th>Status</th><th>Actions</th></tr></thead><tbody>
              ${pending.map(l => `<tr>
                <td><div class="user-cell">${App.avatar(l)}<span>${l.first_name} ${l.last_name}</span></div></td>
                <td>${l.leave_type}</td>
                <td>${App.formatDate(l.start_date)} - ${App.formatDate(l.end_date)}</td>
                <td>${App.statusBadge(l.status)}</td>
                <td class="action-cell">
                  <button class="btn btn-sm btn-success" onclick="Leaves.approve(${l.id})">${icon('check',14)} Approve</button>
                  <button class="btn btn-sm btn-danger" onclick="Leaves.reject(${l.id})">${icon('x',14)} Reject</button>
                </td>
              </tr>`).join('')}
              </tbody></table>`}
          </div>
        </div>`;
    } catch (err) { return `<div class="error-state">Error loading dashboard: ${err.message}</div>`; }
  },

  async employeesContent() {
    try {
      const employees = await App.api('/api/employees');
      return `
        <div class="content-header">
          <div class="search-box">${icon('search',18)}<input type="text" placeholder="Search employees..." oninput="Admin.filterEmployees(this.value)"></div>
          <div style="display:flex; gap:10px;">
            <button class="btn btn-outline" onclick="AddBulkEmployees.showModal()">${icon('download',18)} Import Employees</button>
            <button class="btn btn-primary" onclick="Admin.showAddEmployee()">${icon('plus',18)} Add Employee</button>
          </div>
        </div>
        <div class="employees-grid" id="employeesGrid">
          ${employees.length === 0 ? '<p class="empty-state">No employees yet. Add your first employee!</p>' :
            employees.map(emp => `
              <div class="employee-card" data-name="${emp.first_name} ${emp.last_name}">
                <div class="emp-header">
                  ${App.avatar(emp)}
                  <div>
                    <h4>${emp.first_name} ${emp.last_name}</h4>
                    <span class="text-muted">${emp.email}</span>
                  </div>
                  <span class="badge ${emp.is_active ? 'badge-success' : 'badge-danger'}">${emp.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <div class="emp-details">
                  <div class="emp-detail">${icon('briefcase',14)} ${emp.department || '—'}</div>
                  <div class="emp-detail">${icon('calendar',14)} ${emp.position || '—'}</div>
                </div>
                <div class="emp-actions">
                  <button class="btn btn-sm btn-outline" onclick='Admin.showEditEmployee(${JSON.stringify(emp).replace(/'/g,"&#39;")})'>${icon('edit',14)} Edit</button>
                  <button class="btn btn-sm btn-outline" onclick="Admin.showResetPassword(${emp.id},'${emp.first_name} ${emp.last_name}')">${icon('lock',14)} Reset Pwd</button>
                  <button class="btn btn-sm btn-outline" onclick="Admin.showBalances(${emp.id},'${emp.first_name} ${emp.last_name}')">${icon('calendar',14)} Leave Allowances</button>
                  <button class="btn btn-sm btn-outline" onclick="Admin.toggleEmployee(${emp.id})">${emp.is_active ? icon('x',14)+' Deactivate' : icon('check',14)+' Activate'}</button>
                  <button class="btn btn-sm btn-danger" onclick="Admin.deleteEmployee(${emp.id},'${emp.first_name}')">${icon('trash',14)}</button>
                </div>
              </div>`).join('')}
        </div>`;
    } catch (err) { return `<div class="error-state">${err.message}</div>`; }
  },

  filterEmployees(q) {
    document.querySelectorAll('.employee-card').forEach(c => {
      c.style.display = c.dataset.name.toLowerCase().includes(q.toLowerCase()) ? '' : 'none';
    });
  },

  showAddEmployee() {
    showModal('Add Employee', `
      <form id="addEmpForm" onsubmit="Admin.addEmployee(event)">
        <div class="form-row">
          <div class="form-group"><label>First Name *</label><input type="text" id="empFirst" required></div>
          <div class="form-group"><label>Last Name *</label><input type="text" id="empLast" required></div>
        </div>
        <div class="form-group"><label>Email *</label><input type="email" id="empEmail" required></div>
        <div class="form-group"><label>Password *</label><input type="password" id="empPassword" required minlength="6"></div>
        <div class="form-row">
          <div class="form-group"><label>Department</label><input type="text" id="empDept"></div>
          <div class="form-group"><label>Position</label><input type="text" id="empPos"></div>
        </div>
        <div class="form-group"><label>Phone</label><input type="tel" id="empPhone"></div>
        <div id="addEmpError" class="form-error" style="display:none"></div>
      </form>`,
      `<button class="btn btn-primary" onclick="document.getElementById('addEmpForm').requestSubmit()">Add Employee</button>`
    );
  },

  async addEmployee(e) {
    e.preventDefault();
    try {
      await App.api('/api/employees', {
        method: 'POST',
        body: JSON.stringify({
          first_name: document.getElementById('empFirst').value,
          last_name: document.getElementById('empLast').value,
          email: document.getElementById('empEmail').value,
          password: document.getElementById('empPassword').value,
          department: document.getElementById('empDept').value,
          position: document.getElementById('empPos').value,
          phone: document.getElementById('empPhone').value
        })
      });
      closeModal();
      App.toast('Employee added successfully');
      this.navigate('employees');
    } catch (err) {
      const el = document.getElementById('addEmpError');
      el.textContent = err.message; el.style.display = 'block';
    }
  },

  async deleteEmployee(id, name) {
    if (!confirm(`Delete employee "${name}"? This cannot be undone.`)) return;
    try {
      await App.api(`/api/employees/${id}`, { method: 'DELETE' });
      App.toast('Employee deleted');
      this.navigate('employees');
    } catch (err) { App.toast(err.message, 'error'); }
  },

  async toggleEmployee(id) {
    try {
      await App.api(`/api/employees/${id}/toggle`, { method: 'PUT' });
      App.toast('Employee status updated');
      this.navigate('employees');
    } catch (err) { App.toast(err.message, 'error'); }
  },

  showEditEmployee(emp) {
    showModal('Edit Employee', `
      <form id="editEmpForm" onsubmit="Admin.editEmployee(event, ${emp.id})">
        <div class="form-row">
          <div class="form-group"><label>First Name *</label><input type="text" id="editFirst" value="${emp.first_name}" required></div>
          <div class="form-group"><label>Last Name *</label><input type="text" id="editLast" value="${emp.last_name}" required></div>
        </div>
        <div class="form-group"><label>Email *</label><input type="email" id="editEmail" value="${emp.email}" required></div>
        <div class="form-row">
          <div class="form-group"><label>Department</label><input type="text" id="editDept" value="${emp.department || ''}"></div>
          <div class="form-group"><label>Position</label><input type="text" id="editPos" value="${emp.position || ''}"></div>
        </div>
        <div class="form-group"><label>Phone</label><input type="tel" id="editPhone" value="${emp.phone || ''}"></div>
        <div id="editEmpError" class="form-error" style="display:none"></div>
      </form>`,
      `<button class="btn btn-outline" onclick="closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="document.getElementById('editEmpForm').requestSubmit()">Save Changes</button>`
    );
  },

  async editEmployee(e, id) {
    e.preventDefault();
    try {
      await App.api(`/api/employees/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          first_name: document.getElementById('editFirst').value,
          last_name: document.getElementById('editLast').value,
          email: document.getElementById('editEmail').value,
          department: document.getElementById('editDept').value,
          position: document.getElementById('editPos').value,
          phone: document.getElementById('editPhone').value
        })
      });
      closeModal();
      App.toast('Employee updated successfully');
      this.navigate('employees');
    } catch (err) {
      const el = document.getElementById('editEmpError');
      el.textContent = err.message; el.style.display = 'block';
    }
  },

  showResetPassword(id, name) {
    showModal('Reset Password', `
      <p style="margin-bottom:16px;color:var(--text2)">Set a new password for <strong>${name}</strong></p>
      <form id="resetPwdForm" onsubmit="Admin.resetPassword(event, ${id})">
        <div class="form-group"><label>New Password *</label><input type="password" id="newPassword" required minlength="6" placeholder="Min 6 characters"></div>
        <div class="form-group"><label>Confirm Password *</label><input type="password" id="confirmPassword" required minlength="6" placeholder="Re-enter password"></div>
        <div id="resetPwdError" class="form-error" style="display:none"></div>
      </form>`,
      `<button class="btn btn-outline" onclick="closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="document.getElementById('resetPwdForm').requestSubmit()">Reset Password</button>`
    );
  },

  async resetPassword(e, id) {
    e.preventDefault();
    const pwd = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;
    const errEl = document.getElementById('resetPwdError');
    if (pwd !== confirm) {
      errEl.textContent = 'Passwords do not match';
      errEl.style.display = 'block';
      return;
    }
    try {
      await App.api(`/api/employees/${id}/reset-password`, {
        method: 'PUT',
        body: JSON.stringify({ new_password: pwd })
      });
      closeModal();
      App.toast('Password reset successfully');
    } catch (err) {
      errEl.textContent = err.message; errEl.style.display = 'block';
    }
  },

  async showBalances(userId, name) {
    try {
      const balances = await App.api(`/api/balances?user_id=${userId}`);
      showModal(`Leave Allowances — ${name}`, `
        <div class="balances-list">
          ${balances.map(b => `
            <div class="balance-row">
              <span class="balance-type">${b.leave_type}</span>
              <div class="balance-control">
                <button class="btn btn-icon-sm" onclick="Admin.adjustBalance(${b.id},-1,${userId},'${name}')">${icon('arrowDown',14)}</button>
                <span class="balance-num">${b.balance}</span>
                <button class="btn btn-icon-sm" onclick="Admin.adjustBalance(${b.id},1,${userId},'${name}')">${icon('arrowUp',14)}</button>
              </div>
              <span class="text-muted">/ ${b.monthly_limit} max</span>
            </div>`).join('')}
        </div>
      `);
    } catch (err) { App.toast(err.message, 'error'); }
  },

  async adjustBalance(balId, delta, userId, name) {
    try {
      const balances = await App.api(`/api/balances?user_id=${userId}`);
      const bal = balances.find(b => b.id === balId);
      if (!bal) return;
      const newBal = Math.max(0, bal.balance + delta);
      await App.api(`/api/balances/${balId}`, { method: 'PUT', body: JSON.stringify({ balance: newBal }) });
      closeModal();
      this.showBalances(userId, name);
    } catch (err) { App.toast(err.message, 'error'); }
  },

  async leavesContent() {
    return Leaves.adminView();
  },

  async policiesContent() {
    try {
      const policies = await App.api('/api/policies');
      return `
        <div class="policies-manage">
          ${policies.map(p => `
            <div class="policy-manage-card">
              <div class="policy-manage-header">
                <label class="switch">
                  <input type="checkbox" ${p.is_enabled ? 'checked' : ''} onchange="Admin.togglePolicy(${p.id}, this.checked, ${p.monthly_limit})">
                  <span class="slider"></span>
                </label>
                <div>
                  <h4>${p.leave_type}</h4>
                  <small class="text-muted">${p.description || ''}</small>
                </div>
              </div>
              <div class="policy-manage-limit">
                <label>Monthly Limit</label>
                <input type="number" value="${p.monthly_limit}" min="0" max="30" class="input-sm"
                  onchange="Admin.updatePolicyLimit(${p.id}, this.value, ${p.is_enabled})">
              </div>
            </div>`).join('')}
        </div>`;
    } catch (err) { return `<div class="error-state">${err.message}</div>`; }
  },

  async togglePolicy(id, enabled, limit) {
    try {
      await App.api(`/api/policies/${id}`, { method: 'PUT', body: JSON.stringify({ is_enabled: enabled, monthly_limit: limit }) });
      App.toast('Policy updated');
    } catch (err) { App.toast(err.message, 'error'); }
  },

  async updatePolicyLimit(id, limit, enabled) {
    try {
      await App.api(`/api/policies/${id}`, { method: 'PUT', body: JSON.stringify({ monthly_limit: parseInt(limit), is_enabled: enabled }) });
      App.toast('Limit updated');
    } catch (err) { App.toast(err.message, 'error'); }
  }
};
