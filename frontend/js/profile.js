const API = "http://127.0.0.1:5000/api";
const user_id = parseInt(localStorage.getItem("user_id"));

document.addEventListener("DOMContentLoaded", () => {
  if (!user_id) {
    alert("Please log in to view your profile.");
    window.location.href = "login.html";
    return;
  }
  loadProfile();

  document.addEventListener("click", (e) => {
    if (e.target.id === "saveProfile") saveProfile();
    if (e.target.id === "logoutBtn") logoutUser();
  });
});

// 🔹 Load user profile
async function loadProfile() {
  const box = document.getElementById("profileBox");
  try {
    const res = await fetch(`${API}/users/${user_id}`);
    const user = await res.json();

    if (!user || user.error) {
      box.innerHTML = "<p>Failed to load user profile.</p>";
      return;
    }

    box.innerHTML = `
      <div class="profile-field"><label>Username:</label><input id="username" value="${user.username || ''}" readonly></div>
      <div class="profile-field"><label>Email:</label><input id="email" value="${user.email || ''}" type="email"></div>
      <div class="profile-field"><label>Phone:</label><input id="phone" value="${user.phone || ''}" type="text"></div>
      <div class="profile-field"><label>Member Since:</label><input value="${new Date(user.created_at).toDateString()}" readonly></div>

      <div class="profile-actions">
        <button id="saveProfile" class="btn save">Save Changes</button>
        <button id="logoutBtn" class="btn logout">Logout</button>
      </div>
    `;
  } catch (err) {
    console.error(err);
    box.innerHTML = "<p>Error loading profile.</p>";
  }
}

// 🔹 Save Profile Changes
async function saveProfile() {
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();

  try {
    const res = await fetch(`${API}/users/update/${user_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, phone }),
    });
    const data = await res.json();

    if (res.ok) {
      showToast("✅ Profile updated successfully!");
    } else {
      showToast("⚠️ " + (data.error || "Failed to update."), true);
    }
  } catch (err) {
    console.error(err);
    showToast("❌ Network error.", true);
  }
}

// 🔹 Logout
function logoutUser() {
  localStorage.removeItem("user_id");
  showToast("Logged out successfully!");
  setTimeout(() => (window.location.href = "login.html"), 1000);
}

// 🔹 Toast Notification
function showToast(msg, isError = false) {
  const container = document.getElementById("toast-container") || (() => {
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
  toast.textContent = msg;
  toast.style.background = isError ? "#ff4b4b" : "#00b4db";
  toast.style.color = "#02121a";
  toast.style.padding = "12px 20px";
  toast.style.borderRadius = "8px";
  toast.style.marginTop = "10px";
  toast.style.fontWeight = "600";
  toast.style.boxShadow = "0 5px 20px rgba(0,0,0,0.4)";
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
