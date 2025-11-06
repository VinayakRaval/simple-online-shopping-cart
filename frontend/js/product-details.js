const API = "http://127.0.0.1:5000/api";
const user_id = parseInt(localStorage.getItem("user_id"));

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const product_id = params.get("id");
  if (product_id) loadProductDetails(product_id);
});

// 🔹 Load Product Details
async function loadProductDetails(id) {
  const container = document.getElementById("productDetails");
  container.innerHTML = "<p>Loading...</p>";

  try {
    const res = await fetch(`${API}/products/${id}`);
    const product = await res.json();

    if (!product || product.error) {
      container.innerHTML = "<p>Product not found.</p>";
      return;
    }

    // choose folder dynamically
    const categoryFolder = product.category
      ? product.category.toLowerCase()
      : "others";
    const imagePath = `assets/images/${categoryFolder}/${product.image}`;

    container.innerHTML = `
      <div class="product-wrapper">
        <div class="left-col">
          <img src="${imagePath}" class="main-img" id="mainImage" alt="${product.name}"
            onerror="this.src='assets/images/placeholder.png'">
          <div class="thumb-row">
            <img src="${imagePath}" alt="${product.name}" onclick="setMainImage('${imagePath}')">
            <img src="assets/images/placeholder.png" alt="thumb" onclick="setMainImage('assets/images/placeholder.png')">
          </div>
        </div>
        <div class="right-col">
          <h2>${product.name}</h2>
          <p class="desc">${product.description || "No description available."}</p>
          <div class="price">₹${product.price}</div>

          <ul class="highlight-list">
            <li>⭐ High Performance Guaranteed</li>
            <li>🛡️ 1 Year Manufacturer Warranty</li>
            <li>🚀 Fast & Free Delivery</li>
            <li>🔄 Easy 7-Day Replacement</li>
          </ul>

          <div class="delivery">Delivery by <b>${new Date(Date.now() + 3*24*60*60*1000).toDateString()}</b></div>

          <div class="actions">
            <button class="btn add" onclick="addToCart(${product.id})">Add to Cart</button>
            <button class="btn buy" onclick="buyNow(${product.id})">Buy Now</button>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Failed to load product details.</p>";
  }
}

// 🔹 Update main image
function setMainImage(src) {
  document.getElementById("mainImage").src = src;
}

// 🔹 Add to Cart
async function addToCart(product_id) {
  if (!user_id) {
    alert("Please log in to add items to cart.");
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch(`${API}/cart/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, product_id, quantity: 1 }),
    });

    const data = await res.json();
    if (res.ok) {
      showToast("✅ Added to cart!");
      if (window.updateCartBadge) window.updateCartBadge();
    } else {
      showToast("⚠️ " + (data.error || "Failed to add item"), true);
    }
  } catch (err) {
    console.error(err);
    showToast("❌ Network error", true);
  }
}

// 🔹 Buy Now (redirect)
function buyNow(product_id) {
  addToCart(product_id);
  setTimeout(() => (window.location.href = "cart.html"), 800);
}

// 🔹 Toast utility
function showToast(msg, isError = false) {
  const toastContainer = document.getElementById("toast-container") || (() => {
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
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
