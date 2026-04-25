/* ═══ CYPHER-HR Setup Wizard Module ═══ */
const Setup = {
  step: 1,
  status: null,
  defaultPolicies: [
    { leave_type: 'Casual Leave', monthly_limit: 2, is_enabled: true, description: 'General personal leave' },
    { leave_type: 'Half Day', monthly_limit: 4, is_enabled: true, description: 'Half day leave' },
    { leave_type: 'Medical', monthly_limit: 2, is_enabled: true, description: 'Medical/sick leave' },
    { leave_type: 'Hajj', monthly_limit: 1, is_enabled: false, description: 'Hajj pilgrimage leave' },
    { leave_type: 'Umrah', monthly_limit: 1, is_enabled: false, description: 'Umrah pilgrimage leave' },
    { leave_type: 'Christmas', monthly_limit: 1, is_enabled: true, description: 'Christmas holiday' },
    { leave_type: 'Easter', monthly_limit: 1, is_enabled: true, description: 'Easter holiday' },
    { leave_type: 'Halloween', monthly_limit: 1, is_enabled: false, description: 'Halloween holiday' },
    { leave_type: 'Marriage', monthly_limit: 1, is_enabled: true, description: 'Marriage leave' },
  ],

  init(status) {
    this.status = status;
    if (status.hasCompany) this.step = 2;
    if (status.hasAdmin) this.step = 3;
    this.render();
  },

  render() {
    App.setView(`
      <div class="setup-container">
        <div class="setup-header">
          <div class="brand-logo" style="margin:0 auto 16px">${icon('shield', 24)}</div>
          <h1>CYPHER-HR</h1>
          <p>Let's set up your HR system</p>
        </div>
        <div class="setup-steps">
          <div class="step ${this.step >= 1 ? 'active' : ''} ${this.step > 1 ? 'done' : ''}">
            <div class="step-num">${this.step > 1 ? icon('check', 14) : '1'}</div>
            <span>Company</span>
          </div>
          <div class="step-line ${this.step > 1 ? 'done' : ''}"></div>
          <div class="step ${this.step >= 2 ? 'active' : ''} ${this.step > 2 ? 'done' : ''}">
            <div class="step-num">${this.step > 2 ? icon('check', 14) : '2'}</div>
            <span>Admin</span>
          </div>
          <div class="step-line ${this.step > 2 ? 'done' : ''}"></div>
          <div class="step ${this.step >= 3 ? 'active' : ''}">
            <div class="step-num">3</div>
            <span>Policies</span>
          </div>
        </div>
        <div class="setup-card">${this.getStepContent()}</div>
      </div>
    `);
  },

  getStepContent() {
    if (this.step === 1) return `
      <h2>${icon('building', 22)} Company Profile</h2>
      <form id="companyForm" onsubmit="Setup.saveCompany(event)">
        <div class="form-group">
          <label>Company Name *</label>
          <input type="text" id="companyName" required placeholder="e.g. Cypher Technologies">
        </div>
        <div class="form-group">
          <label>Company Type *</label>
          <select id="companyIndustry" required>
            <option value="">Select company type</option>
            <option value="Technology">Technology</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Finance">Finance & Banking</option>
            <option value="Education">Education</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Retail">Retail & E-commerce</option>
            <option value="Consulting">Consulting</option>
            <option value="Real Estate">Real Estate</option>
            <option value="Media">Media & Entertainment</option>
            <option value="Non-Profit">Non-Profit</option>
            <option value="Government">Government</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary btn-full">Continue ${icon('chevronRight', 16)}</button>
        <div id="setupError" class="form-error" style="display:none"></div>
      </form>`;

    if (this.step === 2) return `
      <h2>${icon('shield', 22)} Create Admin Account</h2>
      <form id="adminForm" onsubmit="Setup.saveAdmin(event)">
        <div class="form-row">
          <div class="form-group"><label>First Name *</label><input type="text" id="adminFirst" required placeholder="John"></div>
          <div class="form-group"><label>Last Name *</label><input type="text" id="adminLast" required placeholder="Doe"></div>
        </div>
        <div class="form-group"><label>Email *</label><input type="email" id="adminEmail" required placeholder="admin@company.com"></div>
        <div class="form-group"><label>Password *</label><input type="password" id="adminPassword" required minlength="6" placeholder="Min 6 characters"></div>
        <button type="submit" class="btn btn-primary btn-full">Continue ${icon('chevronRight', 16)}</button>
        <div id="setupError" class="form-error" style="display:none"></div>
      </form>`;

    if (this.step === 3) return `
      <h2>${icon('calendar', 22)} Leave Policies</h2>
      <p class="text-muted" style="margin-bottom:20px">Configure leave types and monthly limits</p>
      <form id="policyForm" onsubmit="Setup.savePolicies(event)">
        <div class="policies-grid">
          ${this.defaultPolicies.map((p, i) => `
            <div class="policy-card">
              <div class="policy-header">
                <label class="switch">
                  <input type="checkbox" id="pol_en_${i}" ${p.is_enabled ? 'checked' : ''}>
                  <span class="slider"></span>
                </label>
                <span class="policy-name">${p.leave_type}</span>
              </div>
              <div class="policy-body">
                <label>Monthly Limit</label>
                <input type="number" id="pol_lim_${i}" value="${p.monthly_limit}" min="0" max="30" class="input-sm">
              </div>
            </div>
          `).join('')}
        </div>
        <button type="submit" class="btn btn-primary btn-full" style="margin-top:20px">Complete Setup ${icon('check', 16)}</button>
        <div id="setupError" class="form-error" style="display:none"></div>
      </form>`;
  },

  async saveCompany(e) {
    e.preventDefault();
    const err = document.getElementById('setupError');
    err.style.display = 'none';
    try {
      await App.api('/api/setup/company', {
        method: 'POST',
        body: JSON.stringify({
          company_name: document.getElementById('companyName').value,
          industry: document.getElementById('companyIndustry').value
        })
      });
      this.step = 2;
      this.render();
    } catch (error) { err.textContent = error.message; err.style.display = 'block'; }
  },

  async saveAdmin(e) {
    e.preventDefault();
    const err = document.getElementById('setupError');
    err.style.display = 'none';
    try {
      await App.api('/api/setup/admin', {
        method: 'POST',
        body: JSON.stringify({
          first_name: document.getElementById('adminFirst').value,
          last_name: document.getElementById('adminLast').value,
          email: document.getElementById('adminEmail').value,
          password: document.getElementById('adminPassword').value
        })
      });
      this.step = 3;
      this.render();
    } catch (error) { err.textContent = error.message; err.style.display = 'block'; }
  },

  async savePolicies(e) {
    e.preventDefault();
    const err = document.getElementById('setupError');
    err.style.display = 'none';
    try {
      const policies = this.defaultPolicies.map((p, i) => ({
        leave_type: p.leave_type,
        monthly_limit: parseInt(document.getElementById(`pol_lim_${i}`).value) || 1,
        is_enabled: document.getElementById(`pol_en_${i}`).checked,
        description: p.description
      }));
      await App.api('/api/setup/policies', { method: 'POST', body: JSON.stringify({ policies }) });
      App.toast('Setup complete! Please log in.');
      Login.show();
    } catch (error) { err.textContent = error.message; err.style.display = 'block'; }
  }
};
