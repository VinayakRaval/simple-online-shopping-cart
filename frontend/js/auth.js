// ====== BASE URL ======
const USER_API = "http://127.0.0.1:5000/api/users";

// ====== Toast Notification ======
function showToast(message, isError = false) {
  const container =
    document.getElementById("toast-container") ||
    (() => {
      const c = document.createElement("div");
      c.id = "toast-container";
      c.style.position = "fixed";
      c.style.bottom = "20px";
      c.style.right = "20px";
      c.style.zIndex = "9999";
      document.body.appendChild(c);
      return c;
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

// ====== LOGIN ======
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const loginInput = document.getElementById("loginInput").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!loginInput || !password) {
      showToast("Enter Email/Phone and Password", true);
      return;
    }

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
      } else {
        showToast(data.error || "Invalid credentials", true);
      }
    } catch (err) {
      console.error(err);
      showToast("Login failed. Check server connection.", true);
    }
  });
}

// ====== SIGNUP ======
const sendOtpBtn = document.getElementById("sendOtpBtn");
if (sendOtpBtn)
  sendOtpBtn.addEventListener("click", () => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    alert(`Mock OTP: ${otp}`);
    localStorage.setItem("mockOtp", otp);
  });

const signupBtn = document.getElementById("signupBtn");
if (signupBtn) {
  signupBtn.addEventListener("click", async () => {
    const fullname = document.getElementById("fullname").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const otp = document.getElementById("otp").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!fullname || !email || !phone || !otp || !password) {
      showToast("Please fill all fields", true);
      return;
    }

    if (otp !== localStorage.getItem("mockOtp")) {
      showToast("Invalid OTP. Try again.", true);
      return;
    }

    try {
      const res = await fetch(`${USER_API}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullname, email, phone, password }),
      });
      const data = await res.json();

      if (res.ok) {
        showToast("Signup successful! Redirecting...");
        localStorage.removeItem("mockOtp");
        setTimeout(() => (window.location.href = "login.html"), 1000);
      } else {
        showToast(data.error || "Signup failed", true);
      }
    } catch {
      showToast("Server error during signup", true);
    }
  });
}

// ====== LOGOUT ======
function logout() {
  localStorage.removeItem("user_id");
  showToast("Logged out successfully!");
  setTimeout(() => (window.location.href = "login.html"), 1000);
}

// ====== PAGE ACCESS CONTROL ======
document.addEventListener("DOMContentLoaded", () => {
  const userId = localStorage.getItem("user_id");
  const currentPage = window.location.pathname.split("/").pop();

  // 🔒 Force login first — all pages except auth ones
  const protectedPages = ["index.html", "products.html", "cart.html", "orders.html", "checkout.html"];

  if (!userId && protectedPages.includes(currentPage)) {
    window.location.href = "login.html";
    return;
  }

  // 🚫 Prevent logged-in users from re-accessing auth pages
  if (userId && ["login.html", "signup.html", "forgot_password.html"].includes(currentPage)) {
    window.location.href = "index.html";
  }
});
