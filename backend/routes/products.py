from flask import Blueprint, jsonify, request
from models import get_all_products, get_product_by_id, add_product
from database import get_connection

products_bp = Blueprint("products", __name__)

@products_bp.route("/", methods=["GET"])
def list_products():
    # support query params q (search) and category and sort
    q = request.args.get("q", "").strip()
    category = request.args.get("category", "").strip()
    sort = request.args.get("sort", "").strip()

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    base = "SELECT * FROM products WHERE 1=1"
    params = []
    if q:
        base += " AND (LOWER(name) LIKE %s OR LOWER(description) LIKE %s)"
        qparam = f"%{q.lower()}%"
        params.extend([qparam, qparam])
    if category:
        base += " AND LOWER(category)=LOWER(%s)"
        params.append(category)
    if sort == "price_asc":
        base += " ORDER BY price ASC"
    elif sort == "price_desc":
        base += " ORDER BY price DESC"
    else:
        base += " ORDER BY id DESC"

    cursor.execute(base, tuple(params))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(rows), 200

@products_bp.route("/<int:product_id>", methods=["GET"])
def get_product(product_id):
    product = get_product_by_id(product_id)
    if product:
        return jsonify(product), 200
    return jsonify({"error":"Product not found"}), 404

@products_bp.route("/add", methods=["POST"])
def create_product():
    data = request.get_json()
    required = ["name","price"]
    if not all(k in data for k in required):
        return jsonify({"error":"Missing fields"}), 400
    add_product(data.get("name"), data.get("price"), data.get("image",""), data.get("category",""), data.get("description",""))
    return jsonify({"message":"Product added"}), 201
