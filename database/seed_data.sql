CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total REAL NOT NULL,
    address TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
-- seed_data.sql

DROP TABLE IF EXISTS products;

CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT,
    image TEXT NOT NULL
);

INSERT INTO products (name, category, price, description, image) VALUES
('OnePlus 9', 'Phones', 49999, 'OnePlus 9 with Snapdragon 888, 8GB RAM, 128GB Storage', 'oneplus9.jpg'),
('iPhone 14', 'Phones', 79999, 'Apple iPhone 14 with A15 Bionic Chip, 128GB Storage', 'iphone14.jpg'),
('Samsung Galaxy S23', 'Phones', 74999, 'Samsung Galaxy S23 with Snapdragon 8 Gen 2, 256GB Storage', 'galaxy_s23.jpg'),

('Dell XPS 13', 'Laptops', 99999, 'Dell XPS 13 with Intel i7, 16GB RAM, 512GB SSD', 'dell_xps13.jpg'),
('MacBook Air M2', 'Laptops', 114999, 'Apple MacBook Air M2 with 8GB RAM, 256GB SSD', 'macbook_air.jpg'),
('HP Pavilion 15', 'Laptops', 64999, 'HP Pavilion 15 with Ryzen 7, 16GB RAM, 512GB SSD', 'hp_pavilion.jpg'),

('Apple AirPods Pro', 'Accessories', 24999, 'Apple AirPods Pro with Active Noise Cancellation', 'airpods.jpg'),
('Samsung Galaxy Buds', 'Accessories', 9999, 'Samsung Galaxy Buds with Noise Reduction', 'galaxy_buds.jpg'),
('Logitech Mouse', 'Accessories', 1999, 'Logitech Wireless Mouse M235', 'logitech_mouse.jpg'),
('SanDisk 64GB PenDrive', 'Accessories', 799, 'SanDisk Ultra 64GB USB 3.0 Pen Drive', 'sandisk_64gb.jpg');
