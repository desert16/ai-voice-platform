import React, { useState } from 'react';
import { Play, Pause, Download, Volume2, User, Bot, X } from 'lucide-react';

export default function Calls() {
  const [selectedCall, setSelectedCall] = useState(null);
  
  const calls = [
    { id: 'CALL-1029', date: '2023-10-25 14:30', user: '+1 (555) 0192', duration: '2m 14s', status: 'completed', cost: '$0.42' },
    { id: 'CALL-1028', date: '2023-10-25 12:15', user: '+1 (555) 0184', duration: '45s', status: 'failed', cost: '$0.15' },
    { id: 'CALL-1027', date: '2023-10-24 09:00', user: '+1 (555) 0177', duration: '5m 30s', status: 'completed', cost: '$1.10' },
  ];

  const mockTranscript = [
    { speaker: 'agent', text: 'Hello! Thank you for calling Real Estate Pros. How can I help you today?' },
    { speaker: 'user', text: 'Hi, I saw a listing for the house on Maple Street and wanted to know if it\'s still available.' },
    { speaker: 'agent', text: 'Let me check that for you. Yes, 123 Maple Street is currently available for viewing. Would you like me to schedule a tour?' },
    { speaker: 'user', text: 'That would be great, do you have anything this weekend?' },
    { speaker: 'agent', text: 'I have an opening this Saturday at 2:00 PM or Sunday at 10:00 AM. Which works better for you?' },
    { speaker: 'user', text: 'Saturday at 2 works.' }
  ];

  return (
    <div className="page-container" style={{ display: 'flex', gap: '24px' }}>
      <div style={{ flex: selectedCall ? 1 : '1 1 100%', transition: 'all 0.3s ease' }}>
        <div className="header-actions">
          <div>
            <h1>Call History</h1>
            <p className="text-muted">Review transcripts, listen to recordings, and analyze interactions.</p>
          </div>
        </div>

        <div className="glass-card" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Call ID</th>
                  <th>Date & Time</th>
                  <th>User</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {calls.map(call => (
                  <tr 
                    key={call.id} 
                    onClick={() => setSelectedCall(call)}
                    style={{ 
                      cursor: 'pointer', 
                      background: selectedCall?.id === call.id ? 'rgba(108, 99, 255, 0.1)' : 'transparent'
                    }}
                  >
                    <td style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{call.id}</td>
                    <td>{call.date}</td>
                    <td>{call.user}</td>
                    <td>{call.duration}</td>
                    <td>
                      <span className={`badge badge-${call.status === 'completed' ? 'success' : 'danger'}`}>
                        {call.status}
                      </span>
                    </td>
                    <td className="text-muted">{call.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedCall && (
        <div className="glass-card" style={{ width: '400px', display: 'flex', flexDirection: 'column', padding: 0, animation: 'fadeIn 0.3s ease' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Call Details</h3>
            <button className="btn" style={{ padding: '4px', background: 'transparent' }} onClick={() => setSelectedCall(null)}>
              <X size={20} color="var(--text-muted)" />
            </button>
          </div>
          
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
              <button className="btn btn-primary" style={{ padding: '8px', borderRadius: '50%' }}>
                <Play size={16} fill="white" />
              </button>
              <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%', background: 'var(--accent)', borderRadius: '2px' }} />
              </div>
              <Volume2 size={16} className="text-muted" />
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>0:45 / {selectedCall.duration}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span className="text-muted">From: {selectedCall.user}</span>
              <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none' }}><Download size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/> Audio</a>
            </div>
          </div>

          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '500px' }}>
            {mockTranscript.map((msg, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', flexDirection: msg.speaker === 'user' ? 'row-reverse' : 'row' }}>
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '50%', 
                  background: msg.speaker === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {msg.speaker === 'user' ? <User size={16} /> : <Bot size={16} color="var(--accent)" />}
                </div>
                <div style={{ 
                  background: msg.speaker === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                  padding: '12px 16px', borderRadius: '12px', 
                  borderTopRightRadius: msg.speaker === 'user' ? '4px' : '12px',
                  borderTopLeftRadius: msg.speaker === 'agent' ? '4px' : '12px',
                  maxWidth: '75%', fontSize: '0.95rem', lineHeight: '1.5'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
