<div align="center">

<img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/shield-halved.svg" width="80" height="80" alt="Shield Logo">

<h1 style="color: #1570ef; font-size: 3.5em; margin-bottom: 0;">CYPHER-HR</h1>

<p style="font-size: 1.5em; color: #475467; font-weight: 500;">
  The Fully Transparent, Free, & Open-Source HR Management System
</p>

<p>
  <b>Designed & Developed by KENCYPHER</b>
</p>

<p>
  <img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge" alt="Status Active" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License MIT" />
  <img src="https://img.shields.io/badge/Node.js-v16%2B-green?style=for-the-badge&logo=node.js" alt="Node JS" />
  <img src="https://img.shields.io/badge/PostgreSQL-v12%2B-informational?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Vanilla_JS-100%25-yellow?style=for-the-badge&logo=javascript" alt="Vanilla JS" />
  <img src="https://img.shields.io/badge/@thesvg/icons-Integrated-orange?style=for-the-badge&logo=npm" alt="@thesvg/icons NPM Package" />
</p>

---

</div>

<br />

## 🌟 The Vision & Motivation

> *"I created CYPHER-HR because, working in industries and corporations, I faced a recurring issue: **employees didn't know their own leaves and reports**. This critical data was often hidden from them, creating confusion, frustration, and an imbalance of power. I believe everyone should have the right to transparently see their own leaves—how much they have used, what is remaining, and their historical data. Transparency builds trust, and trust builds great companies."*
> 
> — **KENCYPHER**

<br />

## 🐧 The Open Source Philosophy (100% Free)

This is **NOT** a SaaS platform designed to extract monthly fees from growing businesses. In the spirit of true open-source development and drawing inspiration from the philosophy of **Linus Torvalds**, CYPHER-HR is entirely **FREE** and built for the community. 

Software that governs people's daily lives and working conditions shouldn't be locked behind enterprise paywalls. It should be open, auditable, modifiable, and accessible to everyone. You have full control over the source code, your data, and your infrastructure. Fork it, improve it, and host it yourself forever.

<br />

---

## ✨ Comprehensive Feature Suite

CYPHER-HR is built as an enterprise-grade Single Page Application (SPA), rivaling expensive proprietary solutions without the bloat. 

<details open>
<summary><h3 style="display:inline-block; margin:0;">👥 For Employees</h3></summary>
<br>

- **Total Transparency:** An interactive dashboard displaying pending, approved, and total leave requests at a glance.
- **Leave Allowances:** Real-time progress bars showing exactly how many leaves of each type are available vs. consumed.
- **Seamless Applications:** A beautifully crafted form to apply for leave, complete with a custom corporate date picker that strictly formats dates as `DD:MM:YYYY`.
- **Complete History:** View past applications, statuses, and administrative remarks without needing to ask HR.
</details>

<details open>
<summary><h3 style="display:inline-block; margin:0;">👔 For Administrators & HR</h3></summary>
<br>

- **Centralized Employee Directory:** Add, edit, deactivate, or delete employees securely.
- **Password Management:** Instantly reset employee passwords if they get locked out.
- **Granular Leave Controls:** Create custom leave policies (e.g., Sick, Casual, Maternity) and set exact monthly limits.
- **Direct Allowance Adjustments:** Manually increment or decrement individual employee leave balances when necessary.
- **Automated Monthly Resets:** A built-in backend Cron Job automatically refreshes all enabled leave allowances at midnight on the 1st of every month.
</details>

<details open>
<summary><h3 style="display:inline-block; margin:0;">📊 Advanced Reporting & Exporting</h3></summary>
<br>

- **Dynamic Data Filtering:** Query employee leave requests by date range, specific employee, or status (pending, approved, rejected).
- **PDF Generation:** Instantly generate professional, styled PDF reports with tabular data using `jsPDF` and `jspdf-autotable`.
- **CSV Export:** Download raw data into perfectly formatted `.csv` files for Excel or Google Sheets manipulation.
</details>

<details open>
<summary><h3 style="display:inline-block; margin:0;">🎨 State-of-the-Art UI/UX</h3></summary>
<br>

- **Custom Built Design System:** No massive UI frameworks (like Bootstrap or Tailwind). The entire corporate aesthetic is crafted in pure, lightweight CSS featuring glassmorphism, soft shadows, and clean typography.
- **Global Dark Mode:** A native dark mode toggle providing a deep, high-contrast palette for low-light environments.
- **Dynamic Iconography:** Leveraging the highly optimized `@thesvg/icons` library to fetch and render crisp vector graphics seamlessly.
- **Custom Date Picker Engine:** Bypasses ugly native browser inputs with a fully custom, interactive calendar dropdown built in Vanilla JS.
</details>

<br />

---

## 🏗️ Deep-Dive Architecture

The application utilizes a **Vanilla SPA (Single Page Application)** architecture on the frontend, communicating with a **Node.js/Express** REST API, backed by a fully normalized **PostgreSQL** database. 

<div align="center">
  <img src="https://img.shields.io/badge/Architecture-Client%2FServer-purple?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Frontend-Vanilla_JS_%2B_DOM_API-yellow?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Backend-Node_Express-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-blue?style=for-the-badge" />
</div>

<br />

### 🐘 Why PostgreSQL?

Because it's the absolute GOAT 🐐 of databases. 

Honestly, I just love it. It's fully cross-platform (meaning it runs on my toaster if I want it to), but the real reason? **The terminal.** 

Who needs clunky, bloated GUI wrappers taking up RAM when you can just drop into the `psql` shell, type raw SQL like a 90s movie hacker, and feel like an absolute Gigachad? 🗿 `psql` supremacy all the way.

