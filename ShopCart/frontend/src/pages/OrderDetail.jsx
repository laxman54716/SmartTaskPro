import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data.data);
    } catch (err) {
      setError('Order not found');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    setCancelling(true);
    try {
      await api.put(`/orders/${id}/cancel`);
      await fetchOrder();
      alert('Order cancelled successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="loading-screen">Loading order details...</div>;
  if (error || !order) return <div className="alert alert-error">{error}</div>;

  const canCancel = ['placed', 'confirmed'].includes(order.order_status);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Link to="/orders" style={{ display: 'inline-block', marginBottom: '2rem', color: 'var(--text-muted)' }}>
        &larr; Back to Orders
      </Link>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Order #{order.order_number}</h1>
        {canCancel && (
          <button 
            onClick={handleCancel}
            disabled={cancelling}
            className="btn"
            style={{ backgroundColor: 'var(--error-color)', color: 'white' }}
          >
            {cancelling ? 'Cancelling...' : 'Cancel Order'}
          </button>
        )}
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Order Date</div>
            <div style={{ fontWeight: '500' }}>{new Date(order.created_at).toLocaleString()}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Order Status</div>
            <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{order.order_status}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Payment Method</div>
            <div style={{ fontWeight: '500' }}>{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Card'}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Payment Status</div>
            <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{order.payment_status}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div className="card" style={{ flex: '1 1 450px', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Items in Order</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {order.items.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: '1rem' }}>
                <img src={item.product_image} alt={item.product_name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                <div style={{ flex: 1 }}>
                  <Link to={`/products/${item.product_id}`} style={{ fontWeight: '500', display: 'block', marginBottom: '0.25rem' }}>{item.product_name}</Link>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Qty: {item.quantity} &times; ${item.unit_price}</div>
                </div>
                <div style={{ fontWeight: 'bold' }}>${item.subtotal}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Order Summary</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
              <span>${order.subtotal}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Tax</span>
              <span>${order.tax}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Shipping</span>
              <span>${order.shipping_fee}</span>
            </div>
            {parseFloat(order.discount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--success-color)' }}>
                <span>Discount</span>
                <span>-${order.discount}</span>
              </div>
            )}
            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '1rem 0' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.25rem' }}>
              <span>Total</span>
              <span>${order.total}</span>
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Shipping Address</h2>
            <div style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
              <strong>{order.shipping_address.label}</strong><br />
              {order.shipping_address.address_line1}<br />
              {order.shipping_address.address_line2 && <>{order.shipping_address.address_line2}<br /></>}
              {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}<br />
              {order.shipping_address.country}<br />
              {order.shipping_address.phone && `Phone: ${order.shipping_address.phone}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
