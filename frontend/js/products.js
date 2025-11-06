// frontend/js/products.js
const API = "http://127.0.0.1:5000/api";
const user_id = parseInt(localStorage.getItem("user_id")) || 1;

let allProducts = [];     // cached products
let pageSize = 12;        // how many per "page"
let pageIndex = 0;        // current page (0-based)

// utility: show toast
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

// update cart badge (header)
async function updateCartBadge() {
  try {
    const res = await fetch(`${API}/cart/${user_id}`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const items = await res.json();
    const total = items.reduce((s, it) => s + (it.quantity || 0), 0);
    const cartCountEl = document.getElementById("cartCount");
    const floatCountEl = document.getElementById("floatCount");
    if (cartCountEl) cartCountEl.innerText = total;
    if (floatCountEl) floatCountEl.innerText = total;
  } catch (err) {
    console.warn("updateCartBadge failed:", err);
    const cartCountEl = document.getElementById("cartCount");
    if (cartCountEl) cartCountEl.innerText = "0";
  }
}

// add to cart (used by both pages)
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

// view product details
function viewProduct(id) {
  window.location.href = `product-details.html?id=${id}`;
}

// render a slice of products
function renderProductsChunk(startIndex = 0) {
  const container = document.getElementById("productGrid");
  if (!container) return;

  const slice = allProducts.slice(startIndex, startIndex + pageSize);
  if (startIndex === 0) container.innerHTML = ""; // first render clears

  slice.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="assets/images/${p.image || 'placeholder.png'}" alt="${p.name}" onerror="this.onerror=null;this.src='assets/images/placeholder.png'">
      <h4 class="p-title">${p.name}</h4>
      <div class="p-price">₹${parseFloat(p.price).toFixed(2)}</div>
      <div class="p-actions">
        <button class="btn add" data-id="${p.id}">Add to Cart</button>
        <button class="btn view" data-id="${p.id}">View</button>
      </div>
    `;
    container.appendChild(card);
  });

  // attach handlers for the newly added buttons
  container.querySelectorAll(".p-actions .add").forEach(btn => {
    btn.addEventListener("click", () => addToCart(parseInt(btn.dataset.id)));
  });
  container.querySelectorAll(".p-actions .view").forEach(btn => {
    btn.addEventListener("click", () => viewProduct(parseInt(btn.dataset.id)));
  });

  // toggle Load More visibility
  const loadMoreBtn = document.getElementById("loadMoreBtn");
  if (!loadMoreBtn) return;
  const nextIndex = startIndex + pageSize;
  if (nextIndex >= allProducts.length) {
    loadMoreBtn.style.display = "none";
  } else {
    loadMoreBtn.style.display = "inline-block";
  }
}

// fetch products once and initialize pagination
async function loadProducts() {
  const grid = document.getElementById("productGrid");
  if (!grid) return;
  grid.innerHTML = "<p>Loading products...</p>";

  try {
    const res = await fetch(`${API}/products/`);
    if (!res.ok) throw new Error(`Products fetch failed: ${res.status}`);
    const products = await res.json();
    console.log("Fetched products count:", products.length);

    // apply category or q filter from URL
    const params = new URLSearchParams(window.location.search);
    const q = (params.get("q") || "").trim().toLowerCase();
    const category = (params.get("category") || "").trim().toLowerCase();

    allProducts = products.filter(p => {
      if (category && p.category && p.category.toLowerCase() !== category) return false;
      if (q) {
        const inName = (p.name || "").toLowerCase().includes(q);
        const inDesc = (p.description || "").toLowerCase().includes(q);
        return inName || inDesc;
      }
      return true;
    });

    // reset pagination
    pageIndex = 0;
    grid.innerHTML = "";
    renderProductsChunk(0);

    // wire load more
    const loadMoreBtn = document.getElementById("loadMoreBtn");
    if (loadMoreBtn) {
      loadMoreBtn.onclick = () => {
        pageIndex++;
        renderProductsChunk(pageIndex * pageSize);
        // scroll a little to show new items
        window.scrollBy({ top: 300, behavior: 'smooth' });
      };
    }
  } catch (err) {
    console.error("loadProducts error:", err);
    grid.innerHTML = "<p>Failed to load products.</p>";
    showToast("Failed to load products", true);
  }
}

// init on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  updateCartBadge();
});
