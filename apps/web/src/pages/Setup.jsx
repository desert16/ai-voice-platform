import React, { useState, useEffect } from 'react';
import { 
  Check, ChevronRight, Phone, MessageSquare, PartyPopper, 
  Loader2, AlertCircle, Plus, Edit2, Trash2, RefreshCw, 
  CheckCircle2, Radio, Server, ShieldCheck, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

export default function Setup() {
  const { user, tenant } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchingTrunks, setFetchingTrunks] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Mevcut kayıtlı hatlar listesi
  const [trunks, setTrunks] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTrunkId, setEditingTrunkId] = useState(null);
  
  // Step 1: SIP Trunk Form Data
  const [trunkData, setTrunkData] = useState({
    provider: 'Custom SIP',
    phoneNumber: '',
    sipHost: '',
    sipPort: 5060,
    sipUsername: '',
    sipPassword: '',
    label: 'Ana Santral Hattı'
  });

  // Step 2: AI Agent Personality
  const [agentData, setAgentData] = useState({
    systemPrompt: 'Sen VoiceCore AI müşteri hizmetleri asistanısın. Müşterilere kibar, net ve kısa Türkçe cümlelerle yardımcı ol.',
    voiceModel: 'ElevenLabs - Rachel (Female)',
    language: 'Turkish (TR)'
  });

  const tenantId = user?.tenantId || tenant?.id;

  const steps = [
    { id: 1, title: 'SIP Hatları & Numaralar', icon: Phone },
    { id: 2, title: 'AI Ajan Karakteri', icon: MessageSquare },
    { id: 3, title: 'Hazır & Canlı Test', icon: PartyPopper }
  ];

  // 1. Mevcut hatları ve Ajanı sunucudan yükle
  const loadTrunksAndAgent = async () => {
    if (!tenantId) return;
    try {
      setFetchingTrunks(true);
      const res = await api.get(`/tenants/${tenantId}/trunks`);
      const list = res.data?.data || res.data || [];
      setTrunks(list);
      
      // Eğer hiç hat yoksa otomatik form aç
      if (list.length === 0) {
        setShowAddForm(true);
      } else {
        setShowAddForm(false);
      }

      // Ajan bilgilerini yükle
      const agentRes = await api.get(`/tenants/${tenantId}/agents`).catch(() => null);
      const agents = agentRes?.data?.data || agentRes?.data || [];
      if (agents.length > 0) {
        const currentAgent = agents[0];
        setAgentData({
          systemPrompt: currentAgent.systemPrompt || agentData.systemPrompt,
          voiceModel: currentAgent.voiceModel || agentData.voiceModel,
          language: currentAgent.language || agentData.language
        });
      }
    } catch (err) {
      console.error('Hatlar yüklenemedi:', err);
    } finally {
      setFetchingTrunks(false);
    }
  };

  useEffect(() => {
    loadTrunksAndAgent();
  }, [tenantId]);

  // Yeni Hat Ekleme Formunu Aç
  const handleOpenAddForm = () => {
    setEditingTrunkId(null);
    setTrunkData({
      provider: 'Custom SIP',
      phoneNumber: '',
      sipHost: '',
      sipPort: 5060,
      sipUsername: '',
      sipPassword: '',
      label: `Santral Hattı #${trunks.length + 1}`
    });
    setShowAddForm(true);
    setErrorMsg('');
  };

  // Mevcut Hattı Düzenleme Formunu Aç
  const handleEditTrunk = (trunk) => {
    setEditingTrunkId(trunk.id);
    setTrunkData({
      provider: 'Custom SIP',
      phoneNumber: trunk.phoneNumber || '',
      sipHost: trunk.sipHost || '',
      sipPort: trunk.sipPort || 5060,
      sipUsername: trunk.sipUsername || '',
      sipPassword: trunk.sipPassword || '',
      label: trunk.label || ''
    });
    setShowAddForm(true);
    setErrorMsg('');
  };

  // Hattı Kaydet veya Güncelle
  const handleSaveTrunk = async (e) => {
    e?.preventDefault();
    if (!trunkData.sipUsername || !trunkData.sipHost) {
      setErrorMsg('Lütfen SIP Host ve Kullanıcı Adı alanlarını doldurun.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      if (editingTrunkId) {
        // Güncelle
        await api.put(`/tenants/${tenantId}/trunks/${editingTrunkId}`, {
          label: trunkData.label,
          phoneNumber: trunkData.phoneNumber,
          sipHost: trunkData.sipHost,
          sipPort: parseInt(trunkData.sipPort) || 5060,
          sipUsername: trunkData.sipUsername,
          sipPassword: trunkData.sipPassword
        });
        setSuccessMsg('Hat bilgileri güncellendi ve santral senkronize edildi.');
      } else {
        // Yeni Oluştur
        const res = await api.post(`/tenants/${tenantId}/trunks`, {
          label: trunkData.label,
          phoneNumber: trunkData.phoneNumber,
          sipHost: trunkData.sipHost,
          sipPort: parseInt(trunkData.sipPort) || 5060,
          sipUsername: trunkData.sipUsername,
          sipPassword: trunkData.sipPassword
        });
        const created = res.data?.data || res.data;
        if (created?.id) {
          await api.post(`/tenants/${tenantId}/trunks/${created.id}/activate`);
        }
        setSuccessMsg('Yeni hat başarıyla eklendi ve Asterisk santraline yüklendi.');
      }

      await loadTrunksAndAgent();
      setShowAddForm(false);
      setEditingTrunkId(null);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Trunk kaydetme hatası:', err);
      setErrorMsg('Hat kaydedilirken hata oluştu: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Hattı Sil
  const handleDeleteTrunk = async (id, phone) => {
    if (!window.confirm(`${phone || 'Bu hat'} santralden silinecek. Onaylıyor musunuz?`)) return;
    try {
      setLoading(true);
      await api.delete(`/tenants/${tenantId}/trunks/${id}`);
      setSuccessMsg('Hat başarıyla silindi ve santralden kaldırıldı.');
      await loadTrunksAndAgent();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg('Silme hatası: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Hattı Yeniden Aktifleştir (Re-sync)
  const handleReactivateTrunk = async (id) => {
    try {
      setLoading(true);
      await api.post(`/tenants/${tenantId}/trunks/${id}/activate`);
      setSuccessMsg('Hat Asterisk üzerinde yeniden yüklendi.');
      await loadTrunksAndAgent();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg('Yeniden yükleme hatası: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Adım 2: Ajanı Kaydet ve Bitir
  const handleStep2Submit = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const agentRes = await api.get(`/tenants/${tenantId}/agents`);
      const agents = agentRes.data?.data || agentRes.data || [];
      if (agents.length > 0) {
        await api.put(`/tenants/${tenantId}/agents/${agents[0].id}`, {
          systemPrompt: agentData.systemPrompt,
          voiceModel: agentData.voiceModel,
          language: agentData.language,
          status: 'ACTIVE'
        });
      }

      setStep(3);
    } catch (err) {
      console.error('Ajan kaydetme hatası:', err);
      setErrorMsg('Ajan kaydedilirken hata oluştu: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div style={{ maxWidth: '850px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Santral ve Asistan Kurulumu</h1>
          <p className="text-muted">Numaralarınızı tanımlayın, yapay zeka karakterini belirleyin ve aramaları karşılayın</p>
        </div>

        {/* Adım Çubuğu */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '24px', left: '0', right: '0', height: '2px', background: 'var(--border)', zIndex: 0 }} />
          <div style={{ position: 'absolute', top: '24px', left: '0', width: `${((step - 1) / 2) * 100}%`, height: '2px', background: 'var(--accent)', zIndex: 0, transition: 'width 0.3s ease' }} />
          
          {steps.map((s) => (
            <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', zIndex: 1 }}>
              <div style={{ 
                width: '46px', height: '46px', borderRadius: '50%', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: step >= s.id ? 'var(--primary)' : 'var(--surface)',
                border: `2px solid ${step >= s.id ? 'var(--primary)' : 'var(--border)'}`,
                color: step >= s.id ? 'white' : 'var(--text-muted)',
                transition: 'all 0.3s ease',
                boxShadow: step === s.id ? '0 0 20px rgba(108, 99, 255, 0.4)' : 'none'
              }}>
                {step > s.id ? <Check size={22} /> : <s.icon size={22} />}
              </div>
              <span style={{ fontWeight: step >= s.id ? 600 : 400, fontSize: '0.9rem', color: step >= s.id ? 'var(--text-main)' : 'var(--text-muted)' }}>
                {s.title}
              </span>
            </div>
          ))}
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={18} /> {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22C55E', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={18} /> {successMsg}
          </div>
        )}

        <div className="glass-card" style={{ padding: '32px' }}>
          {/* ======================================================== */}
          {/* ADIM 1: SIP HAT VE NUMARA YÖNETİMİ                       */}
          {/* ======================================================== */}
          {step === 1 && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', margin: 0 }}>Tanımlı Santral Hatları (SIP Trunk)</h2>
                  <p className="text-muted" style={{ margin: '4px 0 0 0', fontSize: '0.9rem' }}>
                    Yapay zekanın çağrı alacağı ve arama yapacağı aktif telefon numaraları
                  </p>
                </div>
                {!showAddForm && (
                  <button 
                    className="btn btn-primary" 
                    onClick={handleOpenAddForm}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', fontSize: '0.9rem' }}
                  >
                    <Plus size={16} /> Yeni Numara Ekle
                  </button>
                )}
              </div>

              {/* A. YENİ HAT EKLEME / DÜZENLEME FORMU */}
              {showAddForm ? (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Phone size={18} color="var(--accent)" />
                      {editingTrunkId ? 'Hat Bilgilerini Düzenle' : 'Yeni Telefon Numarası / SIP Trunk Tanımla'}
                    </h3>
                    {trunks.length > 0 && (
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={() => { setShowAddForm(false); setEditingTrunkId(null); }}
                        style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                      >
                        İptal / Listeye Dön
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSaveTrunk}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">Hat Tanımı / Etiket</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Örn: Ana Santral Hattı" 
                          value={trunkData.label}
                          onChange={e => setTrunkData({ ...trunkData, label: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Telefon Numarası (CallerID)</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="0850XXXXXXX veya 905XXXXXXXXX" 
                          value={trunkData.phoneNumber}
                          onChange={e => setTrunkData({ ...trunkData, phoneNumber: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Sağlayıcı / Operatör</label>
                        <select 
                          className="form-input" 
                          value={trunkData.provider}
                          onChange={e => setTrunkData({ ...trunkData, provider: e.target.value })}
                        >
                          <option>Custom SIP</option>
                          <option>NetGSM</option>
                          <option>Bulutfon</option>
                          <option>Verimor</option>
                          <option>Twilio</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">SIP Sunucu / Host Adresi</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="sip.operatorunuz.com veya IP" 
                          value={trunkData.sipHost}
                          onChange={e => setTrunkData({ ...trunkData, sipHost: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">SIP Kullanıcı Adı / Hat No</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Kullanıcı Adı" 
                          value={trunkData.sipUsername}
                          onChange={e => setTrunkData({ ...trunkData, sipUsername: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">SIP Şifresi</label>
                        <input 
                          type="password" 
                          className="form-input" 
                          placeholder="••••••••" 
                          value={trunkData.sipPassword}
                          onChange={e => setTrunkData({ ...trunkData, sipPassword: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                      <button 
                        type="submit" 
                        className="btn btn-primary" 
                        disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}
                      >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        {editingTrunkId ? 'Değişiklikleri Kaydet & Santrali Güncelle' : 'Kaydet ve Asterisk Santraline Bağla'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : null}

              {/* B. KAYITLI HATLAR LİSTESİ */}
              {fetchingTrunks ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <Loader2 size={28} className="animate-spin" />
                </div>
              ) : trunks.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
                  {trunks.map((t, idx) => (
                    <div 
                      key={t.id} 
                      style={{ 
                        background: 'rgba(255,255,255,0.04)', 
                        border: '1px solid rgba(255,255,255,0.09)', 
                        borderRadius: '14px', 
                        padding: '18px 22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 12,
                          background: 'linear-gradient(135deg, rgba(108,99,255,0.2), rgba(0,212,255,0.2))',
                          border: '1px solid rgba(108,99,255,0.3)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#00D4FF'
                        }}>
                          <Phone size={20} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '0.5px' }}>
                              {t.phoneNumber || 'Numara Belirtilmemiş'}
                            </span>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                              ({t.label || `Hat #${idx + 1}`})
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            <span>SIP Host: <b style={{ color: 'var(--text-main)' }}>{t.sipHost}</b></span>
                            <span>Kullanıcı: <b style={{ color: 'var(--text-main)' }}>{t.sipUsername}</b></span>
                          </div>
                        </div>
                      </div>

                      {/* Sağ Taraf: Canlı Durum ve Aksiyonlar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        {/* Durum Rozeti */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '6px 12px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600,
                          background: t.status === 'ACTIVE' || t.status === 'REGISTERED' 
                            ? 'rgba(34,197,94,0.12)' 
                            : t.status === 'REGISTERING' 
                            ? 'rgba(0,212,255,0.12)' 
                            : 'rgba(239,68,68,0.12)',
                          color: t.status === 'ACTIVE' || t.status === 'REGISTERED' 
                            ? '#22C55E' 
                            : t.status === 'REGISTERING' 
                            ? '#00D4FF' 
                            : '#EF4444',
                          border: `1px solid ${
                            t.status === 'ACTIVE' || t.status === 'REGISTERED' 
                              ? 'rgba(34,197,94,0.25)' 
                              : t.status === 'REGISTERING' 
                              ? 'rgba(0,212,255,0.25)' 
                              : 'rgba(239,68,68,0.25)'
                          }`
                        }}>
                          <span style={{
                            width: 7, height: 7, borderRadius: '50%',
                            background: t.status === 'ACTIVE' || t.status === 'REGISTERED' ? '#22C55E' : t.status === 'REGISTERING' ? '#00D4FF' : '#EF4444',
                            boxShadow: t.status === 'ACTIVE' || t.status === 'REGISTERED' ? '0 0 8px #22C55E' : 'none'
                          }} />
                          {t.status === 'ACTIVE' || t.status === 'REGISTERED' ? 'Asterisk Aktif (Kayıtlı)' : t.status === 'REGISTERING' ? 'Kayıt Olunuyor...' : 'Bağlantı Bekliyor'}
                        </div>

                        {/* Aksiyon Butonları */}
                        <button 
                          type="button"
                          className="btn btn-secondary" 
                          onClick={() => handleReactivateTrunk(t.id)}
                          title="Santrali Yeniden Yükle"
                          style={{ padding: '8px 10px' }}
                          disabled={loading}
                        >
                          <RefreshCw size={14} />
                        </button>
                        <button 
                          type="button"
                          className="btn btn-secondary" 
                          onClick={() => handleEditTrunk(t)}
                          title="Hattı Düzenle"
                          style={{ padding: '8px 10px' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          type="button"
                          className="btn btn-danger" 
                          onClick={() => handleDeleteTrunk(t.id, t.phoneNumber)}
                          title="Hattı Sil"
                          style={{ padding: '8px 10px' }}
                          disabled={loading}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Devam Butonu */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={() => setStep(2)}
                  disabled={trunks.length === 0}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', fontSize: '0.95rem' }}
                >
                  Yapay Zeka Promptu ile Devam Et <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ADIM 2: AI AGENT PERSONALITY                              */}
          {/* ======================================================== */}
          {step === 2 && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '8px' }}>Yapay Zeka Asistan Karakteri</h2>
              <p className="text-muted" style={{ marginBottom: '24px', fontSize: '0.9rem' }}>
                Telefon aramalarında müşterilerinizi karşılayacak yapay zekanın davranış ve konuşma kuralları
              </p>
              
              <div className="form-group">
                <label className="form-label">System Prompt (Yapay Zeka Talimatı)</label>
                <textarea 
                  className="form-input" 
                  rows={6} 
                  value={agentData.systemPrompt}
                  onChange={e => setAgentData({ ...agentData, systemPrompt: e.target.value })}
                  style={{ fontFamily: 'monospace', resize: 'vertical', fontSize: '0.95rem', lineHeight: 1.5 }}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Ses Modeli</label>
                  <select 
                    className="form-input"
                    value={agentData.voiceModel}
                    onChange={e => setAgentData({ ...agentData, voiceModel: e.target.value })}
                  >
                    <option>ElevenLabs - Rachel (Female)</option>
                    <option>ElevenLabs - Drew (Male)</option>
                    <option>OpenAI - Alloy (Neutral)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Dil</label>
                  <select 
                    className="form-input"
                    value={agentData.language}
                    onChange={e => setAgentData({ ...agentData, language: e.target.value })}
                  >
                    <option>Turkish (TR)</option>
                    <option>English (US)</option>
                    <option>German (DE)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-secondary" onClick={() => setStep(1)} disabled={loading}>
                  <ArrowLeft size={16} style={{ display: 'inline', marginRight: 6 }} /> Geri (Hatlar)
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleStep2Submit} 
                  disabled={loading} 
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px' }}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  {loading ? 'Santrale Kaydediliyor...' : 'Tamamla ve Canlıya Al'}
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ADIM 3: TEST & LAUNCH                                     */}
          {/* ======================================================== */}
          {step === 3 && (
            <div style={{ animation: 'fadeIn 0.3s ease', textAlign: 'center', padding: '30px 0' }}>
              <div style={{ 
                width: '76px', height: '76px', borderRadius: '50%', 
                background: 'rgba(52, 199, 89, 0.12)', color: '#34C759',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px auto',
                boxShadow: '0 0 30px rgba(52, 199, 89, 0.25)'
              }}>
                <PartyPopper size={38} />
              </div>
              <h2 className="text-gradient" style={{ fontSize: '2.2rem', marginBottom: 8 }}>Santraliniz Canlıda!</h2>
              <p className="text-muted" style={{ maxWidth: '480px', margin: '0 auto 28px auto' }}>
                Tüm hatlarınız Asterisk 22 santraline bağlandı ve yapay zeka ses köprüsü aktifleştirildi. Tanımlı numaralarınızı arayarak canlı test yapabilirsiniz.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 400, margin: '0 auto 32px auto' }}>
                {trunks.map(t => (
                  <div key={t.id} style={{ 
                    background: 'rgba(0,0,0,0.35)', border: '1px dashed rgba(108,99,255,0.4)', 
                    padding: '12px 20px', borderRadius: '12px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent)' }}>
                      {t.phoneNumber || 'Numara'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {t.label}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                <button className="btn btn-secondary" onClick={() => setStep(1)}>
                  Hatları Yönet
                </button>
                <button className="btn btn-primary" onClick={() => window.location.href = '/dashboard'}>
                  Dashboard'a Git
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


