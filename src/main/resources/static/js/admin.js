/* Admin panel: stats, users, products, orders */

const STATUSES = ['PLACED', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
const content = document.getElementById('adminContent');
let currentTab = 'users';

async function loadStats() {
  try {
    const s = await api('/api/admin/stats');
    document.getElementById('adminStats').innerHTML =
      '<div class="stat"><div class="num">' + s.buyers + '</div><div class="lbl">Buyers</div></div>' +
      '<div class="stat"><div class="num">' + s.sellers + '</div><div class="lbl">Sellers</div></div>' +
      '<div class="stat"><div class="num">' + s.products + '</div><div class="lbl">Products</div></div>' +
      '<div class="stat"><div class="num">' + s.orders + '</div><div class="lbl">Orders</div></div>' +
      '<div class="stat"><div class="num">' + money(s.revenue) + '</div><div class="lbl">Revenue (excl. cancelled)</div></div>';
  } catch (e) {
    toast(e.message, 'error');
  }
}

/* ---------- Users ---------- */
async function showUsers() {
  const users = await api('/api/admin/users');
  const rows = users.map(function (u) {
    return '<tr>' +
             '<td>' + u.id + '</td>' +
             '<td>' + esc(u.name) + '</td>' +
             '<td>' + esc(u.email) + '</td>' +
             '<td>' + esc(u.phone || '') + '</td>' +
             '<td><span class="status ' + (u.role === 'ADMIN' ? 'CONFIRMED' : u.role === 'SELLER' ? 'PACKED' : 'PLACED') + '">' + esc(u.role) + '</span></td>' +
             '<td>' + esc(fmtDate(u.createdAt)) + '</td>' +
             '<td>' + (u.role === 'ADMIN' ? '<span class="muted">—</span>' :
               '<button class="btn btn-sm btn-danger" data-deluser="' + u.id + '">Delete</button>') + '</td>' +
           '</tr>';
  }).join('');
  content.innerHTML =
    '<table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th><th>Action</th></tr></thead>' +
    '<tbody>' + rows + '</tbody></table>';
}

/* ---------- Products ---------- */
async function showProducts() {
  const list = await api('/api/products');
  if (list.length === 0) { content.innerHTML = '<p class="muted">No products.</p>'; return; }
  const rows = list.map(function (p) {
    return '<tr>' +
             '<td style="font-size:1.5rem">' + esc(p.emoji) + '</td>' +
             '<td><strong>' + esc(p.name) + '</strong><br><span class="muted">' + esc(p.tamilName || '') + '</span></td>' +
             '<td>' + esc(p.category) + '</td>' +
             '<td>' + money(p.price) + ' / ' + esc(p.unit) + '</td>' +
             '<td>' + p.stock + '</td>' +
             '<td>' + esc(p.sellerName || '') + '</td>' +
             '<td><button class="btn btn-sm btn-danger" data-delproduct="' + p.id + '">Delete</button></td>' +
           '</tr>';
  }).join('');
  content.innerHTML =
    '<table><thead><tr><th></th><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Seller</th><th>Action</th></tr></thead>' +
    '<tbody>' + rows + '</tbody></table>';
}

/* ---------- Orders ---------- */
async function showOrders() {
  const orders = await api('/api/admin/orders');
  if (orders.length === 0) { content.innerHTML = '<p class="muted">No orders yet.</p>'; return; }
  const rows = orders.map(function (o) {
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
             '<td>' + money(o.totalAmount) + '<br><span class="muted">' + esc(o.paymentMethod) + '</span></td>' +
             '<td><span class="status ' + esc(o.status) + '">' + esc(statusLabel(o.status)) + '</span></td>' +
             '<td>' + (final ? '<span class="muted">Closed</span>' :
               '<select data-order="' + o.id + '">' + options + '</select>') + '</td>' +
           '</tr>';
  }).join('');
  content.innerHTML =
    '<table><thead><tr><th>Order</th><th>Customer</th><th>Address</th><th>Items</th><th>Total</th><th>Status</th><th>Update</th></tr></thead>' +
    '<tbody>' + rows + '</tbody></table>';
}

/* ---------- Tab handling ---------- */
async function showTab(tab) {
  currentTab = tab;
  document.querySelectorAll('#adminTabs .tab').forEach(function (t) {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  content.innerHTML = '<p class="muted">Loading...</p>';
  try {
    if (tab === 'users') await showUsers();
    else if (tab === 'products') await showProducts();
    else await showOrders();
  } catch (e) {
    content.innerHTML = '<p class="muted">' + esc(e.message) + '</p>';
  }
}

document.getElementById('adminTabs').addEventListener('click', function (e) {
  const tab = e.target.closest('.tab');
  if (tab) showTab(tab.dataset.tab);
});

content.addEventListener('click', async function (e) {
  const delUser = e.target.closest('button[data-deluser]');
  const delProduct = e.target.closest('button[data-delproduct]');
  try {
    if (delUser) {
      if (!confirm('Delete this user? If it is a seller, all their products will also be deleted.')) return;
      await api('/api/admin/users/' + delUser.dataset.deluser, { method: 'DELETE' });
      toast('User deleted');
    } else if (delProduct) {
      if (!confirm('Delete this product permanently?')) return;
      await api('/api/products/' + delProduct.dataset.delproduct, { method: 'DELETE' });
      toast('Product deleted');
    } else {
      return;
    }
    loadStats();
    showTab(currentTab);
  } catch (err) {
    toast(err.message, 'error');
  }
});

content.addEventListener('change', async function (e) {
  const sel = e.target.closest('select[data-order]');
  if (!sel) return;
  if (sel.value === 'CANCELLED' && !confirm('Cancel this order? Stock will be returned.')) {
    showTab('orders');
    return;
  }
  try {
    await api('/api/orders/' + sel.dataset.order + '/status', { method: 'PUT', body: { status: sel.value } });
    toast('Order status updated');
  } catch (err) {
    toast(err.message, 'error');
  }
  loadStats();
  showTab('orders');
});

/* ---------- init ---------- */
if (requireRole('ADMIN')) {
  renderNavbar('admin');
  renderFooter();
  loadStats();
  showTab('users');
}
