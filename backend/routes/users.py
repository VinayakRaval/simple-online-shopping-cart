from flask import Blueprint, request, jsonify
from database import get_connection
import hashlib, random

users_bp = Blueprint("users", __name__)

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# ---------------- Signup ----------------
@users_bp.route("/signup", methods=["POST"])
def signup():
    data = request.json
    full_name = data.get("full_name")
    email = data.get("email")
    phone = data.get("phone")
    password = hash_password(data.get("password"))

    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM users WHERE email=%s OR phone=%s", (email, phone))
        if cur.fetchone():
            return jsonify({"message": "Email or phone already exists"}), 400

        cur.execute(
            "INSERT INTO users (full_name, email, phone, password) VALUES (%s, %s, %s, %s)",
            (full_name, email, phone, password),
        )
        conn.commit()
        return jsonify({"message": "Account created successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

# ---------------- Login ----------------
@users_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    identifier = data.get("identifier")
    password = hash_password(data.get("password"))

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM users WHERE (email=%s OR phone=%s) AND password=%s",
        (identifier, identifier, password),
    )
    user = cur.fetchone()
    cur.close()
    conn.close()

    if user:
        return jsonify({"message": "Login successful"}), 200
    else:
        return jsonify({"message": "Invalid credentials"}), 401

# ---------------- Forgot Password (Mock OTP) ----------------
@users_bp.route("/forgot_password", methods=["POST"])
def forgot_password():
    data = request.json
    identifier = data.get("identifier")
    otp = random.randint(100000, 999999)
    print(f"Mock OTP for {identifier}: {otp}")
    return jsonify({"message": "Mock OTP generated successfully", "otp": otp}), 200
