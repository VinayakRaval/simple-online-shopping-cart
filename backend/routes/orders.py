from flask import Blueprint, request, jsonify
from database import get_connection

orders_bp = Blueprint("orders", __name__)

# ✅ PLACE ORDER
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

    # Get user's cart items
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

    # Insert into orders
    cursor.execute("""
        INSERT INTO orders (user_id, total_price, status, date)
        VALUES (%s, %s, %s, NOW())
    """, (user_id, total, "Placed"))
    order_id = cursor.lastrowid

    # Insert items
    for item in items:
        cursor.execute("""
            INSERT INTO order_items (order_id, product_id, quantity, price)
            VALUES (%s, %s, %s, %s)
        """, (order_id, item["product_id"], item["quantity"], item["price"]))

    # Clear cart
    cursor.execute("DELETE FROM cart WHERE user_id=%s", (user_id,))
    db.commit()
    db.close()

    return jsonify({"message": "Order placed successfully", "order_id": order_id}), 200


# ✅ FETCH ALL ORDERS FOR A USER
@orders_bp.route("/<int:user_id>", methods=["GET"])
def get_orders(user_id):
    db = get_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT id AS order_id, total_price, status, date
        FROM orders
        WHERE user_id = %s
        ORDER BY date DESC
    """, (user_id,))
    orders = cursor.fetchall()

    for order in orders:
        cursor.execute("""
            SELECT oi.product_id, oi.quantity, oi.price, p.name, p.image
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = %s
        """, (order["order_id"],))
        order["items"] = cursor.fetchall()

    db.close()
    return jsonify(orders), 200


# ✅ FETCH SINGLE ORDER DETAILS
@orders_bp.route("/details/<int:order_id>", methods=["GET"])
def get_order_details(order_id):
    db = get_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("SELECT * FROM orders WHERE id = %s", (order_id,))
    order = cursor.fetchone()

    if not order:
        db.close()
        return jsonify({"error": "Order not found"}), 404

    cursor.execute("""
        SELECT oi.product_id, oi.quantity, oi.price, p.name, p.image
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = %s
    """, (order_id,))
    items = cursor.fetchall()

    db.close()
    order["items"] = items
    return jsonify(order), 200
