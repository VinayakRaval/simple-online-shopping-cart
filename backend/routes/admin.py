from flask import Blueprint, jsonify
from database import get_connection

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

@admin_bp.route("/dashboard", methods=["GET"])
def dashboard_overview():
    db = get_connection()
    cursor = db.cursor(dictionary=True)
    try:
        # Total counts
        cursor.execute("SELECT COUNT(*) AS total_users FROM users")
        total_users = cursor.fetchone()["total_users"]

        cursor.execute("SELECT COUNT(*) AS total_products FROM products")
        total_products = cursor.fetchone()["total_products"]

        cursor.execute("SELECT COUNT(*) AS total_orders FROM orders")
        total_orders = cursor.fetchone()["total_orders"]

        cursor.execute("SELECT IFNULL(SUM(total_price), 0) AS total_sales FROM orders")
        total_sales = float(cursor.fetchone()["total_sales"])

        # Top 5 selling products
        cursor.execute("""
            SELECT p.name, SUM(oi.quantity) AS total_sold,
                   ROUND(SUM(oi.quantity * oi.price),2) AS revenue
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            GROUP BY p.id
            ORDER BY total_sold DESC
            LIMIT 5
        """)
        top_products = cursor.fetchall()

        # Low stock
        cursor.execute("SELECT name, stock FROM products WHERE stock <= 5 ORDER BY stock ASC")
        low_stock = cursor.fetchall()

        # Recent orders
        cursor.execute("""
            SELECT o.id, u.username AS user, o.total_price, o.status, o.order_date
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.order_date DESC
            LIMIT 5
        """)
        recent_orders = cursor.fetchall()

        return jsonify({
            "total_users": total_users,
            "total_products": total_products,
            "total_orders": total_orders,
            "total_sales": total_sales,
            "top_products": top_products,
            "low_stock": low_stock,
            "recent_orders": recent_orders
        })
    except Exception as e:
        print("⚠️ Admin Dashboard Error:", e)
        return jsonify({"error": "Failed to load dashboard"}), 500
    finally:
        db.close()
