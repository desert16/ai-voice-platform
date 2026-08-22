import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, PhoneCall, Bot, Layers, Sparkles, Check, 
  ArrowRight, ArrowLeft, ShieldCheck, Zap, Globe, Lock, Mail, Phone,
  Users, DollarSign, Calculator, CheckCircle2
} from 'lucide-react';

const API_BASE = 'http://192.168.203.138:3000/api';

const FALLBACK_SECTORS = [
  { code: 'health',            name: 'Sağlık & Klinik',      icon: '🏥', description: 'Diş, göz, estetik, poliklinik' },
  { code: 'real_estate',       name: 'Emlak',                 icon: '🏠', description: 'Gayrimenkul ve portföy' },
  { code: 'restaurant',        name: 'Restoran & Kafe',       icon: '🍽️', description: 'Rezervasyon ve paket servis' },
  { code: 'ecommerce',         name: 'E-Ticaret & Kargo',     icon: '🛒', description: 'Sipariş ve kargo takibi' },
  { code: 'automotive',        name: 'Otomotiv & Oto Servis', icon: '🚗', description: 'Servis randevusu ve parça' },
  { code: 'technical_service', name: 'Teknik Servis',         icon: '🔧', description: 'Arıza kaydı ve teknisyen' },
  { code: 'legal',             name: 'Hukuk & Avukatlık',     icon: '⚖️', description: 'Danışmanlık ve randevu' },
  { code: 'hotel',             name: 'Otel & Konaklama',      icon: '🏨', description: 'Oda rezervasyonu ve resepsiyon' },
  { code: 'education',         name: 'Eğitim & Kurs',         icon: '📚', description: 'Öğrenci işleri ve kayıt' },
  { code: 'logistics',         name: 'Lojistik & Taşımacılık', icon: '🚚', description: 'Kargo durumu ve filo' },
  { code: 'finance',           name: 'Finans & Sigorta',      icon: '💼', description: 'Poliçe ve danışmanlık' },
  { code: 'corporate',         name: 'Kurumsal Sekreter',     icon: '🏢', description: 'Genel karşılama ve aktarma' },
  { code: 'travel',            name: 'Seyahat & Turizm',      icon: '✈️', description: 'Bilet ve tur bilgisi' },
  { code: 'other',             name: 'Özel / Diğer',          icon: '⭐', description: 'Genel işletme akışı' },
];

