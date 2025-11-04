const API = "http://127.0.0.1:5000/api";
const user_id = localStorage.getItem("user_id") || 1;

document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  loadFeaturedProducts();
});

// 🏷️ Shop by Category (Dynamic)
function loadCategories() {
  const categories = [
    { name: "Phones", image: "cat-phones.jpg" },
    { name: "Laptops", image: "cat-laptops.jpg" },
    { name: "Accessories", image: "cat-accessories.jpg" },
    { name: "Smartwatches", image: "cat-watches.jpg" },
    { name: "Headphones", image: "cat-headphones.jpg" },
  ];

  const container = document.getElementById("categoryGrid");
  container.innerHTML = categories
    .map(
      (c) => `
      <div class="cat-card" onclick="filterByCategory('${c.name}')">
        <img src="assets/images/${c.image}" alt="${c.name}">
        <h4>${c.name}</h4>
      </div>
    `
    )
    .join("");
}

function filterByCategory(cat) {
  window.location.href = `products.html?category=${encodeURIComponent(cat)}`;
}

// 🛍️ Featured Products
async function loadFeaturedProducts() {
  const grid = document.getElementById("featuredGrid");
  grid.innerHTML = "<p>Loading featured items...</p>";

  try {
    const res = await fetch(`${API}/products/`);
    const products = await res.json();
    const featured = products.slice(0, 12);

    grid.innerHTML = featured
      .map(
        (p) => `
      <div class="product-card">
        <img src="assets/images/${p.image}" alt="${p.name}">
        <h4 class="p-title">${p.name}</h4>
        <div class="p-price">₹${p.price}</div>
        <div class="p-actions">
          <button class="add" onclick="addToCart(${p.id})">Add</button>
          <button class="view" onclick="viewProduct(${p.id})">View</button>
        </div>
      </div>
    `
      )
      .join("");
  } catch (err) {
    console.error("Error loading featured:", err);
    grid.innerHTML = "<p>Failed to load featured products.</p>";
  }
}

// 🛒 Add to Cart with Toast + Count Update
async function addToCart(product_id) {
  try {
    const res = await fetch(`${API}/cart/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, product_id, quantity: 1 }),
    });
    const data = await res.json();

    if (res.ok) {
      showToast("✅ Added to cart!");
      updateCartCount();
    } else {
      showToast("⚠️ " + data.error, true);
    }
  } catch (err) {
    console.error(err);
    showToast("❌ Failed to add to cart", true);
  }
}

// 🔔 Toast Notification
function showToast(message, isError = false) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.style.background = isError ? "#ff4b4b" : "#00b4db";
  toast.innerText = message;
  document.getElementById("toast-container").appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// 🧮 Update Cart Count
async function updateCartCount() {
  try {
    const res = await fetch(`${API}/cart/${user_id}`);
    const items = await res.json();
    const total = items.reduce((sum, i) => sum + i.quantity, 0);
    document.getElementById("cartCount").innerText = total;
    document.getElementById("floatCount").innerText = total;
  } catch {
    document.getElementById("cartCount").innerText = "0";
  }
}

// 👁️ View Product
function viewProduct(id) {
  window.location.href = `product-details.html?id=${id}`;
}
