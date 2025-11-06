from flask import Blueprint, request, jsonify
from database import get_connection

cart_bp = Blueprint("cart", __name__)

# ========== ADD TO CART ==========
@cart_bp.route("/add", methods=["POST"])
def add_to_cart():
    data = request.get_json()
    user_id = data.get("user_id")
    product_id = data.get("product_id")
    quantity = data.get("quantity", 1)

    if not user_id or not product_id:
        return jsonify({"error": "Missing user_id or product_id"}), 400

    db = get_connection()
    cursor = db.cursor(dictionary=True)

    # ✅ Check if user exists
    cursor.execute("SELECT id FROM users WHERE id=%s", (user_id,))
    user = cursor.fetchone()
    if not user:
        db.close()
        return jsonify({"error": "Invalid user. Please log in again."}), 403

    # ✅ Check if product exists
    cursor.execute("SELECT id FROM products WHERE id=%s", (product_id,))
    product = cursor.fetchone()
    if not product:
        db.close()
        return jsonify({"error": "Product not found"}), 404

    # ✅ Check if product already exists in cart
    cursor.execute(
        "SELECT id, quantity FROM cart WHERE user_id=%s AND product_id=%s",
        (user_id, product_id),
    )
    existing = cursor.fetchone()

    if existing:
        # update quantity
        cursor.execute(
            "UPDATE cart SET quantity = quantity + %s WHERE id = %s",
            (quantity, existing["id"]),
        )
    else:
        cursor.execute(
            "INSERT INTO cart (user_id, product_id, quantity) VALUES (%s, %s, %s)",
            (user_id, product_id, quantity),
        )

    db.commit()
    db.close()

    return jsonify({"message": "✅ Added to cart successfully!"}), 200


# ========== GET CART ITEMS ==========
@cart_bp.route("/<int:user_id>", methods=["GET"])
def get_cart(user_id):
    db = get_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT c.id AS cart_id, c.quantity, 
               p.id AS product_id, p.name, p.price, p.image
        FROM cart c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = %s
        """,
        (user_id,),
    )
    items = cursor.fetchall()
    db.close()

    return jsonify(items), 200


# ========== UPDATE CART ITEM ==========
@cart_bp.route("/update", methods=["PUT"])
def update_cart():
    data = request.get_json()
    user_id = data.get("user_id")
    product_id = data.get("product_id")
    quantity = data.get("quantity")

    if not user_id or not product_id or quantity is None:
        return jsonify({"error": "Missing fields"}), 400

    db = get_connection()
    cursor = db.cursor()

    cursor.execute(
        "UPDATE cart SET quantity=%s WHERE user_id=%s AND product_id=%s",
        (quantity, user_id, product_id),
    )
    db.commit()
    db.close()

    return jsonify({"message": "Cart updated successfully"}), 200


# ========== REMOVE ITEM FROM CART ==========
@cart_bp.route("/remove", methods=["DELETE"])
def remove_from_cart():
    data = request.get_json()
    user_id = data.get("user_id")
    product_id = data.get("product_id")

    if not user_id or not product_id:
        return jsonify({"error": "Missing user_id or product_id"}), 400

    db = get_connection()
    cursor = db.cursor()

    cursor.execute(
        "DELETE FROM cart WHERE user_id=%s AND product_id=%s",
        (user_id, product_id),
    )
    db.commit()
    db.close()

    return jsonify({"message": "Item removed from cart"}), 200
