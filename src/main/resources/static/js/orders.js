/* My Orders page (buyer order history) */

const ordersArea = document.getElementById('ordersArea');

function orderCard(o) {
  const items = o.items.map(function (i) {
    return '<div class="order-item">' +
             '<span>' + esc(i.emoji || '') + ' ' + esc(i.productName) +
               ' <span class="muted">× ' + i.quantity + ' ' + esc(i.unit) + '</span></span>' +
             '<span>' + money(i.price * i.quantity) + '</span>' +
           '</div>';
  }).join('');

  const canCancel = (o.status === 'PLACED' || o.status === 'CONFIRMED');

  return '<div class="order-card">' +
           '<div class="order-head">' +
             '<div><div class="oid">Order #' + o.id + '</div><div class="odate">' + esc(fmtDate(o.createdAt)) + '</div></div>' +
             '<span class="status ' + esc(o.status) + '">' + esc(statusLabel(o.status)) + '</span>' +
           '</div>' +
           '<div class="order-body">' + items +
             '<div class="order-meta">📍 ' + esc(o.address) + '<br>📞 ' + esc(o.customerPhone) +
               ' · 💳 ' + esc(o.paymentMethod) + '</div>' +
           '</div>' +
           '<div class="order-foot">' +
             '<strong>Total: ' + money(o.totalAmount) + '</strong>' +
             (canCancel ? '<button class="btn btn-danger btn-sm" data-cancel="' + o.id + '">Cancel Order</button>' : '') +
           '</div>' +
         '</div>';
}

async function loadOrders() {
  try {
    const orders = await api('/api/orders/my');
    if (orders.length === 0) {
      ordersArea.innerHTML =
        '<div class="empty"><div class="big">📦</div><h2>No orders yet</h2>' +
        '<p>When you place an order it will show up here.</p>' +
        '<a href="index.html" class="btn mt">Start Shopping</a></div>';
      return;
    }
    ordersArea.innerHTML = orders.map(orderCard).join('');
  } catch (e) {
    ordersArea.innerHTML = '<div class="empty"><div class="big">⚠️</div><h2>Could not load orders</h2><p>' + esc(e.message) + '</p></div>';
  }
}

ordersArea.addEventListener('click', async function (e) {
  const btn = e.target.closest('button[data-cancel]');
  if (!btn) return;
  if (!confirm('Do you want to cancel this order?')) return;
  btn.disabled = true;
  try {
    await api('/api/orders/' + btn.dataset.cancel + '/cancel', { method: 'PUT' });
    toast('Order cancelled');
    loadOrders();
  } catch (err) {
    toast(err.message, 'error');
    btn.disabled = false;
  }
});

if (requireRole('BUYER')) {
  renderNavbar('orders');
  renderFooter();
  loadOrders();
}
