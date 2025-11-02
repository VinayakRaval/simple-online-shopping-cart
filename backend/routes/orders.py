from flask import Blueprint, jsonify, request
from database import get_connection
from datetime import datetime

orders_bp = Blueprint("orders", __name__)

# ------------------------------
# PLACE NEW ORDER
# ------------------------------
@orders_bp.route("/place", methods=["POST"])
def place_order():
    data = request.get_json()
    user_id = data.get("user_id")

    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Get cart items
    cursor.execute("""
        SELECT c.product_id, p.price, c.quantity
        FROM cart c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = %s
    """, (user_id,))
    cart_items = cursor.fetchall()

    if not cart_items:
        conn.close()
        return jsonify({"error": "Cart is empty"}), 400

    total_amount = sum(item["price"] * item["quantity"] for item in cart_items)

    # Insert order
    cursor.execute(
        "INSERT INTO orders (user_id, total_amount, date) VALUES (%s, %s, %s)",
        (user_id, total_amount, datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    )
    order_id = cursor.lastrowid

    # Insert order items
    for item in cart_items:
        cursor.execute(
            "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (%s, %s, %s, %s)",
            (order_id, item["product_id"], item["quantity"], item["price"])
        )

    # Clear cart after placing order
    cursor.execute("DELETE FROM cart WHERE user_id=%s", (user_id,))
    conn.commit()
    conn.close()

    return jsonify({
        "message": "Order placed successfully",
        "order_id": order_id,
        "total_amount": total_amount
    }), 201


# ------------------------------
# GET USER ORDERS
# ------------------------------
@orders_bp.route("/user/<int:user_id>", methods=["GET"])
def get_user_orders(user_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM orders WHERE user_id=%s ORDER BY date DESC", (user_id,))
    orders = cursor.fetchall()

    order_list = []
    for order in orders:
        cursor.execute("""
            SELECT oi.product_id, p.name, oi.quantity, oi.price
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id=%s
        """, (order["id"],))
        items = cursor.fetchall()
        order_list.append({
            "order_id": order["id"],
            "total_amount": order["total_amount"],
            "date": order["date"],
            "items": items
        })
    conn.close()
    return jsonify(order_list), 200


# ------------------------------
# GET ALL ORDERS (ADMIN)
# ------------------------------
@orders_bp.route("/all", methods=["GET"])
def get_all_orders():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT o.id, u.fullname AS customer, o.total_amount, o.date
        FROM orders o
        JOIN users u ON o.user_id = u.id
        ORDER BY o.date DESC
    """)
    orders = cursor.fetchall()
    conn.close()
    return jsonify(orders), 200
