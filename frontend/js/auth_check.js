// ✅ auth_check.js — always start with login first
document.addEventListener("DOMContentLoaded", () => {
  const userId = localStorage.getItem("user_id");
  const currentPage = window.location.pathname.split("/").pop();

  // Pages that need login
  const protectedPages = [
    "index.html",
    "products.html",
    "product-details.html",
    "cart.html",
    "checkout.html",
    "orders.html",
    "profile.html"
  ];

  // 1️⃣ If not logged in and on a protected page → go to login
  if (!userId && protectedPages.includes(currentPage)) {
    window.location.href = "login.html";
    return;
  }

  // 2️⃣ If logged in and trying to access login/signup/forgot → go to home
  const authPages = ["login.html", "signup.html", "forgot_password.html"];
  if (userId && authPages.includes(currentPage)) {
    window.location.href = "index.html";
    return;
  }

  // 3️⃣ If app opened at root (http://127.0.0.1:5500/), go to login page first
  if (!currentPage || currentPage === "" || currentPage === "/") {
    if (userId) window.location.href = "index.html";
    else window.location.href = "login.html";
  }
});
