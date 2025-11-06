const API = "http://127.0.0.1:5000/api";
const user_id = parseInt(localStorage.getItem("user_id"));

document.addEventListener("DOMContentLoaded", () => {
  if (!user_id) {
    alert("Please log in to continue checkout.");
    window.location.href = "login.html";
    return;
  }

  loadSummary();

  document.getElementById("checkoutForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    await placeOrder();
  });
});

// 🔹 Load order summary from cart
async function loadSummary() {
  const container = document.getElementById("summaryContainer");
  const totalEl = document.getElementById("summaryTotal");

  try {
    const res = await fetch(`${API}/cart/${user_id}`);
    const items = await res.json();

    if (!items.length) {
      container.innerHTML = "<p>Your cart is empty.</p>";
      totalEl.innerText = "0";
      return;
    }

    let total = 0;
    container.innerHTML = items.map(i => {
      const folder = i.category ? i.category.toLowerCase() : "others";
      const imgPath = `assets/images/${folder}/${i.image}`;
      total += i.price * i.quantity;

      return `
        <div class="summary-item">
          <img src="${imgPath}" onerror="this.src='assets/images/placeholder.png'" alt="${i.name}">
          <div>
            <strong>${i.name}</strong><br>
            ₹${i.price} × ${i.quantity}
          </div>
          <div>₹${(i.price * i.quantity).toFixed(2)}</div>
        </div>
      `;
    }).join("");

    totalEl.innerText = total.toFixed(2);
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Failed to load summary.</p>";
  }
}

// 🔹 Place order
async function placeOrder() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const address = document.getElementById("address").value.trim();

  if (!name || !email || !phone || !address) {
    showToast("⚠️ Please fill all details.", true);
    return;
  }

  try {
    const res = await fetch(`${API}/orders/place`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, name, email, phone, address })
    });
    const data = await res.json();

    if (res.ok) {
      showToast("✅ Order placed successfully!");
      setTimeout(() => (window.location.href = "orders.html"), 1200);
    } else {
      showToast(data.error || "Failed to place order.", true);
    }
  } catch (err) {
    console.error(err);
    showToast("❌ Network error. Try again.", true);
  }
}

// 🔹 Toast popup
function showToast(msg, isError = false) {
  const container = document.getElementById("toast-container") || (() => {
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
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
