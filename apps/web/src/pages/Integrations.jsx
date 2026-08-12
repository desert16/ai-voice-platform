import React, { useState } from 'react';
import { Plus, Link2, Power, Code, Trash2 } from 'lucide-react';

export default function Integrations() {
  const [integrations, setIntegrations] = useState([
    { id: 1, name: 'Calendar Booking', method: 'POST', endpoint: 'https://api.cal.com/v1/bookings', active: true },
    { id: 2, name: 'CRM Sync', method: 'PUT', endpoint: 'https://api.hubapi.com/crm/v3/objects/contacts', active: false }
  ]);
  
  const [showBuilder, setShowBuilder] = useState(false);

  return (
    <div className="page-container">
      <div className="header-actions">
        <div>
          <h1>Customer API Builder</h1>
          <p className="text-muted">Connect your voice agent to external APIs and databases</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowBuilder(!showBuilder)}>
          <Plus size={18} /> {showBuilder ? 'Cancel' : 'Add New Integration'}
        </button>
      </div>

      {showBuilder ? (
        <div className="glass-card" style={{ animation: 'fadeIn 0.3s ease', marginBottom: '32px' }}>
          <h2 style={{ marginBottom: '24px' }}>Create API Integration</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div className="form-group">
              <label className="form-label">Integration Name</label>
              <input type="text" className="form-input" placeholder="e.g., Create Support Ticket" />
            </div>
            
            <div className="form-group">
              <label className="form-label">Description (Tells AI when to use this)</label>
              <input type="text" className="form-input" placeholder="Use this API to create a ticket when user has an issue" />
            </div>

            <div className="form-group">
              <label className="form-label">HTTP Method</label>
              <select className="form-input">
                <option>POST</option>
                <option>GET</option>
                <option>PUT</option>
                <option>PATCH</option>
                <option>DELETE</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Endpoint URL</label>
              <input type="text" className="form-input" placeholder="https://api.example.com/v1/..." />
            </div>
            
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Headers (JSON)</label>
              <textarea className="form-input" rows={4} defaultValue={'{\n  "Authorization": "Bearer YOUR_TOKEN",\n  "Content-Type": "application/json"\n}'} style={{ fontFamily: 'monospace' }} />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Request Body Template (JSON)</label>
              <textarea className="form-input" rows={6} defaultValue={'{\n  "title": "{{user_issue_summary}}",\n  "email": "{{user_email}}"\n}'} style={{ fontFamily: 'monospace' }} />
              <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '8px' }}>Use {'{{variable}}'} syntax to let AI inject values dynamically.</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button className="btn btn-secondary"><Code size={18} /> Test Now</button>
            <button className="btn btn-primary" onClick={() => setShowBuilder(false)}><Save size={18} /> Save Integration</button>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Method</th>
                  <th>Endpoint</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {integrations.map(int => (
                  <tr key={int.id}>
                    <td style={{ fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Link2 size={16} className="text-muted" /> {int.name}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${int.method === 'GET' ? 'badge-info' : 'badge-success'}`}>
                        {int.method}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{int.endpoint}</td>
                    <td>
                      <button 
                        className={`btn ${int.active ? 'btn-secondary' : ''}`}
                        style={{ padding: '6px 12px', background: int.active ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255,255,255,0.05)', color: int.active ? '#34C759' : 'white' }}
                        onClick={() => {
                          const newInts = [...integrations];
                          const index = newInts.findIndex(i => i.id === int.id);
                          newInts[index].active = !newInts[index].active;
                          setIntegrations(newInts);
                        }}
                      >
                        <Power size={14} /> {int.active ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                    <td>
                      <button className="btn btn-danger" style={{ padding: '6px 12px' }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Need to import Save for this file to work completely error-free
import { Save } from 'lucide-react';
