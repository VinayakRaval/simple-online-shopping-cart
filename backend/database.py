import mysql.connector
from mysql.connector import Error
from datetime import datetime, timedelta

# CHANGE if your MySQL uses password: set here
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "",   # set it if you use a password
    "database": "shopping_cart",
    "autocommit": False,
}

def get_connection():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        print("DB connection error:", e)
        return None

def init_db():
    conn = get_connection()
    if conn is None:
        print("Failed to connect to DB --- create DB 'shopping_cart' first or update credentials.")
        return
    cursor = conn.cursor()
    # Users
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fullname VARCHAR(150),
      email VARCHAR(150) UNIQUE,
      phone VARCHAR(25) UNIQUE,
      password VARCHAR(255),
      otp_code VARCHAR(10),
      otp_expiry DATETIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
    """)
    # Products
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255),
      price DECIMAL(10,2),
      image VARCHAR(255),
      category VARCHAR(100),
      description TEXT
    ) ENGINE=InnoDB;
    """)
    # Cart
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cart (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      product_id INT,
      quantity INT DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
    """)
    # Orders
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      total_price DECIMAL(10,2),
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(50) DEFAULT 'Pending',
      address TEXT,
      name VARCHAR(150),
      phone VARCHAR(25),
      email VARCHAR(150),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
    """)
    # Order items
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT,
      product_id INT,
      quantity INT,
      price DECIMAL(10,2),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
    """)
    conn.commit()
    cursor.close()
    conn.close()
    print("✅ DB initialized (tables created if not exist).")
