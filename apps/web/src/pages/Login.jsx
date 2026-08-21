import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Mic2, Mail, Lock, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail]       = useState('admin@voicecore.ai');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const { login }               = useAuth();
  const navigate                = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Giriş hatası:', err);
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated blobs */}
      <div style={{
        position: 'absolute', width: 500, height: 500,
        borderRadius: '50%', top: '-10%', left: '-15%',
        background: 'radial-gradient(circle, rgba(108,99,255,0.18) 0%, transparent 70%)',
        animation: 'meshShift 10s ease-in-out infinite alternate',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 400, height: 400,
        borderRadius: '50%', bottom: '-10%', right: '-10%',
        background: 'radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 70%)',
        animation: 'meshShift 14s ease-in-out infinite alternate-reverse',
        pointerEvents: 'none',
      }} />

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 400, zIndex: 1,
        background: 'rgba(17,17,42,0.8)',
        backdropFilter: 'blur(32px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        padding: '40px 36px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #6C63FF, #00D4FF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 28px rgba(108,99,255,0.5)',
          }}>
            <Mic2 size={26} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>
            <span className="text-gradient">VoiceCore AI</span>
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>Sesli Ajan Platformuna Giriş</p>
        </div>

        {/* Demo hint */}
        <div style={{
          padding: '9px 12px', borderRadius: 8, marginBottom: 24,
          background: 'rgba(108,99,255,0.08)',
          border: '1px solid rgba(108,99,255,0.2)',
          fontSize: '0.76rem', color: 'var(--text-2)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>🔑</span>
          <span><b style={{ color: '#fff' }}>admin@voicecore.ai</b> / <b style={{ color: '#fff' }}>admin123</b></span>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, marginBottom: 16,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            fontSize: '0.82rem', color: '#EF4444',
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">E-posta</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
              <input
                type="email" className="form-input" required
                style={{ paddingLeft: 36 }}
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="e-posta@firma.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Şifre</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
              <input
                type="password" className="form-input" required
                style={{ paddingLeft: 36 }}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary"
            style={{ width: '100%', marginTop: 8, padding: '12px', fontSize: '0.9rem' }}
            disabled={loading}
          >
            {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Giriş Yapılıyor...</> : <><ArrowRight size={16} /> Panele Giriş</>}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.75rem', color: 'var(--text-3)' }}>
          VoiceCore AI Platform · Tüm hakları saklıdır
        </p>
      </div>
    </div>
  );
}
