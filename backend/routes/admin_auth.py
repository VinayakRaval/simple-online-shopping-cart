from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
import jwt
import datetime
from database import get_connection

SECRET_KEY = "shopsmart_admin_secret_key"

admin_auth_bp = Blueprint("admin_auth", __name__, url_prefix="/api/admin")

# ✅ ADMIN LOGIN
@admin_auth_bp.route("/login", methods=["POST"])
def admin_login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400

    db = get_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM admin WHERE username=%s", (username,))
        admin = cursor.fetchone()
        if not admin or not check_password_hash(admin["password"], password):
            return jsonify({"error": "Invalid credentials"}), 401

        # Generate JWT token
        token = jwt.encode({
            "admin_id": admin["id"],
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=5)
        }, SECRET_KEY, algorithm="HS256")

        return jsonify({"message": "Login successful", "token": token})
    except Exception as e:
        print("⚠️ Admin Login Error:", e)
        return jsonify({"error": "Server error during login"}), 500
    finally:
        db.close()

# ✅ AUTH PROTECTION HELPER
def verify_admin_token(req):
    token = req.headers.get("Authorization")
    if not token:
        return None
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return decoded.get("admin_id")
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
