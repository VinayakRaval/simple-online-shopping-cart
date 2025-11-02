from flask import Blueprint, request, jsonify
import random
import requests

otp_bp = Blueprint('otp', __name__)

# Temporary storage for OTPs (in real apps use DB)
otp_storage = {}

# === CONFIG ===
FAST2SMS_API_KEY = "Tgpus06jDfMVHkwGLAZhlYKdvyqxFto4CnJNE2bI8S3Q1Bi5mWxTRpZfHInWLuVGah1JEjb5K3oNeCDX"

@otp_bp.route('/send-otp', methods=['POST'])
def send_otp():
    data = request.get_json()
    phone = data.get('phone')

    if not phone:
        return jsonify({"error": "Phone number required"}), 400

    otp = random.randint(100000, 999999)
    otp_storage[phone] = otp

    # Send OTP using Fast2SMS API
    url = "https://www.fast2sms.com/dev/bulkV2"
    payload = {
        'authorization': FAST2SMS_API_KEY,
        'variables_values': str(otp),
        'route': 'otp',
        'numbers': phone
    }
    headers = {'cache-control': "no-cache"}

    response = requests.post(url, data=payload, headers=headers)
    return jsonify({"message": "OTP sent successfully!"})


@otp_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    data = request.get_json()
    phone = data.get('phone')
    user_otp = data.get('otp')

    if otp_storage.get(phone) == int(user_otp):
        del otp_storage[phone]
        return jsonify({"message": "OTP verified successfully!"})
    else:
        return jsonify({"error": "Invalid OTP"}), 400
