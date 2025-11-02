document.addEventListener("DOMContentLoaded", () => {
  const productList = document.getElementById("productList");
  const categoryFilter = document.getElementById("categoryFilter");
  const searchInput = document.getElementById("searchProducts");

  // Load all products
  function loadProducts(category = "all", search = "") {
    fetch("http://127.0.0.1:5000/api/products")
      .then(res => res.json())
      .then(data => {
        let filtered = data;
        if (category !== "all") {
          filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
        }
        if (search.trim() !== "") {
          filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
        }
        displayProducts(filtered);
      })
      .catch(() => productList.innerHTML = "<p>⚠️ Unable to load products.</p>");
  }

  // Display products in grid
  function displayProducts(products) {
    productList.innerHTML = "";
    if (products.length === 0) {
      productList.innerHTML = "<p>No products found.</p>";
      return;
    }

    products.forEach(p => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <img src="../backend/static/uploads/${p.image}" alt="${p.name}">
        <h3>${p.name}</h3>
        <p>₹${p.price}</p>
        <button class="btn add-cart" data-id="${p.id}">Add to Cart</button>
      `;
      productList.appendChild(card);
    });

    // Add to cart buttons
    document.querySelectorAll(".add-cart").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const productId = e.target.dataset.id;
        fetch("http://127.0.0.1:5000/api/cart/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: 1, product_id: productId, quantity: 1 })
        })
        .then(res => res.json())
        .then(msg => alert(msg.message))
        .catch(() => alert("Error adding to cart"));
      });
    });
  }

  // Event listeners for filters
  categoryFilter.addEventListener("change", () => {
    loadProducts(categoryFilter.value, searchInput.value);
  });

  searchInput.addEventListener("input", () => {
    loadProducts(categoryFilter.value, searchInput.value);
  });

  // Initial load
  loadProducts();
});
