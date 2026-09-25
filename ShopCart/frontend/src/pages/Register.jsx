import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Register = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm_password) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '3rem auto' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 'bold' }}>Create an Account</h2>
        
        {error && <div className="alert alert-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label className="form-label" htmlFor="first_name">First Name</label>
              <input className="form-input" type="text" id="first_name" value={formData.first_name} onChange={handleChange} required />
            </div>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label className="form-label" htmlFor="last_name">Last Name</label>
              <input className="form-input" type="text" id="last_name" value={formData.last_name} onChange={handleChange} required />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input className="form-input" type="email" id="email" value={formData.email} onChange={handleChange} required />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input className="form-input" type="password" id="password" value={formData.password} onChange={handleChange} required minLength={8} />
            <small style={{ color: 'var(--text-muted)' }}>Must be at least 8 characters with a number and uppercase letter.</small>
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="confirm_password">Confirm Password</label>
            <input className="form-input" type="password" id="confirm_password" value={formData.confirm_password} onChange={handleChange} required />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.75rem', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary-color)' }}>Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
