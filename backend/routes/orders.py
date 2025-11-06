from flask import Blueprint, request, jsonify
from database import get_connection
from datetime import datetime

orders_bp = Blueprint("orders", __name__, url_prefix="/api/orders")

# ✅ PLACE ORDER (from checkout)
@orders_bp.route("/place", methods=["POST"])
def place_order():
    data = request.get_json() or {}
    user_id = data.get("user_id")
    name = data.get("name")
    address = data.get("address")
    phone = data.get("phone")

    if not all([user_id, name, address, phone]):
        return jsonify({"error": "Missing required fields"}), 400

    db = get_connection()
    cursor = db.cursor(dictionary=True)

    try:
        # ✅ Get all items from cart
        cursor.execute("""
            SELECT c.product_id, p.name AS product_name, p.price, c.quantity
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id=%s
        """, (user_id,))
        items = cursor.fetchall()

        if not items:
            return jsonify({"error": "Cart is empty"}), 400

        total = sum(i["price"] * i["quantity"] for i in items)

        # ✅ Create order
        cursor.execute("""
            INSERT INTO orders (user_id, total_price, name, address, phone, status, order_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (user_id, total, name, address, phone, "Placed", datetime.now()))
        order_id = cursor.lastrowid

        # ✅ Add order_items
        for i in items:
            cursor.execute("""
                INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
                VALUES (%s, %s, %s, %s, %s)
            """, (order_id, i["product_id"], i["product_name"], i["quantity"], i["price"]))

        # ✅ Clear cart after placing
        cursor.execute("DELETE FROM cart WHERE user_id=%s", (user_id,))
        db.commit()

        return jsonify({"message": "Order placed successfully", "order_id": order_id}), 201

    except Exception as e:
        print("⚠️ Order Error:", e)
        db.rollback()
        return jsonify({"error": "Server error while placing order"}), 500
    finally:
        db.close()


# ✅ FETCH ALL ORDERS FOR A USER
@orders_bp.route("/user/<int:user_id>", methods=["GET"])
def get_user_orders(user_id):
    db = get_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT id AS order_id, total_price, status, order_date, name, address, phone
            FROM orders
            WHERE user_id=%s
            ORDER BY order_date DESC
        """, (user_id,))
        orders = cursor.fetchall()

        if not orders:
            return jsonify([])

        # Add items for each order
        for order in orders:
            cursor.execute("""
                SELECT oi.product_id, oi.product_name, oi.quantity, oi.price, p.image, p.category
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id=%s
            """, (order["order_id"],))
            order["items"] = cursor.fetchall()

        return jsonify(orders), 200

    except Exception as e:
        print("⚠️ My Orders Fetch Error:", e)
        return jsonify({"error": "Failed to load orders"}), 500
    finally:
        db.close()
