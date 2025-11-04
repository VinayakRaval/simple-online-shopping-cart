const API = "http://127.0.0.1:5000";
const user_id = localStorage.getItem("user_id") || 1;
document.addEventListener("DOMContentLoaded", loadCart);

async function loadCart(){
  const container = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");
  container.innerHTML = "<p>Loading...</p>";

  try{
    const res = await fetch(`${API}/api/cart/${user_id}`);
    const items = await res.json();
    if(items.length === 0){
      container.innerHTML = "<p>Your cart is empty.</p>";
      totalEl.textContent = "0";
      return;
    }

    container.innerHTML = "";
    let total = 0;
    items.forEach(item=>{
      total += item.price * item.quantity;
      const el = document.createElement("div");
      el.className = "cart-item";
      el.innerHTML = `
        <img src="assets/images/${item.image || 'placeholder.png'}">
        <div class="details">
          <div>${item.name}</div>
          <div class="price">₹${item.price}</div>
        </div>
        <div>
          <button onclick="removeItem(${item.product_id})">Remove</button>
        </div>
      `;
      container.appendChild(el);
    });
    totalEl.textContent = total.toFixed(2);
  }catch(err){
    container.innerHTML = "<p>Failed to load cart.</p>";
  }
}

async function removeItem(product_id){
  await fetch(`${API}/api/cart/remove`, {
    method:"DELETE",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({user_id, product_id})
  });
  loadCart();
}

function goCheckout(){
  window.location.href = "checkout.html";
}
