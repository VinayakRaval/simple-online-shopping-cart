const API = "http://127.0.0.1:5000/api";
const user_id = localStorage.getItem("user_id") || 1;

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const product_id = params.get("id");
  if (product_id) loadProductDetails(product_id);
  updateCartCount();
});

// 📦 Load product details
async function loadProductDetails(id) {
  const container = document.getElementById("productDetails");
  container.innerHTML = "<p>Loading...</p>";

  try {
    const res = await fetch(`${API}/products/${id}`);
    const product = await res.json();

    if (!product || !product.name) {
      container.innerHTML = "<p>Product not found.</p>";
      return;
    }

    container.innerHTML = `
      <div class="details">
        <img src="assets/images/${product.image}" class="detail-img" alt="${product.name}">
        <div class="info">
          <h2>${product.name}</h2>
          <p>${product.description}</p>
          <h3>₹${product.price}</h3>
          <button class="btn add" onclick="addToCart(${product.id})">Add to Cart</button>
        </div>
      </div>
    `;
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Failed to load product details.</p>";
  }
}

// 🛒 Add to cart (same logic as products.js)
async function addToCart(product_id) {
  try {
    const res = await fetch(`${API}/cart/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, product_id, quantity: 1 }),
    });

    const data = await res.json();

    if (res.ok) {
      showToast("✅ Item added to cart");
      updateCartCount();
    } else {
      showToast("⚠️ " + (data.error || "Failed to add"), true);
    }
  } catch (err) {
    console.error(err);
    showToast("❌ Error adding to cart", true);
  }
}

// 🔸 Toast Notification Function
function showToast(message, isError = false) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.style.background = isError ? "#ff4b4b" : "#00b4db";
  toast.innerText = message;
  document.getElementById("toast-container").appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// 🔸 Dynamic Cart Count
async function updateCartCount() {
  try {
    const res = await fetch(`${API}/cart/${user_id}`);
    const items = await res.json();
    const total = items.reduce((sum, i) => sum + i.quantity, 0);
    document.getElementById("cartCount").innerText = total;
  } catch {
    document.getElementById("cartCount").innerText = "0";
  }
}
