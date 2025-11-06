from flask import Blueprint, request, jsonify
from database import get_connection
import random, string
from datetime import datetime, timedelta

otp_bp = Blueprint("otp", __name__)

def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

@otp_bp.route("/send", methods=["POST"])
def send_otp():
    try:
        data = request.get_json() or {}
        phone = data.get("phone")
        if not phone:
            return jsonify({"error": "Phone number is required"}), 400

        otp = generate_otp()
        expiry = datetime.now() + timedelta(minutes=10)

        conn = get_connection()
        cursor = conn.cursor()

        # ✅ Insert new user if not found
        cursor.execute("SELECT id FROM users WHERE phone=%s", (phone,))
        user = cursor.fetchone()
        if not user:
            cursor.execute(
                "INSERT INTO users (phone, otp_code, otp_expiry) VALUES (%s, %s, %s)",
                (phone, otp, expiry)
            )
        else:
            cursor.execute(
                "UPDATE users SET otp_code=%s, otp_expiry=%s WHERE phone=%s",
                (otp, expiry, phone)
            )

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            "message": f"OTP sent successfully to {phone} (mock)",
            "otp": otp
        }), 200

    except Exception as e:
        print("Error sending OTP:", e)
        return jsonify({"error": "Internal server error"}), 500
