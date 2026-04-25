/* ═══ CYPHER-HR Leaves Module ═══ */
const Leaves = {
  async adminView() {
    try {
      const leaves = await App.api('/api/leaves');
      const pending = leaves.filter(l => l.status === 'pending');
      const processed = leaves.filter(l => l.status !== 'pending');
      return `
        <div class="tabs">
          <button class="tab active" onclick="Leaves.switchTab('pending', this)">Pending (${pending.length})</button>
          <button class="tab" onclick="Leaves.switchTab('processed', this)">Processed (${processed.length})</button>
        </div>
        <div id="tabPending" class="tab-content active">
          ${pending.length === 0 ? '<p class="empty-state" style="padding:2rem">No pending requests</p>' :
            `<table class="table"><thead><tr><th>Employee</th><th>Type</th><th>Start</th><th>End</th><th>Reason</th><th>Actions</th></tr></thead><tbody>
            ${pending.map(l => `<tr>
              <td><div class="user-cell">${App.avatar(l)}<span>${l.first_name} ${l.last_name}</span></div></td>
              <td>${l.leave_type}</td>
              <td>${App.formatDate(l.start_date)}</td>
              <td>${App.formatDate(l.end_date)}</td>
              <td>${l.reason || '—'}</td>
              <td class="action-cell">
                <button class="btn btn-sm btn-success" onclick="Leaves.approve(${l.id})">${icon('check',14)} Approve</button>
                <button class="btn btn-sm btn-danger" onclick="Leaves.reject(${l.id})">${icon('x',14)} Reject</button>
              </td>
            </tr>`).join('')}
            </tbody></table>`}
        </div>
        <div id="tabProcessed" class="tab-content">
          ${processed.length === 0 ? '<p class="empty-state" style="padding:2rem">No processed requests</p>' :
            `<table class="table"><thead><tr><th>Employee</th><th>Type</th><th>Dates</th><th>Status</th><th>Remarks</th></tr></thead><tbody>
            ${processed.map(l => `<tr>
              <td><div class="user-cell">${App.avatar(l)}<span>${l.first_name} ${l.last_name}</span></div></td>
              <td>${l.leave_type}</td>
              <td>${App.formatDate(l.start_date)} - ${App.formatDate(l.end_date)}</td>
              <td>${App.statusBadge(l.status)}</td>
              <td>${l.admin_remarks || '—'}</td>
            </tr>`).join('')}
            </tbody></table>`}
        </div>`;
    } catch (err) { return `<div class="error-state">${err.message}</div>`; }
  },

  switchTab(tab, btn) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(tab === 'pending' ? 'tabPending' : 'tabProcessed').classList.add('active');
  },

  async approve(id) {
    showModal('Approve Leave', `
      <form onsubmit="Leaves.processApprove(event, ${id})">
        <div class="form-group"><label>Remarks (optional)</label><textarea id="approveRemarks" rows="3" placeholder="Add remarks..."></textarea></div>
        <button type="submit" class="btn btn-success btn-full">${icon('check',18)} Confirm Approval</button>
      </form>
    `);
  },

  async processApprove(e, id) {
    e.preventDefault();
    try {
      await App.api(`/api/leaves/${id}/approve`, {
        method: 'PUT',
        body: JSON.stringify({ admin_remarks: document.getElementById('approveRemarks').value })
      });
      closeModal();
      App.toast('Leave approved');
      if (App.user.role === 'admin') Admin.navigate('leaves');
    } catch (err) { App.toast(err.message, 'error'); }
  },

  async reject(id) {
    showModal('Reject Leave', `
      <form onsubmit="Leaves.processReject(event, ${id})">
        <div class="form-group"><label>Reason for rejection</label><textarea id="rejectRemarks" rows="3" placeholder="Provide reason..." required></textarea></div>
        <button type="submit" class="btn btn-danger btn-full">${icon('x',18)} Confirm Rejection</button>
      </form>
    `);
  },

  async processReject(e, id) {
    e.preventDefault();
    try {
      await App.api(`/api/leaves/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ admin_remarks: document.getElementById('rejectRemarks').value })
      });
      closeModal();
      App.toast('Leave rejected');
      if (App.user.role === 'admin') Admin.navigate('leaves');
    } catch (err) { App.toast(err.message, 'error'); }
  }
};
