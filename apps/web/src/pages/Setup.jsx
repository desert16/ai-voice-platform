import React, { useState } from 'react';
import { Check, ChevronRight, Phone, MessageSquare, PartyPopper } from 'lucide-react';

export default function Setup() {
  const [step, setStep] = useState(1);

  const steps = [
    { id: 1, title: 'SIP Trunk', icon: Phone },
    { id: 2, title: 'AI Prompt', icon: MessageSquare },
    { id: 3, title: 'Test & Launch', icon: PartyPopper }
  ];

  return (
    <div className="page-container">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1>Quick Setup Wizard</h1>
          <p className="text-muted">Get your AI voice agent running in 5 minutes</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '48px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '24px', left: '0', right: '0', height: '2px', background: 'var(--border)', zIndex: 0 }} />
          <div style={{ position: 'absolute', top: '24px', left: '0', width: `${((step - 1) / 2) * 100}%`, height: '2px', background: 'var(--accent)', zIndex: 0, transition: 'width 0.3s ease' }} />
          
          {steps.map((s) => (
            <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', zIndex: 1 }}>
              <div style={{ 
                width: '48px', height: '48px', borderRadius: '50%', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: step >= s.id ? 'var(--primary)' : 'var(--surface)',
                border: `2px solid ${step >= s.id ? 'var(--primary)' : 'var(--border)'}`,
                color: step >= s.id ? 'white' : 'var(--text-muted)',
                transition: 'all 0.3s ease',
                boxShadow: step === s.id ? '0 0 20px rgba(108, 99, 255, 0.4)' : 'none'
              }}>
                {step > s.id ? <Check size={24} /> : <s.icon size={24} />}
              </div>
              <span style={{ fontWeight: step >= s.id ? 600 : 400, color: step >= s.id ? 'var(--text-main)' : 'var(--text-muted)' }}>
                {s.title}
              </span>
            </div>
          ))}
        </div>

        <div className="glass-card">
          {step === 1 && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <h2>Configure SIP Trunk</h2>
              <p className="text-muted" style={{ marginBottom: '24px' }}>Connect your Twilio, Plivo, or custom SIP provider.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Provider</label>
                  <select className="form-input">
                    <option>Twilio</option>
                    <option>Plivo</option>
                    <option>Custom SIP</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input type="text" className="form-input" placeholder="+1 (555) 000-0000" />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">SIP URI / Host</label>
                  <input type="text" className="form-input" placeholder="sip:your-domain.sip.twilio.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input type="text" className="form-input" placeholder="Username" />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-input" placeholder="••••••••" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <h2>AI Agent Personality</h2>
              <p className="text-muted" style={{ marginBottom: '24px' }}>Define how your agent should behave and talk.</p>
              
              <div className="form-group">
                <label className="form-label">System Prompt</label>
                <textarea 
                  className="form-input" 
                  rows={8} 
                  defaultValue={"You are a helpful customer service assistant for VoiceCore. Your goal is to answer questions politely and concisely. Keep responses under 2 sentences to ensure smooth voice conversation."}
                  style={{ fontFamily: 'monospace', resize: 'vertical' }}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Voice Model</label>
                  <select className="form-input">
                    <option>ElevenLabs - Rachel (Female)</option>
                    <option>ElevenLabs - Drew (Male)</option>
                    <option>OpenAI - Alloy (Neutral)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Language</label>
                  <select className="form-input">
                    <option>English (US)</option>
                    <option>Turkish (TR)</option>
                    <option>Spanish (ES)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ animation: 'fadeIn 0.3s ease', textAlign: 'center', padding: '40px 0' }}>
              <div style={{ 
                width: '80px', height: '80px', borderRadius: '50%', 
                background: 'rgba(52, 199, 89, 0.1)', color: '#34C759',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px auto',
                boxShadow: '0 0 30px rgba(52, 199, 89, 0.2)'
              }}>
                <PartyPopper size={40} />
              </div>
              <h2 className="text-gradient" style={{ fontSize: '2.5rem' }}>Your agent is ready!</h2>
              <p className="text-muted" style={{ maxWidth: '400px', margin: '0 auto 32px auto' }}>
                We've successfully connected to your SIP trunk and initialized the AI model. 
                You can now make a test call to the number below.
              </p>
              
              <div style={{ 
                background: 'rgba(0,0,0,0.3)', border: '1px dashed var(--border)', 
                padding: '16px', borderRadius: '12px', display: 'inline-block',
                marginBottom: '32px'
              }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 600, letterSpacing: '2px', color: 'var(--accent)' }}>
                  +1 (555) 123-4567
                </span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
            {step > 1 && (
              <button className="btn btn-secondary" onClick={() => setStep(s => s - 1)}>
                Back
              </button>
            )}
            {step < 3 ? (
              <button className="btn btn-primary" onClick={() => setStep(s => s + 1)}>
                Continue <ChevronRight size={18} />
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => window.location.href = '/dashboard'}>
                Go to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
