import { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discount_price: '',
    category_id: '',
    image_url: '',
    stock_quantity: 0,
    sku: '',
    is_active: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [page]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/products?page=${page}&limit=10`);
      setProducts(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '', description: '', price: '', discount_price: '', 
      category_id: '', image_url: '', stock_quantity: 0, sku: '', is_active: true
    });
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      discount_price: product.discount_price || '',
      category_id: product.category_id || '',
      image_url: product.image_url || '',
      stock_quantity: product.stock_quantity,
      sku: product.sku,
      is_active: product.is_active
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dataToSubmit = { ...formData };
      if (!dataToSubmit.discount_price) delete dataToSubmit.discount_price;
      
      if (editingId) {
        await api.put(`/products/${editingId}`, dataToSubmit);
      } else {
        await api.post('/products', dataToSubmit);
      }
      fetchProducts();
      resetForm();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product? It will be deactivated if it has existing orders.')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Manage Products</h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            + Add Product
          </button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
            {editingId ? 'Edit Product' : 'Add New Product'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div className="form-group" style={{ flex: '1 1 300px', marginBottom: 0 }}>
                <label className="form-label">Product Name</label>
                <input className="form-input" type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
                <label className="form-label">SKU</label>
                <input className="form-input" type="text" required value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
              </div>
              <div className="form-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
                <label className="form-label">Category</label>
                <select className="form-input" value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})}>
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">Price ($)</label>
                <input className="form-input" type="number" step="0.01" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">Discount Price ($) (Optional)</label>
                <input className="form-input" type="number" step="0.01" value={formData.discount_price} onChange={e => setFormData({...formData, discount_price: e.target.value})} />
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">Stock Quantity</label>
                <input className="form-input" type="number" required min="0" value={formData.stock_quantity} onChange={e => setFormData({...formData, stock_quantity: parseInt(e.target.value)})} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Image URL</label>
              <input className="form-input" type="url" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
              Product is active and visible to customers
            </label>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Product'}</button>
              <button type="button" onClick={resetForm} className="btn btn-outline" disabled={saving}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Product</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Category</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Price</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Stock</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Status</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center' }}>Loading products...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No products found</td></tr>
            ) : (
              products.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      {p.image_url && <img src={p.image_url} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />}
                      <div>
                        <div style={{ fontWeight: '500' }}>{p.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>SKU: {p.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>{p.category_name}</td>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>${p.discount_price || p.price}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ color: p.stock_quantity === 0 ? 'var(--error-color)' : p.stock_quantity < 10 ? 'var(--warning-color)' : 'inherit', fontWeight: 'bold' }}>
                      {p.stock_quantity}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '1rem', backgroundColor: p.is_active ? '#dcfce7' : '#fee2e2', color: p.is_active ? '#166534' : '#991b1b' }}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleEdit(p)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}>Edit</button>
                      <button onClick={() => handleDelete(p.id)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem', color: 'var(--error-color)', borderColor: '#fca5a5' }}>Delete</button>
                    </div>
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

export default AdminProducts;
