/* Register page: buyer or seller */

function showError(msg) {
  const el = document.getElementById('errorMsg');
  el.textContent = msg;
  el.style.display = 'block';
}

document.getElementById('registerForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  document.getElementById('errorMsg').style.display = 'none';

  const btn = document.getElementById('regBtn');
  btn.disabled = true;
  btn.textContent = 'Creating account...';
  try {
    const res = await api('/api/auth/register', {
      method: 'POST',
      body: {
        role: document.querySelector('input[name="role"]:checked').value,
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        password: document.getElementById('password').value
      }
    });
    saveAuth(res.token, res.user);
    location.href = res.user.role === 'SELLER' ? 'seller.html' : 'index.html';
  } catch (err) {
    showError(err.message);
    btn.disabled = false;
    btn.textContent = 'Register';
  }
});

renderNavbar('register');
renderFooter();
