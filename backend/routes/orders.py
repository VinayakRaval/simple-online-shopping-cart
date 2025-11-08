from flask import Blueprint, request, jsonify
from database import get_connection
from datetime import datetime

orders_bp = Blueprint("orders", __name__)

# --------------------------
# Helper: Get product safely
# --------------------------
def _get_product(cursor, product_id):
    cursor.execute("SELECT id, name, price, stock FROM products WHERE id=%s", (product_id,))
    return cursor.fetchone()


# --------------------------
# 🛒 Create single product order (Buy Now)
# --------------------------
@orders_bp.route("/", methods=["POST"])
def create_single_order():
    data = request.get_json() or {}
    user_id = data.get("user_id")
    product_id = data.get("product_id")
    quantity = int(data.get("quantity", 1))
    name = data.get("name")
    address = data.get("address")
    phone = data.get("phone")

    if not all([user_id, product_id, name, address, phone]):
        return jsonify({"error": "Missing required fields"}), 400

    db = get_connection()
    cur = db.cursor(dictionary=True)

    try:
        product = _get_product(cur, product_id)
        if not product:
            return jsonify({"error": "Product not found"}), 404

        if product.get("stock") is not None and product["stock"] < quantity:
            return jsonify({"error": "Insufficient stock"}), 400

        total_price = float(product["price"]) * quantity

        cur.execute("""
            INSERT INTO orders (user_id, total_price, name, address, phone, status, order_date)
            VALUES (%s, %s, %s, %s, %s, %s, NOW())
        """, (user_id, total_price, name, address, phone, "Placed"))
        order_id = cur.lastrowid

        cur.execute("""
            INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
            VALUES (%s, %s, %s, %s, %s)
        """, (order_id, product_id, product["name"], quantity, product["price"]))

        # Update stock if product has stock column
        if product.get("stock") is not None:
            new_stock = product["stock"] - quantity
            cur.execute("UPDATE products SET stock=%s WHERE id=%s", (new_stock, product_id))

        db.commit()
        return jsonify({"message": "Order placed successfully", "order_id": order_id}), 201

    except Exception as e:
        print("Single order error:", e)
        db.rollback()
        return jsonify({"error": "Server error placing order"}), 500
    finally:
        db.close()


# --------------------------
# 🛒 Checkout: place all cart items (from user's cart)
# --------------------------
@orders_bp.route("/place", methods=["POST"])
def place_order():
    data = request.get_json() or {}
    user_id = data.get("user_id")

    if not user_id:
        return jsonify({"error": "Please log in as a user!"}), 401

    db = get_connection()
    cur = db.cursor(dictionary=True)

    try:
        cur.execute("""
            SELECT c.product_id, c.quantity, p.price
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = %s
        """, (user_id,))
        cart_items = cur.fetchall()

        if not cart_items:
            return jsonify({"error": "Your cart is empty!"}), 400

        total = sum(i["quantity"] * i["price"] for i in cart_items)

        cur.execute("""
            INSERT INTO orders (user_id, total_price, status, order_date)
            VALUES (%s, %s, %s, NOW())
        """, (user_id, total, "Pending"))
        order_id = cur.lastrowid

        for item in cart_items:
            cur.execute("""
                INSERT INTO order_items (order_id, product_id, quantity, price)
                VALUES (%s, %s, %s, %s)
            """, (order_id, item["product_id"], item["quantity"], item["price"]))

        cur.execute("DELETE FROM cart WHERE user_id=%s", (user_id,))
        db.commit()

        return jsonify({"message": "Order placed successfully", "order_id": order_id}), 200

    except Exception as e:
        print("Place order error:", e)
        db.rollback()
        return jsonify({"error": "Server error placing order"}), 500
    finally:
        db.close()


# --------------------------
# 📦 Get all orders of a user
# --------------------------
@orders_bp.route("/list/<int:user_id>", methods=["GET"])
def list_user_orders(user_id):
    db = get_connection()
    cur = db.cursor(dictionary=True)

    try:
        cur.execute("""
            SELECT id AS order_id, total_price, status, order_date, name, address, phone
            FROM orders
            WHERE user_id = %s
            ORDER BY order_date DESC
        """, (user_id,))
        orders = cur.fetchall() or []

        for o in orders:
            cur.execute("""
                SELECT oi.product_id, oi.product_name, oi.quantity, oi.price, p.image
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = %s
            """, (o["order_id"],))
            o["items"] = cur.fetchall() or []

        return jsonify(orders), 200
    except Exception as e:
        print("List orders error:", e)
        return jsonify({"error": "Failed to load orders"}), 500
    finally:
        db.close()