<br />

### 📂 Detailed File Guide

Want to modify the code? Here is exactly what every file in the project does:

#### 🖥️ Server & Database Layer
| File | Description |
| :--- | :--- |
| **`server.js`** | The heart of the backend. It spins up the Express server, provides RESTful endpoints, handles JWT authentication/middleware, and runs the `node-cron` scheduler for monthly balance resets. |
| **`db_connection.js`** | Manages the `pg` connection pool. Ensures queries to PostgreSQL are handled efficiently and handles database connection errors gracefully. |
| **`schema.sql`** | The relational database blueprint. It creates the `kencypher` role, builds tables for `users`, `leave_policies`, `leave_balances`, and `leave_requests`, and establishes foreign key constraints. |
| **`seed.sql`** | Optional script to populate the database with dummy data for immediate testing and demonstration. |

#### 🌐 Frontend Core & UI Layer
| File | Description |
| :--- | :--- |
| **`index.html`** | The unified HTML shell. It imports CDNs (jsPDF), Google Fonts (Inter), and all JavaScript modules. The entire app mounts inside the `<div id="app">` container. |
| **`styles.css`** | The complete design token system. Contains all CSS variables for the Light and Dark themes, responsive layout grids, sidebar styling, button states, and the custom date picker styling. |
| **`design.js`** | The UI rendering engine. It handles loading dynamic SVGs from the local `/thesvg` route and houses the complex logic for rendering, navigating, and interacting with the custom calendar date picker. |
| **`main.js`** | The central nervous system of the SPA. It handles the `App` state, checks JWT validity, triggers the theme toggler, handles asynchronous API wrappers (`App.api`), and provides global utility functions like toast notifications. |

#### 🧩 Application Modules
| File | Description |
| :--- | :--- |
| **`setup.js`** | The first-run initialization wizard. If the database is empty, this module guides the user to create the master company profile and the first Admin account. |
| **`login.js`** | Renders the beautiful login screen, authenticates credentials with the backend, stores the JWT securely, and routes to the correct dashboard based on the user's role. |
| **`admin.js`** | The administrative portal. Manages the DOM injection for employee directories, leave policy configuration tables, and the master leave request approval system. |
| **`employee.js`** | The employee portal. Renders personalized stat cards, leave allowance progress bars, and handles the logic for submitting new time-off requests. |
| **`reports.js`** | The reporting UI controller. It manages the complex filtering forms, queries the API with URL parameters, and renders the data tables. |
| **`pdf_reports.js`** | The specialized PDF export engine. It takes JSON data from `reports.js`, configures document layouts, creates custom headers, and utilizes `jspdf-autotable` to draw perfectly aligned tables before initiating a browser download. |

<br />

---

## 🚀 Complete Installation & Setup Guide

Because CYPHER-HR is self-hosted, your data remains 100% yours. Follow these steps to deploy the system locally or on your own server.

### Step 1: System Requirements
Ensure you have the following installed on your machine:
- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **Git**

### Step 2: Database Preparation
CYPHER-HR requires a dedicated PostgreSQL database and user.
1. Open your terminal and access the Postgres CLI:
   <kbd>psql -U postgres</kbd>
2. Create the user and database:
   ```sql
   CREATE USER kencypher WITH PASSWORD 'secure_password';
   CREATE DATABASE cypher_hr_db OWNER kencypher;
   ```
3. Initialize the schema. Exit `psql` and run:
   <kbd>psql -U kencypher -d cypher_hr_db -f schema.sql</kbd>

### Step 3: Environment Configuration
Create a `.env` file in the root directory of the project. This keeps your secrets secure.
```env
# Server Configuration
PORT=5200
JWT_SECRET=generate_a_random_secure_string_here

# Database Configuration
DB_USER=kencypher
DB_PASS=secure_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cypher_hr_db
```

### Step 4: Install Dependencies
Install the required Node packages (`express`, `pg`, `bcryptjs`, `jsonwebtoken`, `cors`, `dotenv`):
```bash
npm install
```

### Step 5: Launch the System
Start the backend server:
```bash
node server.js
```
The console will confirm: `[CYPHER-HR] Server active on port 5200` and `[CYPHER-HR] Database connected`.

### Step 6: Initial Setup Wizard
1. Open your web browser and navigate to **`http://0.0.0.0:5200`** (or your server's IP address).
2. Because it is the first time running the system, CYPHER-HR will automatically present the **System Setup Wizard**.
3. Follow the UI prompts to configure your company details and create your Master Administrator account.
4. Log in and begin adding your employees!

<br />

---

## 🤝 Contributing to CYPHER-HR

Open source thrives on community. If you are a developer, designer, or HR professional who wants to improve this system:
1. **Fork** the repository.
2. Create a new branch: <kbd>git checkout -b feature/amazing-new-feature</kbd>
3. Commit your changes: <kbd>git commit -m 'Add amazing new feature'</kbd>
4. Push to the branch: <kbd>git push origin feature/amazing-new-feature</kbd>
5. Open a **Pull Request**.

All contributions, bug reports, and feature requests are highly welcome. Let's build the ultimate free HR tool together.

<br />

## 📜 License & Freedom

This project is licensed under the **MIT License**.

You are free to use it, modify it, distribute it, and run it for your business without ever paying a dime. As Linus Torvalds demonstrated with Linux, the greatest tools are built when we share knowledge and empower each other.

<br />

<div align="center">
  <p><b>Built with passion and a commitment to transparency by KENCYPHER.</b></p>
  <p><i>Give this repository a ⭐ if it helped your business!</i></p>
</div>
