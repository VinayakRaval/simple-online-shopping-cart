const API = "http://127.0.0.1:5000/api";
const user_id = localStorage.getItem("user_id") || 1;

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const query = params.get("q") || "";
  const sort = params.get("sort") || "newest";

  const searchInput = document.getElementById("searchInput");
  const sortSelect = document.getElementById("sortSelect");

  if (searchInput) searchInput.value = query;
  if (sortSelect) sortSelect.value = sort;

  loadProducts(query, sort);

  // 🔍 Search button
  document.getElementById("searchBtn").addEventListener("click", () => {
    const q = searchInput.value.trim();
    const s = sortSelect.value;
    window.location.href = `products.html?q=${encodeURIComponent(q)}&sort=${s}`;
  });

  // ↕ Sort change
  sortSelect.addEventListener("change", () => {
    const q = searchInput.value.trim();
    const s = sortSelect.value;
    window.location.href = `products.html?q=${encodeURIComponent(q)}&sort=${s}`;
  });
});

async function loadProducts(query = "", sort = "newest") {
  const container = document.getElementById("productGrid");
  container.innerHTML = "<p>Loading products...</p>";

  try {
    const res = await fetch(`${API}/products/`);
    const products = await res.json();

    // 🔎 Filter by search
    let filtered = products.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase())
    );

    // ↕ Sort
    if (sort === "low") filtered.sort((a, b) => a.price - b.price);
    else if (sort === "high") filtered.sort((a, b) => b.price - a.price);
    else filtered.reverse(); // newest first if API returns oldest first

    // 🧱 Render
    if (filtered.length === 0) {
      container.innerHTML = `<p style="text-align:center;color:#b6c8d8;">No products found for "${query}".</p>`;
      return;
    }

    container.innerHTML = filtered
      .map(
        (p) => `
        <div class="product-card">
          <img src="assets/images/${p.image}" alt="${p.name}">
          <h4 class="p-title">${p.name}</h4>
          <div class="p-price">₹${p.price}</div>
          <div class="p-actions">
            <button class="btn add" onclick="addToCart(${p.id})">Add to Cart</button>
            <button class="btn view" onclick="viewProduct(${p.id})">View</button>
          </div>
        </div>
      `
      )
      .join("");
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Failed to load products.</p>";
  }
}

async function addToCart(product_id) {
  try {
    const res = await fetch(`${API}/cart/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, product_id, quantity: 1 }),
    });

    const data = await res.json();
    if (res.ok) showToast("✅ Item added to cart");
    else showToast("⚠️ " + data.error, true);
  } catch (err) {
    console.error(err);
    showToast("❌ Failed to add to cart", true);
  }
}

function viewProduct(id) {
  window.location.href = `product-details.html?id=${id}`;
}
