// ===== API Base =====
const BASE_URL = "http://127.0.0.1:5000/api/users";

// ===== Helper: Toast Notification =====
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

// ===== MOCK OTP System =====
const sendOtpBtn = document.getElementById("sendOtpBtn");
if (sendOtpBtn) {
  sendOtpBtn.addEventListener("click", () => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    alert(`Mock OTP: ${otp}`);
    localStorage.setItem("mockOtp", otp);
  });
}

// ===== SIGNUP =====
const signupBtn = document.getElementById("signupBtn");
if (signupBtn) {
  signupBtn.addEventListener("click", async () => {
    const fullname = document.getElementById("fullname").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const otp = document.getElementById("otp").value.trim();
    const password = document.getElementById("password").value;

    if (!fullname || !email || !phone || !otp || !password) {
      showToast("Please fill all fields", true);
      return;
    }

    const mockOtp = localStorage.getItem("mockOtp");
    if (otp !== mockOtp) {
      showToast("Invalid OTP. Please enter the correct mock OTP.", true);
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullname, email, phone, password }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Signup successful! Please log in.");
        localStorage.removeItem("mockOtp");
        setTimeout(() => (window.location.href = "login.html"), 1500);
      } else {
        showToast(data.error || "Signup failed", true);
      }
    } catch (err) {
      console.error(err);
      showToast("Error connecting to server", true);
    }
  });
}

// ===== LOGIN =====
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const loginInput = document.getElementById("loginInput").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!loginInput || !password) {
      showToast("Enter both Email/Phone and Password", true);
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: loginInput, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // ✅ Store user_id for cart and session
        localStorage.setItem("user_id", data.user_id);
        showToast(`Welcome ${data.username || "User"}!`);
        setTimeout(() => (window.location.href = "index.html"), 1000);
      } else {
        showToast(data.error || "Invalid credentials", true);
      }
    } catch (err) {
      console.error(err);
      showToast("Login failed. Check connection.", true);
    }
  });
}

// ===== FORGOT PASSWORD =====
const sendForgotOtpBtn = document.getElementById("sendForgotOtpBtn");
if (sendForgotOtpBtn) {
  sendForgotOtpBtn.addEventListener("click", () => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    alert(`Mock OTP: ${otp}`);
    localStorage.setItem("forgotOtp", otp);
  });
}

const resetPasswordBtn = document.getElementById("resetPasswordBtn");
if (resetPasswordBtn) {
  resetPasswordBtn.addEventListener("click", async () => {
    const email = document.getElementById("forgotEmail").value.trim();
    const otp = document.getElementById("forgotOtp").value.trim();
    const newPassword = document.getElementById("newPassword").value;
    const mockOtp = localStorage.getItem("forgotOtp");

    if (!email || !otp || !newPassword) {
      showToast("Please fill all fields", true);
      return;
    }

    if (otp !== mockOtp) {
      showToast("Invalid OTP. Please check and try again.", true);
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/forgot_password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, new_password: newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast("Password reset successful! Please log in.");
        localStorage.removeItem("forgotOtp");
        setTimeout(() => (window.location.href = "login.html"), 1500);
      } else {
        showToast(data.error || "Password reset failed", true);
      }
    } catch (err) {
      console.error(err);
      showToast("Error resetting password", true);
    }
  });
}

// ===== PASSWORD VISIBILITY TOGGLE =====
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
