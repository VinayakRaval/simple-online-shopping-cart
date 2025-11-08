from flask import Blueprint, request, jsonify, send_from_directory, current_app
from werkzeug.utils import secure_filename
from database import get_connection
import os

admin_dashboard_bp = Blueprint("admin_dashboard", __name__, url_prefix="/api/admin")

# ============================================================
# 🖼️ Image Upload Folder
# ============================================================
UPLOAD_FOLDER = os.path.join(os.getcwd(), "frontend", "assets", "images")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def save_image(file):
    """Save uploaded image to frontend/assets/images"""
    if not file:
        return None
    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    return filename


# ============================================================
# 🖼️ Serve Uploaded Images
# ============================================================
@admin_dashboard_bp.route("/images/<filename>")
def serve_image(filename):
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.exists(file_path):
        return jsonify({"error": "Image not found"}), 404
    return send_from_directory(UPLOAD_FOLDER, filename)


# ============================================================
# 📊 Dashboard Stats
# ============================================================
@admin_dashboard_bp.route("/dashboard", methods=["GET"])
def dashboard_stats():
    db = get_connection()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute("SELECT COUNT(*) AS total_users FROM users")
        users = cur.fetchone()["total_users"]

        cur.execute("SELECT COUNT(*) AS total_products FROM products")
        products = cur.fetchone()["total_products"]

        cur.execute("SELECT COUNT(*) AS total_orders FROM orders")
        orders = cur.fetchone()["total_orders"]

        cur.execute("SELECT COUNT(*) AS total_categories FROM categories")
        categories = cur.fetchone()["total_categories"]

        return jsonify({
            "total_users": users,
            "total_products": products,
            "total_orders": orders,
            "total_categories": categories
        }), 200
    except Exception as e:
        current_app.logger.error(f"Dashboard stats error: {e}")
        return jsonify({"error": "Failed to load dashboard stats"}), 500
    finally:
        db.close()


# ============================================================
# 🟣 Add / Delete / Edit Category
# ============================================================
@admin_dashboard_bp.route("/add_category", methods=["POST"])
def add_category():
    name = request.form.get("name")
    if not name:
        return jsonify({"error": "Category name required"}), 400

    image_file = request.files.get("image")
    image_name = save_image(image_file)

    db = get_connection()
    cur = db.cursor()
    try:
        cur.execute("INSERT INTO categories (name, image) VALUES (%s, %s)", (name, image_name))
        db.commit()
        return jsonify({"message": "Category added successfully"}), 201
    except Exception as e:
        current_app.logger.error(f"Add category error: {e}")
        db.rollback()
        return jsonify({"error": "Error adding category"}), 500
    finally:
        db.close()


@admin_dashboard_bp.route("/delete_category/<int:cat_id>", methods=["DELETE"])
def delete_category(cat_id):
    db = get_connection()
    cur = db.cursor()
    try:
        cur.execute("DELETE FROM products WHERE category = %s", (cat_id,))
        cur.execute("DELETE FROM categories WHERE id = %s", (cat_id,))
        db.commit()
        return jsonify({"message": "Category deleted successfully"}), 200
    except Exception as e:
        current_app.logger.error(f"Delete category error: {e}")
        db.rollback()
        return jsonify({"error": "Error deleting category"}), 500
    finally:
        db.close()


@admin_dashboard_bp.route("/edit_category/<int:cat_id>", methods=["PUT"])
def edit_category(cat_id):
    name = request.form.get("name")
    image_file = request.files.get("image")

    db = get_connection()
    cur = db.cursor()
    try:
        if image_file:
            image_name = save_image(image_file)
            cur.execute("UPDATE categories SET name=%s, image=%s WHERE id=%s", (name, image_name, cat_id))
        else:
            cur.execute("UPDATE categories SET name=%s WHERE id=%s", (name, cat_id))
        db.commit()
        return jsonify({"message": "Category updated successfully"}), 200
    except Exception as e:
        db.rollback()
        current_app.logger.error(f"Edit category error: {e}")
        return jsonify({"error": "Failed to update category"}), 500
    finally:
        db.close()


