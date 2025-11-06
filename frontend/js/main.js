/* =========================================================
   🛒 ShopSmart — Homepage Script (main.js)
   ========================================================= */

const API = "http://127.0.0.1:5000/api";
const user_id = localStorage.getItem("user_id") || 1;

// 🔹 Build "Shop by Category" grid with image fallback
document.addEventListener("DOMContentLoaded", async () => {
  const cats = ["Phones", "Laptops", "Smartwatches", "Audio", "Accessories"];
  const catGrid = document.getElementById("categoryGrid");

  if (catGrid) {
    catGrid.innerHTML = cats
      .map((c) => {
        const file = `assets/images/categories/cat-${c.toLowerCase()}.jpg`;
        return `
          <div class="cat-card" onclick="location.href='products.html?category=${encodeURIComponent(c)}'">
            <img src="${file}" alt="${c}" onerror="this.onerror=null;this.src='assets/images/placeholder.png'">
            <div class="cat-label">${c}</div>
          </div>`;
      })
      .join("");
  }

  // 🔹 Load Featured Products
  const featuredGrid = document.getElementById("featuredGrid");
  if (featuredGrid) {
    try {
      let sort = localStorage.getItem("home_sort") || "";
      const res = await fetch(`${API}/products/?sort=${encodeURIComponent(sort)}`);
      let products = await res.json();

      // Show first 9 featured products (3 rows)
      products = products.slice(0, 9);

      featuredGrid.innerHTML = products
        .map(
          (p) => `
          <div class="product-card">
            <img src="assets/images/${p.image}" alt="${p.name}" onerror="this.onerror=null;this.src='assets/images/placeholder.png'">
            <div class="p-title">${p.name}</div>
            <div class="p-price">₹${p.price}</div>
            <div class="p-actions">
              <button class="btn add" onclick="addToCart(${p.id})">Add to Cart</button>
              <button class="btn view" onclick="viewProduct(${p.id})">View</button>
            </div>
          </div>`
        )
        .join("");
    } catch (err) {
      console.error("Failed to load featured products:", err);
      featuredGrid.innerHTML = `<p style="color:#f66;">Error loading featured products.</p>`;
    }
  }
});

// 🔹 Redirect to product details page
function viewProduct(id) {
  window.location.href = `product-details.html?id=${id}`;
}

// 🔹 Add to Cart function with toast and live badge update
async function addToCart(product_id) {
  try {
    const res = await fetch(`${API}/cart/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, product_id, quantity: 1 }),
    });

    const data = await res.json();

    if (res.ok) {
      showToast("Item added to cart ✅");
      window.updateCartBadge && window.updateCartBadge();
    } else {
      showToast(data.error || "Failed to add item", true);
    }
  } catch (e) {
    console.error(e);
    showToast("Add to cart failed", true);
  }
}
