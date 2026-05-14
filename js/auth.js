// ── Shared Authentication Utilities ──────────────────────────────────────────
// Used by login.html, admin.html, and index.html

function getCurrentUser() {
  try { return JSON.parse(sessionStorage.getItem('sm_user') || 'null'); } catch { return null; }
}

function setCurrentUser(user) {
  sessionStorage.setItem('sm_user', JSON.stringify({
    id: user.id, name: user.name, email: user.email, role: user.role
  }));
}

function signOut() {
  sessionStorage.removeItem('sm_user');
  window.location.href = 'login.html';
}

function requireAdmin() {
  const user = getCurrentUser();
  if (!user) { window.location.href = 'login.html'; return null; }
  if (user.role !== 'admin') {
    document.body.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;
                  font-family:Georgia,serif;background:#faf8f3;color:#05152d;text-align:center;padding:2rem">
        <div>
          <div style="font-size:3rem;margin-bottom:1rem">🔒</div>
          <h2 style="margin-bottom:0.5rem">Admin Access Required</h2>
          <p style="color:#888;margin-bottom:2rem">Your account does not have admin privileges.<br>
             Please contact the church administrator.</p>
          <a href="login.html" onclick="signOut()" style="background:#05152d;color:#d7b24a;
             padding:0.75rem 1.5rem;text-decoration:none;font-size:0.85rem;font-weight:700;
             letter-spacing:1px;text-transform:uppercase">Sign Out →</a>
        </div>
      </div>`;
    return null;
  }
  return user;
}
