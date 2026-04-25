require('dotenv').config();
const { Pool, Client } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'cypher-hr',
  user: process.env.DB_USER || 'KENCYPHER',
  password: process.env.DB_PASSWORD || 'CYPHER-HR',
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

const query = (text, params) => pool.query(text, params);

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS company_profile (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(30),
  email VARCHAR(255),
  website VARCHAR(255),
  industry VARCHAR(100),
  established_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'employee',
  department VARCHAR(100),
  position VARCHAR(100),
  phone VARCHAR(30),
  avatar_color VARCHAR(10) DEFAULT '#6366f1',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_policies (
  id SERIAL PRIMARY KEY,
  leave_type VARCHAR(60) NOT NULL UNIQUE,
  monthly_limit INTEGER NOT NULL DEFAULT 1,
  is_enabled BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_balances (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_policy_id INTEGER NOT NULL REFERENCES leave_policies(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, leave_policy_id, month, year)
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_policy_id INTEGER NOT NULL REFERENCES leave_policies(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  admin_remarks TEXT,
  approved_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leave_balances_user ON leave_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_period ON leave_balances(month, year);
CREATE INDEX IF NOT EXISTS idx_leave_requests_user ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`;

async function initDatabase() {
  const adminClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'KENCYPHER',
    password: process.env.DB_PASSWORD || 'CYPHER-HR',
    database: 'postgres',
  });

  try {
    await adminClient.connect();
    const res = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME || 'cypher-hr']
    );
    if (res.rowCount === 0) {
      await adminClient.query(`CREATE DATABASE "${process.env.DB_NAME || 'cypher-hr'}"`);
      console.log(`Database "${process.env.DB_NAME}" created successfully`);
    }
  } catch (err) {
    if (err.code !== '42P04') {
      console.error('Error creating database:', err.message);
    }
  } finally {
    await adminClient.end();
  }

  try {
    await pool.query(SCHEMA_SQL);
    console.log('Schema initialized successfully');
  } catch (err) {
    console.error('Error initializing schema:', err.message);
    throw err;
  }
}

async function resetMonthlyBalances() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  try {
    const policies = await query('SELECT id, monthly_limit FROM leave_policies WHERE is_enabled = true');
    const users_res = await query("SELECT id FROM users WHERE role = 'employee' AND is_active = true");

    for (const user of users_res.rows) {
      for (const policy of policies.rows) {
        await query(
          `INSERT INTO leave_balances (user_id, leave_policy_id, balance, month, year)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id, leave_policy_id, month, year)
           DO NOTHING`,
          [user.id, policy.id, policy.monthly_limit, currentMonth, currentYear]
        );
      }
    }
    console.log(`Monthly balances initialized for ${currentMonth}/${currentYear}`);
  } catch (err) {
    console.error('Error resetting monthly balances:', err.message);
  }
}

module.exports = { pool, query, initDatabase, resetMonthlyBalances, SCHEMA_SQL };
