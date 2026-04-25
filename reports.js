/* ═══ CYPHER-HR Reports Module ═══ */
const Reports = {
  async adminView() {
    try {
      const employees = await App.api('/api/employees');
      return `
        <div class="reports-container">
          <div class="card">
            <div class="card-header"><h3>${icon('report', 20)} Generate Report</h3></div>
            <div class="card-body">
              <div class="form-row">
                <div class="form-group">
                  <label>Report Type</label>
                  <select id="reportType">
                    <option value="detailed">Detailed Report</option>
                    <option value="summary">Summary Report</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Employee</label>
                  <select id="reportEmployee">
                    <option value="">All Employees</option>
                    ${employees.map(e => `<option value="${e.id}">${e.first_name} ${e.last_name}</option>`).join('')}
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group" style="position:relative"><label>Start Date</label>${dateInput('reportStart')}</div>
                <div class="form-group" style="position:relative"><label>End Date</label>${dateInput('reportEnd')}</div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Status</label>
                  <select id="reportStatus">
                    <option value="">All</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Year (Summary)</label>
                  <input type="number" id="reportYear" value="${new Date().getFullYear()}" min="2020" max="2030">
                </div>
              </div>
              <div class="form-actions">
                <button class="btn btn-primary" onclick="Reports.generate()">${icon('search', 18)} Generate</button>
                <button class="btn btn-outline" onclick="Reports.exportCSV()">${icon('download', 18)} Export CSV</button>
                <button class="btn btn-outline" onclick="PdfReports.export()">${icon('fileText', 18)} Export PDF</button>
              </div>
            </div>
          </div>
          <div id="reportResults"></div>
        </div>`;
    } catch (err) { return `<div class="error-state">${err.message}</div>`; }
  },

  async employeeView() {
    return `
      <div class="reports-container">
        <div class="card">
          <div class="card-header"><h3>${icon('report', 20)} My Reports</h3></div>
          <div class="card-body">
            <div class="form-row">
              <div class="form-group">
                <label>Report Type</label>
                <select id="reportType">
                  <option value="detailed">Detailed Report</option>
                  <option value="summary">Summary Report</option>
                </select>
              </div>
              <div class="form-group">
                <label>Year (Summary)</label>
                <input type="number" id="reportYear" value="${new Date().getFullYear()}" min="2020" max="2030">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group" style="position:relative"><label>Start Date</label>${dateInput('reportStart')}</div>
              <div class="form-group" style="position:relative"><label>End Date</label>${dateInput('reportEnd')}</div>
            </div>
            <div class="form-actions">
              <button class="btn btn-primary" onclick="Reports.generate()">${icon('search', 18)} Generate</button>
              <button class="btn btn-outline" onclick="Reports.exportCSV()">${icon('download', 18)} Export CSV</button>
              <button class="btn btn-outline" onclick="PdfReports.export()">${icon('fileText', 18)} Export PDF</button>
            </div>
          </div>
        </div>
        <div id="reportResults"></div>
      </div>`;
  },

  lastData: [],

  async generate() {
    const type = document.getElementById('reportType').value;
    const container = document.getElementById('reportResults');
    container.innerHTML = '<p class="text-muted" style="padding:1rem">Loading...</p>';
    try {
      if (type === 'detailed') {
        const params = new URLSearchParams();
        const empEl = document.getElementById('reportEmployee');
        if (empEl && empEl.value) params.set('user_id', empEl.value);
        const start = parseDateInput('reportStart');
        const end = parseDateInput('reportEnd');
        const status = document.getElementById('reportStatus')?.value;
        if (start) params.set('start_date', start);
        if (end) params.set('end_date', end);
        if (status) params.set('status', status);
        const data = await App.api(`/api/reports/detailed?${params}`);
        this.lastData = data;
        container.innerHTML = `
          <div class="card" style="margin-top:1rem">
            <div class="card-header"><h3>Detailed Report (${data.length} records)</h3></div>
            <div class="card-body">
              ${data.length === 0 ? '<p class="empty-state">No records found</p>' :
                `<table class="table"><thead><tr><th>Employee</th><th>Type</th><th>Start</th><th>End</th><th>Reason</th><th>Status</th><th>Department</th></tr></thead><tbody>
                ${data.map(r => `<tr>
                  <td>${r.first_name} ${r.last_name}</td>
                  <td>${r.leave_type}</td>
                  <td>${App.formatDate(r.start_date)}</td>
                  <td>${App.formatDate(r.end_date)}</td>
                  <td>${r.reason || '—'}</td>
                  <td>${App.statusBadge(r.status)}</td>
                  <td>${r.department || '—'}</td>
                </tr>`).join('')}
                </tbody></table>`}
            </div>
          </div>`;
      } else {
        const params = new URLSearchParams();
        const empEl = document.getElementById('reportEmployee');
        if (empEl && empEl.value) params.set('user_id', empEl.value);
        params.set('year', document.getElementById('reportYear')?.value || new Date().getFullYear());
        const data = await App.api(`/api/reports/summary?${params}`);
        this.lastData = data;
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const grouped = {};
        data.forEach(r => {
          const key = `${r.first_name} ${r.last_name}`;
          if (!grouped[key]) grouped[key] = {};
          const m = months[parseInt(r.month) - 1];
          if (!grouped[key][m]) grouped[key][m] = {};
          grouped[key][m][r.status] = (grouped[key][m][r.status] || 0) + parseInt(r.count);
        });
        container.innerHTML = `
          <div class="card" style="margin-top:1rem">
            <div class="card-header"><h3>Summary Report — ${document.getElementById('reportYear')?.value || new Date().getFullYear()}</h3></div>
            <div class="card-body">
              ${data.length === 0 ? '<p class="empty-state">No records found</p>' :
                Object.entries(grouped).map(([name, monthData]) => `
                  <h4 style="margin:1rem 0 0.5rem">${name}</h4>
                  <table class="table table-sm"><thead><tr><th>Month</th><th>Approved</th><th>Rejected</th><th>Pending</th><th>Total</th></tr></thead><tbody>
                  ${Object.entries(monthData).map(([m, statuses]) => {
                    const a = statuses.approved || 0;
                    const r2 = statuses.rejected || 0;
                    const p = statuses.pending || 0;
                    return `<tr><td>${m}</td><td class="text-success">${a}</td><td class="text-danger">${r2}</td><td class="text-warning">${p}</td><td><strong>${a+r2+p}</strong></td></tr>`;
                  }).join('')}
                  </tbody></table>
                `).join('')}
            </div>
          </div>`;
      }
    } catch (err) { container.innerHTML = `<div class="error-state">${err.message}</div>`; }
  },

  exportCSV() {
    if (!this.lastData || this.lastData.length === 0) { App.toast('Generate a report first', 'error'); return; }
    const type = document.getElementById('reportType').value;
    let csv, filename;
    if (type === 'detailed') {
      csv = 'Employee,Type,Start Date,End Date,Reason,Status,Department\n';
      csv += this.lastData.map(r =>
        `"${r.first_name} ${r.last_name}","${r.leave_type}","${App.formatDate(r.start_date)}","${App.formatDate(r.end_date)}","${(r.reason||'').replace(/"/g,'""')}","${r.status}","${r.department||''}"`
      ).join('\n');
      filename = 'detailed_report.csv';
    } else {
      csv = 'Employee,Month,Status,Count\n';
      csv += this.lastData.map(r =>
        `"${r.first_name} ${r.last_name}","${r.month}","${r.status}","${r.count}"`
      ).join('\n');
      filename = 'summary_report.csv';
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    App.toast('Report exported');
  }
};
