from flask import Flask, send_from_directory
from flask_cors import CORS

# Import all routes
from routes.users import users_bp
from routes.products import products_bp
from routes.cart import cart_bp
from routes.orders import orders_bp

app = Flask(__name__, static_folder="../frontend", static_url_path="")
CORS(app)

# Register blueprints
app.register_blueprint(users_bp, url_prefix="/api/users")
app.register_blueprint(products_bp, url_prefix="/api/products")
app.register_blueprint(cart_bp, url_prefix="/api/cart")
app.register_blueprint(orders_bp, url_prefix="/api/orders")

# Serve frontend files (login, index, etc.)
@app.route("/")
def serve_home():
    return send_from_directory(app.static_folder, "login.html")  # Always open login first

@app.route("/<path:filename>")
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)

if __name__ == "__main__":
    app.run(debug=True)
