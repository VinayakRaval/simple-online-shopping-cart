from flask import Flask, send_from_directory
from flask_cors import CORS

# Import blueprints
from routes.users import users_bp
from routes.products import products_bp
from routes.cart import cart_bp
from routes.orders import orders_bp
from routes.admin import admin_bp

app = Flask(__name__, static_folder="../frontend", static_url_path="")
CORS(app)

# Register all routes
app.register_blueprint(users_bp, url_prefix="/api/users")
app.register_blueprint(products_bp, url_prefix="/api/products")
app.register_blueprint(cart_bp, url_prefix="/api/cart")
app.register_blueprint(orders_bp, url_prefix="/api/orders")
app.register_blueprint(admin_bp, url_prefix="/api/admin")

# Serve frontend
@app.route("/")
def serve_login():
    return send_from_directory(app.static_folder, "login.html")

@app.route("/<path:path>")
def serve_static_files(path):
    return send_from_directory(app.static_folder, path)

@app.route("/")
def home():
    return "ShopSmart Flask backend is running!"

if __name__ == "__main__":
    app.run(debug=True)
