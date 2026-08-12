import React from 'react';
import { User, Shield, CreditCard, Bell } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Settings() {
  const { user, logout } = useAuth();

  return (
    <div className="page-container">
      <div className="header-actions">
        <div>
          <h1>Settings</h1>
          <p className="text-muted">Manage your account and workspace preferences</p>
        </div>
        <button className="btn btn-danger" onClick={logout}>Sign Out</button>
      </div>

      <div style={{ display: 'flex', gap: '32px' }}>
        <div style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="nav-item active"><User size={18} /> Profile</div>
          <div className="nav-item"><Shield size={18} /> Security</div>
          <div className="nav-item"><CreditCard size={18} /> Billing</div>
          <div className="nav-item"><Bell size={18} /> Notifications</div>
        </div>

        <div className="glass-card" style={{ flex: 1 }}>
          <h2 style={{ marginBottom: '24px' }}>Profile Information</h2>
          
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', marginBottom: '32px' }}>
            <div style={{ 
              width: '100px', height: '100px', borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', fontWeight: 'bold'
            }}>
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div>
              <button className="btn btn-secondary" style={{ marginBottom: '8px' }}>Upload New Avatar</button>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>JPG, GIF or PNG. Max size of 800K</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '600px' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" defaultValue={user?.name} />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" defaultValue={user?.email} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Workspace Name</label>
              <input type="text" className="form-input" defaultValue="VoiceCore Production" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <button className="btn btn-primary">Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
