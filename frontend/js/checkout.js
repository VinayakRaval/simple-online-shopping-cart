const API = "http://127.0.0.1:5000/api";
const user_id = localStorage.getItem("user_id") || 1;

async function loadSummary(){
  const container = document.getElementById("summary-items");
  container.innerHTML = "<p>Loading...</p>";
  try {
    const res = await fetch(`${API}/cart/${user_id}`);
    const items = await res.json();
    if(!items.length) { container.innerHTML = "<p>Your cart is empty.</p>"; return; }
    let total = 0;
    container.innerHTML = items.map(it=>{
      total += it.price * it.quantity;
      return `<div class="order-item"><img src="assets/images/${it.image}" style="width:60px;height:60px;border-radius:8px"><h4>${it.name}</h4><p>₹${it.price} × ${it.quantity}</p></div>`;
    }).join("");
    document.getElementById("total-price").textContent = total.toFixed(2);
  } catch(e){ console.error(e); container.innerHTML = "<p>Failed to load summary.</p>"; }
}

document.getElementById("place-order")?.addEventListener("click", async ()=>{
  const address = document.getElementById("checkoutAddress").value || "";
  const name = document.getElementById("checkoutName").value || "";
  const phone = document.getElementById("checkoutPhone").value || "";
  const email = document.getElementById("checkoutEmail").value || "";
  if(!address || !name) return alert("Please enter name and address");

  try {
    const res = await fetch(`${API}/orders/place`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ user_id, address, name, phone, email })
    });
    const data = await res.json();
    if(res.ok){
      localStorage.setItem("last_order_id", data.order_id);
      showToast("Order placed!");
      location.href = `order-success.html?order_id=${data.order_id}`;
    } else showToast(data.error || "Order failed", true);
  } catch(e){ console.error(e); showToast("Order failed", true); }
});

document.addEventListener("DOMContentLoaded", loadSummary);
