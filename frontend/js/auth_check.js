// ✅ auth_check.js — redirect users based on login state

document.addEventListener("DOMContentLoaded", () => {
  const currentPage = window.location.pathname.split("/").pop();
  const userId = localStorage.getItem("user_id");

  // Pages that need authentication
  const protectedPages = [
    "index.html",
    "products.html",
    "product-details.html",
    "cart.html",
    "checkout.html",
    "orders.html"
  ];

  // If user is not logged in and tries to access protected page → redirect to login
  if (!userId && protectedPages.includes(currentPage)) {
    window.location.href = "login.html";
  }

  // If already logged in and trying to open login/signup → go to index
  if (userId && (currentPage === "login.html" || currentPage === "signup.html" || currentPage === "forgot_password.html")) {
    window.location.href = "index.html";
  }
});
