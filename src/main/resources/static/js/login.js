/* Login page: Buyer / Seller / Admin */

const DEMO = {
  BUYER:  'Demo buyer: buyer@mart.com / buyer123',
  SELLER: 'Demo seller: seller@mart.com / seller123',
  ADMIN:  'Admin: admin@mart.com / admin123'
};

let role = 'BUYER';
const params = new URLSearchParams(location.search);

function setRole(r) {
  role = r;
  document.querySelectorAll('#roleTabs .tab').forEach(function (t) {
    t.classList.toggle('active', t.dataset.role === r);
  });
  document.getElementById('demoHint').textContent = DEMO[r];
  // admins cannot self-register
  document.getElementById('registerLink').style.display = (r === 'ADMIN') ? 'none' : 'block';
  hideError();
}

function showError(msg) {
  const el = document.getElementById('errorMsg');
  el.textContent = msg;
  el.style.display = 'block';
}

function hideError() {
  document.getElementById('errorMsg').style.display = 'none';
}

// only allow redirecting to our own known pages
function safeRedirect() {
  const r = params.get('redirect');
  const allowed = ['cart.html', 'orders.html', 'index.html'];
  return allowed.indexOf(r) >= 0 ? r : 'index.html';
}

function goAfterLogin(user) {
  if (user.role === 'ADMIN') location.href = 'admin.html';
  else if (user.role === 'SELLER') location.href = 'seller.html';
  else location.href = safeRedirect();
}

document.getElementById('roleTabs').addEventListener('click', function (e) {
  const tab = e.target.closest('.tab');
  if (tab) setRole(tab.dataset.role);
});

document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  hideError();
  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.textContent = 'Logging in...';
  try {
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: {
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
        role: role
      }
    });
    saveAuth(res.token, res.user);
    goAfterLogin(res.user);
  } catch (err) {
    showError(err.message);
    btn.disabled = false;
    btn.textContent = 'Login';
  }
});

renderNavbar('login');
renderFooter();

const wanted = (params.get('role') || '').toUpperCase();
setRole(DEMO[wanted] ? wanted : 'BUYER');
