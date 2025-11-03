// frontend/js/products.js

const BASE_URL = "http://127.0.0.1:5000/api"; // Flask backend URL
const productsContainer = document.getElementById("products-container");
const categoryButtons = document.querySelectorAll(".category-btn");

// Load user ID from localStorage (fallback to guest = 1)
const userId = localStorage.getItem("user_id") || 1;

// Fetch all products on page load
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
});

// Fetch products from backend
async function loadProducts(category = null) {
  try {
    const response = await fetch(`${BASE_URL}/products`);
    const products = await response.json();

    // Filter by category if specified
    const filteredProducts = category
      ? products.filter((p) => p.category === category)
      : products;

    displayProducts(filteredProducts);
  } catch (error) {
    console.error("Error loading products:", error);
  }
}

// Display products as cards
function displayProducts(products) {
  productsContainer.innerHTML = "";

  if (!products.length) {
    productsContainer.innerHTML = "<p class='no-products'>No products found.</p>";
    return;
  }

  products.forEach((product) => {
    const card = document.createElement("div");
    card.classList.add("product-card");

    // Load image directly from database folder
    const imagePath = `../../database/products_images/${product.image}`;

    card.innerHTML = `
      <div class="product-image">
        <img src="${imagePath}" alt="${product.name}" onerror="this.src='../../frontend/assets/images/placeholder.png'">
      </div>
      <div class="product-details">
        <h3>${product.name}</h3>
        <p class="category">${product.category}</p>
        <p class="price">₹${product.price.toLocaleString()}</p>
        <p class="description">${product.description}</p>
        <button class="add-to-cart-btn" onclick="addToCart(${product.id})">🛒 Add to Cart</button>
      </div>
    `;

    productsContainer.appendChild(card);
  });
}

// Add to Cart Function
async function addToCart(productId) {
  try {
    const response = await fetch(`${BASE_URL}/cart/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        product_id: productId,
        quantity: 1,
      }),
    });

    const result = await response.json();
    if (response.ok) {
      alert(`✅ ${result.message || "Added to cart successfully!"}`);
    } else {
      alert(`❌ ${result.error || "Failed to add to cart"}`);
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    alert("⚠️ Unable to add to cart. Please try again.");
  }
}

// Category Filter Buttons
categoryButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const selectedCategory = btn.dataset.category;
    loadProducts(selectedCategory);
  });
});
