/* Shop page: product list, search, category filter, add to cart */

let products = [];
let currentCategory = '';
let currentQuery = '';
let searchTimer = null;

// called by the navbar search form (see common.js)
window.onShopSearch = function (q) {
  currentQuery = q;
  const url = q ? 'index.html?q=' + encodeURIComponent(q) : 'index.html';
  history.replaceState(null, '', url);
  loadProducts();
};

async function loadProducts() {
  const grid = document.getElementById('productGrid');
  const info = document.getElementById('resultInfo');
  try {
    products = await api('/api/products?q=' + encodeURIComponent(currentQuery) +
                         '&category=' + encodeURIComponent(currentCategory));
    renderProducts();
  } catch (e) {
    grid.innerHTML = '';
    info.textContent = '';
    document.getElementById('noResults').innerHTML =
      '<div class="empty"><div class="big">⚠️</div><h2>Could not load products</h2><p>' + esc(e.message) + '</p></div>';
  }
}

function productCard(p) {
  const qty = cartQty(p.id);
  let stockHtml = '';
  if (p.stock < 1) stockHtml = '<div class="stock-out">Out of stock</div>';
  else if (p.stock <= 10) stockHtml = '<div class="stock-low">Only ' + p.stock + ' ' + esc(p.unit) + ' left</div>';

  let action;
  if (p.stock < 1) {
    action = '<button class="btn btn-block" disabled>Out of stock</button>';
  } else if (qty > 0) {
    action = '<div class="stepper">' +
               '<button data-action="dec" data-id="' + p.id + '">−</button>' +
               '<span>' + qty + '</span>' +
               '<button data-action="inc" data-id="' + p.id + '">+</button>' +
             '</div>';
  } else {
    action = '<button class="btn btn-block" data-action="add" data-id="' + p.id + '">Add to Cart</button>';
  }

  return '<div class="card">' +
           '<div class="pimg">' + esc(p.emoji || '🥬') + '</div>' +
           '<span class="badge-cat">' + esc(p.category) + '</span>' +
           '<div class="pname">' + esc(p.name) + '</div>' +
           (p.tamilName ? '<div class="ptamil">' + esc(p.tamilName) + '</div>' : '') +
           '<div class="pdesc">' + esc(p.description || '') + '</div>' +
           '<div class="pprice">' + money(p.price) + ' <small>/ ' + esc(p.unit) + '</small></div>' +
           stockHtml +
           '<div class="mt">' + action + '</div>' +
         '</div>';
}

function renderProducts() {
  const grid = document.getElementById('productGrid');
  const info = document.getElementById('resultInfo');
  const none = document.getElementById('noResults');

  if (products.length === 0) {
    grid.innerHTML = '';
    info.textContent = '';
    const what = currentQuery ? ' for "' + esc(currentQuery) + '"' : '';
    none.innerHTML =
      '<div class="empty">' +
        '<div class="big">🔍</div>' +
        '<h2>No results found' + what + '</h2>' +
        '<p>Sorry, we could not find any matching product. Try a different name.</p>' +
        '<button class="btn mt" id="clearSearchBtn">Show all products</button>' +
      '</div>';
    document.getElementById('clearSearchBtn').addEventListener('click', function () {
      document.getElementById('searchInput').value = '';
      setCategory('');
      window.onShopSearch('');
    });
    return;
  }

  none.innerHTML = '';
  info.textContent = 'Showing ' + products.length + ' product' + (products.length > 1 ? 's' : '') +
                     (currentQuery ? ' for "' + currentQuery + '"' : '');
  grid.innerHTML = products.map(productCard).join('');
}

function setCategory(cat) {
  currentCategory = cat;
  document.querySelectorAll('#chips .chip').forEach(function (c) {
    c.classList.toggle('active', c.dataset.cat === cat);
  });
}

/* ---------- events ---------- */
document.getElementById('productGrid').addEventListener('click', function (e) {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const user = getUser();
  if (user && getToken() && user.role !== 'BUYER') {
    toast('Please login as a Buyer to shop', 'error');
    return;
  }

  const id = Number(btn.dataset.id);
  const p = products.find(function (x) { return x.id === id; });
  if (!p) return;

  const action = btn.dataset.action;
  if (action === 'add') {
    if (addToCart(p)) toast(p.name + ' added to cart');
  } else if (action === 'inc') {
    addToCart(p);
  } else if (action === 'dec') {
    setCartQty(id, cartQty(id) - 1);
  }
  renderProducts();
});

document.getElementById('chips').addEventListener('click', function (e) {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  setCategory(chip.dataset.cat);
  loadProducts();
});

/* ---------- init ---------- */
renderNavbar('home');
renderFooter();

currentQuery = (new URLSearchParams(location.search).get('q') || '').trim();

// live search while typing
document.getElementById('searchInput').addEventListener('input', function (e) {
  clearTimeout(searchTimer);
  const value = e.target.value.trim();
  searchTimer = setTimeout(function () { window.onShopSearch(value); }, 300);
});

loadProducts();
