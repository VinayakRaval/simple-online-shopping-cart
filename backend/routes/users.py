from flask import Blueprint, jsonify, request
from database import get_connection
import bcrypt

users_bp = Blueprint("users", __name__)

# ------------------------------
# REGISTER new user
# ------------------------------
@users_bp.route("/register", methods=["POST"])
def register_user():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    email = data.get("email")

    if not all([username, password, email]):
        return jsonify({"error": "Missing required fields"}), 400

    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO users (username, password, email) VALUES (?, ?, ?)",
            (username, hashed, email)
        )
        conn.commit()
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 400

    conn.close()
    return jsonify({"message": "User registered successfully"}), 201


# ------------------------------
# LOGIN user
# ------------------------------
@users_bp.route("/login", methods=["POST"])
def login_user():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    conn = get_connection()
    user = conn.execute(
        "SELECT * FROM users WHERE username = ?", (username,)
    ).fetchone()
    conn.close()

    if user and bcrypt.checkpw(password.encode('utf-8'), user["password"]):
        return jsonify({
            "message": "Login successful",
            "user": {
                "id": user["id"],
                "username": user["username"],
                "email": user["email"]
            }
        }), 200
    else:
        return jsonify({"error": "Invalid username or password"}), 401


# ------------------------------
# GET all users (Admin)
# ------------------------------
@users_bp.route("/", methods=["GET"])
def get_all_users():
    conn = get_connection()
    users = conn.execute("SELECT id, username, email FROM users").fetchall()
    conn.close()
    return jsonify([dict(u) for u in users]), 200
