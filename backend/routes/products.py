from flask import Blueprint, jsonify, request
from models import get_all_products, get_product_by_id, add_product
from database import get_connection


products_bp = Blueprint("products", __name__)

# ------------------------------
# GET all products
# ------------------------------
@products_bp.route("/", methods=["GET"])
def get_products():
    products = get_all_products()
    return jsonify(products), 200

# ------------------------------
# GET product by ID
# ------------------------------
@products_bp.route("/<int:product_id>", methods=["GET"])
def get_product(product_id):
    product = get_product_by_id(product_id)
    if product:
        return jsonify(product), 200
    else:
        return jsonify({"error": "Product not found"}), 404

# ------------------------------
# GET products by category
# ------------------------------
@products_bp.route("/category/<string:category>", methods=["GET"])
def get_products_by_category(category):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM products WHERE LOWER(category)=LOWER(%s)", (category,))
    result = cursor.fetchall()
    conn.close()
    return jsonify(result), 200

# ------------------------------
# POST new product (Admin only)
# ------------------------------
@products_bp.route("/add", methods=["POST"])
def add_new_product():
    data = request.get_json()
    required_fields = ["name", "price", "image", "category", "description"]

    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing fields"}), 400

    add_product(
        data["name"],
        data["price"],
        data["image"],
        data["category"],
        data["description"]
    )
    return jsonify({"message": "Product added successfully"}), 201
