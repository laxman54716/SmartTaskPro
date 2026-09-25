import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data.data);
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'delivered': return 'var(--success-color)';
      case 'cancelled': return 'var(--error-color)';
      case 'shipped': return '#3b82f6';
      default: return 'var(--warning-color)';
    }
  };

  if (loading) return <div className="loading-screen">Loading orders...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Order History</h1>
      
      {orders.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>You haven't placed any orders yet.</p>
          <Link to="/products" className="btn btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map(order => (
            <div key={order.id} className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>Order #{order.order_number}</h3>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{new Date(order.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>${order.total}</div>
                  <div className={`badge ${
                    order.order_status === 'delivered' ? 'badge-success' :
                    order.order_status === 'cancelled' ? 'badge-error' :
                    order.order_status === 'shipped' ? 'badge-info' :
                    'badge-warning'
                  }`}>
                    {order.order_status}
                  </div>
                </div>
              </div>
              
              <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '1rem 0' }}></div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Payment: {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Card'} ({order.payment_status})
                </span>
                <Link to={`/orders/${order.id}`} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>View Details</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
