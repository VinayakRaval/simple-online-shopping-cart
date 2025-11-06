from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_connection

users_bp = Blueprint("users", __name__)

# ---------- SIGNUP ----------
@users_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    fullname = data.get("fullname")
    email = data.get("email")
    phone = data.get("phone")
    password = data.get("password")

    if not fullname or not email or not phone or not password:
        return jsonify({"error": "All fields are required"}), 400

    db = get_connection()
    cursor = db.cursor(dictionary=True)

    # Check for existing user
    cursor.execute("SELECT * FROM users WHERE email=%s OR phone=%s", (email, phone))
    existing = cursor.fetchone()
    if existing:
        db.close()
        return jsonify({"error": "User already exists"}), 400

    hashed_pw = generate_password_hash(password)
    cursor.execute(
        "INSERT INTO users (username, email, phone, password) VALUES (%s, %s, %s, %s)",
        (fullname, email, phone, hashed_pw),
    )
    db.commit()
    db.close()

    return jsonify({"message": "Signup successful!"}), 200


# ---------- LOGIN ----------
@users_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    identifier = data.get("identifier")
    password = data.get("password")

    if not identifier or not password:
        return jsonify({"error": "Missing fields"}), 400

    db = get_connection()
    cursor = db.cursor(dictionary=True)

    # check by email or phone
    cursor.execute(
        "SELECT * FROM users WHERE email=%s OR phone=%s", (identifier, identifier)
    )
    user = cursor.fetchone()

    if not user:
        db.close()
        return jsonify({"error": "User not found"}), 404

    if not check_password_hash(user["password"], password):
        db.close()
        return jsonify({"error": "Invalid password"}), 401

    db.close()
    # ✅ Return user info for frontend session storage
    return (
        jsonify(
            {
                "message": f"Welcome {user['username']}!",
                "user_id": user["id"],
                "username": user["username"],
            }
        ),
        200,
    )


# ---------- FORGOT PASSWORD ----------
@users_bp.route("/forgot_password", methods=["POST"])
def forgot_password():
    data = request.get_json()
    identifier = data.get("identifier")
    new_password = data.get("new_password")

    if not identifier or not new_password:
        return jsonify({"error": "Missing fields"}), 400

    db = get_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute(
        "SELECT * FROM users WHERE email=%s OR phone=%s", (identifier, identifier)
    )
    user = cursor.fetchone()
    if not user:
        db.close()
        return jsonify({"error": "User not found"}), 404

    hashed_pw = generate_password_hash(new_password)
    cursor.execute(
        "UPDATE users SET password=%s WHERE id=%s", (hashed_pw, user["id"])
    )
    db.commit()
    db.close()

    return jsonify({"message": "Password reset successful!"}), 200


# ---------- GET SINGLE USER ----------
@users_bp.route("/<int:user_id>", methods=["GET"])
def get_user(user_id):
    db = get_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        "SELECT id, username, email, phone, created_at FROM users WHERE id=%s",
        (user_id,),
    )
    user = cursor.fetchone()
    db.close()

    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user), 200


# ---------- UPDATE USER ----------
@users_bp.route("/update/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    data = request.get_json()
    email = data.get("email")
    phone = data.get("phone")

    if not email or not phone:
        return jsonify({"error": "Missing fields"}), 400

    db = get_connection()
    cursor = db.cursor()
    cursor.execute(
        "UPDATE users SET email=%s, phone=%s WHERE id=%s", (email, phone, user_id)
    )
    db.commit()
    db.close()

    return jsonify({"message": "Profile updated successfully"}), 200


# ---------- LOGOUT ----------
@users_bp.route("/logout", methods=["POST"])
def logout():
    """
    This just confirms logout — frontend handles session clearing (localStorage).
    """
    return jsonify({"message": "User logged out successfully"}), 200
