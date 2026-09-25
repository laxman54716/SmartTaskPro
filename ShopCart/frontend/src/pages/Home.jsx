import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get('/products?limit=8'),
          api.get('/categories')
        ]);
        setFeatured(prodRes.data.data);
        setCategories(catRes.data.data);
      } catch (err) {
        console.error('Error fetching home data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="loading-screen">Loading...</div>;

  return (
    <div>
      {/* Hero Section */}
      <section style={{ 
        backgroundColor: 'var(--surface-alt)', 
        color: 'var(--text-main)', 
        padding: '6rem 2rem', 
        marginBottom: '5rem',
        textAlign: 'center',
        border: '1px solid var(--border-color)',
        backgroundImage: 'linear-gradient(to right, #EFEFE9, #F7F7F5)'
      }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: '500', marginBottom: '1rem', letterSpacing: '-0.04em' }}>ShopCart.</h1>
        <p style={{ fontSize: '1.25rem', marginBottom: '2.5rem', color: 'var(--text-secondary)' }}>Curated essentials for the modern lifestyle.</p>
        <Link to="/products" className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1rem' }}>
          Explore Collection
        </Link>
      </section>

      {/* Categories */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', fontWeight: 'bold' }}>Shop by Category</h2>
        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
          {categories.map(cat => (
            <Link 
              key={cat.id} 
              to={`/products?category=${cat.id}`}
              className="card"
              style={{ padding: '1.25rem 2.5rem', minWidth: '180px', textAlign: 'center', flex: '0 0 auto', border: '1px solid var(--border-color)', backgroundColor: 'transparent' }}
            >
              <h3 style={{ fontSize: '0.875rem', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cat.name}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', fontWeight: 'bold' }}>Featured Products</h2>
        <div className="product-grid">
          {featured.map(product => (
            <Link key={product.id} to={`/products/${product.id}`} className="card">
              <img src={product.image_url} alt={product.name} className="product-image" />
              <div className="product-info">
                <div className="product-category">{product.category_name}</div>
                <h3 className="product-title">{product.name}</h3>
                <div>
                  {product.discount_price ? (
                    <>
                      <span className="product-price">${product.discount_price}</span>
                      <span className="product-price-old">${product.price}</span>
                    </>
                  ) : (
                    <span className="product-price">${product.price}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Link to="/products" className="btn btn-outline" style={{ padding: '0.75rem 2rem' }}>
            View All Products
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
