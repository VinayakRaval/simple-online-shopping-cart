document.addEventListener("DOMContentLoaded", () => {
  const cartContainer = document.getElementById("cart-items");
  const totalDisplay = document.getElementById("cart-total");
  const checkoutBtn = document.getElementById("checkout-btn");
  const userId = 1; // Demo user for local API

  // Try backend API first
  function loadBackendCart() {
    fetch(`http://127.0.0.1:5000/api/cart/${userId}`)
      .then(res => {
        if (!res.ok) throw new Error("Backend not available");
        return res.json();
      })
      .then(data => renderCart(data, false))
      .catch(() => {
        console.warn("Backend unavailable — using LocalStorage fallback");
        loadLocalCart();
      });
  }

  // Load local cart from localStorage
  function loadLocalCart() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    renderCart(cart, true);
  }

  // Render cart items
  function renderCart(items, isLocal) {
    cartContainer.innerHTML = "";
    let total = 0;

    if (items.length === 0) {
      cartContainer.innerHTML = "<p>Your cart is empty.</p>";
      totalDisplay.textContent = "0";
      return;
    }

    items.forEach((item, index) => {
      total += item.price * item.quantity;
      const div = document.createElement("div");
      div.className = "cart-item";
      div.innerHTML = `
        <img src="${isLocal ? item.image : `../backend/static/uploads/${item.image}`}" alt="${item.name}">
        <div class="cart-details">
          <h3>${item.name}</h3>
          <p>₹${item.price} × ${item.quantity}</p>
          <input type="number" value="${item.quantity}" min="1" class="qty-input" data-index="${index}">
          <button class="remove-btn" data-id="${item.product_id}" data-index="${index}">Remove</button>
        </div>
      `;
      cartContainer.appendChild(div);
    });

    totalDisplay.textContent = total.toFixed(2);

    // Quantity update
    cartContainer.addEventListener("change", e => {
      if (e.target.classList.contains("qty-input")) {
        const index = e.target.dataset.index;
        if (isLocal) {
          let cart = JSON.parse(localStorage.getItem("cart")) || [];
          cart[index].quantity = parseInt(e.target.value);
          localStorage.setItem("cart", JSON.stringify(cart));
          renderCart(cart, true);
        } else {
          const productId = e.target.parentElement.querySelector(".remove-btn").dataset.id;
          fetch("http://127.0.0.1:5000/api/cart/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, product_id: productId, quantity: e.target.value })
          }).then(() => loadBackendCart());
        }
      }
    });

    // Remove item
    cartContainer.addEventListener("click", e => {
      if (e.target.classList.contains("remove-btn")) {
        const index = e.target.dataset.index;
        if (isLocal) {
          let cart = JSON.parse(localStorage.getItem("cart")) || [];
          cart.splice(index, 1);
          localStorage.setItem("cart", JSON.stringify(cart));
          renderCart(cart, true);
        } else {
          const productId = e.target.dataset.id;
          fetch("http://127.0.0.1:5000/api/cart/remove", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, product_id: productId })
          }).then(() => loadBackendCart());
        }
      }
    });
  }

  // Checkout action
  checkoutBtn.addEventListener("click", () => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (cart.length === 0) {
      alert("Your cart is empty!");
    } else {
      window.location.href = "checkout.html";
    }
  });

  // Load backend or fallback to local
  loadBackendCart();
});
