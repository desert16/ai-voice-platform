import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, PhoneCall, Bot, Layers, Sparkles, Check, 
  ArrowRight, ArrowLeft, ShieldCheck, Zap, Globe, Lock, Mail, Phone,
  Users, DollarSign, Calculator, CheckCircle2, Headphones, CreditCard,
  Building, CheckCircle, Shield
} from 'lucide-react';

const API_BASE = 'http://192.168.203.138:3000/api';

const FALLBACK_SECTORS = [
  { code: 'health',            name: 'Sağlık & Klinik',      icon: '🏥', description: 'Diş, göz, estetik, poliklinik' },
  { code: 'real_estate',       name: 'Emlak & Gayrimenkul',  icon: '🏠', description: 'Satılık/kiralık portföy, konut' },
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

const PACKAGES = [
  {
    id: 'PBX_STANDALONE',
    title: '☎️ Bulut Santral',
    badge: 'Temel Santral',
    icon: PhoneCall,
    desc: 'Dahili hatlar, SIP Trunk, IVR sesli karşılama, mesai saatleri ve ses kayıtları.',
    basePrice: 199,
    includedExt: 3,
    perExtPrice: 49,
    features: ['3 Dahili Hat Dahil', 'Sesli Karşılama (IVR)', 'Mesai İçi / Dışı Yönlendirme', 'Ses Kayıtları & Geçmiş'],
    hasPbx: true,
    hasCallCenter: false,
    hasAiAgent: false,
    hasCrm: false,
    serviceType: 'PBX_ONLY'
  },
  {
    id: 'PBX_CALL_CENTER',
    title: '🎧 Santral + Çağrı Merkezi',
    badge: 'Müşteri Hizmetleri',
    icon: Headphones,
    desc: 'Santrale ek olarak çağrı kuyrukları, canlı wallboard, temsilci yönetimi ve SLA raporları.',
    basePrice: 499,
    includedExt: 5,
    perExtPrice: 49,
    features: ['5 Dahili & Temsilci Dahil', 'Çağrı Kuyrukları & Dağıtım', 'Canlı Duvar Panosu (Wallboard)', 'Detaylı Çağrı Merkezi Raporları'],
    hasPbx: true,
    hasCallCenter: true,
    hasAiAgent: false,
    hasCrm: false,
    serviceType: 'PBX_ONLY'
  },
  {
    id: 'AI_VOICE_AGENT',
    title: '🤖 Sadece AI Sesli Asistan',
    badge: 'Santrali Olanlar İçin',
    icon: Bot,
    desc: 'Mevcut santralinize bağlanan 7/24 konuşan yapay zeka ve sektörel veri toplama tablosu.',
    basePrice: 899,
    includedExt: 1,
    perExtPrice: 0,
    features: ['Gemini Live 8kHz Ses Motoru', 'Sektörel Akış & Parametreler', 'Canlı Çağrı / Lead Tablosu', '5.000 Konuşma Dakikası'],
    hasPbx: false,
    hasCallCenter: false,
    hasAiAgent: true,
    hasCrm: true,
    serviceType: 'AI_AGENT_ONLY'
  },
  {
    id: 'FULL_SUITE',
    title: '⭐ Tam Paket (All-in-One)',
    badge: 'En Popüler',
    popular: true,
    icon: Sparkles,
    desc: 'Bulut Santral + Çağrı Merkezi + AI Sesli Asistan + Sektörel CRM tek platformda bir arada.',
    basePrice: 1299,
    includedExt: 10,
    perExtPrice: 49,
    features: ['10 Dahili & Temsilci Dahil', 'Kuyruklar & Canlı Wallboard', 'AI Sesli Asistan (7/24 Randevu)', 'Sektörel CRM & Canlı Tablo'],
    hasPbx: true,
    hasCallCenter: true,
    hasAiAgent: true,
    hasCrm: true,
    serviceType: 'FULL_SUITE'
  }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [sectors, setSectors] = useState(FALLBACK_SECTORS);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Seçili Paket & Parametreler
  const [selectedPackageId, setSelectedPackageId] = useState('PBX_STANDALONE');
  const [extensionCount, setExtensionCount] = useState(3);
  const [paymentMethod, setPaymentMethod] = useState('CARD'); // 'CARD' | 'BANK_TRANSFER'

  // Kredi Kartı Form State (Simülasyon)
  const [cardData, setCardData] = useState({
    nameOnCard: '',
    cardNumber: '4543 •••• •••• 9012',
    expiry: '12/28',
    cvv: '•••'
  });

  // Form State
  const [formData, setFormData] = useState({
    companyName: '',
    slug: '',
    email: '',
    phone: '',
    password: '',
    sectorCode: 'real_estate',
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
      .catch(() => {});
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

  const currentPkg = PACKAGES.find(p => p.id === selectedPackageId) || PACKAGES[0];

  // Fiyat Hesaplama
  const extraExt = Math.max(0, extensionCount - currentPkg.includedExt);
  const monthlyTotal = currentPkg.basePrice + (extraExt * currentPkg.perExtPrice);

  const handlePackageSelect = (pkg) => {
    setSelectedPackageId(pkg.id);
    setExtensionCount(pkg.includedExt);
  };

  const handleCompleteOrder = async () => {
    try {
      setSubmitting(true);
      setErrorMsg('');

      const payload = {
        companyName: formData.companyName,
        slug: formData.slug,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        serviceType: currentPkg.serviceType,
        sectorCode: formData.sectorCode,
        hasPbx: currentPkg.hasPbx,
        hasCallCenter: currentPkg.hasCallCenter,
        hasAiAgent: currentPkg.hasAiAgent,
        hasCrm: currentPkg.hasCrm,
        extensionCount: extensionCount,
        initialGreeting: formData.initialGreeting,
      };

      const res = await fetch(`${API_BASE}/auth/register-tenant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Kayıt sırasında bir hata oluştu');
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
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #6C63FF, #00D4FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(108,99,255,0.5)' }}>
            <Zap size={22} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.03em' }}>
            Voice<span style={{ color: '#6C63FF' }}>Core</span> AI
          </span>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          Yeni Nesil İletişim & Santral Sisteminizi Kurun
        </h1>
        <p style={{ color: '#8F90A6', fontSize: '0.9rem', margin: 0 }}>
          Paketinizi belirleyin, sektörünüze özel parametreleri seçin; paneliniz saniyeler içinde hazır olsun.
        </p>
      </div>

      {/* Main Wizard Container */}
      <div style={{
        width: '100%', maxWidth: 840,
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20, padding: '30px 36px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        position: 'relative'
      }}>

        {/* Step Indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, position: 'relative' }}>
          {[
            { num: 1, label: '1. Firma Bilgisi' },
            { num: 2, label: '2. Paket & Dahili' },
            { num: 3, label: '3. Sektör & Akış' },
            { num: 4, label: '4. Ödeme & Başlat' },
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

        {/* ── ADIM 1: Firma & Giriş Bilgileri ── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#A8A8C0', marginBottom: 6 }}>Firma Adınız *</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Building2 size={16} color="#6C63FF" style={{ position: 'absolute', left: 14 }} />
                <input
                  type="text" required placeholder="Örn: Akkuş Gayrimenkul"
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
                    type="email" required placeholder="yonetici@firma.com"
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
              Hizmet Paketi Seçimiyle Devam Et <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ── ADIM 2: 4 Temel Paket & Dahili Sayısı Seçimi ── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: '0.85rem', color: '#8F90A6' }}>
              İşletmenizin ihtiyacına uygun temel paketi seçin (İhtiyacınıza göre diğer modülleri istediğiniz zaman ekleyebilirsiniz):
            </div>

            {/* 4 Temel Paket Kartı */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {PACKAGES.map((pkg) => {
                const Icon = pkg.icon;
                const isSelected = selectedPackageId === pkg.id;

                return (
                  <div
                    key={pkg.id}
                    onClick={() => handlePackageSelect(pkg)}
                    style={{
                      border: isSelected ? '2px solid #6C63FF' : '1px solid rgba(255,255,255,0.08)',
                      background: isSelected ? 'rgba(108,99,255,0.12)' : 'rgba(255,255,255,0.02)',
                      borderRadius: 12, padding: '16px', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10,
                      boxShadow: isSelected ? '0 0 20px rgba(108,99,255,0.25)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: isSelected ? 'linear-gradient(135deg, #6C63FF, #00D4FF)' : 'rgba(255,255,255,0.06)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <Icon size={16} color="#fff" />
                          </div>
                          <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{pkg.title}</span>
                        </div>
                        <span style={{ fontSize: '0.65rem', background: isSelected ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.06)', color: isSelected ? '#00D4FF' : '#8F90A6', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                          {pkg.badge}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#8F90A6', lineHeight: 1.3 }}>
                        {pkg.desc}
                      </p>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                        {pkg.basePrice.toLocaleString('tr-TR')} ₺<span style={{ fontSize: '0.75rem', color: '#8F90A6', fontWeight: 400 }}> / ay</span>
                      </span>
                      <div style={{
                        width: 16, height: 16, borderRadius: '50%',
                        border: isSelected ? '4px solid #6C63FF' : '2px solid rgba(255,255,255,0.2)',
                        background: '#fff'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dahili Sayısı Seçimi (Santral veya Call Center paketleri için) */}
            {currentPkg.hasPbx && (
              <div style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12, padding: '14px 18px', marginTop: 4
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Users size={16} color="#00D4FF" />
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>İhtiyaç Duyulan Dahili (Kullanıcı) Sayısı</span>
                  </div>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#00D4FF' }}>
                    {extensionCount} Dahili
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[3, 5, 10, 20, 50, 100].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setExtensionCount(cnt)}
                      style={{
                        flex: 1, minWidth: 40, padding: '6px',
                        background: extensionCount === cnt ? 'linear-gradient(135deg, #6C63FF, #00D4FF)' : 'rgba(255,255,255,0.05)',
                        border: extensionCount === cnt ? 'none' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 6, color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Canlı Fiyatlandırma Kutusu */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(0,212,255,0.15))',
              border: '1px solid rgba(0,212,255,0.3)', borderRadius: 12, padding: '12px 18px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#00D4FF', fontWeight: 700, textTransform: 'uppercase' }}>Aylık Paket Tutarı</div>
                <div style={{ fontSize: '0.8rem', color: '#A8A8C0' }}>{currentPkg.title} ({extensionCount} Dahili)</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>{monthlyTotal.toLocaleString('tr-TR')} ₺</span>
                <span style={{ fontSize: '0.75rem', color: '#8F90A6' }}> / ay</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <button
                onClick={() => setStep(1)}
                style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 10, padding: '12px', color: '#A8A8C0', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <ArrowLeft size={16} /> Geri
              </button>
              <button
                onClick={() => setStep(3)}
                style={{ flex: 2, background: 'linear-gradient(135deg, #6C63FF, #00D4FF)', border: 'none', borderRadius: 10, padding: '12px', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                Sektör Seçimiyle Devam Et <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── ADIM 3: Sektör Seçimi ── */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                  Faaliyet Gösterdiğiniz Sektörü Seçin *
                </label>
                <span style={{ fontSize: '0.75rem', color: '#00D4FF' }}>{sectors.length} Sektör Mevcut</span>
              </div>

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
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                onClick={() => setStep(2)}
                style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 10, padding: '12px', color: '#A8A8C0', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <ArrowLeft size={16} /> Geri
              </button>
              <button
                onClick={() => setStep(4)}
                style={{ flex: 2, background: 'linear-gradient(135deg, #6C63FF, #00D4FF)', border: 'none', borderRadius: 10, padding: '12px', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                Ödeme ve Paneli Başlat <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── ADIM 4: Sipariş Özeti, Ödeme & Paneli Açma ── */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Sipariş Özeti */}
            <div style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.25)', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontSize: '0.8rem', color: '#00D4FF', fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>
                Sipariş & Panel Özeti
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.85rem' }}>
                <div><span style={{ color: '#8F90A6' }}>Firma Adı:</span> <strong>{formData.companyName}</strong></div>
                <div><span style={{ color: '#8F90A6' }}>Özel URL:</span> <strong style={{ color: '#6C63FF' }}>voicecore.ai/{formData.slug}</strong></div>
                <div><span style={{ color: '#8F90A6' }}>Seçilen Paket:</span> <strong>{currentPkg.title}</strong></div>
                <div><span style={{ color: '#8F90A6' }}>Dahili Sayısı:</span> <strong>{extensionCount} Dahili</strong></div>
                <div><span style={{ color: '#8F90A6' }}>Sektör:</span> <strong>{sectors.find(s => s.code === formData.sectorCode)?.name || 'Genel'}</strong></div>
                <div><span style={{ color: '#8F90A6' }}>Aylık Tutar:</span> <strong style={{ color: '#10B981', fontSize: '1.1rem' }}>{monthlyTotal.toLocaleString('tr-TR')} ₺/ay</strong></div>
              </div>
            </div>

            {/* Ödeme Yöntemi Seçimi */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#A8A8C0', marginBottom: 8, display: 'block' }}>
                Ödeme Yöntemi Seçin
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div
                  onClick={() => setPaymentMethod('CARD')}
                  style={{
                    padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                    background: paymentMethod === 'CARD' ? 'rgba(108,99,255,0.2)' : 'rgba(255,255,255,0.03)',
                    border: paymentMethod === 'CARD' ? '2px solid #6C63FF' : '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', gap: 10
                  }}
                >
                  <CreditCard size={18} color="#00D4FF" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Kredi / Banka Kartı</div>
                    <div style={{ fontSize: '0.7rem', color: '#8F90A6' }}>3D Secure ile Anında Açılış</div>
                  </div>
                </div>

                <div
                  onClick={() => setPaymentMethod('BANK_TRANSFER')}
                  style={{
                    padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                    background: paymentMethod === 'BANK_TRANSFER' ? 'rgba(108,99,255,0.2)' : 'rgba(255,255,255,0.03)',
                    border: paymentMethod === 'BANK_TRANSFER' ? '2px solid #6C63FF' : '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', gap: 10
                  }}
                >
                  <Building size={18} color="#10B981" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Kurumsal Havale / EFT</div>
                    <div style={{ fontSize: '0.7rem', color: '#8F90A6' }}>14 Gün Ücretsiz Deneme</div>
                  </div>
                </div>
              </div>

              {/* Kredi Kartı Bilgileri Alanı */}
              {paymentMethod === 'CARD' && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#8F90A6', display: 'block', marginBottom: 4 }}>Kart Numarası</label>
                      <input
                        type="text"
                        value={cardData.cardNumber}
                        onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value })}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '8px', color: '#fff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#8F90A6', display: 'block', marginBottom: 4 }}>Son Kullanma</label>
                      <input
                        type="text"
                        value={cardData.expiry}
                        onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '8px', color: '#fff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#8F90A6', display: 'block', marginBottom: 4 }}>CVV</label>
                      <input
                        type="password"
                        value={cardData.cvv}
                        onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '8px', color: '#fff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: '#10B981' }}>
                    <Shield size={12} /> 256-Bit SSL Güvenli Ödeme Altyapısı ile korunmaktadır.
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                disabled={submitting}
                onClick={() => setStep(3)}
                style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 10, padding: '12px', color: '#A8A8C0', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <ArrowLeft size={16} /> Geri
              </button>
              <button
                disabled={submitting}
                onClick={handleCompleteOrder}
                style={{
                  flex: 2, background: 'linear-gradient(135deg, #10B981, #00D4FF)',
                  border: 'none', borderRadius: 10, padding: '13px', color: '#fff',
                  fontWeight: 800, fontSize: '0.95rem', cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 0 24px rgba(16,185,129,0.4)', opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? 'Panel Kuruluyor...' : '🚀 Ödemeyi Tamamla ve Paneli Başlat'}
              </button>
            </div>
          </div>
        )}

      </div>

      <div style={{ marginTop: 18, fontSize: '0.85rem', color: '#5A5A7A' }}>
        Zaten bir hesabınız var mı? <Link to="/login" style={{ color: '#6C63FF', fontWeight: 600, textDecoration: 'none' }}>Giriş Yap</Link>
      </div>

    </div>
  );
}
