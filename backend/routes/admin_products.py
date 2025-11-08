from flask import Blueprint, request, jsonify
from database import get_connection

admin_products_bp = Blueprint("admin_products", __name__, url_prefix="/api/admin/products")

@admin_products_bp.route("", methods=["GET"])
def get_all_products():
    db = get_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM products ORDER BY id DESC")
        products = cursor.fetchall()
        return jsonify(products)
    except Exception as e:
        print("⚠️ Fetch Products Error:", e)
        return jsonify({"error": "Failed to fetch products"}), 500
    finally:
        db.close()

@admin_products_bp.route("", methods=["POST"])
def add_product():
    data = request.get_json()
    fields = ["name", "category", "price", "stock", "description", "image"]
    if not all(k in data for k in fields):
        return jsonify({"error": "Missing fields"}), 400

    db = get_connection()
    cursor = db.cursor()
    try:
        cursor.execute("""
            INSERT INTO products (name, category, price, stock, description, image)
            VALUES (%s,%s,%s,%s,%s,%s)
        """, (data["name"], data["category"], data["price"], data["stock"], data["description"], data["image"]))
        db.commit()
        return jsonify({"message": "Product added"}), 201
    except Exception as e:
        print("⚠️ Add Product Error:", e)
        db.rollback()
        return jsonify({"error": "Failed to add product"}), 500
    finally:
        db.close()

@admin_products_bp.route("/<int:id>", methods=["PUT"])
def update_product(id):
    data = request.get_json()
    db = get_connection()
    cursor = db.cursor()
    try:
        cursor.execute("""
            UPDATE products SET name=%s, category=%s, price=%s, stock=%s, description=%s, image=%s WHERE id=%s
        """, (data["name"], data["category"], data["price"], data["stock"], data["description"], data["image"], id))
        db.commit()
        return jsonify({"message": "Product updated"}), 200
    except Exception as e:
        print("⚠️ Update Product Error:", e)
        db.rollback()
        return jsonify({"error": "Failed to update product"}), 500
    finally:
        db.close()

@admin_products_bp.route("/<int:id>", methods=["DELETE"])
def delete_product(id):
    db = get_connection()
    cursor = db.cursor()
    try:
        cursor.execute("DELETE FROM products WHERE id=%s", (id,))
        db.commit()
        return jsonify({"message": "Product deleted"}), 200
    except Exception as e:
        print("⚠️ Delete Product Error:", e)
        db.rollback()
        return jsonify({"error": "Failed to delete product"}), 500
    finally:
        db.close()
