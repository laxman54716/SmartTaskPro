import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data.data);
      } catch (err) {
        setError('Product not found');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      return navigate('/login');
    }
    
    setAddingToCart(true);
    const result = await addToCart(product.id, quantity);
    setAddingToCart(false);
    
    if (result.success) {
      alert('Product added to cart!');
    } else {
      alert(result.message);
    }
  };

  if (loading) return <div className="loading-screen">Loading product...</div>;
  if (error || !product) return <div className="alert alert-error" style={{ margin: '4rem auto', maxWidth: '600px' }}>{error}</div>;

  const inStock = product.stock_quantity > 0;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <Link to="/products" style={{ display: 'inline-block', marginBottom: '2rem', color: 'var(--text-muted)' }}>
        &larr; Back to Products
      </Link>
      
      <div className="card" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', overflow: 'visible' }}>
        <div style={{ flex: '1 1 400px' }}>
          <img 
            src={product.image_url} 
            alt={product.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: '400px' }} 
          />
        </div>
        
        <div style={{ flex: '1 1 400px', padding: '3rem 2rem' }}>
          <div className="product-category" style={{ fontSize: '1rem' }}>{product.category_name}</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>{product.name}</h1>
          
          <div style={{ marginBottom: '1.5rem' }}>
            {product.discount_price ? (
              <>
                <span className="product-price" style={{ fontSize: '2rem' }}>${product.discount_price}</span>
                <span className="product-price-old" style={{ fontSize: '1.25rem' }}>${product.price}</span>
              </>
            ) : (
              <span className="product-price" style={{ fontSize: '2rem' }}>${product.price}</span>
            )}
          </div>
          
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.7 }}>
            {product.description}
          </p>
          
          <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: '500' }}>Availability:</span>
              {inStock ? (
                <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>In Stock ({product.stock_quantity})</span>
              ) : (
                <span style={{ color: 'var(--error-color)', fontWeight: 'bold' }}>Out of Stock</span>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '500' }}>SKU:</span>
              <span style={{ color: 'var(--text-muted)' }}>{product.sku}</span>
            </div>
          </div>
          
          {inStock && (!user || user.role === 'customer') && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-color)' }}
                  disabled={quantity <= 1}
                >-</button>
                <input 
                  type="number" 
                  value={quantity} 
                  onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock_quantity, parseInt(e.target.value) || 1)))}
                  style={{ width: '60px', textAlign: 'center', border: 'none', outline: 'none' }}
                  min="1"
                  max={product.stock_quantity}
                />
                <button 
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-color)' }}
                  disabled={quantity >= product.stock_quantity}
                >+</button>
              </div>
              
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '0.85rem' }}
                onClick={handleAddToCart}
                disabled={addingToCart}
              >
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          )}
          
          {user && user.role === 'admin' && (
            <div className="alert alert-warning">
              Admin users cannot add items to cart.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
