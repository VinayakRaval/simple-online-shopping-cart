from flask import Blueprint, jsonify, request
from database import get_connection

admin_orders_bp = Blueprint("admin_orders", __name__, url_prefix="/api/admin/orders")

@admin_orders_bp.route("", methods=["GET"])
def get_all_orders():
    db = get_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT o.id, o.user_id, o.total, o.status, o.order_date,
                   u.username, u.phone
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            ORDER BY o.id DESC
        """)
        orders = cursor.fetchall()
        return jsonify(orders)
    except Exception as e:
        print("⚠️ Fetch Orders Error:", e)
        return jsonify({"error": "Failed to fetch orders"}), 500
    finally:
        db.close()

@admin_orders_bp.route("/<int:order_id>", methods=["PUT"])
def update_order_status(order_id):
    data = request.get_json()
    new_status = data.get("status")
    if not new_status:
        return jsonify({"error": "Missing status"}), 400

    db = get_connection()
    cursor = db.cursor()
    try:
        cursor.execute("UPDATE orders SET status=%s WHERE id=%s", (new_status, order_id))
        db.commit()
        return jsonify({"message": "Order updated"}), 200
    except Exception as e:
        print("⚠️ Update Order Error:", e)
        db.rollback()
        return jsonify({"error": "Failed to update order"}), 500
    finally:
        db.close()

@admin_orders_bp.route("/<int:order_id>", methods=["DELETE"])
def delete_order(order_id):
    db = get_connection()
    cursor = db.cursor()
    try:
        cursor.execute("DELETE FROM orders WHERE id=%s", (order_id,))
        db.commit()
        return jsonify({"message": "Order deleted"}), 200
    except Exception as e:
        print("⚠️ Delete Order Error:", e)
        db.rollback()
        return jsonify({"error": "Failed to delete order"}), 500
    finally:
        db.close()
