const API = "http://127.0.0.1:5000/api";
const user_id = parseInt(localStorage.getItem("user_id"));

document.addEventListener("DOMContentLoaded", () => {
  if (!user_id) {
    alert("Please log in to view your orders.");
    window.location.href = "login.html";
    return;
  }
  loadOrders();
});

async function loadOrders() {
  const container = document.getElementById("ordersContainer");
  container.innerHTML = "<p>Loading orders...</p>";

  try {
    const res = await fetch(`${API}/orders/${user_id}`);
    const orders = await res.json();

    if (!orders.length) {
      container.innerHTML = "<p>No orders found 🛍️</p>";
      return;
    }

    container.innerHTML = orders.map(o => `
      <div class="order-card">
        <div class="order-header">
          <h3>Order #${o.order_id}</h3>
          <span class="status">${o.status}</span>
        </div>
        <p><strong>Date:</strong> ${new Date(o.date).toLocaleString()}</p>
        <p><strong>Total:</strong> ₹${o.total_price}</p>
        <div class="order-items">
          ${o.items.map(i => `
            <div class="item">
              <img src="assets/images/${i.image}" alt="${i.name}" 
                   onerror="this.src='assets/images/placeholder.png'">
              <div>
                <h4>${i.name}</h4>
                <p>₹${i.price} × ${i.quantity}</p>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `).join("");
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Failed to load orders.</p>";
  }
}
