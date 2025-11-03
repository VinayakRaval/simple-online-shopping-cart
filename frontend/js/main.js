// small shared helpers
const API = "http://127.0.0.1:5000/api";
const userId = localStorage.getItem('user_id') || 1;

function showToast(msg){ alert(msg); }

// local cart helper (fast UI) + sync with backend
function getLocalCart(){ return JSON.parse(localStorage.getItem('cart')||'[]'); }
function saveLocalCart(cart){ localStorage.setItem('cart', JSON.stringify(cart)); updateHeaderCartCount(); }
function updateHeaderCartCount(){
  const cart = getLocalCart();
  const count = cart.reduce((s,i)=>s+(i.quantity||1),0);
  const el = document.getElementById('cartCount'); if(el) el.textContent = count;
  const cartLinkCount = document.getElementById('cartCount'); if(cartLinkCount) cartLinkCount.textContent = count;
}
// add item locally & push to backend
async function addToCartBackend(productId, qty=1){
  // update local cache
  const cart = getLocalCart();
  const existing = cart.find(i=>i.product_id==productId);
  if(existing){ existing.quantity += qty; } else cart.push({product_id:productId, quantity:qty});
  saveLocalCart(cart);

  // send to backend
  try{
    await fetch(`${API}/cart/add`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ user_id: userId, product_id: productId, quantity: qty })
    });
  }catch(e){ console.warn('backend cart add failed',e) }
  showToast('Added to cart');
}
