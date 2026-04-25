/* ═══ CYPHER-HR Login Module ═══ */
const Login = {
  show() {
    App.setView(`
      <div class="auth-container">
        <div class="auth-left">
          <div class="auth-brand">
            <div class="brand-logo">${icon('shield', 24)}</div>
            <h1>CYPHER-HR</h1>
            <p>Enterprise Human Resource Management</p>
          </div>
          <div class="auth-features">
            <div class="feature-item"><div class="feature-dot">${icon('checkCircle', 16)}</div>Streamlined Leave Management</div>
            <div class="feature-item"><div class="feature-dot">${icon('report', 16)}</div>Real-time Analytics & Reports</div>
            <div class="feature-item"><div class="feature-dot">${icon('lock', 16)}</div>Role-based Access Control</div>
            <div class="feature-item"><div class="feature-dot">${icon('clock', 16)}</div>Automated Balance Tracking</div>
          </div>
        </div>
        <div class="auth-right">
          <div class="auth-card">
            <h2>Welcome back</h2>
            <p class="auth-subtitle">Sign in to your HR portal</p>
            <form id="loginForm" onsubmit="Login.handleLogin(event)">
              <div class="form-group">
                <label>Email Address</label>
                <input type="email" id="loginEmail" placeholder="you@company.com" required autocomplete="email">
              </div>
              <div class="form-group">
                <label>Password</label>
                <input type="password" id="loginPassword" placeholder="Enter your password" required autocomplete="current-password">
              </div>
              <button type="submit" class="btn btn-primary btn-full" id="loginBtn">
                Sign In ${icon('chevronRight', 16)}
              </button>
              <div id="loginError" class="form-error" style="display:none"></div>
            </form>
          </div>
        </div>
      </div>
    `);
  },

  async handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    const err = document.getElementById('loginError');
    btn.disabled = true;
    btn.textContent = 'Signing in...';
    err.style.display = 'none';
    try {
      const data = await App.api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: document.getElementById('loginEmail').value,
          password: document.getElementById('loginPassword').value
        })
      });
      App.login(data.token, data.user);
    } catch (error) {
      err.textContent = error.message;
      err.style.display = 'block';
      btn.disabled = false;
      btn.innerHTML = `Sign In ${icon('chevronRight', 16)}`;
    }
  }
};
