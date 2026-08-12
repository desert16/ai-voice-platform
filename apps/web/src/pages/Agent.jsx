import React, { useState, useEffect, useRef } from 'react';
import { Save, Play, History, Sparkles, Send } from 'lucide-react';
import { useSSE } from '../hooks/useSSE';

export default function Agent() {
  const [prompt, setPrompt] = useState("You are an expert real estate AI agent. Your goal is to collect the user's name, phone number, and budget, then schedule a viewing. Be extremely polite but concise.");
  const [chatInput, setChatInput] = useState('');
  
  const { messages, isConnecting, sendMessage, connect } = useSSE('/api/ai-wizard');
  const chatEndRef = useRef(null);

  useEffect(() => {
    connect();
  }, [connect]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput);
    setChatInput('');
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="header-actions">
        <div>
          <h1>AI Prompt Studio</h1>
          <p className="text-muted">Design and test your agent's behavior in real-time</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary"><History size={18} /> History</button>
          <button className="btn btn-primary"><Save size={18} /> Save & Activate</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', flex: 1, minHeight: '500px' }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>System Prompt</h3>
            <span className="badge badge-info"><Sparkles size={12} style={{ display: 'inline', marginRight: '4px' }}/> Copilot Active</span>
          </div>
          <textarea
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              padding: '24px',
              color: 'var(--text-main)',
              fontFamily: 'monospace',
              fontSize: '1rem',
              lineHeight: '1.6',
              resize: 'none',
              outline: 'none'
            }}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Test Chat (SSE Stream)</h3>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                background: m.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                padding: '12px 16px',
                borderRadius: '12px',
                borderBottomRightRadius: m.role === 'user' ? '4px' : '12px',
                borderBottomLeftRadius: m.role === 'agent' ? '4px' : '12px',
                maxWidth: '80%',
                border: m.role === 'agent' ? '1px solid var(--border)' : 'none'
              }}>
                {m.content}
              </div>
            ))}
            {isConnecting && (
              <div style={{ alignSelf: 'flex-start', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                <span className="status-dot active"></span> <span className="text-muted" style={{ fontSize: '0.9rem' }}>Agent is typing...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
            <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Type a message to test..." 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px' }}>
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
