# backend/routes/products.py
from flask import Blueprint, jsonify
import sqlite3
import os

products_bp = Blueprint("products", __name__)

DB_PATH = os.path.join(os.path.dirname(__file__), "../../database/shopping_cart.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ===== GET ALL PRODUCTS =====
@products_bp.route("/", methods=["GET"])
def get_products():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM products")
        rows = cursor.fetchall()
        conn.close()

        products = [dict(row) for row in rows]
        return jsonify(products)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ===== GET SINGLE PRODUCT =====
@products_bp.route("/<int:product_id>", methods=["GET"])
def get_product(product_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
        row = cursor.fetchone()
        conn.close()

        if row:
            return jsonify(dict(row))
        else:
            return jsonify({"error": "Product not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
