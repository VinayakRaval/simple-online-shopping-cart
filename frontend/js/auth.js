// ====== API Base ======
const USER_API = "http://127.0.0.1:5000/api/users";
const PRODUCT_API = "http://127.0.0.1:5000/api/products";

// ====== Toast Notification ======
function showToast(message, isError = false) {
  const container =
    document.getElementById("toast-container") ||
    (() => {
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
  toast.style.background = isError ? "#ff4b4b" : "#00b4db";
  toast.style.color = isError ? "#fff" : "#02121a";
  toast.style.padding = "12px 20px";
  toast.style.borderRadius = "8px";
  toast.style.marginTop = "10px";
  toast.style.fontWeight = "600";
  toast.style.boxShadow = "0 5px 20px rgba(0,0,0,0.4)";
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ====== MOCK OTP GENERATOR ======
function generateMockOtp(key) {
  const otp = Math.floor(100000 + Math.random() * 900000);
  alert(`Mock OTP: ${otp}`);
  localStorage.setItem(key, otp);
}

// ====== SIGNUP ======
const sendOtpBtn = document.getElementById("sendOtpBtn");
if (sendOtpBtn) sendOtpBtn.addEventListener("click", () => generateMockOtp("mockOtp"));

const signupBtn = document.getElementById("signupBtn");
if (signupBtn) {
  signupBtn.addEventListener("click", async () => {
    const fullname = document.getElementById("fullname").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const otp = document.getElementById("otp").value.trim();
    const password = document.getElementById("password").value;

    if (!fullname || !email || !phone || !otp || !password)
      return showToast("Please fill all fields", true);

    const mockOtp = localStorage.getItem("mockOtp");
    if (otp !== mockOtp) return showToast("Invalid OTP. Try again.", true);

    try {
      const res = await fetch(`${USER_API}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullname, email, phone, password }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Signup successful! Please log in.");
        localStorage.removeItem("mockOtp");
        setTimeout(() => (window.location.href = "login.html"), 1500);
      } else showToast(data.error || "Signup failed", true);
    } catch (err) {
      console.error(err);
      showToast("Server error during signup", true);
    }
  });
}

// ====== LOGIN ======
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const loginInput = document.getElementById("loginInput").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!loginInput || !password)
      return showToast("Enter both Email/Phone and Password", true);

    try {
      const res = await fetch(`${USER_API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: loginInput, password }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("user_id", data.user_id);
        showToast(`Welcome ${data.username || "User"}!`);
        setTimeout(() => (window.location.href = "index.html"), 1000);
      } else showToast(data.error || "Invalid credentials", true);
    } catch (err) {
      console.error(err);
      showToast("Login failed. Check connection.", true);
    }
  });
}

// ====== LOGOUT ======
function logout() {
  localStorage.removeItem("user_id");
  showToast("Logged out successfully!");
  setTimeout(() => (window.location.href = "login.html"), 1000);
}

// ====== FORGOT PASSWORD ======
const sendForgotOtpBtn = document.getElementById("sendForgotOtpBtn");
if (sendForgotOtpBtn) sendForgotOtpBtn.addEventListener("click", () => generateMockOtp("forgotOtp"));

const resetPasswordBtn = document.getElementById("resetPasswordBtn");
if (resetPasswordBtn) {
  resetPasswordBtn.addEventListener("click", async () => {
    const email = document.getElementById("forgotEmail").value.trim();
    const otp = document.getElementById("forgotOtp").value.trim();
    const newPassword = document.getElementById("newPassword").value;
    const mockOtp = localStorage.getItem("forgotOtp");

    if (!email || !otp || !newPassword)
      return showToast("Please fill all fields", true);

    if (otp !== mockOtp)
      return showToast("Invalid OTP. Please check and try again.", true);

    try {
      const res = await fetch(`${USER_API}/forgot_password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, new_password: newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Password reset successful! Please log in.");
        localStorage.removeItem("forgotOtp");
        setTimeout(() => (window.location.href = "login.html"), 1500);
      } else showToast(data.error || "Password reset failed", true);
    } catch (err) {
      console.error(err);
      showToast("Error resetting password", true);
    }
  });
}

// ====== PASSWORD VISIBILITY TOGGLE ======
function togglePasswordVisibility(inputId, eyeId) {
  const input = document.getElementById(inputId);
  const eye = document.getElementById(eyeId);
  if (!input || !eye) return;
  eye.addEventListener("click", () => {
    input.type = input.type === "password" ? "text" : "password";
  });
}
togglePasswordVisibility("password", "togglePassword");
togglePasswordVisibility("loginPassword", "toggleLoginPassword");
togglePasswordVisibility("newPassword", "toggleForgotPassword");

// ====== FEATURED PRODUCTS ON HOMEPAGE ======
document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("featuredGrid");
  if (!grid) return;

  grid.innerHTML = "<p>Loading featured products...</p>";

  fetch(`${PRODUCT_API}/featured`)
    .then((res) => res.json())
    .then((products) => {
      if (!Array.isArray(products)) throw new Error("No products found");
      grid.innerHTML = products
        .map(
          (p) => `
          <div class="product-card">
            <img src="assets/images/${p.category?.toLowerCase()}/${p.image}" 
                 onerror="this.src='assets/images/placeholder.png'" 
                 alt="${p.name}">
            <h4 class="p-title">${p.name}</h4>
            <div class="p-price">₹${p.price}</div>
            <div class="p-actions">
              <button class="btn add" onclick="addToCart(${p.id})">Add to Cart</button>
              <button class="btn view" onclick="viewProduct(${p.id})">View</button>
            </div>
          </div>
        `
        )
        .join("");
    })
    .catch((err) => {
      console.error(err);
      grid.innerHTML = "<p style='color:red;'>Error loading featured products.</p>";
    });
});

// ====== Add to Cart ======
function addToCart(productId) {
  const userId = parseInt(localStorage.getItem("user_id"));
  if (!userId) {
    showToast("Please log in first!", true);
    window.location.href = "login.html";
    return;
  }

  fetch("http://127.0.0.1:5000/api/cart/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, product_id: productId, quantity: 1 }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.message) showToast("✅ Item added to cart!");
      else showToast(data.error || "Failed to add to cart", true);
    })
    .catch(() => showToast("Server error", true));
}

function viewProduct(id) {
  window.location.href = `product-details.html?id=${id}`;
}

// ====== Redirect Logic (Login First) ======
document.addEventListener("DOMContentLoaded", () => {
  const currentPage = window.location.pathname.split("/").pop();
  const userId = localStorage.getItem("user_id");

  // Redirect to login first if not logged in
  if (!userId && (currentPage === "" || currentPage === "index.html")) {
    window.location.href = "login.html";
  }

  // Prevent logged-in users from revisiting login/signup pages
  if (
    userId &&
    (currentPage === "login.html" || currentPage === "signup.html" || currentPage === "forgot_password.html")
  ) {
    window.location.href = "index.html";
  }
});
