// Load header and footer
document.addEventListener('DOMContentLoaded', () => {
  fetch('components/header.html')
    .then(res => res.text())
    .then(data => document.getElementById('header').innerHTML = data);

  fetch('components/footer.html')
    .then(res => res.text())
    .then(data => document.getElementById('footer').innerHTML = data);

  loadProducts();
});

// Dummy products for demo
const products = [
  { id: 1, name: "OnePlus Nord 3", price: 29999, category: "Phones", image: "assets/images/oneplus.jpg" },
  { id: 2, name: "HP Laptop", price: 49999, category: "Laptops", image: "assets/images/hp.jpg" },
  { id: 3, name: "Men’s Jacket", price: 1999, category: "Fashion", image: "assets/images/jacket.jpg" },
  { id: 4, name: "Bluetooth Speaker", price: 1499, category: "Electronics", image: "assets/images/speaker.jpg" },
];

function loadProducts(filter = null) {
  const container = document.getElementById('product-list');
  container.innerHTML = '';

  const filtered = filter ? products.filter(p => p.category === filter) : products;

  filtered.forEach(p => {
    container.innerHTML += `
      <div class="product-card" onclick="viewProduct(${p.id})">
        <img src="${p.image}" alt="${p.name}">
        <h3>${p.name}</h3>
        <p>₹${p.price}</p>
        <button onclick="addToCart(${p.id}); event.stopPropagation();">Add to Cart</button>
      </div>
    `;
  });
}

function filterProducts(category) {
  loadProducts(category);
}

function viewProduct(id) {
  localStorage.setItem('selectedProduct', id);
  window.location.href = 'product-details.html';
}

function addToCart(id) {
  alert("Added to cart: " + id);
}
