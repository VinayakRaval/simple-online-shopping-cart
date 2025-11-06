// frontend/js/product-details.js
const API = "http://127.0.0.1:5000/api";
const user_id = parseInt(localStorage.getItem("user_id")) || 1;

// toast + updateCartBadge (duplicate because this file is standalone)
function showToast(message, isError = false) {
  const container = document.getElementById("toast-container") || (() => {
    const c = document.createElement("div"); c.id = "toast-container"; document.body.appendChild(c); return c;
  })();

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.style.background = isError ? "#ff4b4b" : "#00b4db";
  toast.style.color = isError ? "#fff" : "#02121a";
  toast.style.padding = "10px 14px";
  toast.style.borderRadius = "8px";
  toast.style.marginTop = "8px";
  toast.style.fontWeight = "600";
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

async function updateCartBadge() {
  try {
    const res = await fetch(`${API}/cart/${user_id}`);
    if (!res.ok) throw new Error("cart fetch failed");
    const items = await res.json();
    const total = items.reduce((s,i)=>s+(i.quantity||0),0);
    const e = document.getElementById("cartCount");
    const f = document.getElementById("floatCount");
    if (e) e.innerText = total;
    if (f) f.innerText = total;
  } catch (err) {
    console.warn("updateCartBadge:", err);
  }
}

async function addToCart(product_id) {
  const user_id = parseInt(localStorage.getItem("user_id"));
  if (!user_id) {
    alert("Please log in to add items to cart.");
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch("http://127.0.0.1:5000/api/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, product_id, quantity: 1 }),
    });
    const data = await res.json();

    if (res.ok) {
      showToast("✅ Item added to cart!");
      if (window.updateCartBadge) window.updateCartBadge();
    } else {
      showToast("⚠️ " + (data.error || "Failed to add item"), true);
    }
  } catch (err) {
    console.error(err);
    showToast("❌ Could not add to cart", true);
  }
}

// load a single product and render
async function loadProductDetails(productId) {
  const container = document.getElementById("productDetails");
  if (!container) return;
  container.innerHTML = "<p>Loading...</p>";

  try {
    const res = await fetch(`${API}/products/${productId}`);
    if (!res.ok) throw new Error(`Product fetch failed ${res.status}`);
    const product = await res.json();

    // sanitize fields to fallback
    const img = product.image || 'placeholder.png';
    const name = product.name || 'Unnamed';
    const price = product.price !== undefined ? parseFloat(product.price).toFixed(2) : '0.00';
    const desc = product.description || '';

    container.innerHTML = `
      <div class="details">
        <img src="assets/images/${img}" class="detail-img" alt="${name}" onerror="this.onerror=null;this.src='assets/images/placeholder.png'">
        <div class="info">
          <h2>${name}</h2>
          <p class="desc">${desc}</p>
          <h3 class="price">₹${price}</h3>
          <div style="display:flex;gap:10px;align-items:center;margin-top:12px">
            <button class="btn add" id="addToCartBtn">Add to Cart</button>
            <input id="qtyInput" type="number" min="1" value="1" style="width:70px;padding:8px;border-radius:6px;border:none">
          </div>
        </div>
      </div>
    `;

    document.getElementById("addToCartBtn").addEventListener("click", () => {
      const qty = parseInt(document.getElementById("qtyInput").value) || 1;
      addToCart(product.id, qty);
    });

  } catch (err) {
    console.error("loadProductDetails error:", err);
    container.innerHTML = "<p>Failed to load product details.</p>";
  }
}

// bootstrap
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (id) loadProductDetails(id);
  updateCartBadge();
});
