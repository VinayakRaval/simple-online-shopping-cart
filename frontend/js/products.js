// ============================
// Products Page Script
// ============================
const API = "http://127.0.0.1:5000/api";
let allProducts = [];
let displayed = 0;
const PAGE_SIZE = 12;

// ============================
// INITIALIZATION
// ============================
document.addEventListener("DOMContentLoaded", () => {
  const searchBtn = document.getElementById("searchBtn");
  const sortSelect = document.getElementById("sortSelect");
  const searchInput = document.getElementById("filterSearch");
  const loadMoreBtn = document.getElementById("loadMoreBtn");

  if (searchBtn) searchBtn.addEventListener("click", handleSearch);
  if (sortSelect) sortSelect.addEventListener("change", () => loadProducts());
  if (searchInput)
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleSearch();
    });
  if (loadMoreBtn) loadMoreBtn.addEventListener("click", loadMore);

  const params = new URLSearchParams(window.location.search);
  const query = params.get("q");
  const category = params.get("category");

  loadProducts(query, category);
});

// ============================
// HANDLE SEARCH
// ============================
function handleSearch() {
  const searchVal = document.getElementById("filterSearch").value.trim();
  if (searchVal) {
    // ✅ Redirect to same page with new query param
    window.location.href = `products.html?q=${encodeURIComponent(searchVal)}`;
  } else {
    loadProducts();
  }
}

// ============================
// LOAD PRODUCTS FUNCTION
// ============================
async function loadProducts(query = null, category = null) {
  const grid = document.getElementById("productGrid");
  grid.innerHTML = "<p>Loading products...</p>";

  try {
    const res = await fetch(`${API}/products/`);
    allProducts = await res.json();

    if (!Array.isArray(allProducts)) {
      grid.innerHTML = "<p style='color:red;'>Error: Invalid data.</p>";
      return;
    }

    // Normalize data for comparison (fixes 'Samsung' vs 'samsung')
    allProducts = allProducts.map((p) => ({
      ...p,
      name: (p.name || "").toLowerCase(),
      description: (p.description || "").toLowerCase(),
      category: (p.category || "").toLowerCase(),
    }));

    // 🔹 Category Filter
    if (category) {
      const cat = category.toLowerCase();
      allProducts = allProducts.filter((p) => p.category === cat);
      document.getElementById("pageTitle").textContent =
        category.charAt(0).toUpperCase() + category.slice(1) + " Products";
    }

    // 🔹 Search Filter (handles lowercase, plural forms, extra spaces)
    const searchTerm =
      (query || document.getElementById("filterSearch").value || "")
        .trim()
        .toLowerCase()
        .replace(/s$/, ""); // allow plural search (samsung → samsung)

    if (searchTerm) {
      allProducts = allProducts.filter(
        (p) =>
          p.name.includes(searchTerm) ||
          p.description.includes(searchTerm) ||
          p.category.includes(searchTerm)
      );
      document.getElementById(
        "pageTitle"
      ).textContent = `Search: "${searchTerm}"`;
    }

    // 🔹 Sort
    const sort = document.getElementById("sortSelect").value;
    if (sort === "price_asc") allProducts.sort((a, b) => a.price - b.price);
    if (sort === "price_desc") allProducts.sort((a, b) => b.price - a.price);
    if (sort === "newest")
      allProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Reset display
    displayed = 0;
    grid.innerHTML = "";
    loadMore();
  } catch (e) {
    console.error("Product Load Error:", e);
    grid.innerHTML =
      "<p style='color:red;'>⚠️ Failed to load products. Check server.</p>";
  }
}

// ============================
// LOAD MORE BUTTON
// ============================
function loadMore() {
  const grid = document.getElementById("productGrid");
  const slice = allProducts.slice(displayed, displayed + PAGE_SIZE);

  if (slice.length === 0 && displayed === 0) {
    grid.innerHTML = "<p style='color:#9fb6c7;'>No products found.</p>";
    document.getElementById("loadMoreBtn").style.display = "none";
    return;
  }

  grid.insertAdjacentHTML(
    "beforeend",
    slice
      .map(
        (p) => `
      <div class="product-card">
        <img 
          src="assets/images/${p.category}/${p.image}" 
          onerror="this.src='assets/images/placeholder.png'" 
          alt="${p.name}" 
        />
        <h4 class="p-title">${capitalize(p.name)}</h4>
        <div class="p-price">₹${p.price}</div>
        <div class="p-actions">
          <button class="btn add" onclick="addToCart(${p.id})">Add to Cart</button>
          <button class="btn view" onclick="viewProduct(${p.id})">View</button>
        </div>
      </div>`
      )
      .join("")
  );

  displayed += slice.length;
  document.getElementById("loadMoreBtn").style.display =
    displayed < allProducts.length ? "inline-block" : "none";
}

// ============================
// ADD TO CART
// ============================
async function addToCart(productId) {
  const userId = parseInt(localStorage.getItem("user_id"));
  if (!userId) {
    showToast("Please log in first!", true);
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch(`${API}/cart/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        product_id: productId,
        quantity: 1,
      }),
    });
    const data = await res.json();

    if (res.ok) {
      showToast("✅ Item added to cart!");
      window.updateCartBadge && window.updateCartBadge();
    } else showToast(data.error || "Failed to add to cart", true);
  } catch (err) {
    console.error(err);
    showToast("Server error while adding to cart", true);
  }
}

// ============================
// VIEW PRODUCT
// ============================
function viewProduct(id) {
  window.location.href = `product-details.html?id=${id}`;
}

// ============================
// HELPERS
// ============================
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
