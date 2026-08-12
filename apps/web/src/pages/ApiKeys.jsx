import React, { useState } from 'react';
import { Key, Plus, Copy, CheckCircle2, Trash2 } from 'lucide-react';

export default function ApiKeys() {
  const [keys, setKeys] = useState([
    { id: '1', name: 'Production Dashboard', keyStart: 'vc_live_19a...', created: '2023-10-01', lastUsed: 'Just now' },
    { id: '2', name: 'Test Environment', keyStart: 'vc_test_84b...', created: '2023-09-15', lastUsed: '2 days ago' }
  ]);
  const [showNewKey, setShowNewKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('vc_live_93f82a7b6c5d4e3f2g1h0i9j8k7l6m5n4o3p2q1r');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-container">
      <div className="header-actions">
        <div>
          <h1>API Keys</h1>
          <p className="text-muted">Manage access to the VoiceCore API</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewKey(true)}>
          <Plus size={18} /> Create New Key
        </button>
      </div>

      {showNewKey && (
        <div className="glass-card" style={{ marginBottom: '32px', borderColor: 'var(--accent)', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0, 212, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
              <Key size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0 }}>New API Key Created</h3>
              <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>Please copy this key now. You won't be able to see it again.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <input 
              type="text" 
              className="form-input" 
              value="vc_live_93f82a7b6c5d4e3f2g1h0i9j8k7l6m5n4o3p2q1r" 
              readOnly 
              style={{ fontFamily: 'monospace', flex: 1 }}
            />
            <button className="btn btn-primary" onClick={handleCopy}>
              {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />} 
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowNewKey(false)}>Done</button>
          </div>
        </div>
      )}

      <div className="glass-card" style={{ padding: 0 }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>API Key</th>
                <th>Created</th>
                <th>Last Used</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map(k => (
                <tr key={k.id}>
                  <td style={{ fontWeight: 500 }}>{k.name}</td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{k.keyStart}</td>
                  <td>{k.created}</td>
                  <td className="text-muted">{k.lastUsed}</td>
                  <td>
                    <button className="btn btn-danger" style={{ padding: '6px 12px' }}>
                      <Trash2 size={14} /> Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
