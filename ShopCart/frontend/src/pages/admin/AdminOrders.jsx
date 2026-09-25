import { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, search]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = `/admin/orders?page=${page}&limit=15`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (search) url += `&search=${search}`;
      
      const res = await api.get(url);
      setOrders(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await api.put(`/admin/orders/${orderId}/status`, { order_status: newStatus });
      // Update local state without fetching all
      setOrders(orders.map(o => o.id === orderId ? { ...o, order_status: newStatus } : o));
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Manage Orders</h1>
      
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label className="form-label">Search (Order #, Name, Email)</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              className="form-input" 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              placeholder="Search orders..." 
            />
          </div>
        </div>
        
        <div style={{ width: '200px' }}>
          <label className="form-label">Filter by Status</label>
          <select 
            className="form-input" 
            value={statusFilter} 
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Orders</option>
            <option value="placed">Placed</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Order ID</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Date</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Customer</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Total</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Status</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Payment</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center' }}>Loading orders...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No orders found</td></tr>
            ) : (
              orders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>#{order.order_number}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem' }}>
                    <div>{order.first_name} {order.last_name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{order.customer_email}</div>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>${order.total}</td>
                  <td style={{ padding: '1rem' }}>
                    <select 
                      className="form-input" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem', width: 'auto', backgroundColor: updating === order.id ? '#f3f4f6' : 'transparent' }}
                      value={order.order_status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      disabled={updating === order.id}
                    >
                      <option value="placed">Placed</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: order.payment_status === 'paid' ? 'var(--success-color)' : order.payment_status === 'failed' ? 'var(--error-color)' : 'var(--text-muted)' }}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <a href={`/orders/${order.id}`} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}>
                      View
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
          <button className="btn btn-outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
          <span style={{ padding: '0.5rem 1rem' }}>Page {page} of {totalPages}</span>
          <button className="btn btn-outline" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
