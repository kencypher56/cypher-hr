-- ═══ CYPHER-HR Seed Data ═══
-- Run after schema.sql, passwords are bcrypt hashed for "admin123" and "emp123"

-- Company Profile
INSERT INTO company_profile (company_name, address, phone, email, website, industry)
VALUES ('Cypher Technologies', '123 Innovation Drive, Tech City', '+1-555-0100', 'hr@cypher.tech', 'https://cypher.tech', 'Technology')
ON CONFLICT DO NOTHING;

-- Leave Policies
INSERT INTO leave_policies (leave_type, monthly_limit, is_enabled, description) VALUES
('Casual Leave', 2, true, 'General personal leave'),
('Half Day', 4, true, 'Half day leave'),
('Medical', 2, true, 'Medical/sick leave'),
('Hajj', 1, false, 'Hajj pilgrimage leave'),
('Umrah', 1, false, 'Umrah pilgrimage leave'),
('Christmas', 1, true, 'Christmas holiday'),
('Easter', 1, true, 'Easter holiday'),
('Halloween', 1, false, 'Halloween holiday'),
('Marriage', 1, true, 'Marriage leave')
ON CONFLICT (leave_type) DO NOTHING;

-- NOTE: To seed users, run the app and use the setup wizard,
-- or use bcrypt to hash passwords manually.
-- The setup wizard handles admin creation and policy setup automatically.
