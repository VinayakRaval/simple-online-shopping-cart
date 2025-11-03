const API = "http://127.0.0.1:5000/api";
const currentUser = localStorage.getItem('user_id')||1;

function renderCartItems(){
  const cart = JSON.parse(localStorage.getItem('cart')||'[]');
  const container = document.getElementById('cartItems');
  const subtotalEl = document.getElementById('cartSubtotal');
  if(!container) return;
  container.innerHTML = '';
  let total = 0;
  if(cart.length===0){ container.innerHTML = '<p>Your cart is empty.</p>'; subtotalEl.textContent = '0'; return; }
  cart.forEach(async item=>{
    // fetch product details from backend for nicer display
    let product = null;
    try{
      const res = await fetch(`${API}/products/${item.product_id}`);
      if(res.ok) product = await res.json();
    }catch(e){ console.warn(e); }
    const name = product ? product.name : `Product ${item.product_id}`;
    const price = product ? product.price : 0;
    const img = product ? product.image : 'placeholder.png';
    total += price * (item.quantity||1);
    const el = document.createElement('div'); el.className='cart-item';
    el.innerHTML = `
      <img src="assets/images/${img}">
      <div class="cart-details">
        <h4>${name}</h4>
        <div>₹${price} × <input type="number" min="1" value="${item.quantity}" data-id="${item.product_id}" class="qty-input" style="width:60px"></div>
      </div>
      <div>
        <button class="btn remove" data-id="${item.product_id}">Remove</button>
      </div>
    `;
    container.appendChild(el);
  });

  // small delay to allow product fetches to contribute totals
  setTimeout(()=>{
    const cart2 = JSON.parse(localStorage.getItem('cart')||'[]');
    let total2 = 0;
    Promise.all(cart2.map(async i=>{
      try{
        const res = await fetch(`${API}/products/${i.product_id}`);
        if(res.ok){ const p=await res.json(); total2 += p.price * i.quantity; }
      }catch(e){}
    })).finally(()=>{ subtotalEl.textContent = (total2).toFixed(2); });
  },300);

  // attach handlers
  setTimeout(()=>{
    document.querySelectorAll('.remove').forEach(btn=>{
      btn.addEventListener('click', async e=>{
        const pid = e.target.dataset.id;
        let cart = JSON.parse(localStorage.getItem('cart')||'[]');
        cart = cart.filter(i=>i.product_id!=pid);
        localStorage.setItem('cart', JSON.stringify(cart));
        // notify backend
        try{ await fetch(`${API}/cart/remove`, { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ user_id: currentUser, product_id: pid })}); }catch(e){}
        renderCartItems(); updateHeaderCartCount();
      });
    });
    document.querySelectorAll('.qty-input').forEach(inp=>{
      inp.addEventListener('change', async e=>{
        const pid = e.target.dataset.id; const q = parseInt(e.target.value)||1;
        let cart = JSON.parse(localStorage.getItem('cart')||'[]');
        const it = cart.find(i=>i.product_id==pid);
        if(it) it.quantity = q;
        localStorage.setItem('cart', JSON.stringify(cart));
        try{ await fetch(`${API}/cart/update`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ user_id: currentUser, product_id: pid, quantity: q })}); }catch(e){}
        renderCartItems(); updateHeaderCartCount();
      });
    });
  },500);
}

document.addEventListener('DOMContentLoaded', ()=>{
  if(document.getElementById('cartItems')) renderCartItems();
  const toCheckout = document.getElementById('toCheckout');
  if(toCheckout) toCheckout.addEventListener('click', ()=> location.href='checkout.html');

  // checkout page logic
  const placeOrderBtn = document.getElementById('placeOrder');
  if(placeOrderBtn){
    // load summary
    const summaryList = document.getElementById('summaryList');
    const summaryTotal = document.getElementById('summaryTotal');
    const cart = JSON.parse(localStorage.getItem('cart')||'[]');
    summaryList.innerHTML = '';
    let total=0;
    (async ()=>{
      for(const it of cart){
        try{
          const res = await fetch(`${API}/products/${it.product_id}`);
          if(res.ok){
            const p = await res.json();
            const r = document.createElement('div');
            r.textContent = `${p.name} × ${it.quantity} — ₹${(p.price * it.quantity).toFixed(2)}`;
            summaryList.appendChild(r);
            total += p.price * it.quantity;
          }
        }catch(e){}
      }
      summaryTotal.textContent = total.toFixed(2);
    })();

    placeOrderBtn.addEventListener('click', async ()=>{
      // gather shipping
      const address = document.getElementById('shipAddress').value || '';
      const name = document.getElementById('shipName').value || '';
      const phone = document.getElementById('shipPhone').value || '';
      const email = document.getElementById('shipEmail').value || '';
      // call backend
      try{
        const res = await fetch(`${API}/orders/place`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ user_id: currentUser, address, name, phone, email })
        });
        const data = await res.json();
        if(res.ok){
          localStorage.removeItem('cart');
          updateHeaderCartCount();
          alert('Order placed! Order ID: '+ (data.order_id || 'N/A'));
          window.location.href = 'order-success.html?order_id='+ (data.order_id || '');
        } else alert(data.message || 'Order failed');
      }catch(e){ alert('Order failed'); }
    });
  }
});
