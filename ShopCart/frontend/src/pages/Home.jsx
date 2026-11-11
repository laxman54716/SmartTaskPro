import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

// Category icon mapping - simple emoji that feels human
const CATEGORY_ICONS = {
  'Electronics': '⚡',
  'Laptops': '💻',
  'Mobile Phones': '📱',
  'Accessories': '🎒',
  'Home & Kitchen': '🏠',
  'Clothing': '👕',
  'Footwear': '👟',
  'Books': '📚',
  'Gaming': '🎮',
  'Office Supplies': '📎',
};

const PLACEHOLDER = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500';

const ProductCard = ({ product }) => {
  const [imgSrc, setImgSrc] = useState(product.image_url || PLACEHOLDER);
  const savings = product.discount_price
    ? Math.round(((product.price - product.discount_price) / product.price) * 100)
    : null;

  return (
    <Link to={`/products/${product.id}`} className="home-product-card">
      <div className="home-product-img-wrap">
        <img
          src={imgSrc}
          alt={product.name}
          onError={() => setImgSrc(PLACEHOLDER)}
          className="home-product-img"
        />
        {savings && <span className="home-product-badge">-{savings}%</span>}
        {product.stock_quantity === 0 && (
          <span className="home-product-badge home-product-badge--oos">Out of stock</span>
        )}
      </div>
      <div className="home-product-body">
        <span className="home-product-cat">{product.category_name}</span>
        <h3 className="home-product-name">{product.name}</h3>
        <div className="home-product-pricing">
          {product.discount_price ? (
            <>
              <span className="home-price-now">${Number(product.discount_price).toFixed(2)}</span>
              <span className="home-price-was">${Number(product.price).toFixed(2)}</span>
            </>
          ) : (
            <span className="home-price-now">${Number(product.price).toFixed(2)}</span>
          )}
        </div>
      </div>
    </Link>
  );
};

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes, newRes] = await Promise.all([
          api.get('/products?limit=8&sort=price_desc'),
          api.get('/categories'),
          api.get('/products?limit=4&sort=newest'),
        ]);
        setFeatured(prodRes.data.data);
        setCategories(catRes.data.data);
        setNewArrivals(newRes.data.data);
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
    <div className="home-root">

      {/* ── Hero (full-bleed via negative margin) ──────────────────── */}
      <section className="home-hero" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', marginTop: '-3rem' }}>
        <div className="home-hero-inner">
          <p className="home-hero-eyebrow">Free shipping on orders over $50</p>
          <h1 className="home-hero-title">
            Everything you need,<br />nothing you don't.
          </h1>
          <p className="home-hero-sub">
            Carefully sourced electronics, fashion, books and more — all in one place.
          </p>
          <div className="home-hero-actions">
            <Link to="/products" className="btn btn-primary">Shop now</Link>
            <Link to="/products?category=1" className="btn btn-outline">Browse electronics</Link>
          </div>
        </div>
        <div className="home-hero-marquee-wrap" aria-hidden="true">
          <div className="home-hero-marquee">
            {[...categories, ...categories].map((c, i) => (
              <span key={i} className="home-hero-marquee-item">
                {CATEGORY_ICONS[c.name] || '•'} {c.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Category strip ─────────────────────────────────────────── */}
      <section className="home-section">
        <div className="home-section-head">
          <h2 className="home-section-title">Shop by category</h2>
        </div>
        <div className="home-cat-grid">
          {categories.map(cat => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.id}`}
              className="home-cat-card"
            >
              <span className="home-cat-icon">{CATEGORY_ICONS[cat.name] || '🛍'}</span>
              <span className="home-cat-name">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured / Best sellers ────────────────────────────────── */}
      <section className="home-section">
        <div className="home-section-head">
          <h2 className="home-section-title">Best sellers</h2>
          <Link to="/products?sort=price_desc" className="home-section-link">View all →</Link>
        </div>
        <div className="home-product-grid">
          {featured.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* ── Promo banner ───────────────────────────────────────────── */}
      <section className="home-promo">
        <div className="home-promo-inner">
          <span className="home-promo-tag">Limited time</span>
          <h2 className="home-promo-title">Up to 30% off selected items</h2>
          <p className="home-promo-sub">Deals refreshed every week. Don't miss out.</p>
          <Link to="/products" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
            See all deals
          </Link>
        </div>
      </section>

      {/* ── New arrivals ───────────────────────────────────────────── */}
      <section className="home-section">
        <div className="home-section-head">
          <h2 className="home-section-title">Just arrived</h2>
          <Link to="/products?sort=newest" className="home-section-link">More →</Link>
        </div>
        <div className="home-product-grid home-product-grid--4">
          {newArrivals.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* ── Trust bar ──────────────────────────────────────────────── */}
      <section className="home-trust">
        {[
          { icon: '🚚', title: 'Free delivery', sub: 'On orders over $50' },
          { icon: '↩️', title: '30-day returns', sub: 'Hassle-free, no questions asked' },
          { icon: '🔒', title: 'Secure checkout', sub: 'Your data stays private' },
          { icon: '🤝', title: '24/7 support', sub: 'Real humans, quick replies' },
        ].map(item => (
          <div key={item.title} className="home-trust-item">
            <span className="home-trust-icon">{item.icon}</span>
            <div>
              <p className="home-trust-title">{item.title}</p>
              <p className="home-trust-sub">{item.sub}</p>
            </div>
          </div>
        ))}
      </section>

    </div>
  );
};

export default Home;
