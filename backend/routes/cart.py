from flask import Blueprint, jsonify, request
from backend.database import get_connection

cart_bp = Blueprint("cart", __name__)

# ------------------------------
# GET user cart
# ------------------------------
@cart_bp.route("/<int:user_id>", methods=["GET"])
def get_cart(user_id):
    conn = get_connection()
    items = conn.execute("""
        SELECT c.id, c.product_id, p.name, p.price, c.quantity, p.image
        FROM cart c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
    """, (user_id,)).fetchall()
    conn.close()
    return jsonify([dict(item) for item in items]), 200


# ------------------------------
# ADD item to cart
# ------------------------------
@cart_bp.route("/add", methods=["POST"])
def add_to_cart():
    data = request.get_json()
    user_id = data.get("user_id")
    product_id = data.get("product_id")
    quantity = data.get("quantity", 1)

    if not user_id or not product_id:
        return jsonify({"error": "Missing user_id or product_id"}), 400

    conn = get_connection()
    existing = conn.execute(
        "SELECT * FROM cart WHERE user_id=? AND product_id=?",
        (user_id, product_id)
    ).fetchone()

    if existing:
        conn.execute(
            "UPDATE cart SET quantity = quantity + ? WHERE user_id=? AND product_id=?",
            (quantity, user_id, product_id)
        )
    else:
        conn.execute(
            "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)",
            (user_id, product_id, quantity)
        )

    conn.commit()
    conn.close()
    return jsonify({"message": "Item added to cart"}), 201


# ------------------------------
# UPDATE cart item quantity
# ------------------------------
@cart_bp.route("/update", methods=["PUT"])
def update_cart_item():
    data = request.get_json()
    user_id = data.get("user_id")
    product_id = data.get("product_id")
    quantity = data.get("quantity")

    if not all([user_id, product_id, quantity]):
        return jsonify({"error": "Missing fields"}), 400

    conn = get_connection()
    conn.execute(
        "UPDATE cart SET quantity=? WHERE user_id=? AND product_id=?",
        (quantity, user_id, product_id)
    )
    conn.commit()
    conn.close()
    return jsonify({"message": "Cart updated"}), 200


# ------------------------------
# DELETE item from cart
# ------------------------------
@cart_bp.route("/remove", methods=["DELETE"])
def remove_cart_item():
    data = request.get_json()
    user_id = data.get("user_id")
    product_id = data.get("product_id")

    conn = get_connection()
    conn.execute(
        "DELETE FROM cart WHERE user_id=? AND product_id=?",
        (user_id, product_id)
    )
    conn.commit()
    conn.close()
    return jsonify({"message": "Item removed"}), 200
