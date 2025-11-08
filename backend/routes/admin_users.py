from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash
from database import get_connection

admin_users_bp = Blueprint("admin_users", __name__, url_prefix="/api/admin/users")

@admin_users_bp.route("", methods=["GET"])
def get_all_users():
    db = get_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT u.id, u.username, u.email, u.phone, u.status, u.last_login,
                   COUNT(o.id) AS order_count
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id
            GROUP BY u.id
            ORDER BY u.id DESC
        """)
        users = cursor.fetchall()
        return jsonify(users)
    except Exception as e:
        print("⚠️ Fetch Users Error:", e)
        return jsonify({"error": "Failed to fetch users"}), 500
    finally:
        db.close()

@admin_users_bp.route("/<int:user_id>/block", methods=["PUT"])
def block_user(user_id):
    db = get_connection()
    cursor = db.cursor()
    try:
        cursor.execute("UPDATE users SET status='blocked' WHERE id=%s", (user_id,))
        db.commit()
        return jsonify({"message": "User blocked"}), 200
    except Exception as e:
        db.rollback()
        print("⚠️ Block User Error:", e)
        return jsonify({"error": "Failed to block user"}), 500
    finally:
        db.close()

@admin_users_bp.route("/<int:user_id>/unblock", methods=["PUT"])
def unblock_user(user_id):
    db = get_connection()
    cursor = db.cursor()
    try:
        cursor.execute("UPDATE users SET status='active' WHERE id=%s", (user_id,))
        db.commit()
        return jsonify({"message": "User unblocked"}), 200
    except Exception as e:
        db.rollback()
        print("⚠️ Unblock User Error:", e)
        return jsonify({"error": "Failed to unblock user"}), 500
    finally:
        db.close()

@admin_users_bp.route("/<int:user_id>/reset-password", methods=["PUT"])
def reset_password(user_id):
    data = request.get_json()
    new_password = data.get("new_password")
    if not new_password:
        return jsonify({"error": "Missing password"}), 400

    hashed = generate_password_hash(new_password)
    db = get_connection()
    cursor = db.cursor()
    try:
        cursor.execute("UPDATE users SET password=%s WHERE id=%s", (hashed, user_id))
        db.commit()
        return jsonify({"message": "Password reset successful"}), 200
    except Exception as e:
        db.rollback()
        print("⚠️ Password Reset Error:", e)
        return jsonify({"error": "Failed to reset password"}), 500
    finally:
        db.close()
