-- =====================================================
-- 🛒 SHOPSMART / SIMPLE ONLINE SHOPPING CART DATABASE
-- Database: shopping_cart
-- Author: Vinu (ShopSmart Project)
-- =====================================================

DROP DATABASE IF EXISTS shopping_cart;
CREATE DATABASE shopping_cart CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shopping_cart;

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  role ENUM('Admin','Customer') DEFAULT 'Customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample Users
INSERT INTO users (username, email, password, phone, address, role) VALUES
('admin', 'admin@shopsmart.com', 'admin123', '9876543210', 'ShopSmart HQ, Bengaluru', 'Admin'),
('vinu', 'vinu@example.com', 'vinu123', '9999999999', 'Rajajinagar, Bengaluru', 'Customer'),
('testuser', 'test@example.com', 'test123', '8888888888', 'Mysuru, Karnataka', 'Customer');

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  image VARCHAR(255),
  stock INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample Products
INSERT INTO products (name, description, category, price, image, stock) VALUES
-- Phones
('iPhone 14 Pro', 'Apple flagship smartphone with A16 Bionic chip', 'Phones', 129999, 'iphone14pro.jpg', 15),
('Samsung Galaxy S24', 'Samsung latest Android flagship', 'Phones', 99999, 'galaxy-s24.jpg', 20),
('OnePlus 12', 'Premium smartphone with Snapdragon 8 Gen 3', 'Phones', 74999, 'oneplus12.jpg', 25),

-- Laptops
('HP Pavilion 15', '15-inch laptop with Ryzen 5 and SSD', 'Laptops', 68999, 'hp-pavilion15.jpg', 10),
('MacBook Air M2', 'Apple laptop with M2 chip and Retina display', 'Laptops', 114999, 'macbook-air-m2.jpg', 8),
('Dell Inspiron 14', 'Intel i5 12th Gen, 8GB RAM, 512GB SSD', 'Laptops', 59999, 'dell-inspiron.jpg', 10),

-- Smartwatches
('Noise ColorFit Pro 4', 'Smartwatch with AMOLED display', 'Smartwatches', 4999, 'noise-watch.jpg', 30),
('Apple Watch Series 9', 'Smartwatch with ECG and health sensors', 'Smartwatches', 45999, 'apple-watch9.jpg', 15),

-- Audio
('Sony WH-1000XM5', 'Noise cancelling wireless headphones', 'Audio', 29999, 'sony-xm5.jpg', 10),
('Boat Airdopes 441', 'Wireless earbuds with deep bass', 'Audio', 2499, 'boat-441.jpg', 40),
('JBL Flip 6', 'Portable Bluetooth speaker', 'Audio', 9999, 'jbl-flip6.jpg', 20),

-- Accessories
('USB-C Fast Charger', '25W charger compatible with Android and iPhone', 'Accessories', 999, 'charger.jpg', 100),
('Wireless Mouse', 'Bluetooth ergonomic mouse', 'Accessories', 799, 'mouse.jpg', 50),
('Laptop Bag', 'Water-resistant laptop bag 15.6 inch', 'Accessories', 1499, 'bag.jpg', 30),

-- Fashion
('T-Shirt', 'Cotton round neck casual t-shirt', 'Fashion', 599, 'tshirt.jpg', 25),
('Sneakers', 'Stylish white sneakers for men', 'Fashion', 1499, 'sneakers.jpg', 15),
('Women Handbag', 'Leather handbag for daily use', 'Fashion', 2499, 'handbag.jpg', 12),
('Smart Jacket', 'Hooded waterproof jacket', 'Fashion', 3499, 'jacket.jpg', 8);

-- =====================================================
-- CART TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS cart (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT DEFAULT 1,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Sample cart (optional)
INSERT INTO cart (user_id, product_id, quantity) VALUES
(2, 1, 1),
(2, 3, 1);

-- =====================================================
-- ORDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  total_price DECIMAL(10,2),
  name VARCHAR(255),
  address TEXT,
  phone VARCHAR(20),
  status ENUM('Placed','Processing','Shipped','Delivered','Cancelled') DEFAULT 'Placed',
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sample order
INSERT INTO orders (user_id, total_price, name, address, phone, status)
VALUES (2, 74999.00, 'Vinu', 'Bengaluru', '9999999999', 'Placed');

-- =====================================================
-- ORDER ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(255),
  quantity INT DEFAULT 1,
  price DECIMAL(10,2),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Sample order item
INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
VALUES (1, 3, 'OnePlus 12', 1, 74999.00);

-- =====================================================
-- CONTACT / FEEDBACK TABLE (Optional)
-- =====================================================
CREATE TABLE contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(150),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- END OF SCRIPT
-- =====================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS role ENUM('Admin','Customer') DEFAULT 'Customer';
