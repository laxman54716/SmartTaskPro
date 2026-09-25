-- ShopCart Comprehensive Seed Data
-- ============================================

-- 1. USERS
-- Password used for all generated users: 'Password123!' 
-- Hash: $2a$10$kckVqP3.ZNwZI9r8DMlUeOb9KJrznnhMIo3xhmBceuv/Sw7C67Kx6

INSERT INTO users (id, first_name, last_name, email, password_hash, phone, role) VALUES
(1, 'Super', 'Admin', 'admin@shopcart.com', '$2a$10$kckVqP3.ZNwZI9r8DMlUeOb9KJrznnhMIo3xhmBceuv/Sw7C67Kx6', '9999999999', 'admin'),
(2, 'Alice', 'Smith', 'alice@example.com', '$2a$10$kckVqP3.ZNwZI9r8DMlUeOb9KJrznnhMIo3xhmBceuv/Sw7C67Kx6', '9876543210', 'customer'), -- Multiple orders, addresses
(3, 'Bob', 'Johnson', 'bob@example.com', '$2a$10$kckVqP3.ZNwZI9r8DMlUeOb9KJrznnhMIo3xhmBceuv/Sw7C67Kx6', '8765432109', 'customer'), -- 1 pending order
(4, 'Charlie', 'Brown', 'charlie@example.com', '$2a$10$kckVqP3.ZNwZI9r8DMlUeOb9KJrznnhMIo3xhmBceuv/Sw7C67Kx6', '7654321098', 'customer'), -- Cancelled order
(5, 'Diana', 'Prince', 'diana@example.com', '$2a$10$kckVqP3.ZNwZI9r8DMlUeOb9KJrznnhMIo3xhmBceuv/Sw7C67Kx6', '6543210987', 'customer'); -- No orders, empty cart

-- Adjust sequence for users
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- 2. CATEGORIES
INSERT INTO categories (id, name, description) VALUES
(1, 'Electronics', 'Gadgets and electronic devices'),
(2, 'Laptops', 'High-performance laptops for work and gaming'),
(3, 'Mobile Phones', 'Latest smartphones and accessories'),
(4, 'Accessories', 'Cables, chargers, cases, and more'),
(5, 'Home & Kitchen', 'Home appliances and kitchenware'),
(6, 'Clothing', 'Fashion apparel for men and women'),
(7, 'Footwear', 'Shoes, sneakers, and boots'),
(8, 'Books', 'Fiction, non-fiction, and educational materials'),
(9, 'Gaming', 'Consoles, video games, and gaming gear'),
(10, 'Office Supplies', 'Stationery and office essentials');

SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));

