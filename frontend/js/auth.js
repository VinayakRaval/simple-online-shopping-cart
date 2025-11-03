const BASE_URL = "http://127.0.0.1:5000/api/users";

// ===== MOCK OTP GENERATOR =====
function generateMockOtp(key) {
  const otp = Math.floor(100000 + Math.random() * 900000);
  alert(`✅ Mock OTP: ${otp}`);
  localStorage.setItem(key, otp);
}

// ===== SIGNUP =====
const sendOtpBtn = document.getElementById("sendOtpBtn");
if (sendOtpBtn) {
  sendOtpBtn.addEventListener("click", () => generateMockOtp("mockOtp"));
}

const signupBtn = document.getElementById("signupBtn");
if (signupBtn) {
  signupBtn.addEventListener("click", async () => {
    const fullname = document.getElementById("fullname").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const otp = document.getElementById("otp").value;
    const password = document.getElementById("password").value;

    const mockOtp = localStorage.getItem("mockOtp");
    if (otp !== mockOtp) {
      alert("❌ Invalid OTP. Please enter the correct mock OTP.");
      return;
    }

    const res = await fetch(`${BASE_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullname, email, phone, password }),
    });

    const data = await res.json();
    alert(data.message);
    if (res.ok) window.location.href = "login.html";
  });
}

// ===== LOGIN =====
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const identifier = document.getElementById("loginInput").value;
    const password = document.getElementById("loginPassword").value;

    const res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });

    const data = await res.json();
    alert(data.message);
    if (res.ok) window.location.href = "index.html";
  });
}

// ===== FORGOT PASSWORD =====
const sendForgotOtpBtn = document.getElementById("sendForgotOtpBtn");
if (sendForgotOtpBtn) {
  sendForgotOtpBtn.addEventListener("click", () => generateMockOtp("forgotOtp"));
}

const resetPasswordBtn = document.getElementById("resetPasswordBtn");
if (resetPasswordBtn) {
  resetPasswordBtn.addEventListener("click", async () => {
    const email = document.getElementById("forgotEmail").value;
    const otp = document.getElementById("forgotOtp").value;
    const newPassword = document.getElementById("newPassword").value;
    const mockOtp = localStorage.getItem("forgotOtp");

    if (otp !== mockOtp) {
      alert("❌ Invalid OTP. Please check and try again.");
      return;
    }

    const res = await fetch(`${BASE_URL}/forgot_password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: email, newPassword }),
    });

    const data = await res.json();
    alert(data.message);
    if (res.ok) window.location.href = "login.html";
  });
}

// ===== SHOW / HIDE PASSWORD (Black SVG Eye) =====
function setupEyeToggle(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  if (!input || !icon) return;

  icon.addEventListener("click", () => {
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    icon.innerHTML = isHidden
      ? `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="black" width="22" height="22" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="black" width="22" height="22" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18M10.477 10.477A3 3 0 0015 12m-2.42 2.42A3 3 0 0112 15c-4.478 0-8.268-2.943-9.542-7 0.61-1.943 1.805-3.66 3.405-4.95M15.54 8.46A9.957 9.957 0 0112 5c-4.478 0-8.268 2.943-9.542 7 0.313 1.002 0.752 1.937 1.3 2.786"/></svg>`;
  });
}

setupEyeToggle("password", "togglePassword");
setupEyeToggle("loginPassword", "toggleLoginPassword");
setupEyeToggle("newPassword", "toggleForgotPassword");
