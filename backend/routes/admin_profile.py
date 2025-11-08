from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_connection
from routes.admin_auth import verify_admin_token

admin_profile_bp = Blueprint("admin_profile", __name__, url_prefix="/api/admin/profile")

# ✅ Get admin profile
@admin_profile_bp.route("", methods=["GET"])
def get_admin_profile():
    admin_id = verify_admin_token(request)
    if not admin_id:
        return jsonify({"error": "Unauthorized"}), 401

    db = get_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT username, email FROM admin WHERE id = %s", (admin_id,))
    admin = cursor.fetchone()
    db.close()
    if not admin:
        return jsonify({"error": "Admin not found"}), 404
    return jsonify(admin)

# ✅ Update admin email
@admin_profile_bp.route("/update_email", methods=["PUT"])
def update_email():
    admin_id = verify_admin_token(request)
    if not admin_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    email = data.get("email")
    if not email:
        return jsonify({"error": "Email is required"}), 400

    db = get_connection()
    cursor = db.cursor()
    cursor.execute("UPDATE admin SET email=%s WHERE id=%s", (email, admin_id))
    db.commit()
    db.close()
    return jsonify({"message": "Email updated successfully"})

# ✅ Change password
@admin_profile_bp.route("/change_password", methods=["PUT"])
def change_password():
    admin_id = verify_admin_token(request)
    if not admin_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    current_password = data.get("current_password")
    new_password = data.get("new_password")

    if not current_password or not new_password:
        return jsonify({"error": "Both current and new passwords are required"}), 400

    db = get_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT password FROM admin WHERE id=%s", (admin_id,))
    admin = cursor.fetchone()

    if not admin or not check_password_hash(admin["password"], current_password):
        db.close()
        return jsonify({"error": "Incorrect current password"}), 403

    hashed_pw = generate_password_hash(new_password)
    cursor.execute("UPDATE admin SET password=%s WHERE id=%s", (hashed_pw, admin_id))
    db.commit()
    db.close()
    return jsonify({"message": "Password updated successfully"})
