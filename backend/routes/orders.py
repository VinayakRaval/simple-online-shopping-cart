# routes/orders.py
from flask import Blueprint, request, jsonify
from database import get_connection
from datetime import datetime

orders_bp = Blueprint("orders", __name__)

# Helper: safe fetch product (with lock for update if needed)
def _get_product(cursor, product_id):
    cursor.execute("SELECT id, name, price, stock FROM products WHERE id=%s FOR UPDATE", (product_id,))
    return cursor.fetchone()

# ------------------------------
# POST /api/orders  -> Single product order (Buy Now)
# Body: { user_id, product_id, quantity (optional, default 1), name, address, phone }
# ------------------------------
@orders_bp.route("/", methods=["POST"])
def create_single_order():
    data = request.get_json() or {}
    user_id = data.get("user_id")
    product_id = data.get("product_id")
    qty = int(data.get("quantity", 1))
    name = data.get("name")
    address = data.get("address")
    phone = data.get("phone")

    if not all([user_id, product_id, name, address, phone]):
        return jsonify({"error": "Missing required fields (user_id, product_id, name, address, phone)"}), 400

    db = get_connection()
    cursor = db.cursor(dictionary=True)
    try:
        # start transaction
        # fetch product and verify stock
        prod = _get_product(cursor, product_id)
        if not prod:
            db.rollback()
            return jsonify({"error": "Product not found"}), 404

        if prod.get("stock") is not None and prod["stock"] < qty:
            db.rollback()
            return jsonify({"error": "Insufficient stock"}), 400

        # compute total
        total_price = float(prod["price"]) * qty

        # insert order
        now = datetime.now()
        cursor.execute("""
            INSERT INTO orders (user_id, total_price, name, address, phone, status, order_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (user_id, total_price, name, address, phone, "Placed", now))
        order_id = cursor.lastrowid

        # insert order_items
        cursor.execute("""
            INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
            VALUES (%s, %s, %s, %s, %s)
        """, (order_id, product_id, prod["name"], qty, prod["price"]))

        # decrement product stock if stock column exists
        if prod.get("stock") is not None:
            new_stock = prod["stock"] - qty
            if new_stock < 0:
                db.rollback()
                return jsonify({"error": "Insufficient stock (race)"}), 400
            cursor.execute("UPDATE products SET stock=%s WHERE id=%s", (new_stock, product_id))

        # update user phone (optional — saves phone)
        if phone:
            try:
                cursor.execute("UPDATE users SET phone=%s WHERE id=%s", (phone, user_id))
            except Exception:
                # don't fail the whole order if user update fails; just log
                print("Warning: failed to update user phone for user_id", user_id)

        db.commit()
        return jsonify({"message": "Order placed successfully", "order_id": order_id}), 201

    except Exception as e:
        print("Create single order error:", e)
        db.rollback()
        return jsonify({"error": "Server error placing order"}), 500
    finally:
        db.close()


# ------------------------------
# POST /api/orders/place  -> Checkout all items from cart for a user
# Body: { user_id, name, address, phone }
# ------------------------------
@orders_bp.route("/place", methods=["POST"])
def place_order_from_cart():
    data = request.get_json() or {}
    user_id = data.get("user_id")
    name = data.get("name")
    address = data.get("address")
    phone = data.get("phone")

    if not all([user_id, name, address, phone]):
        return jsonify({"error": "Missing required fields (user_id, name, address, phone)"}), 400

    db = get_connection()
    cursor = db.cursor(dictionary=True)
    try:
        # Lock cart rows + product rows as we go to avoid race conditions
        # Fetch cart items (join with products to get current price & stock)
        cursor.execute("""
            SELECT c.id AS cart_id, c.product_id, c.quantity,
                   p.name AS product_name, p.price AS product_price, p.stock as product_stock
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = %s
            FOR UPDATE
        """, (user_id,))
        items = cursor.fetchall()

        if not items:
            db.rollback()
            return jsonify({"error": "Cart is empty"}), 400

        # Validate stock and compute total
        total = 0.0
        for it in items:
            qty = int(it["quantity"])
            price = float(it["product_price"])
            stock = it.get("product_stock")
            if stock is not None and stock < qty:
                db.rollback()
                return jsonify({"error": f"Insufficient stock for product '{it['product_name']}'"}), 400
            total += price * qty

        # Insert order
        now = datetime.now()
        cursor.execute("""
            INSERT INTO orders (user_id, total_price, name, address, phone, status, order_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (user_id, total, name, address, phone, "Placed", now))
        order_id = cursor.lastrowid

        # Insert order_items and decrement product stock
        for it in items:
            pid = it["product_id"]
            pname = it["product_name"]
            qty = int(it["quantity"])
            price = float(it["product_price"])
            cursor.execute("""
                INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
                VALUES (%s, %s, %s, %s, %s)
            """, (order_id, pid, pname, qty, price))

            # decrement stock
            if it.get("product_stock") is not None:
                new_stock = it["product_stock"] - qty
                if new_stock < 0:
                    db.rollback()
                    return jsonify({"error": f"Insufficient stock for product '{pname}' (race)"}), 400
                cursor.execute("UPDATE products SET stock=%s WHERE id=%s", (new_stock, pid))

        # Clear cart
        cursor.execute("DELETE FROM cart WHERE user_id=%s", (user_id,))

        # Save phone on users table (best-effort)
        try:
            cursor.execute("UPDATE users SET phone=%s WHERE id=%s", (phone, user_id))
        except Exception:
            print("Warning: could not update user phone", user_id)

        db.commit()
        return jsonify({"message": "Order placed successfully", "order_id": order_id}), 201

    except Exception as e:
        print("Place order from cart error:", e)
        db.rollback()
        return jsonify({"error": "Server error placing order"}), 500
    finally:
        db.close()


# ------------------------------
# GET /api/orders/list/<user_id>  -> Fetch user's orders with items
# ------------------------------
@orders_bp.route("/list/<int:user_id>", methods=["GET"])
def list_user_orders(user_id):
    db = get_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT id AS order_id, total_price, status, order_date, name, address, phone
            FROM orders
            WHERE user_id = %s
            ORDER BY order_date DESC
        """, (user_id,))
        orders = cursor.fetchall() or []

        for o in orders:
            cursor.execute("""
                SELECT oi.product_id, oi.product_name, oi.quantity, oi.price, p.image
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = %s
            """, (o["order_id"],))
            o["items"] = cursor.fetchall() or []

        return jsonify(orders), 200
    except Exception as e:
        print("List user orders error:", e)
        return jsonify({"error": "Failed to load orders"}), 500
    finally:
        db.close()
