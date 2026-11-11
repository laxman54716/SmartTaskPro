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
(13, 'Basic HDMI Cable 2m', 'Standard 2-meter HDMI 2.0 cable for 4K video.', 9.99, NULL, 4, 'https://images.unsplash.com/photo-1605826832916-d0ea4b9f3e5f?w=500', 300, 'CABL-HDMI-2M', true),

-- Additional Products per Category (Electronics, Laptops, Mobile Phones, Accessories, Home & Kitchen, Books, Gaming, Office Supplies, Clothing, Footwear)
(14, 'Apple AirPods Pro 2', 'Active noise cancellation, Adaptive Transparency, Personalized Spatial Audio with dynamic head tracking. Up to 30 hours total battery life.', 249.00, 219.00, 1, 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500', 150, 'APPL-APP2-01', true),
(15, 'Samsung 65" QLED 4K TV', '65-inch QLED display with Quantum Processor 4K, 120Hz refresh rate, and Dolby Atmos sound. Smart TV with built-in streaming apps.', 1299.99, 1099.99, 1, 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=500', 20, 'SAMS-TV65-01', true),
(16, 'Kindle Paperwhite', 'The thinnest, lightest Kindle with adjustable warm light, waterproof, and 8 weeks of battery life. 6.8" display, 300 ppi.', 139.99, NULL, 1, 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=500', 200, 'AMZN-KPW-01', true),
(17, 'GoPro HERO12 Black', 'Shoot stunning 5.3K60 video and 27MP photos. HyperSmooth 6.0 stabilization, waterproof to 33ft, and 2.5-hour battery.', 399.99, 349.99, 1, 'https://images.unsplash.com/photo-1521405924368-64c5b84bec60?w=500', 60, 'GPRO-H12B-01', true),
(18, 'Dell XPS 15', 'Intel Core i9-13900H, 32GB DDR5 RAM, 1TB NVMe SSD, OLED 3.5K 60Hz display. Premium ultrabook built for creative professionals.', 1899.99, 1749.99, 2, 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=500', 30, 'DELL-XPS15-01', true),
(19, 'ASUS ROG Zephyrus G14', 'AMD Ryzen 9 7940HS, RTX 4060, 16GB RAM, 1TB SSD, 165Hz QHD display. The ultimate compact gaming laptop.', 1499.99, 1399.99, 2, 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500', 25, 'ASUS-ROG14-01', true),
(20, 'Microsoft Surface Pro 9', 'Intel Core i5, 16GB RAM, 256GB SSD. Detachable 2-in-1 with 13" PixelSense Flow display. Includes Type Cover.', 1299.00, NULL, 2, 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500', 40, 'MSFT-SP9-01', true),
(21, 'Lenovo ThinkPad X1 Carbon', '11th Gen Intel Core i7, 16GB RAM, 512GB SSD, 14" IPS display. Legendary ThinkPad durability with military-grade toughness.', 1399.00, 1249.00, 2, 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500', 35, 'LNVO-X1C-01', true),
(22, 'Anker 65W USB-C Charger', 'GaN technology compact 65W charger with 3 ports. Charge your laptop, phone and earbuds simultaneously. Universal compatibility.', 45.99, 39.99, 4, 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500', 300, 'ANKR-65W-01', true),
(23, 'Apple MagSafe Leather Wallet', 'Precision stitched top-grain leather with strong MagSafe attachment. Holds up to 3 cards and an ID. Fits iPhone 13/14/15 series.', 59.00, NULL, 4, 'https://images.unsplash.com/photo-1627123424574-724758594754?w=500', 180, 'APPL-MSW-01', true),
(24, 'Peak Design Phone Case', 'SlimLink mount built-in. Precision-molded polycarbonate with raised edges. Compatible with MagSafe and all Peak Design mounts.', 79.95, 69.95, 4, 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=500', 120, 'PKDS-PC-01', true),
(25, 'Logitech MX Master 3S', 'Ultra-fast 8K DPI tracking on glass, 70-day battery, USB-C quick charge, quiet clicks, MagSpeed scroll wheel. Mac and PC.', 99.99, 89.99, 4, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500', 90, 'LOGI-MXM3-01', true),
(26, 'Instant Pot Duo 7-in-1', 'Pressure cooker, slow cooker, rice cooker, steamer, sauté pan, food warmer, and sterilizer in one appliance. 6 quart capacity.', 89.99, 79.99, 5, 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=500', 70, 'INST-DUO7-01', true),
(27, 'Dyson V15 Detect Cordless', 'Laser dust detection, up to 60 mins run time, HEPA filtration, LCD screen showing particle counts. The most intelligent vacuum.', 749.99, 699.99, 5, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500', 25, 'DYSN-V15-01', true),
(28, 'Fellow Stagg EKG Pro Kettle', 'Variable temperature control, 60-minute hold mode, real-time brew stopwatch, matte black PCA coating. For the serious coffee enthusiast.', 199.00, NULL, 5, 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=500', 55, 'FLLW-EKG-01', true),
(29, 'IKEA KALLAX Shelf Unit', 'Versatile shelving that works as a room divider, TV unit, or storage. 4x4 cubes with optional inserts. 147x147cm, birch effect.', 229.00, NULL, 5, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500', 15, 'IKEA-KLX-01', true),
(30, 'Atomic Habits by James Clear', 'The #1 New York Times bestseller. An Easy & Proven Way to Build Good Habits & Break Bad Ones. Over 15 million copies sold worldwide.', 18.99, 14.99, 8, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500', 500, 'BOOK-AH-01', true),
(31, 'The Pragmatic Programmer', '20th Anniversary Edition. From Journeyman to Master. Essential reading for every software developer. Authors: David Thomas & Andrew Hunt.', 49.99, 39.99, 8, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500', 300, 'BOOK-PP-01', true),
(32, 'Dune by Frank Herbert', 'The bestselling science fiction novel of all time. Set in the distant future amidst a feudal interstellar society. Inspiration for the films.', 16.99, NULL, 8, 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=500', 400, 'BOOK-DN-01', true),
(33, 'The Design of Everyday Things', 'Don Norman''s classic guide to human-centered design. Required reading for UX designers, engineers, and product managers.', 24.99, 19.99, 8, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500', 250, 'BOOK-DET-01', true),
(34, 'PlayStation 5 Console', 'Play the best PS5 games with ray tracing, 4K-TV gaming, lightning-speed loading with ultra-high speed SSD, and 3D Audio.', 499.99, NULL, 9, 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500', 15, 'SONY-PS5-01', true),
(35, 'Xbox Series X', 'The fastest, most powerful Xbox ever. 12 teraflops of raw GPU performance, DirectX ray tracing, 4K gaming at up to 120 FPS.', 499.99, NULL, 9, 'https://images.unsplash.com/photo-1621259182978-7b98b0cad66f?w=500', 12, 'MSFT-XBSX-01', true),
(36, 'SteelSeries Arctis Nova Pro', 'Multi-system gaming headset with active noise cancellation, lossless 2.4GHz wireless, retractable ClearCast Gen 2 mic, and swappable batteries.', 349.99, 299.99, 9, 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=500', 45, 'STLS-ANP-01', true),
(37, 'Razer DeathAdder V3 Pro', 'Ultra-lightweight 63g wireless gaming mouse. 30K DPI Focus Pro optical sensor, 90-hour battery, and Razer HyperSpeed Wireless at 4000Hz polling.', 149.99, 129.99, 9, 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=500', 80, 'RZER-DAV3-01', true),
(38, 'Moleskine Classic Notebook', 'Hard cover, ruled pages, 240 pages, 13x21cm. The legendary notebook used by artists, writers, and thinkers. Available in black.', 22.00, NULL, 10, 'https://images.unsplash.com/photo-1531346680769-a1d79b57de5e?w=500', 600, 'MOLS-CLN-01', true),
(39, 'Pilot G2 Gel Pen Set (10pc)', 'The #1 selling pen in America. Retractable, refillable 0.7mm gel pens in 10 vibrant colors. Smooth writing, long lasting ink.', 12.99, NULL, 10, 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500', 1000, 'PLOT-G2S-01', true),
(40, '3M Post-it Super Sticky Notes', 'Super sticky notes that hold on where regular Post-it notes might not. 90 sheets per pad, 12-pack assorted colors, 3x3 inch.', 19.99, 16.99, 10, 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=500', 800, '3M-PSS-01', true),
(41, 'BenQ ScreenBar Halo Monitor Light', 'USB-powered LED monitor light bar with backglow. Asymmetric optical design eliminates screen glare. Auto-dimming brightness sensor.', 199.00, 179.00, 10, 'https://images.unsplash.com/photo-1593640408182-31c228fdc738?w=500', 50, 'BENQ-SBH-01', true),
(42, 'Levi''s 501 Original Jeans', 'The original blue jean since 1873. Straight leg, button fly, rigid denim that breaks in beautifully over time. Available in dark stonewash.', 69.50, NULL, 6, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500', 200, 'LEVI-501-01', true),
(43, 'Arc''teryx Atom LT Hoody', 'Coreloft Compact insulation, weather-resistant, packable to its own pocket. The essential midlayer for unpredictable mountain weather.', 299.00, 259.00, 6, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500', 50, 'ARCT-ALH-01', true),
(44, 'Uniqlo Ultra Light Down Jacket', '90% down filling, water-resistant DWR coating, packs into included carry pouch. Incredibly warm for its weight, minimalist design.', 89.90, 69.90, 6, 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500', 120, 'UNIQ-ULD-01', true),
(45, 'Adidas Ultraboost 23', 'BOOST midsole technology returns energy with every step. PRIMEKNIT+ upper wraps your foot like a sock. Continental rubber outsole for grip.', 190.00, 159.99, 7, 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500', 65, 'ADID-UB23-01', true),
(46, 'New Balance 574 Classic', 'An all-time classic sneaker in premium suede and mesh upper. ENCAP midsole cushioning, rubber outsole. The everyday sneaker done right.', 89.99, NULL, 7, 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=500', 90, 'NEWB-574-01', true),
(47, 'Timberland 6-Inch Premium Boots', 'Waterproof full-grain leather upper, insulated with PrimaLoft 200g, anti-fatigue technology footbed. Iconic design since 1973.', 198.00, 179.00, 7, 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=500', 40, 'TMBL-6IP-01', true),
(48, 'Google Pixel 8 Pro', 'Google Tensor G3 chip, 50MP camera with Magic Eraser, 7 years of OS updates, 6.7" Super Actua display. The smartest Pixel yet.', 999.00, 899.00, 3, 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500', 35, 'GOOG-PX8P-01', true),
(49, 'OnePlus 12', 'Snapdragon 8 Gen 3, Hasselblad camera system, 100W SUPERVOOC charging, 120Hz AMOLED display. Flagship killer returns.', 799.99, 729.99, 3, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500', 45, 'ONEP-12-01', true);

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

