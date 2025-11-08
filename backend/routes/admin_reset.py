# backend/routes/admin_reset.py
from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta
import re
from flask_mail import Message, Mail
from database import get_connection
from werkzeug.security import generate_password_hash

# Create Blueprint
admin_reset_bp = Blueprint("admin_reset", __name__, url_prefix="/api/admin")

# === MOCK OTP CONFIG ===
MOCK_OTP_ENABLED = True
MOCK_OTP_VALUE = "123456"

# === Utility Functions ===
def _get_mail():
    """Ensure Flask-Mail instance exists."""
    if not hasattr(current_app, "mail"):
        current_app.mail = Mail(current_app)
    return current_app.mail

def _is_valid_email(email):
    """Simple email validation."""
    return bool(re.match(r"[^@]+@[^@]+\.[^@]+", email))

# === 1️⃣ Send Mock OTP ===
# POST /api/admin/forgot
# body: { "email": "admin@example.com" }
@admin_reset_bp.route("/forgot", methods=["POST"])
def admin_forgot():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()

    if not email or not _is_valid_email(email):
        return jsonify({"error": "Valid email required"}), 400

    db = get_connection()
    cur = db.cursor(dictionary=True)
    try:
        # ✅ check in users table with role='Admin'
        cur.execute("SELECT id, email FROM users WHERE email=%s AND role='Admin' LIMIT 1", (email,))
        admin = cur.fetchone()

        if not admin:
            # Return generic message to avoid info leak
            return jsonify({"message": "If this email is registered, a reset code was sent."}), 200

        # MOCK OTP SYSTEM
        otp = MOCK_OTP_VALUE if MOCK_OTP_ENABLED else "000000"
        expiry = datetime.utcnow() + timedelta(minutes=15)

        # Make sure reset columns exist (create dynamically if needed)
        try:
            cur.execute("ALTER TABLE users ADD COLUMN reset_otp VARCHAR(10) NULL, ADD COLUMN reset_expiry DATETIME NULL")
            db.commit()
        except Exception:
            db.rollback()

        # Update reset OTP and expiry
        cur.execute(
            "UPDATE users SET reset_otp=%s, reset_expiry=%s WHERE id=%s",
            (otp, expiry, admin["id"])
        )
        db.commit()

        # MOCK: Print OTP in console and email it
        print(f"🔐 Mock OTP for {email}: {otp}")
        mail = _get_mail()
        msg = Message(
            subject="Admin Password Reset Code",
            recipients=[email],
            body=f"Your ShopSmart admin password reset code is: {otp}\n(This is a mock test OTP.)",
            sender=current_app.config.get("MAIL_DEFAULT_SENDER")
        )
        try:
            mail.send(msg)
        except Exception:
            print("⚠️ Email sending skipped (mock mode).")

        return jsonify({"message": "Mock OTP sent successfully (check console)."}), 200

    except Exception as e:
        print("admin_forgot error:", e)
        db.rollback()
        return jsonify({"error": "Server error sending reset code"}), 500
    finally:
        db.close()

# === 2️⃣ Verify OTP and Reset Password ===
# POST /api/admin/reset
# body: { "email": "admin@example.com", "otp": "123456", "new_password": "..." }
@admin_reset_bp.route("/reset", methods=["POST"])
def admin_reset():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    otp = (data.get("otp") or "").strip()
    new_password = (data.get("new_password") or "").strip()

    if not (email and otp and new_password):
        return jsonify({"error": "Email, OTP, and new password are required."}), 400

    if len(new_password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long."}), 400

    db = get_connection()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute("SELECT id, reset_otp, reset_expiry FROM users WHERE email=%s AND role='Admin' LIMIT 1", (email,))
        admin = cur.fetchone()

        if not admin:
            return jsonify({"error": "Invalid email or reset not requested."}), 400

        expiry = admin.get("reset_expiry")
        if isinstance(expiry, str):
            expiry = datetime.fromisoformat(expiry)

        if not expiry or datetime.utcnow() > expiry:
            return jsonify({"error": "Reset code expired."}), 400

        # ✅ Verify OTP
        expected_otp = MOCK_OTP_VALUE if MOCK_OTP_ENABLED else admin.get("reset_otp")
        if otp != expected_otp:
            return jsonify({"error": "Invalid OTP code."}), 400

        # ✅ Hash password and update
        hashed = generate_password_hash(new_password)
        cur.execute(
            "UPDATE users SET password=%s, reset_otp=NULL, reset_expiry=NULL WHERE id=%s",
            (hashed, admin["id"])
        )
        db.commit()

        return jsonify({"message": "✅ Password reset successful. Please log in again."}), 200

    except Exception as e:
        print("admin_reset error:", e)
        db.rollback()
        return jsonify({"error": "Server error resetting password"}), 500
    finally:
        db.close()
