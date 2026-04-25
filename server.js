require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, initDatabase, resetMonthlyBalances } = require('./db_connection');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'cypher-hr-secret';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use('/thesvg', express.static(path.join(__dirname, 'node_modules', '@thesvg', 'icons', 'dist')));

/* ─── Middleware ─── */
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch { return res.status(401).json({ error: 'Invalid token' }); }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

/* ─── System Status ─── */
app.get('/api/system/status', async (req, res) => {
  try {
    const company = await query('SELECT id FROM company_profile LIMIT 1');
    const admin = await query("SELECT id FROM users WHERE role='admin' LIMIT 1");
    const policies = await query('SELECT id FROM leave_policies LIMIT 1');
    res.json({
      hasCompany: company.rowCount > 0,
      hasAdmin: admin.rowCount > 0,
      hasPolicies: policies.rowCount > 0,
      setupComplete: company.rowCount > 0 && admin.rowCount > 0 && policies.rowCount > 0
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ─── Auth Routes ─── */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const result = await query('SELECT * FROM users WHERE email=$1 AND is_active=true', [email.toLowerCase()]);
    if (result.rowCount === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, first_name: user.first_name, last_name: user.last_name }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, first_name: user.first_name, last_name: user.last_name, department: user.department, position: user.position, avatar_color: user.avatar_color } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const result = await query('SELECT id,email,first_name,last_name,role,department,position,phone,avatar_color,created_at FROM users WHERE id=$1', [req.user.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ─── Setup Routes ─── */
app.post('/api/setup/company', async (req, res) => {
  try {
    const existing = await query('SELECT id FROM company_profile LIMIT 1');
    if (existing.rowCount > 0) return res.status(400).json({ error: 'Company already exists' });
    const { company_name, address, phone, email, website, industry, established_date } = req.body;
    if (!company_name) return res.status(400).json({ error: 'Company name is required' });
    const result = await query(
      'INSERT INTO company_profile(company_name,address,phone,email,website,industry,established_date) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [company_name, address, phone, email, website, industry, established_date]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/setup/admin', async (req, res) => {
  try {
    const existing = await query("SELECT id FROM users WHERE role='admin' LIMIT 1");
    if (existing.rowCount > 0) return res.status(400).json({ error: 'Admin already exists' });
    const { email, password, first_name, last_name, phone } = req.body;
    if (!email || !password || !first_name || !last_name) return res.status(400).json({ error: 'All fields required' });
    const hashed = await bcrypt.hash(password, 12);
    const colors = ['#6366f1','#8b5cf6','#ec4899','#f43f5e','#14b8a6','#f97316','#06b6d4'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const result = await query(
      "INSERT INTO users(email,password,first_name,last_name,role,department,position,phone,avatar_color) VALUES($1,$2,$3,$4,'admin','Human Resources','HR Administrator',$5,$6) RETURNING id,email,first_name,last_name,role,avatar_color",
      [email.toLowerCase(), hashed, first_name, last_name, phone, color]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/setup/policies', async (req, res) => {
  try {
    const { policies } = req.body;
    if (!policies || !Array.isArray(policies)) return res.status(400).json({ error: 'Policies array required' });
    const results = [];
    for (const p of policies) {
      const r = await query(
        'INSERT INTO leave_policies(leave_type,monthly_limit,is_enabled,description) VALUES($1,$2,$3,$4) ON CONFLICT(leave_type) DO UPDATE SET monthly_limit=$2,is_enabled=$3,description=$4 RETURNING *',
        [p.leave_type, p.monthly_limit || 1, p.is_enabled !== false, p.description || '']
      );
      results.push(r.rows[0]);
    }
    res.json(results);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ─── Company ─── */
app.get('/api/company', authMiddleware, async (req, res) => {
  try {
    const r = await query('SELECT * FROM company_profile LIMIT 1');
    res.json(r.rows[0] || null);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/company', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { company_name, address, phone, email, website, industry } = req.body;
    const r = await query(
      'UPDATE company_profile SET company_name=$1,address=$2,phone=$3,email=$4,website=$5,industry=$6,updated_at=NOW() WHERE id=(SELECT id FROM company_profile LIMIT 1) RETURNING *',
      [company_name, address, phone, email, website, industry]
    );
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ─── Leave Policies ─── */
app.get('/api/policies', authMiddleware, async (req, res) => {
  try {
    const r = await query('SELECT * FROM leave_policies ORDER BY id');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/policies/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { monthly_limit, is_enabled } = req.body;
    const r = await query('UPDATE leave_policies SET monthly_limit=$1,is_enabled=$2,updated_at=NOW() WHERE id=$3 RETURNING *', [monthly_limit, is_enabled, req.params.id]);
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ─── Employee Management ─── */
app.get('/api/employees', authMiddleware, adminOnly, async (req, res) => {
  try {
    const r = await query("SELECT id,email,first_name,last_name,role,department,position,phone,avatar_color,is_active,created_at FROM users WHERE role='employee' ORDER BY first_name");
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/employees', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { email, password, first_name, last_name, department, position, phone } = req.body;
    if (!email || !password || !first_name || !last_name) return res.status(400).json({ error: 'Required fields missing' });
    const exists = await query('SELECT id FROM users WHERE email=$1', [email.toLowerCase()]);
    if (exists.rowCount > 0) return res.status(400).json({ error: 'Email already in use' });
    const hashed = await bcrypt.hash(password, 12);
    const colors = ['#6366f1','#8b5cf6','#ec4899','#f43f5e','#14b8a6','#f97316','#06b6d4','#84cc16','#eab308'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const r = await query(
      "INSERT INTO users(email,password,first_name,last_name,role,department,position,phone,avatar_color) VALUES($1,$2,$3,$4,'employee',$5,$6,$7,$8) RETURNING id,email,first_name,last_name,role,department,position,phone,avatar_color",
      [email.toLowerCase(), hashed, first_name, last_name, department, position, phone, color]
    );
    const user = r.rows[0];
    const now = new Date();
    const policies = await query('SELECT id,monthly_limit FROM leave_policies WHERE is_enabled=true');
    for (const p of policies.rows) {
      await query('INSERT INTO leave_balances(user_id,leave_policy_id,balance,month,year) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING',
        [user.id, p.id, p.monthly_limit, now.getMonth()+1, now.getFullYear()]);
    }
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/employees/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await query('DELETE FROM users WHERE id=$1 AND role=$2', [req.params.id, 'employee']);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/employees/:id/toggle', authMiddleware, adminOnly, async (req, res) => {
  try {
    const r = await query('UPDATE users SET is_active = NOT is_active, updated_at=NOW() WHERE id=$1 RETURNING is_active', [req.params.id]);
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/employees/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { email, first_name, last_name, department, position, phone } = req.body;
    if (!email || !first_name || !last_name) return res.status(400).json({ error: 'Name and email are required' });
    const exists = await query('SELECT id FROM users WHERE email=$1 AND id!=$2', [email.toLowerCase(), req.params.id]);
    if (exists.rowCount > 0) return res.status(400).json({ error: 'Email already in use by another user' });
    const r = await query(
      'UPDATE users SET email=$1,first_name=$2,last_name=$3,department=$4,position=$5,phone=$6,updated_at=NOW() WHERE id=$7 AND role=$8 RETURNING id,email,first_name,last_name,department,position,phone,avatar_color',
      [email.toLowerCase(), first_name, last_name, department || null, position || null, phone || null, req.params.id, 'employee']
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Employee not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/employees/:id/reset-password', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { new_password } = req.body;
    if (!new_password || new_password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const hashed = await bcrypt.hash(new_password, 12);
    const r = await query('UPDATE users SET password=$1,updated_at=NOW() WHERE id=$2 AND role=$3 RETURNING id', [hashed, req.params.id, 'employee']);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Employee not found' });
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ─── Leave Balances ─── */
app.get('/api/balances', authMiddleware, async (req, res) => {
  try {
    const uid = req.user.role === 'admin' && req.query.user_id ? req.query.user_id : req.user.id;
    const month = parseInt(req.query.month) || new Date().getMonth()+1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const r = await query(
      `SELECT lb.*, lp.leave_type, lp.monthly_limit, lp.is_enabled
       FROM leave_balances lb JOIN leave_policies lp ON lb.leave_policy_id=lp.id
       WHERE lb.user_id=$1 AND lb.month=$2 AND lb.year=$3 ORDER BY lp.leave_type`,
      [uid, month, year]
    );
    if (r.rowCount === 0) {
      const policies = await query('SELECT id,monthly_limit,leave_type,is_enabled FROM leave_policies WHERE is_enabled=true');
      const balances = [];
      for (const p of policies.rows) {
        const ins = await query('INSERT INTO leave_balances(user_id,leave_policy_id,balance,month,year) VALUES($1,$2,$3,$4,$5) ON CONFLICT(user_id,leave_policy_id,month,year) DO NOTHING RETURNING *', [uid, p.id, p.monthly_limit, month, year]);
        balances.push({ ...ins.rows[0], leave_type: p.leave_type, monthly_limit: p.monthly_limit, is_enabled: p.is_enabled });
      }
      return res.json(balances);
    }
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/balances/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { balance } = req.body;
    const r = await query('UPDATE leave_balances SET balance=$1,updated_at=NOW() WHERE id=$2 RETURNING *', [balance, req.params.id]);
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ─── Leave Requests ─── */
app.get('/api/leaves', authMiddleware, async (req, res) => {
  try {
    let sql, params;
    if (req.user.role === 'admin') {
      sql = `SELECT lr.*, lp.leave_type, u.first_name, u.last_name, u.email, u.avatar_color
             FROM leave_requests lr JOIN leave_policies lp ON lr.leave_policy_id=lp.id
             JOIN users u ON lr.user_id=u.id ORDER BY lr.created_at DESC`;
      params = [];
    } else {
      sql = `SELECT lr.*, lp.leave_type FROM leave_requests lr JOIN leave_policies lp ON lr.leave_policy_id=lp.id
             WHERE lr.user_id=$1 ORDER BY lr.created_at DESC`;
      params = [req.user.id];
    }
    const r = await query(sql, params);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/leaves', authMiddleware, async (req, res) => {
  try {
    const { leave_policy_id, start_date, end_date, reason } = req.body;
    if (!leave_policy_id || !start_date || !end_date) return res.status(400).json({ error: 'All fields required' });
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const bal = await query('SELECT * FROM leave_balances WHERE user_id=$1 AND leave_policy_id=$2 AND month=$3 AND year=$4', [req.user.id, leave_policy_id, month, year]);
    if (bal.rowCount === 0 || bal.rows[0].balance <= 0) return res.status(400).json({ error: 'Insufficient leave balance' });
    const policy = await query('SELECT * FROM leave_policies WHERE id=$1', [leave_policy_id]);
    if (policy.rowCount === 0 || !policy.rows[0].is_enabled) return res.status(400).json({ error: 'Leave type not available' });
    const s = new Date(start_date); const e = new Date(end_date);
    let days = Math.ceil((e - s) / (1000*60*60*24)) + 1;
    if (policy.rows[0].leave_type === 'Half Day') days = 0.5;
    if (bal.rows[0].balance < days) return res.status(400).json({ error: `Insufficient balance. Available: ${bal.rows[0].balance}, Requested: ${days}` });
    const r = await query(
      'INSERT INTO leave_requests(user_id,leave_policy_id,start_date,end_date,reason) VALUES($1,$2,$3,$4,$5) RETURNING *',
      [req.user.id, leave_policy_id, start_date, end_date, reason]
    );
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/leaves/:id/approve', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { admin_remarks } = req.body;
    const lr = await query('SELECT * FROM leave_requests WHERE id=$1', [req.params.id]);
    if (lr.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    if (lr.rows[0].status !== 'pending') return res.status(400).json({ error: 'Already processed' });
    const leave = lr.rows[0];
    const policy = await query('SELECT * FROM leave_policies WHERE id=$1', [leave.leave_policy_id]);
    let days = Math.ceil((new Date(leave.end_date) - new Date(leave.start_date)) / (1000*60*60*24)) + 1;
    if (policy.rows[0].leave_type === 'Half Day') days = 0.5;
    const now = new Date();
    await query('UPDATE leave_balances SET balance=balance-$1,updated_at=NOW() WHERE user_id=$2 AND leave_policy_id=$3 AND month=$4 AND year=$5',
      [days, leave.user_id, leave.leave_policy_id, now.getMonth()+1, now.getFullYear()]);
    const r = await query("UPDATE leave_requests SET status='approved',admin_remarks=$1,approved_by=$2,updated_at=NOW() WHERE id=$3 RETURNING *",
      [admin_remarks, req.user.id, req.params.id]);
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/leaves/:id/reject', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { admin_remarks } = req.body;
    const r = await query("UPDATE leave_requests SET status='rejected',admin_remarks=$1,approved_by=$2,updated_at=NOW() WHERE id=$3 RETURNING *",
      [admin_remarks, req.user.id, req.params.id]);
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ─── Reports ─── */
app.get('/api/reports/detailed', authMiddleware, async (req, res) => {
  try {
    const { user_id, start_date, end_date, status } = req.query;
    let sql = `SELECT lr.*, lp.leave_type, u.first_name, u.last_name, u.department
               FROM leave_requests lr JOIN leave_policies lp ON lr.leave_policy_id=lp.id
               JOIN users u ON lr.user_id=u.id WHERE 1=1`;
    const params = [];
    let i = 1;
    if (req.user.role !== 'admin') { sql += ` AND lr.user_id=$${i++}`; params.push(req.user.id); }
    else if (user_id) { sql += ` AND lr.user_id=$${i++}`; params.push(user_id); }
    if (start_date) { sql += ` AND lr.start_date >= $${i++}`; params.push(start_date); }
    if (end_date) { sql += ` AND lr.end_date <= $${i++}`; params.push(end_date); }
    if (status) { sql += ` AND lr.status=$${i++}`; params.push(status); }
    sql += ' ORDER BY lr.start_date DESC';
    const r = await query(sql, params);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/reports/summary', authMiddleware, async (req, res) => {
  try {
    const { user_id, year } = req.query;
    const yr = parseInt(year) || new Date().getFullYear();
    let userFilter = '';
    const params = [yr];
    if (req.user.role !== 'admin') { userFilter = 'AND lr.user_id=$2'; params.push(req.user.id); }
    else if (user_id) { userFilter = 'AND lr.user_id=$2'; params.push(user_id); }
    const r = await query(
      `SELECT EXTRACT(MONTH FROM lr.start_date) as month, lp.leave_type, COUNT(*) as count,
              lr.status, u.first_name, u.last_name
       FROM leave_requests lr JOIN leave_policies lp ON lr.leave_policy_id=lp.id
       JOIN users u ON lr.user_id=u.id
       WHERE EXTRACT(YEAR FROM lr.start_date)=$1 ${userFilter}
       GROUP BY EXTRACT(MONTH FROM lr.start_date), lp.leave_type, lr.status, u.first_name, u.last_name
       ORDER BY month`, params
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/dashboard/stats', authMiddleware, adminOnly, async (req, res) => {
  try {
    const totalEmp = await query("SELECT COUNT(*) FROM users WHERE role='employee'");
    const activeEmp = await query("SELECT COUNT(*) FROM users WHERE role='employee' AND is_active=true");
    const pendingLeaves = await query("SELECT COUNT(*) FROM leave_requests WHERE status='pending'");
    const approvedToday = await query("SELECT COUNT(*) FROM leave_requests WHERE status='approved' AND DATE(updated_at)=CURRENT_DATE");
    res.json({
      totalEmployees: parseInt(totalEmp.rows[0].count),
      activeEmployees: parseInt(activeEmp.rows[0].count),
      pendingLeaves: parseInt(pendingLeaves.rows[0].count),
      approvedToday: parseInt(approvedToday.rows[0].count)
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ─── Start Server ─── */
async function start() {
  try {
    await initDatabase();
    await resetMonthlyBalances();
    setInterval(async () => {
      const now = new Date();
      if (now.getDate() === 1 && now.getHours() === 0) await resetMonthlyBalances();
    }, 3600000);
    app.listen(PORT, () => console.log(`CYPHER-HR running on http://localhost:${PORT}`));
  } catch (err) { console.error('Failed to start:', err); process.exit(1); }
}

start();
