from flask import Blueprint, request, jsonify
from database import get_connection
from datetime import datetime

orders_bp = Blueprint("orders", __name__)

# ✅ PLACE ORDER (from Checkout Page)
@orders_bp.route("/place", methods=["POST"])
def place_order():
    data = request.get_json()
    user_id = data.get("user_id")
    name = data.get("name")
    address = data.get("address")
    phone = data.get("phone")

    if not all([user_id, name, address, phone]):
        return jsonify({"error": "Missing required fields"}), 400

    db = get_connection()
    cursor = db.cursor(dictionary=True)

    try:
        # ✅ Get all cart items
        cursor.execute("""
            SELECT c.product_id, c.product_name, c.price, c.quantity
            FROM cart c WHERE c.user_id=%s
        """, (user_id,))
        items = cursor.fetchall()

        if not items:
            db.close()
            return jsonify({"error": "Cart is empty"}), 400

        total = sum(i["price"] * i["quantity"] for i in items)

        # ✅ Insert into orders
        cursor.execute("""
            INSERT INTO orders (user_id, total_price, name, address, phone, status, order_date)
            VALUES (%s,%s,%s,%s,%s,%s,%s)
        """, (user_id, total, name, address, phone, "Placed", datetime.now()))
        order_id = cursor.lastrowid

        # ✅ Insert into order_items
        for i in items:
            cursor.execute("""
                INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
                VALUES (%s,%s,%s,%s,%s)
            """, (order_id, i["product_id"], i["product_name"], i["quantity"], i["price"]))

        # ✅ Clear cart after order placed
        cursor.execute("DELETE FROM cart WHERE user_id=%s", (user_id,))
        db.commit()

        return jsonify({"message": "Order placed successfully!", "order_id": order_id}), 201

    except Exception as e:
        print("Order Error:", e)
        db.rollback()
        return jsonify({"error": "Failed to place order"}), 500
    finally:
        db.close()


# ✅ FETCH ALL USER ORDERS
@orders_bp.route("/user/<int:user_id>", methods=["GET"])
def get_user_orders(user_id):
    db = get_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT id AS order_id, total_price, status, order_date
            FROM orders WHERE user_id=%s ORDER BY order_date DESC
        """, (user_id,))
        orders = cursor.fetchall()

        for o in orders:
            cursor.execute("""
                SELECT oi.product_id, oi.product_name, oi.quantity, oi.price, p.image
                FROM order_items oi
                JOIN products p ON oi.product_id=p.id
                WHERE oi.order_id=%s
            """, (o["order_id"],))
            o["items"] = cursor.fetchall()

        return jsonify(orders), 200
    except Exception as e:
        print("Orders fetch error:", e)
        return jsonify({"error": "Failed to load orders"}), 500
    finally:
        db.close()
