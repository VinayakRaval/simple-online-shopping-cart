# backend/app.py
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_mail import Mail

# === Import Blueprints ===
from routes.users import users_bp
from routes.products import products_bp
from routes.cart import cart_bp
from routes.orders import orders_bp

# === Admin Blueprints ===
from routes.admin import admin_bp
from routes.admin_products import admin_products_bp
from routes.admin_categories import admin_categories_bp
from routes.admin_users import admin_users_bp
from routes.admin_orders import admin_orders_bp
from routes.admin_dashboard import admin_dashboard_bp
from routes.admin_auth import admin_auth_bp
from routes.admin_profile import admin_profile_bp
from routes.admin_reset import admin_reset_bp
from routes.auth_roles import auth_bp

# === Flask Setup ===
app = Flask(__name__, static_folder="../frontend", static_url_path="")
CORS(app)

# === Mail Configuration ===
app.config.update({
    "MAIL_SERVER": "smtp.gmail.com",
    "MAIL_PORT": 587,
    "MAIL_USE_TLS": True,
    "MAIL_USERNAME": "<your-email>@gmail.com",        # replace later
    "MAIL_PASSWORD": "<your-email-password>",         # or use App Password
    "MAIL_DEFAULT_SENDER": "<your-email>@gmail.com"
})

mail = Mail(app)
app.mail = mail

# === Register All Blueprints ===
app.register_blueprint(users_bp, url_prefix="/api/users")
app.register_blueprint(products_bp, url_prefix="/api/products")
app.register_blueprint(cart_bp, url_prefix="/api/cart")
app.register_blueprint(orders_bp, url_prefix="/api/orders")

# Admin routes
app.register_blueprint(admin_bp, url_prefix="/api/admin")
app.register_blueprint(admin_products_bp)
app.register_blueprint(admin_categories_bp)
app.register_blueprint(admin_users_bp)
app.register_blueprint(admin_orders_bp)
app.register_blueprint(admin_dashboard_bp)
app.register_blueprint(admin_auth_bp)
app.register_blueprint(admin_profile_bp)
app.register_blueprint(admin_reset_bp)
app.register_blueprint(auth_bp)

# === Serve Frontend (React-style Fallback) ===
@app.route("/")
def serve_index():
    """Serve the frontend login page."""
    return send_from_directory(app.static_folder, "login.html")

@app.route("/<path:path>")
def serve_static_files(path):
    """Serve all other static files."""
    return send_from_directory(app.static_folder, path)

# === Health Check Route ===
@app.route("/api")
def home():
    return {"message": "✅ ShopSmart Flask backend is running successfully!"}

if __name__ == "__main__":
    app.run(debug=True)
