from flask import Flask
from flask_cors import CORS
from backend.database import init_db
from backend.routes.products import products_bp
from backend.routes.users import users_bp
from backend.routes.cart import cart_bp
from backend.routes.orders import orders_bp

app = Flask(__name__)
CORS(app)

# Initialize Database
init_db()

# Register Blueprints (routes)
app.register_blueprint(products_bp, url_prefix="/api/products")
app.register_blueprint(users_bp, url_prefix="/api/users")
app.register_blueprint(cart_bp, url_prefix="/api/cart")
app.register_blueprint(orders_bp, url_prefix="/api/orders")

@app.route('/')
def home():
    return {"message": "Simple Online Shopping Cart API is running"}

if __name__ == "__main__":
    app.run(debug=True)
