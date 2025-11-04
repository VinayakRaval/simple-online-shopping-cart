const API = "http://127.0.0.1:5000";
const user_id = localStorage.getItem("user_id") || 1;

async function placeOrder(){
  const name=document.getElementById("name").value.trim();
  const email=document.getElementById("email").value.trim();
  const phone=document.getElementById("phone").value.trim();
  const address=document.getElementById("address").value.trim();
  if(!name || !email || !phone || !address) return alert("Please fill all fields!");

  const res = await fetch(`${API}/api/orders/place`, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({user_id,name,email,phone,address})
  });

  const data = await res.json();
  alert(data.message || "Order placed!");
  if(res.ok) window.location.href = "order-success.html";
}
