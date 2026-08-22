import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  PhoneCall, Clock, Sun, Moon, Volume2, Plus, Trash2, 
  Save, CheckCircle2, AlertCircle, PhoneForwarded, Users, Bot, Mic
} from 'lucide-react';

const API_BASE = 'http://192.168.203.138:3000/api';

const DAYS = [
  { id: 'mon', label: 'Pazartesi' },
  { id: 'tue', label: 'Salı' },
  { id: 'wed', label: 'Çarşamba' },
  { id: 'thu', label: 'Perşembe' },
  { id: 'fri', label: 'Cuma' },
  { id: 'sat', label: 'Cumartesi' },
  { id: 'sun', label: 'Pazar' },
];

export default function PbxSettings() {
  const { tenant } = useAuth();
  const tenantId = tenant?.id || 'demo-tenant';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  
  // Tab: 'TIME' | 'DAY_ACTION' | 'NIGHT_ACTION' | 'IVR'
  const [activeTab, setActiveTab] = useState('TIME');

  // Form State
  const [config, setConfig] = useState({
    workDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    workStartHour: '08:30',
    workEndHour: '18:00',
    dayAction: 'IVR',
    dayTarget: '1001',
    nightAction: 'PLAYBACK',
    nightTarget: 'Mesai saatlerimiz dışındasınız. Lütfen mesai saatleri içinde tekrar arayınız.',
    ivrWelcomeText: 'Firmamıza hoş geldiniz. Satış ve bilgi için 1\'e, teknik destek için 2\'ye, muhasebe için 3\'e basınız.',
    ivrOptions: [
      { digit: '1', label: 'Satış & Bilgi', action: 'EXTENSION', target: '1001' },
      { digit: '2', label: 'Teknik Destek', action: 'EXTENSION', target: '1002' },
      { digit: '3', label: 'Muhasebe & Finans', action: 'EXTENSION', target: '1003' }
    ],
    ivrTimeoutAction: 'EXTENSION',
    ivrTimeoutTarget: '1001'
  });

  useEffect(() => {
    fetch(`${API_BASE}/tenants/${tenantId}/pbx`)
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          setConfig(res.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tenantId]);

  const toggleDay = (dayId) => {
    setConfig(prev => {
      const exists = prev.workDays.includes(dayId);
      return {
        ...prev,
        workDays: exists ? prev.workDays.filter(d => d !== dayId) : [...prev.workDays, dayId]
      };
    });
  };

  const handleAddIvrOption = () => {
    const nextDigit = String(config.ivrOptions.length + 1);
    setConfig(prev => ({
      ...prev,
      ivrOptions: [
        ...prev.ivrOptions,
        { digit: nextDigit, label: `Departman #${nextDigit}`, action: 'EXTENSION', target: '1001' }
      ]
    }));
  };

  const handleRemoveIvrOption = (index) => {
    setConfig(prev => ({
      ...prev,
      ivrOptions: prev.ivrOptions.filter((_, idx) => idx !== index)
    }));
  };

  const handleUpdateIvrOption = (index, field, value) => {
    setConfig(prev => {
      const updated = [...prev.ivrOptions];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, ivrOptions: updated };
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/pbx`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg('Santral yönlendirme ve IVR ayarları Asterisk\'e başarıyla kaydedildi!');
        setTimeout(() => setStatusMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px', color: '#fff' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #fff, #A8A8C0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Santral & Gelen Arama Ayarları
          </h1>
          <p style={{ margin: 0, color: '#8F90A6', fontSize: '0.9rem' }}>
            Mesai saatlerinizi, mesai içi/dışı yönlendirmelerinizi ve sesli karşılama (IVR) tuşlamalarını kolayca yönetin.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, #10B981, #00D4FF)',
            border: 'none', borderRadius: 10, padding: '10px 20px',
            color: '#fff', fontSize: '0.9rem', fontWeight: 800,
            cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow: '0 0 20px rgba(16,185,129,0.3)', opacity: saving ? 0.7 : 1
          }}
        >
          <Save size={16} /> {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
        </button>
      </div>

      {statusMsg && (
        <div style={{
          marginBottom: 20, padding: '12px 16px', borderRadius: 8,
          background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
          color: '#10B981', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8
        }}>
          <CheckCircle2 size={16} /> {statusMsg}
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
        {[
          { id: 'TIME', label: '⏰ Mesai Saatleri', icon: Clock },
          { id: 'DAY_ACTION', label: '☀️ Mesai İçi Akışı', icon: Sun },
          { id: 'NIGHT_ACTION', label: '🌙 Mesai Dışı Akışı', icon: Moon },
          { id: 'IVR', label: '🎙️ Sesli Karşılama & Tuşlama', icon: Volume2 },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: isActive ? 'rgba(108,99,255,0.18)' : 'rgba(255,255,255,0.03)',
                border: isActive ? '1px solid #6C63FF' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, padding: '10px 16px', color: isActive ? '#fff' : '#A8A8C0',
                fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: MESAİ SAATLERİ ── */}
      {activeTab === 'TIME' && (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 24 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 8px' }}>Çalışma Günleri ve Saatleri</h2>
          <p style={{ fontSize: '0.85rem', color: '#8F90A6', marginBottom: 20 }}>
            Santralin gelen çağrıları mesai içi veya mesai dışı olarak değerlendireceği zaman dilimini belirleyin.
          </p>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#A8A8C0', marginBottom: 10 }}>Çalışma Günleri</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {DAYS.map(d => {
                const isSelected = config.workDays.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDay(d.id)}
                    style={{
                      padding: '8px 14px', borderRadius: 8,
                      background: isSelected ? 'linear-gradient(135deg, #6C63FF, #00D4FF)' : 'rgba(255,255,255,0.05)',
                      border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.1)',
                      color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 400 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#A8A8C0', marginBottom: 6 }}>Mesai Başlangıç</label>
              <input
                type="time"
                value={config.workStartHour}
                onChange={(e) => setConfig({ ...config, workStartHour: e.target.value })}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#A8A8C0', marginBottom: 6 }}>Mesai Bitiş</label>
              <input
                type="time"
                value={config.workEndHour}
                onChange={(e) => setConfig({ ...config, workEndHour: e.target.value })}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: MESAİ İÇİ AKIŞI ── */}
      {activeTab === 'DAY_ACTION' && (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 24 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 8px' }}>Mesai Saatleri İçinde Gelen Arama Davranışı</h2>
          <p style={{ fontSize: '0.85rem', color: '#8F90A6', marginBottom: 20 }}>
            Çalışma saatleri içinde numaranız arandığında santralin uygulayacağı ilk eylemi seçin.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, marginBottom: 20 }}>
            {[
              { id: 'IVR', title: '🎙️ Sesli Karşılama (IVR)', desc: 'Karşılama anonsu çalar ve tuşlamalara göre aktarır.' },
              { id: 'RING_ALL', title: '📞 Tüm Dahilileri Çaldır', desc: 'Tüm çalışanların telefonları aynı anda çalar.' },
              { id: 'EXTENSION', title: '👤 Belirli Dahiliye Aktar', desc: 'Doğrudan santral sekreterini veya temsilciyi çaldırır.' },
              { id: 'AI_AGENT', title: '🤖 AI Sesli Asistan', desc: 'Çağrıyı doğrudan yapay zeka karşılar ve yönlendirir.' },
            ].map(act => {
              const isSelected = config.dayAction === act.id;
              return (
                <div
                  key={act.id}
                  onClick={() => setConfig({ ...config, dayAction: act.id })}
                  style={{
                    border: isSelected ? '2px solid #6C63FF' : '1px solid rgba(255,255,255,0.08)',
                    background: isSelected ? 'rgba(108,99,255,0.15)' : 'rgba(255,255,255,0.02)',
                    borderRadius: 12, padding: '16px', cursor: 'pointer', transition: 'all 0.15s'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{act.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#8F90A6', lineHeight: 1.3 }}>{act.desc}</div>
                </div>
              );
            })}
          </div>

          {config.dayAction === 'EXTENSION' && (
            <div style={{ maxWidth: 300 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#A8A8C0', marginBottom: 6 }}>Aktarılacak Dahili Numarası</label>
              <input
                type="text" placeholder="Örn: 1001"
                value={config.dayTarget || ''}
                onChange={(e) => setConfig({ ...config, dayTarget: e.target.value })}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: MESAİ DIŞI AKIŞI ── */}
      {activeTab === 'NIGHT_ACTION' && (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 24 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 8px' }}>Mesai Saatleri Dışında Gelen Arama Davranışı</h2>
          <p style={{ fontSize: '0.85rem', color: '#8F90A6', marginBottom: 20 }}>
            İşletmeniz kapalıyken arayan müşterilere uygulanacak kuralı belirleyin.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, marginBottom: 20 }}>
            {[
              { id: 'PLAYBACK', title: '📢 Bilgi Anonsu Çal & Kapat', desc: 'Kapalı olduğunuzu belirten ses kaydını dinletir.' },
              { id: 'FORWARD_PHONE', title: '📱 Nöbetçi Cep Telefonuna Aktar', desc: 'Aramayı yetkili GSM numarasına yönlendirir.' },
              { id: 'VOICEMAIL', title: '✉️ Sesli Mesaj Bıraktır', desc: 'Arayan kişinin sesli mesajını kaydeder ve e-posta atar.' },
              { id: 'AI_AGENT', title: '🤖 Nöbetçi AI Asistan', desc: 'Yapay zeka mesai dışı talepleri alır ve kaydeder.' },
            ].map(act => {
              const isSelected = config.nightAction === act.id;
              return (
                <div
                  key={act.id}
                  onClick={() => setConfig({ ...config, nightAction: act.id })}
                  style={{
                    border: isSelected ? '2px solid #00D4FF' : '1px solid rgba(255,255,255,0.08)',
                    background: isSelected ? 'rgba(0,212,255,0.12)' : 'rgba(255,255,255,0.02)',
                    borderRadius: 12, padding: '16px', cursor: 'pointer', transition: 'all 0.15s'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{act.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#8F90A6', lineHeight: 1.3 }}>{act.desc}</div>
                </div>
              );
            })}
          </div>

          {config.nightAction === 'FORWARD_PHONE' && (
            <div style={{ maxWidth: 320 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#A8A8C0', marginBottom: 6 }}>Yönlendirilecek GSM Numarası</label>
              <input
                type="text" placeholder="05XXXXXXXXX"
                value={config.nightTarget || ''}
                onChange={(e) => setConfig({ ...config, nightTarget: e.target.value })}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>
          )}

          {config.nightAction === 'PLAYBACK' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#A8A8C0', marginBottom: 6 }}>Mesai Dışı Sesli Mesaj Metni (TTS)</label>
              <textarea
                rows={2}
                value={config.nightTarget || ''}
                onChange={(e) => setConfig({ ...config, nightTarget: e.target.value })}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
              />
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: SESLİ KARŞILAMA (IVR) & TUŞLAMA MENÜSÜ ── */}
      {activeTab === 'IVR' && (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 24 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 8px' }}>Sesli Karşılama ve Tuşlama (IVR) Ayarları</h2>
          <p style={{ fontSize: '0.85rem', color: '#8F90A6', marginBottom: 20 }}>
            Müşterileriniz aradığında dinletilecek karşılama anonsunu ve bastıkları tuşlara göre nereye aktarılacaklarını belirleyin.
          </p>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#A8A8C0', marginBottom: 6 }}>
              Karşılama Anons Metni
            </label>
            <textarea
              rows={3}
              value={config.ivrWelcomeText || ''}
              onChange={(e) => setConfig({ ...config, ivrWelcomeText: e.target.value })}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>Tuşlama Eşlemeleri (Tuş 1, 2, 3...)</label>
              <button
                type="button"
                onClick={handleAddIvrOption}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(108,99,255,0.18)', border: '1px solid #6C63FF',
                  padding: '6px 12px', borderRadius: 8, color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer'
                }}
              >
                <Plus size={14} /> Yeni Tuş Ekle
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {config.ivrOptions?.map((opt, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10, padding: '12px 16px',
                    display: 'grid', gridTemplateColumns: '70px 1fr 1fr 1fr 40px', gap: 10, alignItems: 'center'
                  }}
                >
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#8F90A6', display: 'block' }}>Tuş</label>
                    <input
                      type="text"
                      value={opt.digit}
                      onChange={(e) => handleUpdateIvrOption(idx, 'digit', e.target.value)}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '6px', color: '#00D4FF', fontWeight: 800, textAlign: 'center', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#8F90A6', display: 'block' }}>Departman / Başlık</label>
                    <input
                      type="text"
                      value={opt.label}
                      onChange={(e) => handleUpdateIvrOption(idx, 'label', e.target.value)}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '6px 8px', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#8F90A6', display: 'block' }}>Eylem</label>
                    <select
                      value={opt.action}
                      onChange={(e) => handleUpdateIvrOption(idx, 'action', e.target.value)}
                      style={{ width: '100%', background: '#121226', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '6px 8px', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    >
                      <option value="EXTENSION">Dahiliye Aktar</option>
                      <option value="AI_AGENT">AI Sesli Asistana Aktar</option>
                      <option value="QUEUE">Çağrı Kuyruğuna Aktar</option>
                      <option value="EXTERNAL">Dış Numaraya Aktar</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#8F90A6', display: 'block' }}>Hedef (Dahili / No)</label>
                    <input
                      type="text"
                      value={opt.target || ''}
                      onChange={(e) => handleUpdateIvrOption(idx, 'target', e.target.value)}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '6px 8px', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveIvrOption(idx)}
                    style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 14 }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
