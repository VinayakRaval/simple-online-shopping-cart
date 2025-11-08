from flask import Blueprint, request, jsonify
from database import get_connection

admin_categories_bp = Blueprint("admin_categories", __name__, url_prefix="/api/admin/categories")

@admin_categories_bp.route("", methods=["GET"])
def get_all_categories():
    db = get_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM categories ORDER BY id DESC")
        return jsonify(cursor.fetchall())
    except Exception as e:
        print("⚠️ Fetch Categories Error:", e)
        return jsonify({"error": "Failed to load categories"}), 500
    finally:
        db.close()

@admin_categories_bp.route("", methods=["POST"])
def add_category():
    data = request.get_json()
    name = data.get("name")
    image = data.get("image")
    if not name or not image:
        return jsonify({"error": "Missing fields"}), 400

    db = get_connection()
    cursor = db.cursor()
    try:
        cursor.execute("INSERT INTO categories (name, image) VALUES (%s, %s)", (name, image))
        db.commit()
        return jsonify({"message": "Category added"}), 201
    except Exception as e:
        print("⚠️ Add Category Error:", e)
        db.rollback()
        return jsonify({"error": "Failed to add category"}), 500
    finally:
        db.close()

@admin_categories_bp.route("/<int:id>", methods=["PUT"])
def update_category(id):
    data = request.get_json()
    name = data.get("name")
    image = data.get("image")
    db = get_connection()
    cursor = db.cursor()
    try:
        cursor.execute("UPDATE categories SET name=%s, image=%s WHERE id=%s", (name, image, id))
        db.commit()
        return jsonify({"message": "Category updated"}), 200
    except Exception as e:
        print("⚠️ Update Category Error:", e)
        db.rollback()
        return jsonify({"error": "Failed to update category"}), 500
    finally:
        db.close()

@admin_categories_bp.route("/<int:id>", methods=["DELETE"])
def delete_category(id):
    db = get_connection()
    cursor = db.cursor()
    try:
        cursor.execute("DELETE FROM categories WHERE id=%s", (id,))
        db.commit()
        return jsonify({"message": "Category deleted"}), 200
    except Exception as e:
        print("⚠️ Delete Category Error:", e)
        db.rollback()
        return jsonify({"error": "Failed to delete category"}), 500
    finally:
        db.close()
