import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const Profile = () => {
  const { user, setUser } = useAuth();
  
  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || ''
  });
  
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMessage({ text: '', type: '' });
    setLoadingProfile(true);
    
    try {
      const res = await api.put('/auth/me', profileData);
      setUser(res.data.data);
      setProfileMessage({ text: 'Profile updated successfully', type: 'success' });
    } catch (err) {
      setProfileMessage({ text: err.response?.data?.message || 'Failed to update profile', type: 'error' });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPasswordMessage({ text: '', type: '' });
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      return setPasswordMessage({ text: 'New passwords do not match', type: 'error' });
    }
    
    if (passwordData.new_password.length < 8) {
      return setPasswordMessage({ text: 'Password must be at least 8 characters', type: 'error' });
    }
    
    setLoadingPassword(true);
    
    try {
      await api.put('/auth/password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      setPasswordMessage({ text: 'Password changed successfully', type: 'success' });
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setPasswordMessage({ text: err.response?.data?.message || 'Failed to change password', type: 'error' });
    } finally {
      setLoadingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>My Profile</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Profile Information */}
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Personal Information</h2>
          
          {profileMessage.text && (
            <div className={`alert ${profileMessage.type === 'error' ? 'alert-error' : ''}`} style={{ backgroundColor: profileMessage.type === 'success' ? '#dcfce7' : undefined, color: profileMessage.type === 'success' ? '#166534' : undefined }}>
              {profileMessage.text}
            </div>
          )}
          
          <form onSubmit={handleProfileUpdate}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                <label className="form-label" htmlFor="first_name">First Name</label>
                <input 
                  className="form-input" type="text" id="first_name" required
                  value={profileData.first_name} 
                  onChange={e => setProfileData({...profileData, first_name: e.target.value})} 
                />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                <label className="form-label" htmlFor="last_name">Last Name</label>
                <input 
                  className="form-input" type="text" id="last_name" required
                  value={profileData.last_name} 
                  onChange={e => setProfileData({...profileData, last_name: e.target.value})} 
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Email (Cannot be changed)</label>
              <input className="form-input" type="email" value={user.email} disabled style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-muted)' }} />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone Number</label>
              <input 
                className="form-input" type="tel" id="phone"
                value={profileData.phone} 
                onChange={e => setProfileData({...profileData, phone: e.target.value})} 
              />
            </div>
            
            <button type="submit" className="btn btn-primary" disabled={loadingProfile}>
              {loadingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Password Change */}
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Change Password</h2>
          
          {passwordMessage.text && (
            <div className={`alert ${passwordMessage.type === 'error' ? 'alert-error' : ''}`} style={{ backgroundColor: passwordMessage.type === 'success' ? '#dcfce7' : undefined, color: passwordMessage.type === 'success' ? '#166534' : undefined }}>
              {passwordMessage.text}
            </div>
          )}
          
          <form onSubmit={handlePasswordUpdate}>
            <div className="form-group">
              <label className="form-label" htmlFor="current_password">Current Password</label>
              <input 
                className="form-input" type="password" id="current_password" required
                value={passwordData.current_password} 
                onChange={e => setPasswordData({...passwordData, current_password: e.target.value})} 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="new_password">New Password</label>
              <input 
                className="form-input" type="password" id="new_password" required
                value={passwordData.new_password} 
                onChange={e => setPasswordData({...passwordData, new_password: e.target.value})} 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="confirm_password">Confirm New Password</label>
              <input 
                className="form-input" type="password" id="confirm_password" required
                value={passwordData.confirm_password} 
                onChange={e => setPasswordData({...passwordData, confirm_password: e.target.value})} 
              />
            </div>
            
            <button type="submit" className="btn btn-outline" disabled={loadingPassword}>
              {loadingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
