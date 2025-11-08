// ==========================================
// 🔹 AUTH.JS — Handles Login, Signup & Logout
// ==========================================

const API_BASE = "http://127.0.0.1:5000/api/auth";

// ======================
// 🔹 Toast Utility
// ======================
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

// ======================
// 🔹 LOGIN
// ======================
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value.trim();
    const msg = document.getElementById("msg");

    if (!email || !password) {
      showToast("Please enter both email and password.", true);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        // ✅ Save essential user data in localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("user_id", data.user_id);
        localStorage.setItem("role", data.role);
        localStorage.setItem("username", data.username);

        showToast(`Welcome back, ${data.username || "User"}!`);

        // ✅ Redirect based on role
        setTimeout(() => {
          if (data.role === "Admin") {
            window.location.href = "admin/dashboard.html";
          } else {
            window.location.href = "index.html";
          }
        }, 800);
      } else {
        msg.textContent = data.error || "Invalid credentials.";
        msg.style.color = "#ff4b4b";
      }
    } catch (err) {
      console.error("Login error:", err);
      showToast("Server error during login.", true);
    }
  });
}

// ======================
// 🔹 SIGNUP (Customer)
// ======================
const signupBtn = document.getElementById("signupBtn");
if (signupBtn) {
  signupBtn.addEventListener("click", async () => {
    const username = document.getElementById("username")?.value.trim();
    const email = document.getElementById("email")?.value.trim();
    const phone = document.getElementById("phone")?.value.trim();
    const password = document.getElementById("password")?.value.trim();
    const msg = document.getElementById("msg");

    if (!username || !email || !phone || !password) {
      showToast("Please fill all fields.", true);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, phone, password }),
      });
      const data = await res.json();

      if (res.ok) {
        showToast("Account created successfully! Redirecting...");
        setTimeout(() => (window.location.href = "login.html"), 1200);
      } else {
        msg.textContent = data.error || "Signup failed.";
        msg.style.color = "#ff4b4b";
      }
    } catch (err) {
      console.error("Signup error:", err);
      showToast("Server error during signup.", true);
    }
  });
}

// ======================
// 🔹 LOGOUT
// ======================
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user_id");
  localStorage.removeItem("role");
  localStorage.removeItem("username");
  showToast("You’ve been logged out!");
  setTimeout(() => (window.location.href = "login.html"), 1000);
}

// ======================
// 🔹 Session Validation
// ======================
document.addEventListener("DOMContentLoaded", () => {
  const currentPage = window.location.pathname.split("/").pop();
  const userId = localStorage.getItem("user_id");
  const role = localStorage.getItem("role");

  const protectedPages = ["cart.html", "checkout.html", "orders.html"];
  const adminPages = ["dashboard.html", "admin_products.html"];

  // 🔒 If user not logged in and accessing protected page
  if (!userId && protectedPages.includes(currentPage)) {
    showToast("Please log in to continue.", true);
    window.location.href = "login.html";
  }

  // 🔒 Prevent Admins from accessing user pages
  if (userId && role === "Admin" && protectedPages.includes(currentPage)) {
    showToast("Admins cannot access user pages.", true);
    window.location.href = "admin/dashboard.html";
  }

  // 🔒 Prevent Customers from accessing Admin pages
  if (userId && role === "Customer" && adminPages.includes(currentPage)) {
    showToast("Access denied — Admin only.", true);
    window.location.href = "index.html";
  }
});
