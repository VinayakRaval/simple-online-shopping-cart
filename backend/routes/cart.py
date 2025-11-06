from flask import Blueprint, request, jsonify
from database import get_connection

cart_bp = Blueprint("cart", __name__, url_prefix="/api/cart")

# Add to cart
@cart_bp.route("/add", methods=["POST"])
def add_to_cart():
    data = request.get_json() or {}
    user_id = data.get("user_id")
    product_id = data.get("product_id")
    quantity = int(data.get("quantity", 1))

    if not user_id or not product_id:
        return jsonify({"error": "Missing fields"}), 400

    db = get_connection()
    cursor = db.cursor(dictionary=True)
    try:
        # Check if item exists
        cursor.execute("SELECT id, quantity FROM cart WHERE user_id=%s AND product_id=%s", (user_id, product_id))
        item = cursor.fetchone()
        if item:
            cursor.execute("UPDATE cart SET quantity = quantity + %s WHERE id=%s", (quantity, item["id"]))
        else:
            cursor.execute("INSERT INTO cart (user_id, product_id, quantity) VALUES (%s, %s, %s)",
                           (user_id, product_id, quantity))
        db.commit()
        return jsonify({"message": "Item added to cart"}), 200
    except Exception as e:
        print("⚠️ Add to Cart Error:", e)
        db.rollback()
        return jsonify({"error": "Server error adding to cart"}), 500
    finally:
        db.close()
        
# ✅ REMOVE FROM CART

@cart_bp.route("/remove", methods=["POST"])
def remove_from_cart():
    data = request.get_json() or {}
    user_id = data.get("user_id")
    product_id = data.get("product_id")

    if not user_id or not product_id:
        return jsonify({"error": "Missing user_id or product_id"}), 400

    db = get_connection()
    cursor = db.cursor()
    try:
        cursor.execute("DELETE FROM cart WHERE user_id=%s AND product_id=%s", (user_id, product_id))
        db.commit()
        return jsonify({"message": "Item removed from cart"}), 200
    except Exception as e:
        print("⚠️ Remove Cart Error:", e)
        db.rollback()
        return jsonify({"error": "Failed to remove item"}), 500
    finally:
        db.close()

# Get cart items for a user
@cart_bp.route("/<int:user_id>", methods=["GET"])
def get_cart(user_id):
    db = get_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT c.id AS cart_id, c.product_id, c.quantity,
                   p.name, p.price, p.image, p.category
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = %s
        """, (user_id,))
        items = cursor.fetchall()
        return jsonify(items), 200
    except Exception as e:
        print("⚠️ Cart fetch error:", e)
        return jsonify({"error": "Failed to load cart"}), 500
    finally:
        db.close()


# Update quantity (body: user_id, product_id, quantity)
@cart_bp.route("/update", methods=["POST"])
def update_cart_item():
    data = request.get_json() or {}
    user_id = data.get("user_id")
    product_id = data.get("product_id")
    quantity = int(data.get("quantity", 1))

    if not user_id or not product_id:
        return jsonify({"error": "user_id and product_id required"}), 400

    db = get_connection()
    cursor = db.cursor()
    try:
        cursor.execute("UPDATE cart SET quantity=%s WHERE user_id=%s AND product_id=%s", (quantity, user_id, product_id))
        db.commit()
        return jsonify({"message": "Cart updated"}), 200
    except Exception as e:
        db.rollback()
        print("Update cart error:", e)
        return jsonify({"error": "Failed to update cart"}), 500
    finally:
        db.close()


# Remove item from cart (body: user_id, product_id)
@cart_bp.route("/remove", methods=["POST"])
def remove_cart_item():
    data = request.get_json() or {}
    user_id = data.get("user_id")
    product_id = data.get("product_id")

    if not user_id or not product_id:
        return jsonify({"error": "user_id and product_id required"}), 400

    db = get_connection()
    cursor = db.cursor()
    try:
        cursor.execute("DELETE FROM cart WHERE user_id=%s AND product_id=%s", (user_id, product_id))
        db.commit()
        return jsonify({"message": "Removed from cart"}), 200
    except Exception as e:
        db.rollback()
        print("Remove cart error:", e)
        return jsonify({"error": "Failed to remove item"}), 500
    finally:
        db.close()
