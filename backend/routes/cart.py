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
        return jsonify({"error": "user_id and product_id required"}), 400

    db = get_connection()
    cursor = db.cursor(dictionary=True)

    try:
        # Check user exists
        cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        if not cursor.fetchone():
            return jsonify({"error": "User not found"}), 404

        # Check product exists
        cursor.execute("SELECT id, stock FROM products WHERE id = %s", (product_id,))
        prod = cursor.fetchone()
        if not prod:
            return jsonify({"error": "Product not found"}), 404

        # Optional: check stock (if you track stock)
        if prod.get("stock") is not None and prod["stock"] < 1:
            return jsonify({"error": "Product out of stock"}), 400

        # Check existing cart item
        cursor.execute("SELECT id, quantity FROM cart WHERE user_id=%s AND product_id=%s", (user_id, product_id))
        exist = cursor.fetchone()

        if exist:
            cursor.execute("UPDATE cart SET quantity = quantity + %s WHERE id = %s", (quantity, exist["id"]))
        else:
            cursor.execute("INSERT INTO cart (user_id, product_id, quantity) VALUES (%s, %s, %s)",
                           (user_id, product_id, quantity))

        db.commit()

        # Return updated cart summary (simple)
        cursor.execute("SELECT SUM(quantity) as total_items FROM cart WHERE user_id=%s", (user_id,))
        total = cursor.fetchone().get("total_items") or 0

        return jsonify({"message": "Added to cart successfully!", "cart_count": int(total)}), 200

    except Exception as e:
        db.rollback()
        # log in console for debugging (keep for dev)
        print("Cart add error:", e)
        return jsonify({"error": "Server error adding to cart"}), 500
    finally:
        db.close()


# Get cart items for a user
@cart_bp.route("/<int:user_id>", methods=["GET"])
def get_cart(user_id):
    db = get_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT c.id as cart_id, c.product_id, c.quantity, p.name, p.price, p.image, p.category
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = %s
        """, (user_id,))
        items = cursor.fetchall() or []
        return jsonify(items), 200
    except Exception as e:
        print("Get cart error:", e)
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
