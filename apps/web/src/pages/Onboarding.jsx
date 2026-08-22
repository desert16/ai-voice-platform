import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, PhoneCall, Bot, Layers, Sparkles, Check, 
  ArrowRight, ArrowLeft, ShieldCheck, Zap, Globe, Lock, Mail, Phone
} from 'lucide-react';

const API_BASE = 'http://192.168.203.138:3000/api';

const SERVICE_OPTIONS = [
  {
    id: 'FULL_SUITE',
    icon: Sparkles,
    title: '⭐ Tam Paket (Santral + AI + Sektörel CRM)',
    desc: 'Bulut santral, Gemini Live sesli asistan ve sektörünüze özel canlı müşteri tablosu bir arada.',
    popular: true,
    badge: 'En Çok Tercih Edilen'
  },
  {
    id: 'AI_AGENT_ONLY',
    icon: Bot,
    title: '🤖 Sadece AI Sesli Asistan',
    desc: 'Mevcut kendi santraliniz (Asterisk, Netgsm, 3CX vb.) var ise, sadece yapay zeka sesli ajanını bağlayın.',
    badge: 'Santrali Olanlar İçin'
  },
  {
    id: 'PBX_ONLY',
    icon: PhoneCall,
    title: '☎️ Sadece Bulut Santral',
    desc: 'Dahili hatlar, ses kayıtları, IVR ve çağrı merkezi özellikleri. (İleride tek tıkla AI eklenebilir)',
    badge: 'Temel Santral'
  }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [sectors, setSectors] = useState([]);
  const [loadingSectors, setLoadingSectors] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    companyName: '',
    slug: '',
    email: '',
    phone: '',
    password: '',
    serviceType: 'FULL_SUITE',
    sectorCode: 'health',
    initialGreeting: '',
  });

  useEffect(() => {
    fetch(`${API_BASE}/admin/sectors`)
      .then(r => r.json())
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          setSectors(res.data);
          if (res.data.length > 0) {
            setFormData(prev => ({ ...prev, sectorCode: res.data[0].code }));
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoadingSectors(false));
  }, []);

  const handleCompanyNameChange = (val) => {
    const slugified = val.toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    
    setFormData(prev => ({
      ...prev,
      companyName: val,
      slug: slugified,
      initialGreeting: prev.initialGreeting || `Merhaba, ${val}'e hoş geldiniz! Size nasıl yardımcı olabilirim?`
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setErrorMsg('');

      const res = await fetch(`${API_BASE}/auth/register-tenant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Kayıt sırasında bir sorun oluştu');
      }

      // Başarılı: Token ve Tenant bilgilerini localStorage'a yaz
      if (data.data?.tokens?.accessToken) {
        localStorage.setItem('vc_access_token', data.data.tokens.accessToken);
        localStorage.setItem('vc_user', JSON.stringify(data.data.user));
        localStorage.setItem('vc_tenant', JSON.stringify(data.data.tenant));
      }

      // Müşterinin dinamik paneline yönlendir: /:slug/dashboard
      const targetSlug = data.data?.tenant?.slug || formData.slug;
      navigate(`/${targetSlug}/dashboard`);

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% -20%, #1c1538 0%, #090915 70%)',
      color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #6C63FF, #00D4FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(108,99,255,0.5)' }}>
            <Zap size={22} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.03em' }}>
            Voice<span style={{ color: '#6C63FF' }}>Core</span> AI
          </span>
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          Yeni Nesil İletişim Panelinizi Oluşturun
        </h1>
        <p style={{ color: '#8F90A6', fontSize: '0.95rem', margin: 0 }}>
          Hizmet paketinizi ve sektörünüzü seçin, size özel panel saniyeler içinde hazır olsun.
        </p>
      </div>

      {/* Main Card */}
      <div style={{
        width: '100%', maxWidth: 720,
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20, padding: '32px 36px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        position: 'relative'
      }}>

        {/* Step Indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, position: 'relative' }}>
          {[
            { num: 1, label: 'Firma & Giriş' },
            { num: 2, label: 'Hizmet Paketi' },
            { num: 3, label: 'Sektör & Akış' },
            { num: 4, label: 'Önizleme' },
          ].map((s) => (
            <div key={s.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 2 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: step >= s.num ? 'linear-gradient(135deg, #6C63FF, #00D4FF)' : 'rgba(255,255,255,0.08)',
                color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: step >= s.num ? '0 0 16px rgba(108,99,255,0.4)' : 'none',
                transition: 'all 0.3s'
              }}>
                {step > s.num ? <Check size={16} /> : s.num}
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: step >= s.num ? '#fff' : '#5A5A7A' }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {errorMsg && (
          <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: '0.85rem' }}>
            {errorMsg}
          </div>
        )}

        {/* ── STEP 1: Firma & Giriş Bilgileri ── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#A8A8C0', marginBottom: 6 }}>Firma Adınız *</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Building2 size={16} color="#6C63FF" style={{ position: 'absolute', left: 14 }} />
                <input
                  type="text" required placeholder="Örn: DentPlus Ağız ve Diş Sağlığı"
                  value={formData.companyName}
                  onChange={(e) => handleCompanyNameChange(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 14px 12px 42px', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#A8A8C0', marginBottom: 6 }}>Panel Adresiniz (URL) *</label>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 10, padding: '0 14px', overflow: 'hidden' }}>
                <span style={{ fontSize: '0.85rem', color: '#8F90A6' }}>voicecore.ai/</span>
                <input
                  type="text" required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  style={{ flex: 1, background: 'transparent', border: 'none', padding: '12px 6px', color: '#00D4FF', fontWeight: 700, fontSize: '0.9rem', outline: 'none' }}
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: '#5A5A7A', marginTop: 4, display: 'block' }}>Giriş yapacağınız özel linkiniz bu şekilde olacaktır.</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#A8A8C0', marginBottom: 6 }}>Yönetici E-Postası *</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Mail size={16} color="#8F90A6" style={{ position: 'absolute', left: 14 }} />
                  <input
                    type="email" required placeholder="info@dentplus.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 14px 12px 42px', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#A8A8C0', marginBottom: 6 }}>Panel Şifresi *</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={16} color="#8F90A6" style={{ position: 'absolute', left: 14 }} />
                  <input
                    type="password" required placeholder="En az 6 karakter"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 14px 12px 42px', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            <button
              disabled={!formData.companyName || !formData.email || !formData.password}
              onClick={() => setStep(2)}
              style={{
                marginTop: 12, width: '100%',
                background: 'linear-gradient(135deg, #6C63FF, #00D4FF)',
                border: 'none', borderRadius: 10, padding: '13px',
                color: '#fff', fontSize: '0.95rem', fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: (!formData.companyName || !formData.email || !formData.password) ? 0.5 : 1
              }}
            >
              Hizmet Seçimiyle Devam Et <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ── STEP 2: Hizmet Tipi Seçimi ── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: '0.9rem', color: '#8F90A6', marginBottom: 4 }}>
              Firmanızın ihtiyaç duyduğu panel tipini belirleyin:
            </div>

            {SERVICE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = formData.serviceType === opt.id;

              return (
                <div
                  key={opt.id}
                  onClick={() => setFormData({ ...formData, serviceType: opt.id })}
                  style={{
                    border: isSelected ? '2px solid #6C63FF' : '1px solid rgba(255,255,255,0.08)',
                    background: isSelected ? 'rgba(108,99,255,0.12)' : 'rgba(255,255,255,0.02)',
                    borderRadius: 14, padding: '18px 20px', cursor: 'pointer',
                    display: 'flex', alignItems: 'flex-start', gap: 16,
                    transition: 'all 0.2s', position: 'relative'
                  }}
                >
                  <div style={{
                    width: 42, height: 42, borderRadius: 10,
                    background: isSelected ? 'linear-gradient(135deg, #6C63FF, #00D4FF)' : 'rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Icon size={20} color="#fff" />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem' }}>{opt.title}</span>
                      <span style={{ fontSize: '0.7rem', background: isSelected ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.06)', color: isSelected ? '#00D4FF' : '#8F90A6', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                        {opt.badge}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#8F90A6', lineHeight: 1.4 }}>
                      {opt.desc}
                    </p>
                  </div>

                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    border: isSelected ? '6px solid #6C63FF' : '2px solid rgba(255,255,255,0.2)',
                    background: '#fff', flexShrink: 0, marginTop: 4
                  }} />
                </div>
              );
            })}

            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button
                onClick={() => setStep(1)}
                style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 10, padding: '13px', color: '#A8A8C0', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <ArrowLeft size={16} /> Geri
              </button>
              <button
                onClick={() => setStep(3)}
                style={{ flex: 2, background: 'linear-gradient(135deg, #6C63FF, #00D4FF)', border: 'none', borderRadius: 10, padding: '13px', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                Sektör Seçimiyle Devam Et <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Sektör & Karşılama Akışı ── */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#A8A8C0', marginBottom: 8 }}>
                Faaliyet Gösterdiğiniz Sektör *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, maxHeight: 220, overflowY: 'auto', paddingRight: 4 }}>
                {sectors.map(sec => {
                  const isSelected = formData.sectorCode === sec.code;
                  return (
                    <div
                      key={sec.code}
                      onClick={() => setFormData({ ...formData, sectorCode: sec.code })}
                      style={{
                        padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                        background: isSelected ? 'rgba(108,99,255,0.18)' : 'rgba(255,255,255,0.03)',
                        border: isSelected ? '1px solid #6C63FF' : '1px solid rgba(255,255,255,0.06)',
                        display: 'flex', alignItems: 'center', gap: 8,
                        transition: 'all 0.15s'
                      }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>{sec.icon}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? '#fff' : '#A8A8C0' }}>{sec.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {formData.serviceType !== 'PBX_ONLY' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#A8A8C0', marginBottom: 6 }}>
                  AI Sesli Asistan İlk Karşılama Cümlesi
                </label>
                <textarea
                  rows={2}
                  value={formData.initialGreeting}
                  onChange={(e) => setFormData({ ...formData, initialGreeting: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: '0.85rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button
                onClick={() => setStep(2)}
                style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 10, padding: '13px', color: '#A8A8C0', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <ArrowLeft size={16} /> Geri
              </button>
              <button
                onClick={() => setStep(4)}
                style={{ flex: 2, background: 'linear-gradient(135deg, #6C63FF, #00D4FF)', border: 'none', borderRadius: 10, padding: '13px', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                Önizleme ve Tamamlama <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Özet & Panel Oluşturma ── */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.25)', borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ fontSize: '0.8rem', color: '#00D4FF', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
                Panel Özeti
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.9rem' }}>
                <div><span style={{ color: '#8F90A6' }}>Firma:</span> <strong>{formData.companyName}</strong></div>
                <div><span style={{ color: '#8F90A6' }}>Özel URL:</span> <strong style={{ color: '#6C63FF' }}>voicecore.ai/{formData.slug}</strong></div>
                <div><span style={{ color: '#8F90A6' }}>Hizmet:</span> <strong>{SERVICE_OPTIONS.find(s => s.id === formData.serviceType)?.title}</strong></div>
                <div><span style={{ color: '#8F90A6' }}>Sektör:</span> <strong>{sectors.find(s => s.code === formData.sectorCode)?.name}</strong></div>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#8F90A6', margin: '4px 0', lineHeight: 1.4 }}>
              "Paneli Oluştur ve Başla" butonuna bastığınızda firmanıza ait veritabanı alanı, sektörel canlı veri tablonuz ve AI asistanınız hazır hale getirilecektir.
            </p>

            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button
                disabled={submitting}
                onClick={() => setStep(3)}
                style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 10, padding: '13px', color: '#A8A8C0', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <ArrowLeft size={16} /> Geri
              </button>
              <button
                disabled={submitting}
                onClick={handleSubmit}
                style={{
                  flex: 2, background: 'linear-gradient(135deg, #10B981, #00D4FF)',
                  border: 'none', borderRadius: 10, padding: '13px', color: '#fff',
                  fontWeight: 800, fontSize: '1rem', cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 0 24px rgba(16,185,129,0.4)', opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? 'Panel Kuruluyor...' : '🚀 Paneli Oluştur ve Giriş Yap'}
              </button>
            </div>
          </div>
        )}

      </div>

      <div style={{ marginTop: 24, fontSize: '0.85rem', color: '#5A5A7A' }}>
        Zaten bir hesabınız var mı? <Link to="/login" style={{ color: '#6C63FF', fontWeight: 600, textDecoration: 'none' }}>Giriş Yap</Link>
      </div>

    </div>
  );
}
