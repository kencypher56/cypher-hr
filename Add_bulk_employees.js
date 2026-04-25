/* ═══ CYPHER-HR Bulk Import Module ═══ */

const AddBulkEmployees = {
  showModal() {
    showModal('Import Employees', `
      <div class="bulk-import-container">
        <div class="import-instructions" style="background:var(--bg3); padding:16px; border-radius:var(--radius); margin-bottom:20px; text-align:left;">
          <h4 style="margin-top:0;">Instructions:</h4>
          <ol style="margin-bottom:0; padding-left:20px; font-size:0.9rem;">
            <li>Download the template below.</li>
            <li>Fill out the employee details. <b>Email, First Name, Last Name, and Password are required.</b></li>
            <li>Upload the completed <code>.csv</code>, <code>.xls</code>, or <code>.xlsx</code> file.</li>
          </ol>
        </div>
        
        <div class="form-group" style="text-align: center; margin-bottom: 24px;">
          <button type="button" class="btn btn-outline" onclick="AddBulkEmployees.downloadTemplate()">
            ${icon('download', 18)} Download Template
          </button>
        </div>

        <div class="form-group">
          <label>Upload Completed File</label>
          <input type="file" id="bulkUploadFile" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" style="padding:10px; border:1px dashed var(--border2); border-radius:var(--radius); width:100%; cursor:pointer;">
        </div>

        <div id="bulkError" class="form-error" style="display:none; text-align:left;"></div>
        <div id="bulkSuccess" class="form-success" style="display:none; color:var(--success); margin-top:10px; font-weight:600; text-align:center;"></div>
      </div>
    `, `
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="btnProcessImport" onclick="AddBulkEmployees.processFile()">Process Import</button>
    `);
  },

  downloadTemplate() {
    const csvContent = "first_name,last_name,email,password,department,position,phone\nJohn,Doe,john.doe@company.com,password123,IT,Developer,1234567890\nJane,Smith,jane.smith@company.com,password123,HR,Manager,0987654321";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "CYPHER_HR_Employee_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  async processFile() {
    const fileInput = document.getElementById('bulkUploadFile');
    const errEl = document.getElementById('bulkError');
    const succEl = document.getElementById('bulkSuccess');
    const btn = document.getElementById('btnProcessImport');
    
    errEl.style.display = 'none';
    succEl.style.display = 'none';

    if (!fileInput.files || fileInput.files.length === 0) {
      errEl.textContent = "Please select a file to upload.";
      errEl.style.display = 'block';
      return;
    }

    const file = fileInput.files[0];
    
    // Check if SheetJS is loaded
    if (typeof XLSX === 'undefined') {
      errEl.textContent = "Excel parser library not loaded. Please refresh the page.";
      errEl.style.display = 'block';
      return;
    }

    btn.disabled = true;
    btn.innerHTML = `${icon('clock', 18)} Processing...`;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (json.length === 0) throw new Error("The uploaded file is empty.");

      // Normalize keys and validate
      const payload = json.map((row, index) => {
        // Find keys case-insensitively
        const getVal = (keyStr) => {
          const key = Object.keys(row).find(k => k.toLowerCase().replace(/ /g, '_') === keyStr);
          return key ? row[key] : '';
        };

        const emp = {
          first_name: getVal('first_name'),
          last_name: getVal('last_name'),
          email: getVal('email'),
          password: getVal('password'),
          department: getVal('department'),
          position: getVal('position'),
          phone: getVal('phone')
        };

        if (!emp.first_name || !emp.last_name || !emp.email || !emp.password) {
          throw new Error(`Row ${index + 2} is missing required fields (First Name, Last Name, Email, or Password).`);
        }

        return emp;
      });

      // Send to backend
      const response = await App.api('/api/employees/bulk', {
        method: 'POST',
        body: JSON.stringify({ employees: payload })
      });

      succEl.textContent = `Successfully imported ${response.inserted} employees. Skipped ${response.skipped} duplicates.`;
      succEl.style.display = 'block';
      
      // Refresh the grid underneath if Admin is on the employees view
      if (typeof Admin !== 'undefined' && document.getElementById('employeesGrid')) {
        const updatedGridHTML = await Admin.employeesContent();
        const contentArea = document.getElementById('contentArea');
        if (contentArea) contentArea.innerHTML = updatedGridHTML;
      }

      setTimeout(closeModal, 3000);

    } catch (err) {
      errEl.textContent = err.message || "Failed to process file.";
      errEl.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.textContent = "Process Import";
    }
  }
};
