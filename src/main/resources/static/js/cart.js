/* Cart page: review items, checkout, place order */

const area = document.getElementById('cartArea');
let placing = false;

// Refresh price / stock of cart items from the server
async function syncCart() {
  const cart = getCart();
  if (cart.length === 0) return;
  try {
    const list = await api('/api/products');
    const map = {};
    list.forEach(function (p) { map[p.id] = p; });

    let changed = false;
    const fresh = [];
    cart.forEach(function (i) {
      const p = map[i.id];
      if (!p || p.stock < 1) { changed = true; return; }
      if (i.price !== p.price) changed = true;
      i.price = p.price;
      i.stock = p.stock;
      i.name = p.name;
      i.tamilName = p.tamilName;
      i.emoji = p.emoji;
      i.unit = p.unit;
      if (i.qty > p.stock) { i.qty = p.stock; changed = true; }
      fresh.push(i);
    });
    saveCart(fresh);
    if (changed) toast('Some items in your cart were updated (price / availability)', 'error');
  } catch (e) {
    // if server is not reachable we still show the cart from the browser
  }
}

function cartTotal(cart) {
  return cart.reduce(function (t, i) { return t + i.price * i.qty; }, 0);
}

function checkoutHtml(total) {
  const user = getUser();
  const loggedIn = user && getToken();

  if (!loggedIn) {
    return '<p class="muted">Please login as a buyer to place your order.</p>' +
           '<a class="btn btn-block mt" href="login.html?redirect=cart.html">Login to Place Order</a>' +
           '<div class="auth-foot">New here? <a href="register.html">Create an account</a></div>';
  }
  if (user.role !== 'BUYER') {
    return '<p class="muted">You are logged in as <strong>' + esc(user.role.toLowerCase()) +
           '</strong>. Only buyers can place orders. Please logout and login with a buyer account.</p>' +
           '<button class="btn btn-block mt" onclick="logout()">Logout</button>';
  }
  return '<div class="form-group"><label for="address">Delivery Address</label>' +
           '<textarea id="address" rows="3" placeholder="Door no, street, area, city, pincode"></textarea></div>' +
         '<div class="form-group"><label for="phone">Phone Number</label>' +
           '<input type="tel" id="phone" maxlength="10" placeholder="10 digit mobile number" value="' + esc(user.phone || '') + '"></div>' +
         '<div class="form-group"><label>Payment</label><div class="radio-row">' +
           '<label><input type="radio" name="pay" value="COD" checked> Cash on Delivery</label>' +
           '<label><input type="radio" name="pay" value="UPI"> UPI on Delivery</label>' +
         '</div></div>' +
         '<button class="btn btn-block" id="placeBtn">Place Order · ' + money(total) + '</button>';
}

function render() {
  const cart = getCart();
  updateCartBadge();

  if (cart.length === 0) {
    area.innerHTML =
      '<div class="empty"><div class="big">🛒</div><h2>Your cart is empty</h2>' +
      '<p>Add some fresh fruits and vegetables to get started.</p>' +
      '<a href="index.html" class="btn mt">Start Shopping</a></div>';
    return;
  }

  const items = cart.map(function (i) {
    return '<div class="cart-item">' +
             '<div class="ci-img">' + esc(i.emoji || '🥬') + '</div>' +
             '<div class="ci-info"><div class="ci-name">' + esc(i.name) + '</div>' +
               '<div class="ci-price">' + money(i.price) + ' / ' + esc(i.unit) + '</div></div>' +
             '<div class="stepper">' +
               '<button data-action="dec" data-id="' + i.id + '">−</button>' +
               '<span>' + i.qty + '</span>' +
               '<button data-action="inc" data-id="' + i.id + '">+</button>' +
             '</div>' +
             '<div class="ci-total">' + money(i.price * i.qty) + '</div>' +
             '<button class="remove-btn" title="Remove" data-action="remove" data-id="' + i.id + '">🗑</button>' +
           '</div>';
  }).join('');

  const total = cartTotal(cart);
  const count = cartCount();

  area.innerHTML =
    '<div class="cart-layout">' +
      '<div class="panel"><h2>Items (' + count + ')</h2>' + items + '</div>' +
      '<div class="panel"><h2>Order Summary</h2>' +
        '<div class="summary-row"><span>Subtotal</span><span>' + money(total) + '</span></div>' +
        '<div class="summary-row"><span>Delivery</span><span style="color:#2e7d32">FREE</span></div>' +
        '<div class="summary-row total"><span>Total</span><span>' + money(total) + '</span></div>' +
        '<div class="mt">' + checkoutHtml(total) + '</div>' +
      '</div>' +
    '</div>';
}

// keep what the user typed while the cart re-renders
function renderKeepingForm() {
  const a = document.getElementById('address');
  const p = document.getElementById('phone');
  const pay = document.querySelector('input[name="pay"]:checked');
  const saved = { a: a ? a.value : '', p: p ? p.value : '', pay: pay ? pay.value : 'COD' };
  render();
  const a2 = document.getElementById('address');
  const p2 = document.getElementById('phone');
  if (a2) a2.value = saved.a;
  if (p2 && saved.p) p2.value = saved.p;
  const radio = document.querySelector('input[name="pay"][value="' + saved.pay + '"]');
  if (radio) radio.checked = true;
}

async function placeOrder() {
  if (placing) return;
  const address = document.getElementById('address').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const payment = document.querySelector('input[name="pay"]:checked').value;

  if (!address) { toast('Please enter your delivery address', 'error'); return; }
  if (!/^[0-9]{10}$/.test(phone)) { toast('Phone number must be 10 digits', 'error'); return; }

  const cart = getCart();
  if (cart.length === 0) return;

  placing = true;
  const btn = document.getElementById('placeBtn');
  btn.disabled = true;
  btn.textContent = 'Placing order...';

  try {
    const order = await api('/api/orders', {
      method: 'POST',
      body: {
        items: cart.map(function (i) { return { productId: i.id, quantity: i.qty }; }),
        address: address,
        phone: phone,
        paymentMethod: payment
      }
    });
    clearCart();
    document.getElementById('successOrderId').textContent = 'Order ID: #' + order.id + ' · Total ' + money(order.totalAmount);
    document.getElementById('successModal').classList.add('show');
    render();
  } catch (err) {
    toast(err.message, 'error');
    await syncCart();
    renderKeepingForm();
  } finally {
    placing = false;
  }
}

area.addEventListener('click', function (e) {
  const btn = e.target.closest('button');
  if (!btn) return;

  if (btn.id === 'placeBtn') { placeOrder(); return; }

  const action = btn.dataset.action;
  if (!action) return;
  const id = Number(btn.dataset.id);

  if (action === 'inc') setCartQty(id, cartQty(id) + 1);
  else if (action === 'dec') setCartQty(id, cartQty(id) - 1);
  else if (action === 'remove') setCartQty(id, 0);
  renderKeepingForm();
});

(async function init() {
  renderNavbar('cart');
  renderFooter();
  await syncCart();
  render();
})();
