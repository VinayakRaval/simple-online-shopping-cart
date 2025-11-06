from flask import Blueprint, jsonify, request
from database import get_connection

products_bp = Blueprint('products', __name__)

# ---------- Get All Products ----------
@products_bp.route('/', methods=['GET'])
def get_all_products():
    db = get_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM products")
    products = cursor.fetchall()
    db.close()
    return jsonify(products), 200


# ---------- Get Single Product ----------
@products_bp.route('/<int:product_id>', methods=['GET'])
def get_product_by_id(product_id):
    db = get_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM products WHERE id=%s", (product_id,))
    product = cursor.fetchone()
    db.close()

    if not product:
        return jsonify({"error": "Product not found"}), 404
    return jsonify(product), 200


# ---------- Get Featured Products ----------
@products_bp.route('/featured', methods=['GET'])
def get_featured_products():
    """
    Returns the top 9 products or random featured items.
    """
    db = get_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM products ORDER BY id DESC LIMIT 9")
    products = cursor.fetchall()
    db.close()

    if not products:
        return jsonify({"error": "No featured products found"}), 404
    return jsonify(products), 200


# ---------- Add Product ----------
@products_bp.route('/add', methods=['POST'])
def add_product():
    data = request.get_json()
    name = data.get("name")
    price = data.get("price")
    image = data.get("image")
    category = data.get("category")
    description = data.get("description")

    if not name or not price:
        return jsonify({"error": "Missing product data"}), 400

    db = get_connection()
    cursor = db.cursor()
    cursor.execute(
        "INSERT INTO products (name, price, image, category, description) VALUES (%s, %s, %s, %s, %s)",
        (name, price, image, category, description),
    )
    db.commit()
    db.close()
    return jsonify({"message": "Product added successfully"}), 201
