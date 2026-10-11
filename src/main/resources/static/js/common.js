/* ===========================================================
   Bhuvaneshwari Mart - shared helpers (API, auth, cart, navbar)
   =========================================================== */

// When the page is opened from Spring Boot (http://localhost:8080) the API is on the same origin.
// If you open the HTML with VS Code Live Server (port 5500...) or directly as a file,
// the API is called on http://localhost:8080
const LIVE_SERVER_PORTS = ['5500', '5501', '5502', '3000', '5173'];
const API_BASE = (location.protocol === 'file:' || LIVE_SERVER_PORTS.indexOf(location.port) >= 0)
  ? 'http://localhost:8080' : '';

/* ---------- Auth storage ---------- */
function getToken() { return localStorage.getItem('bm_token'); }

function getUser() {
  try { return JSON.parse(localStorage.getItem('bm_user')); } catch (e) { return null; }
}

function saveAuth(token, user) {
  localStorage.setItem('bm_token', token);
  localStorage.setItem('bm_user', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('bm_token');
  localStorage.removeItem('bm_user');
}

async function logout() {
  try { await api('/api/auth/logout', { method: 'POST' }); } catch (e) { /* ignore */ }
  clearAuth();
  location.href = 'index.html';
}

/* ---------- API helper ---------- */
async function api(path, options) {
  const opts = options || {};
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  let res;
  try {
    res = await fetch(API_BASE + path, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
  } catch (e) {
    throw new Error('Cannot connect to server. Please make sure the Spring Boot app is running.');
  }

  let data = null;
  try { data = await res.json(); } catch (e) { /* no body */ }

  if (!res.ok) {
    if (res.status === 401 && token && !location.pathname.endsWith('login.html')) {
      // session expired (server restarted) -> login again
      clearAuth();
      location.href = 'login.html';
    }
    const err = new Error((data && data.message) || 'Something went wrong. Please try again.');
    err.status = res.status;
    throw err;
  }
  return data;
}

/* ---------- Page protection ---------- */
function requireRole(role) {
  const u = getUser();
  if (!u || !getToken() || u.role !== role) {
    location.href = 'login.html?role=' + role.toLowerCase();
    return false;
  }
  return true;
}

/* ---------- Utilities ---------- */
function esc(s) {
  return String(s === null || s === undefined ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function money(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function statusLabel(s) {
  return String(s || '').replace(/_/g, ' ');
}

function toast(msg, type) {
  let box = document.getElementById('toastBox');
  if (!box) {
    box = document.createElement('div');
    box.id = 'toastBox';
    box.className = 'toast-box';
    document.body.appendChild(box);
  }
  const t = document.createElement('div');
  t.className = 'toast' + (type === 'error' ? ' error' : '');
  t.textContent = msg;
  box.appendChild(t);
  setTimeout(function () { t.remove(); }, 3000);
}

/* ---------- Cart (kept in browser localStorage) ---------- */
function getCart() {
  try { return JSON.parse(localStorage.getItem('bm_cart')) || []; } catch (e) { return []; }
}

function saveCart(cart) {
  localStorage.setItem('bm_cart', JSON.stringify(cart));
  updateCartBadge();
}

function cartCount() {
  return getCart().reduce(function (n, i) { return n + i.qty; }, 0);
}

function cartQty(productId) {
  const item = getCart().find(function (i) { return i.id === productId; });
  return item ? item.qty : 0;
}

function addToCart(p) {
  const cart = getCart();
  const item = cart.find(function (i) { return i.id === p.id; });
  if (item) {
    if (item.qty >= p.stock) { toast('Only ' + p.stock + ' ' + p.unit + ' available', 'error'); return false; }
    item.qty += 1;
    item.stock = p.stock;
  } else {
    if (p.stock < 1) { toast('Out of stock', 'error'); return false; }
    cart.push({ id: p.id, name: p.name, tamilName: p.tamilName, emoji: p.emoji, price: p.price, unit: p.unit, stock: p.stock, qty: 1 });
  }
  saveCart(cart);
  return true;
}

function setCartQty(productId, qty) {
  let cart = getCart();
  const item = cart.find(function (i) { return i.id === productId; });
  if (!item) return;
  if (qty <= 0) {
    cart = cart.filter(function (i) { return i.id !== productId; });
  } else if (qty > item.stock) {
    toast('Only ' + item.stock + ' ' + item.unit + ' available', 'error');
    return;
  } else {
    item.qty = qty;
  }
  saveCart(cart);
}

function clearCart() { saveCart([]); }

function updateCartBadge() {
  const el = document.getElementById('cartBadge');
  if (el) el.textContent = cartCount();
}

/* ---------- Navbar ---------- */
function renderNavbar(active) {
  const u = getUser();
  const loggedIn = u && getToken();
  const role = loggedIn ? u.role : null;

  let links = '<a href="index.html" class="' + (active === 'home' ? 'active' : '') + '">Home</a>';
  if (!loggedIn) {
    links += '<a href="cart.html" class="' + (active === 'cart' ? 'active' : '') + '">🛒 Cart<span class="cart-badge" id="cartBadge">0</span></a>';
    links += '<a href="login.html" class="' + (active === 'login' ? 'active' : '') + '">Login</a>';
    links += '<a href="register.html">Register</a>';
  } else if (role === 'BUYER') {
    links += '<a href="orders.html" class="' + (active === 'orders' ? 'active' : '') + '">My Orders</a>';
    links += '<a href="cart.html" class="' + (active === 'cart' ? 'active' : '') + '">🛒 Cart<span class="cart-badge" id="cartBadge">0</span></a>';
    links += '<span class="nav-user">👤 ' + esc(u.name) + '</span>';
    links += '<button class="linkbtn" onclick="logout()">Logout</button>';
  } else if (role === 'SELLER') {
    links += '<a href="seller.html" class="' + (active === 'seller' ? 'active' : '') + '">Seller Dashboard</a>';
    links += '<span class="nav-user">🏪 ' + esc(u.name) + '</span>';
    links += '<button class="linkbtn" onclick="logout()">Logout</button>';
  } else if (role === 'ADMIN') {
    links += '<a href="admin.html" class="' + (active === 'admin' ? 'active' : '') + '">Admin Panel</a>';
    links += '<span class="nav-user">🛡️ ' + esc(u.name) + '</span>';
    links += '<button class="linkbtn" onclick="logout()">Logout</button>';
  }

  const params = new URLSearchParams(location.search);
  const q = params.get('q') || '';

  const html =
    '<div class="nav-inner">' +
      '<a class="logo" href="index.html">🥬 Bhuvaneshwari Mart<small>Fresh Fruits &amp; Vegetables</small></a>' +
      '<form class="search-form" id="navSearchForm">' +
        '<input type="text" id="searchInput" placeholder="Search fruits &amp; vegetables (e.g. apple, தக்காளி)" value="' + esc(q) + '" autocomplete="off">' +
        '<button type="submit">Search</button>' +
      '</form>' +
      '<div class="nav-links">' + links + '</div>' +
    '</div>';

  const nav = document.getElementById('navbar');
  nav.className = 'navbar';
  nav.innerHTML = html;
  updateCartBadge();

  // On pages other than the shop, searching takes you to the shop page.
  // (shop.js replaces this behaviour on index.html)
  document.getElementById('navSearchForm').addEventListener('submit', function (e) {
    e.preventDefault();
    if (typeof window.onShopSearch === 'function') {
      window.onShopSearch(document.getElementById('searchInput').value.trim());
    } else {
      location.href = 'index.html?q=' + encodeURIComponent(document.getElementById('searchInput').value.trim());
    }
  });
}

function renderFooter() {
  const f = document.getElementById('footer');
  if (f) f.innerHTML = '© 2026 Bhuvaneshwari Mart · Fresh from the farm to your home 🌿';
}
