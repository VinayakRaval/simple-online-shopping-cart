from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_connection
import os

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

# ✅ Admin registration key (change this in production or load from .env)
ADMIN_REG_KEY = os.environ.get("ADMIN_REG_KEY", "SUPERADMIN")

# -------------------------------------------------
# 🧩 SIGNUP (for both Customer & Admin)
# -------------------------------------------------
@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    phone = (data.get("phone") or "").strip() or None
    address = (data.get("address") or "").strip() or None
    role = (data.get("role") or "Customer").strip()
    key = (data.get("key") or "").strip()

    if not username or not email or not password:
        return jsonify({"error": "Please fill all required fields"}), 400

    if role not in ("Admin", "Customer"):
        role = "Customer"

    # Verify admin key if role is Admin
    if role == "Admin" and key != ADMIN_REG_KEY:
        return jsonify({"error": "Invalid admin registration key"}), 403

    hashed = generate_password_hash(password)

    db = get_connection()
    cur = db.cursor()
    try:
        cur.execute("SELECT id FROM users WHERE email=%s LIMIT 1", (email,))
        if cur.fetchone():
            return jsonify({"error": "Email already registered"}), 400

        cur.execute("""
            INSERT INTO users (username, email, password, phone, address, role)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (username, email, hashed, phone, address, role))
        db.commit()

        return jsonify({
            "message": "Signup successful",
            "username": username,
            "role": role
        }), 201

    except Exception as e:
        current_app.logger.exception("Signup error")
        db.rollback()
        return jsonify({"error": "Server error during signup"}), 500
    finally:
        db.close()


# -------------------------------------------------
# 🔐 LOGIN (for both Customer & Admin)
# -------------------------------------------------
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role = (data.get("role") or "Customer").strip()

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    db = get_connection()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute("SELECT * FROM users WHERE email=%s AND role=%s LIMIT 1", (email, role))
        user = cur.fetchone()
        if not user:
            return jsonify({"error": "Invalid credentials or role"}), 401

        if not check_password_hash(user["password"], password):
            return jsonify({"error": "Incorrect password"}), 401

        # Update last login timestamp
        cur.execute("UPDATE users SET last_login=NOW() WHERE id=%s", (user["id"],))
        db.commit()

        return jsonify({
            "message": "Login successful",
            "user_id": user["id"],
            "username": user["username"],
            "role": user["role"]
        }), 200

    except Exception as e:
        current_app.logger.exception("Login error")
        return jsonify({"error": "Server error during login"}), 500
    finally:
        db.close()


# -------------------------------------------------
# 🔄 RESET PASSWORD (Mock OTP 123456)
# -------------------------------------------------
@auth_bp.route("/reset", methods=["POST"])
def reset_password():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    otp = (data.get("otp") or "").strip()
    new_password = data.get("new_password") or ""
    role = (data.get("role") or "Customer").strip()

    if not email or not otp or not new_password:
        return jsonify({"error": "Email, OTP, and new password are required"}), 400

    if otp != "123456":
        return jsonify({"error": "Invalid OTP"}), 400

    if len(new_password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    hashed = generate_password_hash(new_password)

    db = get_connection()
    cur = db.cursor()
    try:
        cur.execute("UPDATE users SET password=%s WHERE email=%s AND role=%s", (hashed, email, role))
        if cur.rowcount == 0:
            return jsonify({"error": "User not found for given role"}), 404
        db.commit()
        return jsonify({"message": "Password reset successful"}), 200
    except Exception as e:
        current_app.logger.exception("Password reset error")
        db.rollback()
        return jsonify({"error": "Server error resetting password"}), 500
    finally:
        db.close()
