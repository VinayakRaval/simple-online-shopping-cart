// frontend/js/global-search.js
// Robust client-side global search with suggestions and redirect to products.html?q=...

const API_PRODUCTS = "http://127.0.0.1:5000/api/products/"; // ensure backend running
let PRODUCTS_CACHE = [];
let lastFetchError = false;
const SUGGEST_LIMIT = 7;

// DOM elements
const inputEl = document.getElementById("globalSearch");
const btnEl = document.getElementById("globalSearchBtn");
const sugBox = document.getElementById("searchSuggestions");

// Debounce utility
function debounce(fn, wait = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

// Fetch products (cache once)
async function fetchProducts() {
  if (PRODUCTS_CACHE.length || lastFetchError) return PRODUCTS_CACHE;
  try {
    const res = await fetch(API_PRODUCTS);
    if (!res.ok) throw new Error("Failed to fetch products");
    const data = await res.json();
    PRODUCTS_CACHE = Array.isArray(data) ? data : [];
    return PRODUCTS_CACHE;
  } catch (err) {
    console.error("global-search: product fetch failed", err);
    lastFetchError = true;
    return [];
  }
}

// Normalize string for matching
function norm(s = "") {
  return String(s).trim().toLowerCase();
}

// Create suggestion HTML
function suggestionHTML(prod) {
  // Try to infer path by category if available; fallback to placeholder
  const category = prod.category ? prod.category.toLowerCase() : "";
  const imagePath = `assets/images/${category}/${prod.image || ""}`;
  return `
    <div class="item" data-id="${prod.id}" data-q="${escapeHtml(prod.name)}">
      <img src="${escapeAttr(imagePath)}" onerror="this.src='assets/images/placeholder.png'">
      <div style="flex:1">
        <div style="font-weight:600;color:#e6eef8">${escapeHtml(prod.name)}</div>
        <div style="font-size:13px;color:#9fb6c7;margin-top:3px">₹${prod.price}</div>
      </div>
    </div>
  `;
}

// Small helpers to avoid XSS (since content comes from DB)
function escapeHtml(s){ return String(s).replace(/[&<>"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));}
function escapeAttr(s){ return escapeHtml(s).replace(/"/g, "&quot;"); }

// Show suggestions (list of product objects)
function showSuggestions(list) {
  if (!sugBox) return;
  if (!list || list.length === 0) {
    sugBox.innerHTML = `<div class="empty">No suggestions</div>`;
    sugBox.style.display = "block";
    return;
  }
  sugBox.innerHTML = list.slice(0, SUGGEST_LIMIT).map(suggestionHTML).join("");
  sugBox.style.display = "block";

  // attach click handlers to suggestion items
  Array.from(sugBox.querySelectorAll(".item")).forEach(el => {
    el.addEventListener("click", () => {
      const id = el.dataset.id;
      // go to product details if id available; otherwise redirect to products search
      if (id && Number(id) > 0) {
        window.location.href = `product-details.html?id=${id}`;
      } else {
        const q = el.dataset.q || el.textContent.trim();
        window.location.href = `products.html?q=${encodeURIComponent(q)}`;
      }
    });
  });
}

// Hide suggestions
function hideSuggestions() {
  if (!sugBox) return;
  sugBox.style.display = "none";
}

// Build a filtered list from query
function filterProducts(query) {
  const qRaw = String(query || "").trim();
  if (!qRaw) return [];
  // allow searching e.g., "samsungs" -> "samsung" by removing trailing s (basic)
  const q = norm(qRaw).replace(/\s+$/, "").replace(/s$/, "");
  const parts = q.split(/\s+/).filter(Boolean);

  // Score-based matching to show best results first
  const results = PRODUCTS_CACHE
    .map(p => {
      const name = norm(p.name || "");
      const desc = norm(p.description || "");
      const cat = norm(p.category || "");
      let score = 0;
      for (const part of parts) {
        if (name.includes(part)) score += 10;
        if (desc.includes(part)) score += 4;
        if (cat.includes(part)) score += 6;
        // prefix match higher weight
        if (name.startsWith(part)) score += 8;
      }
      return { p, score };
    })
    .filter(x => x.score > 0)
    .sort((a,b) => b.score - a.score)
    .map(x => x.p);

  return results;
}

// When user types: update suggestions
const onInput = debounce(async (ev) => {
  const q = ev.target.value || "";
  if (!q.trim()) { hideSuggestions(); return; }
  await fetchProducts();
  const matches = filterProducts(q);
  showSuggestions(matches);
}, 150);

// on Enter or Search button: go to products page with q param
async function doSearchAndRedirect() {
  const q = (inputEl && inputEl.value || "").trim();
  if (!q) {
    // go to products.html without q
    window.location.href = "products.html";
    return;
  }
  // If there's an exact product match, go to details (try best match)
  await fetchProducts();
  const matches = filterProducts(q);
  if (matches && matches.length === 1) {
    window.location.href = `product-details.html?id=${matches[0].id}`;
    return;
  }
  // otherwise go to products listing with query (user expects results)
  window.location.href = `products.html?q=${encodeURIComponent(q)}`;
}

// Attach events
if (inputEl) {
  inputEl.addEventListener("input", onInput);
  inputEl.addEventListener("focus", async () => {
    if (!PRODUCTS_CACHE.length) await fetchProducts();
    // if value present, show suggestions
    if (inputEl.value.trim()) showSuggestions(filterProducts(inputEl.value));
  });
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { hideSuggestions(); inputEl.blur(); }
    if (e.key === "Enter") { e.preventDefault(); doSearchAndRedirect(); }
  });
}

// search button
if (btnEl) btnEl.addEventListener("click", (e) => { e.preventDefault(); doSearchAndRedirect(); });

// click outside to hide suggestions
document.addEventListener("click", (ev) => {
  const wrap = document.getElementById("globalSearchWrap");
  if (!wrap) return;
  if (!wrap.contains(ev.target)) hideSuggestions();
});

// prefetch products silently
fetchProducts();
