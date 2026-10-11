/* Seller dashboard: add / edit / delete products, manage orders */

const STATUSES = ['PLACED', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

let myProducts = [];
let myOrders = [];
let editingId = null;

/* ---------- Products ---------- */
async function loadProducts() {
  try {
    myProducts = await api('/api/products/mine');
    renderProducts();
    renderStats();
  } catch (e) {
    document.getElementById('myProducts').innerHTML = '<p class="muted">' + esc(e.message) + '</p>';
  }
}

function renderProducts() {
  const filter = document.getElementById('productFilter').value.trim().toLowerCase();
  const list = myProducts.filter(function (p) {
    return !filter || p.name.toLowerCase().indexOf(filter) >= 0 ||
           (p.tamilName || '').toLowerCase().indexOf(filter) >= 0;
  });

  if (list.length === 0) {
    document.getElementById('myProducts').innerHTML =
      '<p class="muted">' + (myProducts.length === 0 ? 'You have not added any products yet.' : 'No results found') + '</p>';
    return;
  }

  const rows = list.map(function (p) {
    return '<tr>' +
             '<td style="font-size:1.6rem">' + esc(p.emoji) + '</td>' +
             '<td><strong>' + esc(p.name) + '</strong><br><span class="muted">' + esc(p.tamilName || '') + '</span></td>' +
             '<td>' + esc(p.category) + '</td>' +
             '<td>' + money(p.price) + ' / ' + esc(p.unit) + '</td>' +
             '<td>' + p.stock + (p.stock < 1 ? ' <span class="stock-out">(out)</span>' : '') + '</td>' +
             '<td>' +
               '<button class="btn btn-sm" data-edit="' + p.id + '">Edit</button> ' +
               '<button class="btn btn-sm btn-danger" data-delete="' + p.id + '">Delete</button>' +
             '</td>' +
           '</tr>';
  }).join('');

  document.getElementById('myProducts').innerHTML =
    '<table><thead><tr><th></th><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>' +
    '<tbody>' + rows + '</tbody></table>';
}

function renderStats() {
  const active = myOrders.filter(function (o) { return o.status !== 'CANCELLED'; });
  const revenue = active.reduce(function (t, o) { return t + o.totalAmount; }, 0);
  const lowStock = myProducts.filter(function (p) { return p.stock <= 10; }).length;
  document.getElementById('sellerStats').innerHTML =
    '<div class="stat"><div class="num">' + myProducts.length + '</div><div class="lbl">My Products</div></div>' +
    '<div class="stat"><div class="num">' + myOrders.length + '</div><div class="lbl">Orders Received</div></div>' +
    '<div class="stat"><div class="num">' + lowStock + '</div><div class="lbl">Low / Out of Stock</div></div>' +
    '<div class="stat"><div class="num">' + money(revenue) + '</div><div class="lbl">Sales (excl. cancelled)</div></div>';
}

/* ---------- Form ---------- */
function resetForm() {
  editingId = null;
  document.getElementById('productForm').reset();
  document.getElementById('pUnit').value = 'kg';
  document.getElementById('formTitle').textContent = '➕ Add New Product';
  document.getElementById('saveBtn').textContent = 'Add Product';
  document.getElementById('cancelEditBtn').style.display = 'none';
}

function startEdit(id) {
  const p = myProducts.find(function (x) { return x.id === id; });
  if (!p) return;
  editingId = id;
  document.getElementById('pName').value = p.name;
  document.getElementById('pTamil').value = p.tamilName || '';
  document.getElementById('pCategory').value = p.category;
  document.getElementById('pPrice').value = p.price;
  document.getElementById('pUnit').value = p.unit;
  document.getElementById('pStock').value = p.stock;
  document.getElementById('pEmoji').value = p.emoji || '';
  document.getElementById('pDesc').value = p.description || '';
  document.getElementById('formTitle').textContent = '✏️ Edit Product';
  document.getElementById('saveBtn').textContent = 'Update Product';
  document.getElementById('cancelEditBtn').style.display = 'inline-block';
  document.getElementById('productForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

document.getElementById('productForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const body = {
    name: document.getElementById('pName').value.trim(),
    tamilName: document.getElementById('pTamil').value.trim(),
    category: document.getElementById('pCategory').value,
    price: parseFloat(document.getElementById('pPrice').value),
    unit: document.getElementById('pUnit').value.trim(),
    stock: parseInt(document.getElementById('pStock').value, 10),
    emoji: document.getElementById('pEmoji').value.trim(),
    description: document.getElementById('pDesc').value.trim()
  };
  if (isNaN(body.price) || isNaN(body.stock)) { toast('Please enter valid price and stock', 'error'); return; }

  const btn = document.getElementById('saveBtn');
  btn.disabled = true;
  try {
    if (editingId) {
      await api('/api/products/' + editingId, { method: 'PUT', body: body });
      toast('Product updated');
    } else {
      await api('/api/products', { method: 'POST', body: body });
      toast('Product added');
    }
    resetForm();
    await loadProducts();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
});

document.getElementById('cancelEditBtn').addEventListener('click', resetForm);
document.getElementById('productFilter').addEventListener('input', renderProducts);

document.getElementById('myProducts').addEventListener('click', async function (e) {
  const editBtn = e.target.closest('button[data-edit]');
  const delBtn = e.target.closest('button[data-delete]');
  if (editBtn) {
    startEdit(Number(editBtn.dataset.edit));
  } else if (delBtn) {
    if (!confirm('Delete this product permanently?')) return;
    try {
      await api('/api/products/' + delBtn.dataset.delete, { method: 'DELETE' });
      toast('Product deleted');
      if (editingId === Number(delBtn.dataset.delete)) resetForm();
      loadProducts();
    } catch (err) {
      toast(err.message, 'error');
    }
  }
});

/* ---------- Orders ---------- */
async function loadOrders() {
  try {
    myOrders = await api('/api/orders/seller');
    renderOrders();
    renderStats();
  } catch (e) {
    document.getElementById('sellerOrders').innerHTML = '<p class="muted">' + esc(e.message) + '</p>';
  }
}

function renderOrders() {
  if (myOrders.length === 0) {
    document.getElementById('sellerOrders').innerHTML = '<p class="muted">No orders yet for your products.</p>';
    return;
  }
  const rows = myOrders.map(function (o) {
    const items = o.items.map(function (i) {
      return esc(i.emoji || '') + ' ' + esc(i.productName) + ' × ' + i.quantity + ' ' + esc(i.unit);
    }).join('<br>');
    const final = (o.status === 'DELIVERED' || o.status === 'CANCELLED');
    const options = STATUSES.map(function (s) {
      return '<option value="' + s + '"' + (s === o.status ? ' selected' : '') + '>' + statusLabel(s) + '</option>';
    }).join('');
    return '<tr>' +
             '<td>#' + o.id + '<br><span class="muted">' + esc(fmtDate(o.createdAt)) + '</span></td>' +
             '<td>' + esc(o.customerName) + '<br><span class="muted">📞 ' + esc(o.customerPhone) + '</span></td>' +
             '<td>' + esc(o.address) + '</td>' +
             '<td>' + items + '</td>' +
             '<td>' + money(o.totalAmount) + '</td>' +
             '<td><span class="status ' + esc(o.status) + '">' + esc(statusLabel(o.status)) + '</span></td>' +
             '<td>' + (final ? '<span class="muted">Closed</span>' :
               '<select data-order="' + o.id + '">' + options + '</select>') + '</td>' +
           '</tr>';
  }).join('');

  document.getElementById('sellerOrders').innerHTML =
    '<table><thead><tr><th>Order</th><th>Customer</th><th>Address</th><th>My Items</th><th>My Amount</th><th>Status</th><th>Update</th></tr></thead>' +
    '<tbody>' + rows + '</tbody></table>';
}

document.getElementById('sellerOrders').addEventListener('change', async function (e) {
  const sel = e.target.closest('select[data-order]');
  if (!sel) return;
  if (sel.value === 'CANCELLED' && !confirm('Cancel this order? Stock will be returned.')) {
    loadOrders();
    return;
  }
  try {
    await api('/api/orders/' + sel.dataset.order + '/status', { method: 'PUT', body: { status: sel.value } });
    toast('Order status updated');
  } catch (err) {
    toast(err.message, 'error');
  }
  loadOrders();
  loadProducts(); // stock may have changed on cancel
});

/* ---------- init ---------- */
if (requireRole('SELLER')) {
  renderNavbar('seller');
  renderFooter();
  loadProducts();
  loadOrders();
}
