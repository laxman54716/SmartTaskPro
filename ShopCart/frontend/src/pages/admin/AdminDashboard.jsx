import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/dashboard');
        setStats(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="loading-screen">Loading dashboard...</div>;
  if (!stats) return <div className="alert alert-error">Failed to load dashboard</div>;

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Admin Dashboard</h1>
      
      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Revenue</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>${stats.total_revenue.toFixed(2)}</div>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Orders</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.total_orders}</div>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Customers</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.total_customers}</div>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Products</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.total_products}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Recent Orders */}
        <div className="card" style={{ flex: '1 1 500px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Recent Orders</h2>
            <Link to="/admin/orders" style={{ color: 'var(--primary-color)', fontSize: '0.875rem' }}>View All</Link>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>Order ID</th>
                  <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>Customer</th>
                  <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>Amount</th>
                  <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_orders.map(order => (
                  <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem 0.5rem' }}>#{order.order_number}</td>
                    <td style={{ padding: '1rem 0.5rem' }}>{order.first_name} {order.last_name}</td>
                    <td style={{ padding: '1rem 0.5rem' }}>${order.total}</td>
                    <td style={{ padding: '1rem 0.5rem', textTransform: 'capitalize', fontWeight: '500' }}>
                      <span style={{ color: order.order_status === 'delivered' ? 'var(--success-color)' : order.order_status === 'cancelled' ? 'var(--error-color)' : 'var(--warning-color)' }}>
                        {order.order_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card" style={{ flex: '1 1 300px', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Low Stock Alerts</h2>
          
          {stats.low_stock_products.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>All products have sufficient stock.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {stats.low_stock_products.map(product => (
                <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontWeight: '500' }}>{product.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>SKU: {product.sku}</div>
                  </div>
                  <div style={{ fontWeight: 'bold', color: product.stock_quantity === 0 ? 'var(--error-color)' : 'var(--warning-color)' }}>
                    {product.stock_quantity} left
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
