const API = "http://127.0.0.1:5000";
document.addEventListener("DOMContentLoaded", loadOrders);

async function loadOrders() {
  const container = document.getElementById("ordersContainer");
  const user_id = localStorage.getItem("user_id") || 1;
  container.innerHTML = "<p>Loading...</p>";

  try {
    const res = await fetch(`${API}/api/orders/user/${user_id}`);
    const orders = await res.json();

    if (!Array.isArray(orders) || orders.length === 0) {
      container.innerHTML = "<p>No orders found.</p>";
      return;
    }

    container.innerHTML = "";
    orders.forEach(order => {
      const div = document.createElement("div");
      div.className = "order";
      div.innerHTML = `
        <div class="order-header">
          <span class="order-id">Order #${order.order_id}</span>
          <span class="price">Total: ₹${order.total_amount}</span>
        </div>
        <div>Date: ${new Date(order.date).toLocaleString()}</div>
        <div class="order-items">
          ${order.items.map(i => `
            <div class="item">
              <strong>${i.name}</strong><br>
              Qty: ${i.quantity} × ₹${i.price}<br>
              <span class="price">Subtotal: ₹${(i.quantity * i.price).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Failed to load orders.</p>";
  }
}