const SERVICE_OPTIONS = [
  {
    id: 'FULL_SUITE',
    icon: Sparkles,
    title: '⭐ Tam Paket (Santral + AI + Sektörel CRM)',
    desc: 'Bulut santral, Gemini Live sesli asistan ve sektörünüze özel canlı müşteri tablosu bir arada.',
    popular: true,
    badge: 'En Çok Tercih Edilen',
    basePrice: 799,
    perExtPrice: 49
  },
  {
    id: 'AI_AGENT_ONLY',
    icon: Bot,
    title: '🤖 Sadece AI Sesli Asistan',
    desc: 'Mevcut kendi santraliniz (Asterisk, Netgsm, 3CX vb.) var ise, sadece yapay zeka sesli ajanını bağlayın.',
    badge: 'Santrali Olanlar İçin',
    basePrice: 999,
    perExtPrice: 0
  },
  {
    id: 'PBX_ONLY',
    icon: PhoneCall,
    title: '☎️ Sadece Bulut Santral',
    desc: 'Dahili hatlar, ses kayıtları, IVR ve çağrı merkezi özellikleri. (İleride tek tıkla AI eklenebilir)',
    badge: 'Temel Santral',
    basePrice: 0,
    perExtPrice: 49
  }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [sectors, setSectors] = useState(FALLBACK_SECTORS);
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
    extensionCount: 5,
    initialGreeting: '',
  });

  useEffect(() => {
    fetch(`${API_BASE}/admin/sectors`)
      .then(r => r.json())
      .then(res => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setSectors(res.data);
        }
      })
      .catch(() => {
        // Fallback kullanılmaya devam edilir
      });
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

  // Dinamik Fiyat Hesaplama
  const selectedService = SERVICE_OPTIONS.find(s => s.id === formData.serviceType) || SERVICE_OPTIONS[0];
  const monthlyTotal = selectedService.basePrice + (formData.extensionCount * selectedService.perExtPrice);

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

      if (data.data?.tokens?.accessToken) {
        localStorage.setItem('vc_access_token', data.data.tokens.accessToken);
        localStorage.setItem('vc_user', JSON.stringify(data.data.user));
        localStorage.setItem('vc_tenant', JSON.stringify(data.data.tenant));
      }

      navigate(`/dashboard`);

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
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #6C63FF, #00D4FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(108,99,255,0.5)' }}>
            <Zap size={22} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.03em' }}>
            Voice<span style={{ color: '#6C63FF' }}>Core</span> AI
          </span>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          Yeni Nesil İletişim Panelinizi Oluşturun
        </h1>
        <p style={{ color: '#8F90A6', fontSize: '0.9rem', margin: 0 }}>
          Hizmet paketinizi, dahili sayınızı ve sektörünüzü seçin; size özel panel anında hazırlansın.
        </p>
      </div>

      {/* Main Wizard Card */}
      <div style={{
        width: '100%', maxWidth: 760,
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20, padding: '30px 34px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        position: 'relative'
      }}>

        {/* Step Indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, position: 'relative' }}>
          {[
            { num: 1, label: 'Firma & Giriş' },
            { num: 2, label: 'Paket & Dahili' },
            { num: 3, label: 'Sektör & Akış' },
            { num: 4, label: 'Fiyat & Başlat' },
          ].map((s) => (
            <div key={s.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 2 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: step >= s.num ? 'linear-gradient(135deg, #6C63FF, #00D4FF)' : 'rgba(255,255,255,0.08)',
                color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: step >= s.num ? '0 0 16px rgba(108,99,255,0.4)' : 'none',
                transition: 'all 0.3s'
              }}>
                {step > s.num ? <Check size={15} /> : s.num}
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: step >= s.num ? '#fff' : '#5A5A7A' }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {errorMsg && (
          <div style={{ marginBottom: 18, padding: '12px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: '0.85rem' }}>
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
                  type="text" required placeholder="Örn: Akkuş Emlak Gayrimenkul"
                  value={formData.companyName}
                  onChange={(e) => handleCompanyNameChange(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 14px 12px 42px', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#A8A8C0', marginBottom: 6 }}>Özel Panel Adresiniz (URL) *</label>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 10, padding: '0 14px', overflow: 'hidden' }}>
                <span style={{ fontSize: '0.85rem', color: '#8F90A6' }}>voicecore.ai/</span>
                <input
                  type="text" required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  style={{ flex: 1, background: 'transparent', border: 'none', padding: '12px 6px', color: '#00D4FF', fontWeight: 700, fontSize: '0.9rem', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#A8A8C0', marginBottom: 6 }}>Yönetici E-Postası *</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Mail size={16} color="#8F90A6" style={{ position: 'absolute', left: 14 }} />
                  <input
                    type="email" required placeholder="yonetici@akkusemlak.com"
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
                marginTop: 10, width: '100%',
                background: 'linear-gradient(135deg, #6C63FF, #00D4FF)',
                border: 'none', borderRadius: 10, padding: '13px',
                color: '#fff', fontSize: '0.95rem', fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: (!formData.companyName || !formData.email || !formData.password) ? 0.5 : 1
              }}
            >
              Hizmet & Dahili Seçimiyle Devam Et <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ── STEP 2: Hizmet Tipi & Dahili Sayısı & Canlı Fiyat ── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: '0.85rem', color: '#8F90A6' }}>
              İhtiyaç duyduğunuz santral paketini ve kullanıcı (dahili) sayınızı belirleyin:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                      borderRadius: 12, padding: '14px 18px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 14,
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: isSelected ? 'linear-gradient(135deg, #6C63FF, #00D4FF)' : 'rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <Icon size={18} color="#fff" />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{opt.title}</span>
                        <span style={{ fontSize: '0.65rem', background: isSelected ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.06)', color: isSelected ? '#00D4FF' : '#8F90A6', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                          {opt.badge}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#8F90A6', lineHeight: 1.3 }}>
                        {opt.desc}
                      </p>
                    </div>

                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: isSelected ? '5px solid #6C63FF' : '2px solid rgba(255,255,255,0.2)',
                      background: '#fff', flexShrink: 0
                    }} />
                  </div>
                );
              })}
            </div>

            {/* Dahili Sayısı Seçimi (PBX_ONLY veya FULL_SUITE için) */}
            {formData.serviceType !== 'AI_AGENT_ONLY' && (
              <div style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12, padding: '16px 18px', marginTop: 4
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Users size={18} color="#00D4FF" />
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>İhtiyaç Duyulan Dahili (Kullanıcı) Sayısı</span>
                  </div>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#00D4FF' }}>
                    {formData.extensionCount} Dahili
                  </span>
                </div>

                {/* Hızlı Butonlar */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  {[3, 5, 10, 20, 50, 100].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setFormData({ ...formData, extensionCount: cnt })}
                      style={{
                        flex: 1, minWidth: 45, padding: '6px',
                        background: formData.extensionCount === cnt ? 'linear-gradient(135deg, #6C63FF, #00D4FF)' : 'rgba(255,255,255,0.05)',
                        border: formData.extensionCount === cnt ? 'none' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 6, color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>

                <div style={{ fontSize: '0.75rem', color: '#8F90A6' }}>
                  Dahili başına aylık 49 ₺ (Sınırsız dahili içi görüşme, ses kaydı ve IVR dahil).
                </div>
              </div>
            )}

            {/* Canlı Fiyatlandırma Kartı */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(0,212,255,0.15))',
              border: '1px solid rgba(0,212,255,0.3)', borderRadius: 12, padding: '14px 18px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#00D4FF', fontWeight: 700, textTransform: 'uppercase' }}>Tahmini Aylık Tutar</div>
                <div style={{ fontSize: '0.8rem', color: '#A8A8C0' }}>{formData.extensionCount} Dahili + Seçilen Paket</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>{monthlyTotal.toLocaleString('tr-TR')} ₺</span>
                <span style={{ fontSize: '0.75rem', color: '#8F90A6' }}> / ay</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
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

        {/* ── STEP 3: Sektör Seçimi & Görsel Kartlar ── */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                  Faaliyet Gösterdiğiniz Sektörü Seçin *
                </label>
                <span style={{ fontSize: '0.75rem', color: '#00D4FF' }}>{sectors.length} Sektör Mevcut</span>
              </div>

              {/* 14 Sektör Görsel Grid */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: 10, maxHeight: 250, overflowY: 'auto', paddingRight: 4, paddingBottom: 4
              }}>
                {sectors.map((sec) => {
                  const isSelected = formData.sectorCode === sec.code;
                  return (
                    <div
                      key={sec.code}
                      onClick={() => setFormData({ ...formData, sectorCode: sec.code })}
                      style={{
                        padding: '12px 10px', borderRadius: 10, cursor: 'pointer',
                        background: isSelected ? 'rgba(108,99,255,0.22)' : 'rgba(255,255,255,0.03)',
                        border: isSelected ? '2px solid #00D4FF' : '1px solid rgba(255,255,255,0.08)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 6,
                        boxShadow: isSelected ? '0 0 16px rgba(0,212,255,0.25)' : 'none',
                        transition: 'all 0.18s'
                      }}
                    >
                      <span style={{ fontSize: '1.6rem' }}>{sec.icon}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isSelected ? '#fff' : '#A8A8C0' }}>{sec.name}</span>
                      {sec.description && (
                        <span style={{ fontSize: '0.65rem', color: '#5A5A7A', lineHeight: 1.2 }}>{sec.description}</span>
                      )}
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

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
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
                Özet ve Fiyat Onayı <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Özet, Fiyat & Paneli Başlatma ── */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.25)', borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ fontSize: '0.8rem', color: '#00D4FF', fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>
                Seçilen Hizmet ve Panel Özeti
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.85rem' }}>
                <div><span style={{ color: '#8F90A6' }}>Firma:</span> <strong>{formData.companyName}</strong></div>
                <div><span style={{ color: '#8F90A6' }}>Panel URL:</span> <strong style={{ color: '#6C63FF' }}>voicecore.ai/{formData.slug}</strong></div>
                <div><span style={{ color: '#8F90A6' }}>Hizmet Paketi:</span> <strong>{selectedService.title}</strong></div>
                <div><span style={{ color: '#8F90A6' }}>Dahili Sayısı:</span> <strong>{formData.extensionCount} Dahili</strong></div>
                <div><span style={{ color: '#8F90A6' }}>Seçilen Sektör:</span> <strong>{sectors.find(s => s.code === formData.sectorCode)?.name || 'Genel'}</strong></div>
                <div><span style={{ color: '#8F90A6' }}>Aylık Tutar:</span> <strong style={{ color: '#10B981', fontSize: '1rem' }}>{monthlyTotal.toLocaleString('tr-TR')} ₺/ay</strong></div>
              </div>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#8F90A6', margin: '0', lineHeight: 1.4 }}>
              "Paneli Oluştur ve Giriş Yap" butonuna bastığınızda seçtiğiniz dahili sayısı, sektörünüze özel canlı çağrı tablosu ve Asterisk santral yönlendirmeleriniz hazır edilecektir.
            </p>

            <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
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

      <div style={{ marginTop: 20, fontSize: '0.85rem', color: '#5A5A7A' }}>
        Zaten bir hesabınız var mı? <Link to="/login" style={{ color: '#6C63FF', fontWeight: 600, textDecoration: 'none' }}>Giriş Yap</Link>
      </div>

    </div>
  );
}
