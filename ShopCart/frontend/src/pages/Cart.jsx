import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';

const Cart = () => {
  const { cart, loading, error, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  const handleQuantityChange = async (itemId, currentQty, newQty, stockQty) => {
    if (newQty < 1) return;
    if (newQty > stockQty) return alert(`Only ${stockQty} items available`);
    if (newQty === currentQty) return;
    await updateQuantity(itemId, newQty);
  };

  const handleRemove = async (itemId) => {
    if (window.confirm('Remove this item from cart?')) {
      await removeFromCart(itemId);
    }
  };

  const handleClear = async () => {
    if (window.confirm('Clear all items from your cart?')) {
      await clearCart();
    }
  };

  if (loading) return <div className="loading-screen">Loading cart...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '4rem auto' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Your Cart is Empty</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Looks like you haven't added anything to your cart yet.</p>
        <Link to="/products" className="btn btn-primary">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Shopping Cart</h1>
      
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Cart Items */}
        <div style={{ flex: '1 1 600px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '500' }}>{cart.item_count} {cart.item_count === 1 ? 'Item' : 'Items'}</span>
            <button onClick={handleClear} className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>Clear Cart</button>
          </div>
          
          {cart.items.map(item => (
            <div key={item.id} className="card" style={{ display: 'flex', padding: '1rem', gap: '1.5rem' }}>
              <Link to={`/products/${item.product_id}`} style={{ width: '100px', height: '100px', flexShrink: 0 }}>
                <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
              </Link>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Link to={`/products/${item.product_id}`}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>{item.name}</h3>
                  </Link>
                  <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>${item.item_subtotal.toFixed(2)}</div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <button 
                      onClick={() => handleQuantityChange(item.id, item.quantity, item.quantity - 1, item.stock_quantity)}
                      style={{ padding: '0.25rem 0.75rem', backgroundColor: 'var(--bg-color)' }}
                      disabled={item.quantity <= 1}
                    >-</button>
                    <input 
                      type="number" 
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.id, item.quantity, parseInt(e.target.value) || 1, item.stock_quantity)}
                      style={{ width: '40px', textAlign: 'center', border: 'none', outline: 'none' }}
                    />
                    <button 
                      onClick={() => handleQuantityChange(item.id, item.quantity, item.quantity + 1, item.stock_quantity)}
                      style={{ padding: '0.25rem 0.75rem', backgroundColor: 'var(--bg-color)' }}
                      disabled={item.quantity >= item.stock_quantity}
                    >+</button>
                  </div>
                  
                  <button onClick={() => handleRemove(item.id)} style={{ color: 'var(--error-color)', fontSize: '0.875rem' }}>
                    Remove
                  </button>
                </div>
                
                {!item.is_active && (
                  <div style={{ color: 'var(--error-color)', fontSize: '0.875rem', marginTop: '0.5rem' }}>This product is no longer available.</div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Order Summary */}
        <div className="card" style={{ flex: '1 1 300px', padding: '1.5rem', position: 'sticky', top: '100px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Order Summary</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
            <span>${cart.subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Tax (8%)</span>
            <span>${cart.tax.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Shipping</span>
            <span>{cart.shipping === 0 ? 'Free' : `$${cart.shipping.toFixed(2)}`}</span>
          </div>
          
          <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '1rem 0' }}></div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontWeight: 'bold', fontSize: '1.25rem' }}>
            <span>Total</span>
            <span>${cart.total.toFixed(2)}</span>
          </div>
          
          <button 
            onClick={() => navigate('/checkout')} 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
            disabled={cart.items.some(i => !i.is_active)}
          >
            Proceed to Checkout
          </button>
          
          {cart.items.some(i => !i.is_active) && (
            <div style={{ color: 'var(--error-color)', fontSize: '0.875rem', marginTop: '1rem', textAlign: 'center' }}>
              Please remove unavailable items before checkout.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;
