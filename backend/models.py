from database import get_connection

def get_all_products():
    conn = get_connection()
    products = conn.execute("SELECT * FROM products").fetchall()
    conn.close()
    return [dict(p) for p in products]

def get_product_by_id(product_id):
    conn = get_connection()
    product = conn.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
    conn.close()
    return dict(product) if product else None

def add_product(name, price, image, category, description):
    conn = get_connection()
    conn.execute(
        "INSERT INTO products (name, price, image, category, description) VALUES (?, ?, ?, ?, ?)",
        (name, price, image, category, description)
    )
    conn.commit()
    conn.close()
