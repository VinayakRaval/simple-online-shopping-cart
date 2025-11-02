// frontend/js/auth.js

document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");
  const loginForm = document.getElementById("loginForm");
  const togglePassword = document.getElementById("togglePassword");
  const passwordField = document.getElementById("password");
  const passwordStrength = document.getElementById("passwordStrength");
  const sendOtpBtn = document.getElementById("sendOtp");
  const otpStatus = document.getElementById("otpStatus");

  // ---------------------------
  // Show/Hide Password Toggle
  // ---------------------------
  if (togglePassword && passwordField) {
    togglePassword.addEventListener("click", () => {
      const type = passwordField.type === "password" ? "text" : "password";
      passwordField.type = type;
    });
  }

  // ---------------------------
  // Password Strength Checker
  // ---------------------------
  if (passwordField && passwordStrength) {
    passwordField.addEventListener("input", () => {
      const val = passwordField.value;
      const hasNumber = /\d/.test(val);
      if (val.length < 8 || !hasNumber) {
        passwordStrength.textContent = "Password must have at least 8 characters and 1 number.";
        passwordStrength.style.color = "#f3a712";
      } else {
        passwordStrength.textContent = "Strong password ✅";
        passwordStrength.style.color = "#00ff88";
      }
    });
  }

  // ---------------------------
  // Mock OTP Send
  // ---------------------------
  if (sendOtpBtn) {
    sendOtpBtn.addEventListener("click", () => {
      const phone = document.getElementById("phone").value;
      if (!phone) {
        otpStatus.textContent = "Please enter a valid phone number.";
        otpStatus.style.color = "orange";
        return;
      }
      otpStatus.textContent = "OTP sent successfully ✅ (mock)";
      otpStatus.style.color = "#00ff88";
    });
  }

  // ---------------------------
  // Signup Form Submit
  // ---------------------------
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const data = {
        username: document.getElementById("username").value,
        email: document.getElementById("email").value,
        password: passwordField.value,
      };

      // Basic password check before submit
      if (data.password.length < 8 || !/\d/.test(data.password)) {
        alert("Please use a stronger password (8+ characters, include a number)");
        return;
      }

      const res = await fetch("http://127.0.0.1:5000/api/users/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (res.ok) {
        alert("Signup successful! You can now login.");
        window.location.href = "login.html";
      } else {
        alert(result.error || "Signup failed.");
      }
    });
  }

  // ---------------------------
  // Login Form Submit
  // ---------------------------
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const data = {
        email: document.getElementById("email").value,
        password: passwordField.value,
      };

      const res = await fetch("http://127.0.0.1:5000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (res.ok) {
        alert("Login successful!");
        localStorage.setItem("user", JSON.stringify(result.user));
        window.location.href = "index.html";
      } else {
        alert(result.error || "Invalid credentials.");
      }
    });
  }
});
