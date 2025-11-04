// ✅ Base API URL
const BASE_URL = "http://127.0.0.1:5000/api/users";

// ======= SEND MOCK OTP =======
function sendOTP() {
  const phone = document.getElementById("phone").value;
  if (!phone) return alert("📱 Please enter your phone number first!");

  const otp = Math.floor(100000 + Math.random() * 900000);
  localStorage.setItem("mockOtp", otp);
  alert(`📩 Mock OTP sent to ${phone}: ${otp}`);
}

// ======= SIGNUP =======
async function signup() {
  const fullname = document.getElementById("fullname").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const password = document.getElementById("password").value.trim();
  const otp = document.getElementById("otp").value.trim();
  const mockOtp = localStorage.getItem("mockOtp");

  if (!fullname || !email || !phone || !password || !otp)
    return alert("⚠️ Please fill all fields!");

  if (otp !== mockOtp)
    return alert("❌ Invalid OTP. Please enter the correct one.");

  if (password.length < 8 || !/\d/.test(password))
    return alert("🔒 Password must be at least 8 characters and contain 1 number.");

  const res = await fetch(`${BASE_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullname, email, phone, password }),
  });

  const data = await res.json();
  alert(data.message || data.error);

  if (res.ok) {
    localStorage.removeItem("mockOtp");
    window.location.href = "login.html";
  }
}

// ======= LOGIN =======
async function login() {
  const identifier = document.getElementById("loginInput").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!identifier || !password)
    return alert("⚠️ Please enter your email/phone and password!");

  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });

  const data = await res.json();

  if (res.ok) {
    alert(`✅ Welcome back, ${data.username || "User"}!`);
    localStorage.setItem("user_id", data.user_id);
    window.location.href = "index.html";
  } else {
    alert(data.error || "❌ Invalid login credentials!");
  }
}

// ======= FORGOT PASSWORD =======
function sendForgotOtp() {
  const email = document.getElementById("forgotEmail").value;
  if (!email) return alert("📧 Please enter your email first!");

  const otp = Math.floor(100000 + Math.random() * 900000);
  localStorage.setItem("forgotOtp", otp);
  alert(`📩 Mock OTP sent to ${email}: ${otp}`);
}

async function resetPassword() {
  const email = document.getElementById("forgotEmail").value.trim();
  const otp = document.getElementById("forgotOtp").value.trim();
  const newPassword = document.getElementById("newPassword").value.trim();
  const mockOtp = localStorage.getItem("forgotOtp");

  if (!email || !otp || !newPassword)
    return alert("⚠️ Please fill all fields!");

  if (otp !== mockOtp)
    return alert("❌ Invalid OTP entered!");

  const res = await fetch(`${BASE_URL}/forgot_password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, new_password: newPassword }),
  });

  const data = await res.json();
  alert(data.message || data.error);

  if (res.ok) {
    localStorage.removeItem("forgotOtp");
    window.location.href = "login.html";
  }
}

// ======= SHOW / HIDE PASSWORD (Eye Icon) =======
function togglePasswordVisibility(inputId, eyeId) {
  const input = document.getElementById(inputId);
  const eye = document.getElementById(eyeId);
  if (!input || !eye) return;

  eye.addEventListener("click", () => {
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    eye.innerHTML = isPassword
      ? `<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" fill="#000"><path d="M10 4C5 4 1 10 1 10s4 6 9 6 9-6 9-6-4-6-9-6Zm0 9a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" fill="#000"><path d="M10 4C5 4 1 10 1 10s4 6 9 6 9-6 9-6-4-6-9-6Zm0 9a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"/></svg>`;
  });
}

// Initialize password toggle
document.addEventListener("DOMContentLoaded", () => {
  togglePasswordVisibility("password", "togglePassword");
  togglePasswordVisibility("loginPassword", "toggleLoginPassword");
  togglePasswordVisibility("newPassword", "toggleForgotPassword");
});
