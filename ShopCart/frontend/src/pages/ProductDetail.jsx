import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMsg, setCartMsg] = useState(null); // { type: 'success'|'error', text }
  const [imgSrc, setImgSrc] = useState(null);

  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data.data);
        setImgSrc(res.data.data.image_url || PLACEHOLDER);
      } catch (err) {
        setError('Product not found');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) return navigate('/login');
    setAddingToCart(true);
    const result = await addToCart(product.id, quantity);
    setAddingToCart(false);
    setCartMsg({ type: result.success ? 'success' : 'error', text: result.success ? 'Added to cart!' : result.message });
    if (result.success) setTimeout(() => setCartMsg(null), 3000);
  };

  if (loading) return <div className="loading-screen">Loading product...</div>;
  if (error || !product) return <div className="alert alert-error" style={{ margin: '4rem auto', maxWidth: '600px' }}>{error}</div>;

  const inStock = product.stock_quantity > 0;
  const savings = product.discount_price
    ? Math.round(((product.price - product.discount_price) / product.price) * 100)
    : null;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Breadcrumb */}
      <nav style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '2rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <Link to="/" style={{ color: 'var(--text-muted)' }}>Home</Link>
        <span>/</span>
        <Link to="/products" style={{ color: 'var(--text-muted)' }}>Products</Link>
        <span>/</span>
        <span style={{ color: 'var(--text-secondary)' }}>{product.category_name}</span>
        <span>/</span>
        <span style={{ color: 'var(--text-main)' }}>{product.name}</span>
      </nav>

      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '0', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)' }}>
        {/* Image */}
        <div style={{ flex: '1 1 420px', position: 'relative', background: 'var(--surface-alt)', overflow: 'hidden' }}>
          <img
            src={imgSrc}
            alt={product.name}
            onError={() => setImgSrc(PLACEHOLDER)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: '420px', display: 'block' }}
          />
          {savings && (
            <span style={{
              position: 'absolute', top: '16px', left: '16px',
              background: 'var(--primary-color)', color: '#fff',
              fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.08em',
              textTransform: 'uppercase', padding: '0.3rem 0.6rem'
            }}>
              Save {savings}%
            </span>
          )}
          {!inStock && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ color: '#fff', fontWeight: '700', fontSize: '1.1rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: '1 1 380px', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            {product.category_name}
          </span>

          <h1 style={{ fontSize: '1.75rem', fontWeight: '500', letterSpacing: '-0.02em', marginBottom: '1.25rem', lineHeight: 1.2 }}>
            {product.name}
          </h1>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {product.discount_price ? (
              <>
                <span style={{ fontSize: '1.75rem', fontWeight: '500' }}>${Number(product.discount_price).toFixed(2)}</span>
                <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>${Number(product.price).toFixed(2)}</span>
              </>
            ) : (
              <span style={{ fontSize: '1.75rem', fontWeight: '500' }}>${Number(product.price).toFixed(2)}</span>
            )}
          </div>

          {/* Description */}
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '2rem', fontSize: '0.9rem' }}>
            {product.description}
          </p>

          {/* Stock & SKU */}
          <div style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '1rem 0', marginBottom: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Availability</span>
              {inStock ? (
                <span style={{ color: 'var(--success-color)', fontWeight: '500' }}>
                  {product.stock_quantity < 10 ? `Only ${product.stock_quantity} left` : 'In stock'}
                </span>
              ) : (
                <span style={{ color: 'var(--error-color)', fontWeight: '500' }}>Out of stock</span>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>SKU</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{product.sku}</span>
            </div>
          </div>

          {/* Add to Cart */}
          {inStock && (!user || user.role === 'customer') && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
              {/* Qty */}
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)' }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ padding: '0.65rem 1rem', fontSize: '1rem', background: 'var(--surface-alt)' }}
                  disabled={quantity <= 1}
                >−</button>
                <input
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, Math.min(product.stock_quantity, parseInt(e.target.value) || 1)))}
                  style={{ width: '52px', textAlign: 'center', border: 'none', outline: 'none', fontSize: '0.9rem', background: 'transparent' }}
                  min="1" max={product.stock_quantity}
                />
                <button
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  style={{ padding: '0.65rem 1rem', fontSize: '1rem', background: 'var(--surface-alt)' }}
                  disabled={quantity >= product.stock_quantity}
                >+</button>
              </div>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleAddToCart}
                disabled={addingToCart}
              >
                {addingToCart ? 'Adding…' : 'Add to cart'}
              </button>
            </div>
          )}

          {cartMsg && (
            <div className={`alert alert-${cartMsg.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: 0 }}>
              {cartMsg.text}
            </div>
          )}

          {user && user.role === 'admin' && (
            <div className="alert alert-warning">Admin accounts cannot add items to cart.</div>
          )}

          {/* Free shipping notice */}
          {inStock && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
              🚚 Free shipping on orders over $50 · 30-day returns
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