-- 3. PRODUCTS
-- Covering various edge cases and normal scenarios
INSERT INTO products (id, name, description, price, discount_price, category_id, image_url, stock_quantity, sku, is_active) VALUES
-- Normal Products
(1, 'iPhone 15 Pro', 'The latest Apple iPhone with A17 Pro chip and titanium design.', 999.00, 949.00, 3, 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500', 50, 'APPL-IP15P-01', true),
(2, 'Samsung Galaxy S24 Ultra', 'AI-powered Android smartphone with an incredible camera system.', 1199.99, NULL, 3, 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500', 40, 'SAMS-S24U-01', true),
(3, 'MacBook Pro 16"', 'M3 Max chip, 32GB RAM, 1TB SSD. Built for professionals.', 2499.99, 2399.99, 2, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500', 25, 'APPL-MBP16-01', true),
(4, 'Sony WH-1000XM5', 'Industry-leading noise canceling wireless headphones.', 398.00, 348.00, 1, 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500', 100, 'SONY-WH5-01', true),
(5, 'Nike Air Max 270', 'Comfortable everyday sneakers with signature Air Max heel.', 150.00, NULL, 7, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', 80, 'NIKE-AM270-01', true),

-- Edge Cases
-- Stock = 0 (Out of Stock)
(6, 'Nintendo Switch OLED', 'The versatile console with a vibrant OLED screen. Currently out of stock.', 349.99, NULL, 9, 'https://images.unsplash.com/photo-1578298751508-335129994c73?w=500', 0, 'NINT-SWOL-00', true),
-- Stock = 1 (Low Stock)
(7, 'Vintage Leather Jacket', 'One of a kind vintage motorcycle leather jacket.', 299.99, NULL, 6, 'https://images.unsplash.com/photo-1520975954732-57dd22299614?w=500', 1, 'VINT-LJ-01', true),
-- Very High Inventory
(8, 'Standard A4 Paper Ream', '500 sheets of standard multipurpose A4 printer paper.', 5.99, NULL, 10, 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500', 10000, 'OFFC-A4-01', true),
-- Minimum allowed price (0.00) / Free item
(9, 'ShopCart Promotional Sticker', 'A cool die-cut sticker of the ShopCart logo. Free for a limited time!', 0.00, NULL, 4, 'https://images.unsplash.com/photo-1572375992501-4b0892d50c69?w=500', 500, 'PROMO-STK-00', true),
-- Decimal price
(10, 'Artisan Coffee Beans', 'Freshly roasted single-origin Ethiopian Yirgacheffe coffee beans. 250g bag.', 14.57, NULL, 5, 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=500', 200, 'FOOD-COF-01', true),
-- Long description
(11, 'Ergonomic Office Chair Pro', 'Designed for 24/7 use, this chair features a highly adjustable lumbar support system that dynamically adapts to your posture. The breathable mesh back ensures optimal airflow during long working sessions, while the 4D armrests provide customized support for your arms and shoulders to prevent strain. With a heavy-duty aluminum base, smooth-rolling casters for both carpet and hard floors, and a synchronous tilt mechanism with tension control, this chair represents the pinnacle of ergonomic seating technology designed for the modern professional workspace.', 450.00, 399.99, 10, 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=500', 45, 'OFFC-CH-01', true),
-- Special characters in name/description
(12, '100% "Awesome" T-Shirt & Co.', 'This T-shirt is 50% cotton & 50% polyester! It features an @ symbol and a #hashtag on the back. Cost: < $25! 😊', 24.99, NULL, 6, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500', 120, 'CLTH-TS-SPL', true),
-- Missing optional fields (No discount, No image)
(13, 'Basic HDMI Cable 2m', 'Standard 2-meter HDMI 2.0 cable for 4K video.', 9.99, NULL, 4, NULL, 300, 'CABL-HDMI-2M', true);

SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));

-- 4. ADDRESSES
INSERT INTO addresses (id, user_id, label, address_line1, address_line2, city, state, postal_code, country, phone, is_default) VALUES
(1, 2, 'Home', '101 Palm Grove', 'Bandra West', 'Mumbai', 'Maharashtra', '400050', 'India', '9876543210', true),
(2, 2, 'Work', 'Tech Park, Building C', 'Andheri East', 'Mumbai', 'Maharashtra', '400093', 'India', '9876543211', false),
(3, 3, 'Home', '45 Brigade Road', 'Ashok Nagar', 'Bangalore', 'Karnataka', '560001', 'India', '8765432109', true),
(4, 4, 'Office', 'Tidel Park, 4th Floor', 'Taramani', 'Chennai', 'Tamil Nadu', '600113', 'India', '7654321098', true);

SELECT setval('addresses_id_seq', (SELECT MAX(id) FROM addresses));

-- 5. CARTS
INSERT INTO carts (id, user_id) VALUES
(1, 1),
(2, 2), -- Alice (empty, checked out recently)
(3, 3), -- Bob (1 item)
(4, 4), -- Charlie (Multiple items)
(5, 5); -- Diana (Multiple quantities, including low stock product)

SELECT setval('carts_id_seq', (SELECT MAX(id) FROM carts));

-- 6. CART ITEMS
INSERT INTO cart_items (cart_id, product_id, quantity) VALUES
-- Cart 3 (Bob)
(3, 4, 1), -- Sony WH-1000XM5
-- Cart 4 (Charlie)
(4, 8, 2), -- Standard A4 Paper
(4, 12, 1), -- T-Shirt
-- Cart 5 (Diana)
(5, 1, 1), -- iPhone
(5, 7, 1); -- Vintage Leather Jacket (stock is 1, so they have the last one in cart)

-- 7. ORDERS
INSERT INTO orders (id, user_id, order_number, subtotal, tax, shipping_fee, discount, total, shipping_address, payment_method, payment_status, order_status, notes, created_at) VALUES
-- Alice: Delivered order (Bought MacBook Pro and HDMI Cable)
-- subtotal: 2399.99 + 9.99 = 2409.98. Tax (8%): 192.80. Shipping: 0. Total: 2602.78
(1, 2, 'SC-LXYZ123-A1B2C3', 2409.98, 192.80, 0.00, 0.00, 2602.78, 
 '{"label":"Home","address_line1":"101 Palm Grove","address_line2":"Bandra West","city":"Mumbai","state":"Maharashtra","postal_code":"400050","country":"India","phone":"9876543210"}', 
 'card', 'paid', 'delivered', 'Please leave at reception', '2023-11-15 10:00:00'),

-- Alice: Shipped order (Bought iPhone)
-- subtotal: 949.00. Tax (8%): 75.92. Shipping: 0. Total: 1024.92
(2, 2, 'SC-LXYZ124-D4E5F6', 949.00, 75.92, 0.00, 0.00, 1024.92, 
 '{"label":"Work","address_line1":"Tech Park, Building C","address_line2":"Andheri East","city":"Mumbai","state":"Maharashtra","postal_code":"400093","country":"India","phone":"9876543211"}', 
 'card', 'paid', 'shipped', NULL, '2024-02-20 14:30:00'),

-- Bob: Pending order (Bought Artisan Coffee and Sticker)
-- subtotal: 14.57 + 0.00 = 14.57. Tax (8%): 1.17. Shipping: 5.99. Total: 21.73
(3, 3, 'SC-LXYZ125-G7H8I9', 14.57, 1.17, 5.99, 0.00, 21.73, 
 '{"label":"Home","address_line1":"45 Brigade Road","address_line2":"Ashok Nagar","city":"Bangalore","state":"Karnataka","postal_code":"560001","country":"India","phone":"8765432109"}', 
 'cod', 'pending', 'placed', 'Call before delivery', NOW()),

-- Charlie: Cancelled order (Bought Ergonomic Chair)
-- subtotal: 399.99. Tax (8%): 32.00. Shipping: 0. Total: 431.99
(4, 4, 'SC-LXYZ126-J0K1L2', 399.99, 32.00, 0.00, 0.00, 431.99, 
 '{"label":"Office","address_line1":"Tidel Park, 4th Floor","address_line2":"Taramani","city":"Chennai","state":"Tamil Nadu","postal_code":"600113","country":"India","phone":"7654321098"}', 
 'card', 'refunded', 'cancelled', 'Customer requested cancellation', '2024-01-10 09:15:00');

SELECT setval('orders_id_seq', (SELECT MAX(id) FROM orders));

-- 8. ORDER ITEMS
INSERT INTO order_items (order_id, product_id, product_name, product_image, quantity, unit_price, subtotal) VALUES
-- Order 1 (Alice)
(1, 3, 'MacBook Pro 16"', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500', 1, 2399.99, 2399.99),
(1, 13, 'Basic HDMI Cable 2m', NULL, 1, 9.99, 9.99),
-- Order 2 (Alice)
(2, 1, 'iPhone 15 Pro', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500', 1, 949.00, 949.00),
-- Order 3 (Bob)
(3, 10, 'Artisan Coffee Beans', 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=500', 1, 14.57, 14.57),
(3, 9, 'ShopCart Promotional Sticker', 'https://images.unsplash.com/photo-1572375992501-4b0892d50c69?w=500', 1, 0.00, 0.00),
-- Order 4 (Charlie)
(4, 11, 'Ergonomic Office Chair Pro', 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=500', 1, 399.99, 399.99);

