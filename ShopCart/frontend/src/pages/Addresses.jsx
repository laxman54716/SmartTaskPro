import { useState, useEffect } from 'react';
import api from '../services/api';

const Addresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    label: 'Home',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
    phone: '',
    is_default: false
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/addresses');
      setAddresses(res.data.data);
    } catch (err) {
      setError('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      label: 'Home',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'India',
      phone: '',
      is_default: false
    });
  };

  const handleEdit = (address) => {
    setFormData({ ...address });
    setEditingId(address.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await api.delete(`/addresses/${id}`);
      fetchAddresses();
    } catch (err) {
      alert('Failed to delete address');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/addresses/${editingId}`, formData);
      } else {
        await api.post('/addresses', formData);
      }
      fetchAddresses();
      resetForm();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save address');
    }
  };

  if (loading) return <div className="loading-screen">Loading addresses...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>My Addresses</h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            + Add New Address
          </button>
        )}
      </div>
      
      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
            {editingId ? 'Edit Address' : 'Add New Address'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Label (e.g., Home, Work)</label>
                <input className="form-input" type="text" required
                  value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Phone Number</label>
                <input className="form-input" type="tel" 
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Address Line 1</label>
              <input className="form-input" type="text" required
                value={formData.address_line1} onChange={e => setFormData({...formData, address_line1: e.target.value})} />
            </div>
            
            <div className="form-group">
              <label className="form-label">Address Line 2 (Optional)</label>
              <input className="form-input" type="text" 
                value={formData.address_line2} onChange={e => setFormData({...formData, address_line2: e.target.value})} />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">City</label>
                <input className="form-input" type="text" required
                  value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">State</label>
                <input className="form-input" type="text" required
                  value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Postal Code</label>
                <input className="form-input" type="text" required
                  value={formData.postal_code} onChange={e => setFormData({...formData, postal_code: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Country</label>
                <input className="form-input" type="text" required
                  value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} />
              </div>
            </div>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={formData.is_default} onChange={e => setFormData({...formData, is_default: e.target.checked})} />
              Set as default address
            </label>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary">Save Address</button>
              <button type="button" onClick={resetForm} className="btn btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {addresses.length === 0 && !showForm && (
          <p style={{ color: 'var(--text-muted)' }}>You have no saved addresses.</p>
        )}
        
        {addresses.map(addr => (
          <div key={addr.id} className="card" style={{ padding: '1.5rem', border: addr.is_default ? '2px solid var(--primary-color)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 'bold' }}>{addr.label}</span>
                {addr.is_default && <span style={{ backgroundColor: 'var(--primary-color)', color: 'white', fontSize: '0.75rem', padding: '0.1rem 0.5rem', borderRadius: '1rem' }}>Default</span>}
              </div>
            </div>
            
            <div style={{ color: 'var(--text-main)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              {addr.address_line1}<br />
              {addr.address_line2 && <>{addr.address_line2}<br /></>}
              {addr.city}, {addr.state} {addr.postal_code}<br />
              {addr.country}<br />
              {addr.phone && `Phone: ${addr.phone}`}
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => handleEdit(addr)} style={{ color: 'var(--primary-color)', fontWeight: '500', fontSize: '0.875rem' }}>Edit</button>
              <button onClick={() => handleDelete(addr.id)} style={{ color: 'var(--error-color)', fontWeight: '500', fontSize: '0.875rem' }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Addresses;
