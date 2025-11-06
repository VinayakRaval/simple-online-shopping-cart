from flask import Flask
from flask_cors import CORS
from database import init_db
from routes.products import products_bp
from routes.users import users_bp
from routes.cart import cart_bp
from routes.orders import orders_bp
from routes.otp import otp_bp

app = Flask(__name__)
CORS(app)

init_db()

app.register_blueprint(products_bp, url_prefix="/api/products")
app.register_blueprint(users_bp, url_prefix="/api/users")
app.register_blueprint(cart_bp, url_prefix="/api/cart")
app.register_blueprint(orders_bp, url_prefix="/api/orders")
app.register_blueprint(otp_bp, url_prefix="/api/otp")

@app.route('/')
def home():
    return {"message": "Simple Online Shopping Cart API is running"}

if __name__ == "__main__":
    app.run(debug=True)
