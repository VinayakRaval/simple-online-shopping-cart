# helper DB functions used by routes
from database import get_connection

def get_all_products():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM products ORDER BY id DESC")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows

def get_product_by_id(product_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM products WHERE id=%s", (product_id,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    return row

def add_product(name, price, image, category, description):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO products (name, price, image, category, description) VALUES (%s,%s,%s,%s,%s)",
                   (name, price, image, category, description))
    conn.commit()
    cursor.close()
    conn.close()
