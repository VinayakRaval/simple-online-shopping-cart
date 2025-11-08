const API = "http://127.0.0.1:5000/api";
const user_id = parseInt(localStorage.getItem("user_id"));

// 🔸 Global Toast Utility (can be reused everywhere)
window.showToast = function (msg, isError = false) {
  const container = document.getElementById("toast-container") || (() => {
    const div = document.createElement("div");
    div.id = "toast-container";
    div.style.position = "fixed";
    div.style.bottom = "20px";
    div.style.right = "20px";
    div.style.zIndex = "9999";
    document.body.appendChild(div);
    return div;
  })();

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = msg;
  toast.style.background = isError ? "#ff4b4b" : "#00b4db";
  toast.style.color = "#02121a";
  toast.style.padding = "12px 20px";
  toast.style.borderRadius = "8px";
  toast.style.marginTop = "10px";
  toast.style.fontWeight = "600";
  toast.style.boxShadow = "0 5px 20px rgba(0,0,0,0.4)";
  toast.style.opacity = "0";
  toast.style.transform = "translateY(20px)";
  toast.style.transition = "all 0.3s ease";

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  }, 50);
  setTimeout(() => toast.remove(), 3000);
};

// 🔹 Load cart items
document.addEventListener("DOMContentLoaded", () => {
  if (!user_id) {
    alert("Please log in to view your cart.");
    window.location.href = "login.html";
    return;
  }
  loadCart();
  document.getElementById("placeOrderBtn").addEventListener("click", placeOrder);
});

// 🔹 Fetch Cart Items
async function loadCart() {
  const container = document.getElementById("cartContainer");
  container.innerHTML = "<p>Loading...</p>";

  try {
    const res = await fetch(`${API}/cart/${user_id}`);
    const items = await res.json();

    if (!items.length) {
      container.innerHTML = "<p>Your cart is empty 🛒</p>";
      document.getElementById("cartTotal").innerText = "0";
      return;
    }

    let total = 0;
    container.innerHTML = items.map(item => {
      const imgPath = `assets/images/${item.image || "placeholder.png"}`;
      total += item.price * item.quantity;
      return `
        <div class="cart-item">
          <img src="${imgPath}" alt="${item.name}" onerror="this.src='assets/images/placeholder.png'">
          <div class="cart-info">
            <h4>${item.name}</h4>
            <p>${item.description || "No description available."}</p>
            <p>₹${item.price} × ${item.quantity} = ₹${(item.price * item.quantity).toFixed(2)}</p>
          </div>
          <div class="cart-actions">
            <div class="qty-control">
              <button onclick="updateQty(${item.product_id}, ${item.quantity - 1})">-</button>
              <span>${item.quantity}</span>
              <button onclick="updateQty(${item.product_id}, ${item.quantity + 1})">+</button>
            </div>
            <button class="remove-btn" onclick="removeItem(${item.product_id})">Remove</button>
          </div>
        </div>
      `;
    }).join("");

    document.getElementById("cartTotal").innerText = total.toFixed(2);
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Failed to load cart.</p>";
  }
}

// 🔹 Update Quantity
async function updateQty(product_id, quantity) {
  if (quantity <= 0) return removeItem(product_id);
  try {
    await fetch(`${API}/cart/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, product_id, quantity }),
    });
    loadCart();
    showToast("Quantity updated!");
  } catch (err) {
    console.error(err);
  }
}

// 🔹 Remove Item
async function removeItem(product_id) {
  try {
    await fetch(`${API}/cart/remove`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, product_id }),
    });
    showToast("🗑️ Item removed from cart");
    loadCart();
  } catch (err) {
    console.error(err);
  }
}

// 🔹 Place Order
async function placeOrder() {
  try {
    const res = await fetch(`${API}/orders/place`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id,
        name: "Vinu",
        phone: "9999999999",
        email: "vinu@example.com",
        address: "Bengaluru, Karnataka",
      }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast("✅ Order placed successfully!");
      setTimeout(() => (window.location.href = "orders.html"), 1000);
    } else {
      showToast(data.error || "Failed to place order", true);
    }
  } catch (err) {
    console.error(err);
    showToast("❌ Network error", true);
  }
}
async function removeFromCart(cartId, productId) {
  const userId = localStorage.getItem("user_id");
  try {
    const res = await fetch("http://127.0.0.1:5000/api/cart/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, cart_id: cartId, product_id: productId })
    });
    const data = await res.json();
    if (res.ok) {
      showToast("🗑 Item removed");
      loadCartItems(); // reload cart
      updateCartBadge(); // update cart count in header
    } else {
      showToast(data.error || "Failed to remove", true);
    }
  } catch (err) {
    console.error("Remove error:", err);
    showToast("Server error removing item", true);
  }
}
// ✅ Frontend cart.js
const API_CART = "http://127.0.0.1:5000/api/cart";
const userId = localStorage.getItem("user_id");
const role = localStorage.getItem("role");

// ✅ 1. Check login status
if (!userId || role !== "Customer") {
  alert("Please log in as a user!");
  window.location.href = "login.html";
} else {
  loadCart();
}

// ✅ 2. Load cart items
async function loadCart() {
  const cartContainer = document.getElementById("cartItems");
  try {
    const res = await fetch(`${API_CART}/${userId}`);
    const data = await res.json();

    if (!res.ok) {
      cartContainer.innerHTML = `<p style='color:red;'>${data.error || "Failed to load cart."}</p>`;
      return;
    }

    if (!Array.isArray(data) || data.length === 0) {
      cartContainer.innerHTML = `<p>Your cart is empty.</p>`;
      return;
    }

    renderCart(data);
  } catch (err) {
    console.error(err);
    cartContainer.innerHTML = `<p style='color:red;'>Server error loading cart.</p>`;
  }
}

// ✅ 3. Render cart items
function renderCart(items) {
  const container = document.getElementById("cartItems");
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  container.innerHTML = `
    <table class="cart-table">
      <thead>
        <tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th><th></th></tr>
      </thead>
      <tbody>
        ${items.map(i => `
          <tr>
            <td>${i.name}</td>
            <td>${i.quantity}</td>
            <td>₹${i.price}</td>
            <td>₹${i.price * i.quantity}</td>
            <td><button onclick="removeFromCart(${i.product_id})">❌</button></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    <div class="cart-summary">
      <h3>Total: ₹${total}</h3>
      <button id="placeOrderBtn" onclick="placeOrder()">Place Order</button>
    </div>
  `;
}

// ✅ 4. Remove item
async function removeFromCart(productId) {
  const res = await fetch(`${API_CART}/remove`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, product_id: productId })
  });
  const data = await res.json();
  if (res.ok) {
    alert("Item removed from cart.");
    loadCart();
  } else {
    alert(data.error || "Failed to remove item.");
  }
}

// ✅ 5. Place order
async function placeOrder() {
  try {
    const res = await fetch("http://127.0.0.1:5000/api/orders/place", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId })
    });
    const data = await res.json();

    if (res.ok) {
      alert("✅ Order placed successfully!");
      window.location.href = "my-orders.html";
    } else {
      alert(data.error || "Failed to place order.");
    }
  } catch (err) {
    alert("Server error placing order!");
  }
}
