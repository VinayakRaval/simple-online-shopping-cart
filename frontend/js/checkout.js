document.addEventListener("DOMContentLoaded", () => {
  loadCartSummary();

  document.getElementById("placeOrderBtn").addEventListener("click", async () => {
    const address = {
      fullname: document.getElementById("fullname").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      address: document.getElementById("address").value.trim(),
      city: document.getElementById("city").value.trim(),
      zipcode: document.getElementById("zipcode").value.trim(),
    };

    if (!address.fullname || !address.phone || !address.address) {
      alert("Please fill in all required fields.");
      return;
    }

    const storedCart = localStorage.getItem("cart");
    const cartItems = storedCart ? JSON.parse(storedCart) : [];

    if (cartItems.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    const response = await fetch("http://localhost/backend/api/orders.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: `${address.fullname}, ${address.phone}, ${address.address}, ${address.city} - ${address.zipcode}`,
        cartItems: cartItems,
      }),
      credentials: "include"
    });

    const data = await response.json();

    if (data.success) {
      alert("✅ Order placed successfully!");
      localStorage.removeItem("cart");
      window.location.href = "index.html";
    } else {
      alert("❌ " + (data.error || "Order failed."));
    }
  });
});

function loadCartSummary() {
  const orderSummary = document.getElementById("orderSummary");
  const orderTotal = document.getElementById("orderTotal");
  const storedCart = localStorage.getItem("cart");
  const cartItems = storedCart ? JSON.parse(storedCart) : [];

  if (cartItems.length === 0) {
    orderSummary.innerHTML = "<p class='empty-msg'>Your cart is empty.</p>";
    return;
  }

  let total = 0;
  orderSummary.innerHTML = "";

  cartItems.forEach(item => {
    const price = (item.price * item.quantity).toFixed(2);
    total += parseFloat(price);
    const div = document.createElement("div");
    div.classList.add("order-item");
    div.innerHTML = `<span>${item.name} (x${item.quantity})</span><span>₹${price}</span>`;
    orderSummary.appendChild(div);
  });

  orderTotal.textContent = `Total: ₹${total.toFixed(2)}`;
}
