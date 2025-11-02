import mysql.connector
from mysql.connector import Error

# ⚙️ MySQL connection settings (change if needed)
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',  # keep empty if no password
    'database': 'shopping_cart'
}


def get_connection():
    """Establish and return MySQL database connection."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        print("Database connection error:", e)
        return None


def init_db():
    """Initialize database tables if not exist."""
    conn = get_connection()
    if conn is None:
        print("❌ Failed to connect to database")
        return

    cursor = conn.cursor()

    # ✅ USERS table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) UNIQUE NOT NULL,
            email VARCHAR(150) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            phone VARCHAR(15)
        )
    ''')

    # ✅ PRODUCTS table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            image VARCHAR(255),
            category VARCHAR(100),
            description TEXT
        )
    ''')

    # ✅ CART table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cart (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            product_id INT,
            quantity INT DEFAULT 1,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
    ''')

    # ✅ ORDERS table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            total_price DECIMAL(10,2),
            date DATETIME,
            status VARCHAR(50) DEFAULT 'Pending',
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')

    # ✅ ORDER ITEMS table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT,
            product_id INT,
            quantity INT,
            price DECIMAL(10,2),
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
    ''')

    conn.commit()
    conn.close()
    print("✅ Database initialized successfully!")
