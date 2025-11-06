from flask import Blueprint, request, jsonify
from database import get_connection

orders_bp = Blueprint("orders", __name__)

@orders_bp.route("/place", methods=["POST"])
def place_order():
    data = request.get_json()
    user_id = data.get("user_id")
    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone")
    address = data.get("address")

    if not user_id:
        return jsonify({"error": "Login required"}), 401

    db = get_connection()
    cursor = db.cursor(dictionary=True)

    # fetch cart items
    cursor.execute("""
        SELECT c.product_id, c.quantity, p.price 
        FROM cart c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = %s
    """, (user_id,))
    items = cursor.fetchall()

    if not items:
        db.close()
        return jsonify({"error": "Cart is empty"}), 400

    total = sum(i["price"] * i["quantity"] for i in items)

    # create order
    cursor.execute(
        "INSERT INTO orders (user_id, total_price, status) VALUES (%s, %s, %s)",
        (user_id, total, "Placed"),
    )
    order_id = cursor.lastrowid

    # add order items
    for item in items:
        cursor.execute(
            "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (%s, %s, %s, %s)",
            (order_id, item["product_id"], item["quantity"], item["price"]),
        )

    # clear cart
    cursor.execute("DELETE FROM cart WHERE user_id=%s", (user_id,))
    db.commit()
    db.close()

    return jsonify({"message": "Order placed successfully", "order_id": order_id}), 200
