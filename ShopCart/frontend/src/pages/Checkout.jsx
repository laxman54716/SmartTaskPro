import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../hooks/useCart';

const Checkout = () => {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const { cart, fetchCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      navigate('/cart');
      return;
    }
    fetchAddresses();
  }, [cart, navigate]);

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/addresses');
      setAddresses(res.data.data);
      const defaultAddr = res.data.data.find(a => a.is_default);
      if (defaultAddr) setSelectedAddress(defaultAddr.id);
      else if (res.data.data.length > 0) setSelectedAddress(res.data.data[0].id);
    } catch (err) {
      setError('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) return setError('Please select a shipping address');
    
    setSubmitting(true);
    setError('');
    
    try {
      const res = await api.post('/orders', {
        address_id: selectedAddress,
        payment_method: paymentMethod
      });
      
      await fetchCart(); // refresh empty cart
      navigate(`/orders/${res.data.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-screen">Loading checkout...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Checkout</h1>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Shipping Address */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Shipping Address</h2>
            
            {addresses.length === 0 ? (
              <div>
                <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>No addresses found.</p>
                <button onClick={() => navigate('/addresses')} className="btn btn-outline">Add New Address</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {addresses.map(addr => (
                  <label key={addr.id} style={{ display: 'flex', gap: '1rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', backgroundColor: selectedAddress === addr.id ? 'var(--bg-color)' : 'transparent' }}>
                    <input 
                      type="radio" 
                      name="address" 
                      checked={selectedAddress === addr.id}
                      onChange={() => setSelectedAddress(addr.id)}
                      style={{ marginTop: '0.25rem' }}
                    />
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{addr.label}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                        {addr.address_line1} {addr.address_line2 && `, ${addr.address_line2}`}<br />
                        {addr.city}, {addr.state} {addr.postal_code}<br />
                        {addr.country}<br />
                        {addr.phone && `Phone: ${addr.phone}`}
                      </div>
                    </div>
                  </label>
                ))}
                <button onClick={() => navigate('/addresses')} className="btn btn-outline" style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}>Manage Addresses</button>
              </div>
            )}
          </div>
          
          {/* Payment Method */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Payment Method</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ display: 'flex', gap: '1rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', backgroundColor: paymentMethod === 'card' ? 'var(--bg-color)' : 'transparent' }}>
                <input 
                  type="radio" 
                  name="payment" 
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  style={{ marginTop: '0.25rem' }}
                />
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Credit / Debit Card</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>(Mock Payment - 90% Success Rate)</div>
                </div>
              </label>
              <label style={{ display: 'flex', gap: '1rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', backgroundColor: paymentMethod === 'cod' ? 'var(--bg-color)' : 'transparent' }}>
                <input 
                  type="radio" 
                  name="payment" 
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  style={{ marginTop: '0.25rem' }}
                />
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Cash on Delivery</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Pay when your order is delivered</div>
                </div>
              </label>
            </div>
          </div>
          
        </div>
        
        {/* Order Summary */}
        <div className="card" style={{ flex: '1 1 350px', padding: '1.5rem', position: 'sticky', top: '100px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Order Summary</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            {cart.items.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: '1rem' }}>
                <img src={item.image_url} alt={item.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '500', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Qty: {item.quantity} &times; ${item.effective_price.toFixed(2)}</div>
                </div>
                <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>${item.item_subtotal.toFixed(2)}</div>
              </div>
            ))}
          </div>
          
          <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '1rem 0' }}></div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
            <span>${cart.subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Tax (8%)</span>
            <span>${cart.tax.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Shipping</span>
            <span>{cart.shipping === 0 ? 'Free' : `$${cart.shipping.toFixed(2)}`}</span>
          </div>
          
          <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '1rem 0' }}></div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontWeight: 'bold', fontSize: '1.25rem' }}>
            <span>Total</span>
            <span>${cart.total.toFixed(2)}</span>
          </div>
          
          <button 
            onClick={handlePlaceOrder} 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
            disabled={submitting || !selectedAddress}
          >
            {submitting ? 'Processing...' : `Pay $${cart.total.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
