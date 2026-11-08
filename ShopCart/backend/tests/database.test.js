const { db, createTestUser, createTestCategory, createTestProduct } = require('./helpers');

describe('Database Schema, Constraints & Integrity Audit', () => {
  let testUser, testCategory, testProduct;

  beforeAll(async () => {
    testUser = (await createTestUser({ email: `db_test_${Date.now()}@example.com` })).user;
    testCategory = await createTestCategory({ name: `DBCat_${Date.now()}` });
    testProduct = await createTestProduct({ category_id: testCategory.id });
  });

  describe('Constraints & Uniqueness', () => {
    it('1. User email unique constraint prevents duplicate emails', async () => {
      let threw = false;
      try {
        await db.query(
          `INSERT INTO users (first_name, last_name, email, password_hash)
           VALUES ('Dup', 'User', $1, 'somehash')`,
          [testUser.email]
        );
      } catch (err) {
        threw = true;
        expect(err.code).toBe('23505'); // unique_violation
      }
      expect(threw).toBe(true);
    });

    it('2. Category name unique constraint prevents duplicate names', async () => {
      let threw = false;
      try {
        await db.query(
          'INSERT INTO categories (name, description) VALUES ($1, $2)',
          [testCategory.name, 'duplicate']
        );
      } catch (err) {
        threw = true;
        expect(err.code).toBe('23505');
      }
      expect(threw).toBe(true);
    });

    it('3. Product SKU unique constraint prevents duplicate SKU', async () => {
      let threw = false;
      try {
        await db.query(
          `INSERT INTO products (name, price, stock_quantity, sku)
           VALUES ('Dup SKU', 10.00, 5, $1)`,
          [testProduct.sku]
        );
      } catch (err) {
        threw = true;
        expect(err.code).toBe('23505');
      }
      expect(threw).toBe(true);
    });

    it('4. Product price check constraint (price >= 0)', async () => {
      let threw = false;
      try {
        await db.query(
          `INSERT INTO products (name, price, stock_quantity, sku)
           VALUES ('Negative Price', -10.00, 5, $1)`,
          [`NEG-${Date.now()}`]
        );
      } catch (err) {
        threw = true;
        expect(err.code).toBe('23514'); // check_violation
      }
      expect(threw).toBe(true);
    });

    it('5. Product stock_quantity check constraint (stock_quantity >= 0)', async () => {
      let threw = false;
      try {
        await db.query(
          `INSERT INTO products (name, price, stock_quantity, sku)
           VALUES ('Negative Stock', 10.00, -5, $1)`,
          [`NEGSTK-${Date.now()}`]
        );
      } catch (err) {
        threw = true;
        expect(err.code).toBe('23514');
      }
      expect(threw).toBe(true);
    });

    it('6. Cart items unique compound constraint (cart_id, product_id)', async () => {
      const cartRes = await db.query('SELECT id FROM carts WHERE user_id = $1', [testUser.id]);
      const cartId = cartRes.rows[0].id;

      await db.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
      await db.query('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, 1)', [cartId, testProduct.id]);

      let threw = false;
      try {
        await db.query('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, 2)', [cartId, testProduct.id]);
      } catch (err) {
        threw = true;
        expect(err.code).toBe('23505');
      }
      expect(threw).toBe(true);
    });
  });

  describe('Foreign Keys & Cascading Deletes', () => {
    it('1. Deleting a cart cascades and deletes all its cart_items', async () => {
      const tempUser = (await createTestUser({ email: `cascade_user_${Date.now()}@example.com` })).user;
      const cartRes = await db.query('SELECT id FROM carts WHERE user_id = $1', [tempUser.id]);
      const cartId = cartRes.rows[0].id;

      await db.query('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, 3)', [cartId, testProduct.id]);

      // Delete cart
      await db.query('DELETE FROM carts WHERE id = $1', [cartId]);

      // Verify cart_items were cascaded
      const items = await db.query('SELECT * FROM cart_items WHERE cart_id = $1', [cartId]);
      expect(items.rows.length).toBe(0);
    });

    it('2. Deleting category sets product.category_id to NULL (ON DELETE SET NULL)', async () => {
      const tempCat = await createTestCategory();
      const tempProd = await createTestProduct({ category_id: tempCat.id });

      await db.query('DELETE FROM categories WHERE id = $1', [tempCat.id]);

      const prodCheck = await db.query('SELECT category_id FROM products WHERE id = $1', [tempProd.id]);
      expect(prodCheck.rows[0].category_id).toBeNull();
    });

    it('3. Trigger update_updated_at updates the updated_at timestamp automatically', async () => {
      const beforeTime = (await db.query('SELECT updated_at FROM products WHERE id = $1', [testProduct.id])).rows[0].updated_at;
      await new Promise(r => setTimeout(r, 20));

      await db.query('UPDATE products SET description = $1 WHERE id = $2', ['New Desc', testProduct.id]);
      const afterTime = (await db.query('SELECT updated_at FROM products WHERE id = $1', [testProduct.id])).rows[0].updated_at;

      expect(new Date(afterTime).getTime()).toBeGreaterThanOrEqual(new Date(beforeTime).getTime());
    });
  });
});

