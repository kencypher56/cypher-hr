/* ═══ CYPHER-HR PDF Reports Module ═══ */
const PdfReports = {
  export() {
    if (!Reports.lastData || Reports.lastData.length === 0) {
      App.toast('Generate a report first to export', 'error');
      return;
    }

    try {
      const type = document.getElementById('reportType').value;
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(21, 112, 239); // Primary blue
      doc.rect(0, 0, 210, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('CYPHER-HR', 14, 13);
      
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(14);
      doc.text(type === 'detailed' ? 'Detailed Leave Report' : 'Summary Leave Report', 14, 30);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${App.formatDate(new Date())}`, 14, 36);

      if (type === 'detailed') {
        this.generateDetailed(doc, Reports.lastData);
      } else {
        this.generateSummary(doc, Reports.lastData);
      }
    } catch (err) {
      console.error(err);
      App.toast('Failed to generate PDF. Make sure libraries are loaded.', 'error');
    }
  },

  generateDetailed(doc, data) {
    const columns = [
      { header: 'Employee', dataKey: 'employee' },
      { header: 'Type', dataKey: 'type' },
      { header: 'Dates', dataKey: 'dates' },
      { header: 'Status', dataKey: 'status' },
      { header: 'Department', dataKey: 'department' }
    ];

    const rows = data.map(r => ({
      employee: `${r.first_name} ${r.last_name}`,
      type: r.leave_type,
      dates: `${App.formatDate(r.start_date)} to ${App.formatDate(r.end_date)}`,
      status: r.status.charAt(0).toUpperCase() + r.status.slice(1),
      department: r.department || '—'
    }));

    doc.autoTable({
      columns: columns,
      body: rows,
      startY: 42,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [21, 112, 239], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      didDrawPage: function (data) {
        doc.setFontSize(8);
        doc.text(`Page ${doc.internal.getNumberOfPages()}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
      }
    });

    doc.save('detailed_report.pdf');
    App.toast('PDF generated successfully');
  },

  generateSummary(doc, data) {
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    
    // Group data for summary exactly like the UI
    const grouped = {};
    data.forEach(r => {
      const name = `${r.first_name} ${r.last_name}`;
      if (!grouped[name]) grouped[name] = {};
      const m = months[parseInt(r.month) - 1];
      if (!grouped[name][m]) grouped[name][m] = { approved: 0, rejected: 0, pending: 0 };
      grouped[name][m][r.status] = (grouped[name][m][r.status] || 0) + parseInt(r.count);
    });

    let currentY = 42;

    Object.entries(grouped).forEach(([name, monthData], index) => {
      // Add employee name header
      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);
      doc.text(name, 14, currentY);
      
      const rows = Object.entries(monthData).map(([m, statuses]) => ({
        month: m,
        approved: statuses.approved || 0,
        rejected: statuses.rejected || 0,
        pending: statuses.pending || 0,
        total: (statuses.approved || 0) + (statuses.rejected || 0) + (statuses.pending || 0)
      }));

      doc.autoTable({
        columns: [
          { header: 'Month', dataKey: 'month' },
          { header: 'Approved', dataKey: 'approved' },
          { header: 'Rejected', dataKey: 'rejected' },
          { header: 'Pending', dataKey: 'pending' },
          { header: 'Total', dataKey: 'total' }
        ],
        body: rows,
        startY: currentY + 4,
        margin: { bottom: 20 },
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [240, 242, 245], textColor: [50, 50, 50] },
        didDrawPage: function (data) {
          doc.setFontSize(8);
          doc.text(`Page ${doc.internal.getNumberOfPages()}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
      });

      currentY = doc.lastAutoTable.finalY + 12;
      
      // If close to bottom, add new page
      if (currentY > 260 && index < Object.entries(grouped).length - 1) {
        doc.addPage();
        currentY = 20;
      }
    });

    doc.save('summary_report.pdf');
    App.toast('PDF generated successfully');
  }
};