# ============================================================
# 🟢 Add / Edit / Delete Product
# ============================================================
@admin_dashboard_bp.route("/add_product", methods=["POST"])
def add_product():
    data = request.form
    name = data.get("name")
    description = data.get("description")
    price = data.get("price")
    category_id = data.get("category")
    stock = data.get("stock")

    if not name or not price or not category_id:
        return jsonify({"error": "Missing required fields"}), 400

    image_file = request.files.get("image")
    image_name = save_image(image_file)

    db = get_connection()
    cur = db.cursor()
    try:
        cur.execute("""
            INSERT INTO products (name, description, price, category, image, stock)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (name, description, price, category_id, image_name, stock))
        db.commit()
        return jsonify({"message": "Product added successfully"}), 201
    except Exception as e:
        current_app.logger.error(f"Add product error: {e}")
        db.rollback()
        return jsonify({"error": "Error adding product"}), 500
    finally:
        db.close()


@admin_dashboard_bp.route("/edit_product/<int:pid>", methods=["PUT"])
def edit_product(pid):
    data = request.json
    name = data.get("name")
    price = data.get("price")
    stock = data.get("stock")
    description = data.get("description")

    db = get_connection()
    cur = db.cursor()
    try:
        cur.execute("""
            UPDATE products SET name=%s, price=%s, stock=%s, description=%s WHERE id=%s
        """, (name, price, stock, description, pid))
        db.commit()
        return jsonify({"message": "Product updated successfully"}), 200
    except Exception as e:
        db.rollback()
        current_app.logger.error(f"Edit product error: {e}")
        return jsonify({"error": "Error updating product"}), 500
    finally:
        db.close()


@admin_dashboard_bp.route("/delete_product/<int:pid>", methods=["DELETE"])
def delete_product(pid):
    db = get_connection()
    cur = db.cursor()
    try:
        cur.execute("DELETE FROM products WHERE id = %s", (pid,))
        db.commit()
        return jsonify({"message": "Product deleted successfully"}), 200
    except Exception as e:
        current_app.logger.error(f"Delete product error: {e}")
        db.rollback()
        return jsonify({"error": "Error deleting product"}), 500
    finally:
        db.close()


# ============================================================
# 📋 Get All Categories & Products
# ============================================================
@admin_dashboard_bp.route("/categories", methods=["GET"])
def get_categories():
    db = get_connection()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute("SELECT id, name, image FROM categories ORDER BY id DESC")
        return jsonify(cur.fetchall()), 200
    except Exception as e:
        current_app.logger.error(f"Fetch categories error: {e}")
        return jsonify({"error": "Error fetching categories"}), 500
    finally:
        db.close()


@admin_dashboard_bp.route("/products", methods=["GET"])
def get_products():
    db = get_connection()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute("""
            SELECT p.id, p.name, p.price, p.stock, p.description, p.image,
                   COALESCE(c.name, 'Uncategorized') AS category_name
            FROM products p
            LEFT JOIN categories c ON p.category = c.id
            ORDER BY p.id DESC
        """)
        return jsonify(cur.fetchall()), 200
    except Exception as e:
        current_app.logger.error(f"Fetch products error: {e}")
        return jsonify({"error": "Error fetching products"}), 500
    finally:
        db.close()




# ============================================================
# 👁️ Get Single Product or Category (with Products)
# ============================================================
@admin_dashboard_bp.route("/product/<int:pid>", methods=["GET"])
def get_product(pid):
    db = get_connection()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute("""
            SELECT p.id, p.name, p.price, p.stock, p.description, p.image, c.name AS category
            FROM products p LEFT JOIN categories c ON p.category = c.id WHERE p.id=%s
        """, (pid,))
        p = cur.fetchone()
        if not p:
            return jsonify({"error": "Product not found"}), 404
        return jsonify(p), 200
    finally:
        db.close()


@admin_dashboard_bp.route("/category/<int:cat_id>", methods=["GET"])
def get_category(cat_id):
    db = get_connection()
    cur = db.cursor(dictionary=True)
    try:
        # Category info
        cur.execute("SELECT id, name, image FROM categories WHERE id=%s", (cat_id,))
        cat = cur.fetchone()
        if not cat:
            return jsonify({"error": "Category not found"}), 404

        # Products under this category
        cur.execute("""
            SELECT id, name, price, image FROM products WHERE category=%s ORDER BY id DESC
        """, (cat_id,))
        cat["products"] = cur.fetchall()
        return jsonify(cat), 200
    finally:
        db.close()
