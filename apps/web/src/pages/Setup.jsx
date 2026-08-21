import React, { useState } from 'react';
import { Check, ChevronRight, Phone, MessageSquare, PartyPopper, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

export default function Setup() {
  const { user, tenant } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Step 1: SIP Trunk Data
  const [trunkData, setTrunkData] = useState({
    provider: 'Custom SIP',
    phoneNumber: '+90 (555) 000-0000',
    sipHost: 'sip.provider.com',
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
    { id: 1, title: 'SIP Trunk', icon: Phone },
    { id: 2, title: 'AI Prompt', icon: MessageSquare },
    { id: 3, title: 'Test & Launch', icon: PartyPopper }
  ];

  const handleStep1Submit = async () => {
    if (!trunkData.sipUsername || !trunkData.sipPassword || !trunkData.sipHost) {
      setErrorMsg('Lütfen SIP Host, Kullanıcı Adı ve Şifre alanlarını doldurun.');
      return;
    }
    setErrorMsg('');
    setStep(2);
  };

  const handleStep2Submit = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      // 1. SIP Trunk oluştur ve PBX'e aktifleştir
      const trunkRes = await api.post(`/tenants/${tenantId}/trunks`, {
        label: trunkData.label || 'Ana Santral Hattı',
        phoneNumber: trunkData.phoneNumber,
        sipHost: trunkData.sipHost,
        sipPort: parseInt(trunkData.sipPort) || 5060,
        sipUsername: trunkData.sipUsername,
        sipPassword: trunkData.sipPassword
      });

      const createdTrunk = trunkRes.data?.data || trunkRes.data;
      if (createdTrunk?.id) {
        // Asterisk üzerinde aktifleştir
        await api.post(`/tenants/${tenantId}/trunks/${createdTrunk.id}/activate`);
      }

      // 2. Ajan promptunu güncelle
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
      console.error('Setup wizard hatası:', err);
      setErrorMsg('Kurulum sırasında hata oluştu: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1>Quick Setup Wizard</h1>
          <p className="text-muted">Yapay zeka sesli asistanınızı ve santral hattınızı 2 dakikada bağlayın</p>
        </div>

        {/* Adım Çubuğu */}
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

        {errorMsg && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={18} /> {errorMsg}
          </div>
        )}

        <div className="glass-card">
          {/* ADIM 1: SIP TRUNK */}
          {step === 1 && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <h2>Configure SIP Trunk (Santral Hattı)</h2>
              <p className="text-muted" style={{ marginBottom: '24px' }}>Santralinizin veya SIP operatörünüzün hat bilgilerini tanımlayın.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Provider / Sağlayıcı</label>
                  <select 
                    className="form-input" 
                    value={trunkData.provider}
                    onChange={e => setTrunkData({ ...trunkData, provider: e.target.value })}
                  >
                    <option>Custom SIP</option>
                    <option>NetGSM</option>
                    <option>Bulutfon</option>
                    <option>Twilio</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Telefon Numarası (CallerID)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="0850XXXXXXX" 
                    value={trunkData.phoneNumber}
                    onChange={e => setTrunkData({ ...trunkData, phoneNumber: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">SIP Sunucu / Host Adresi</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="sip.operatorunuz.com" 
                    value={trunkData.sipHost}
                    onChange={e => setTrunkData({ ...trunkData, sipHost: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SIP Kullanıcı Adı</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="SIP Kullanıcı Adı / Hat No" 
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
            </div>
          )}

          {/* ADIM 2: AI AGENT */}
          {step === 2 && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <h2>AI Agent Personality (Yapay Zeka Karakteri)</h2>
              <p className="text-muted" style={{ marginBottom: '24px' }}>Yapay zekanın telefon görüşmelerinde nasıl davranacağını belirleyin.</p>
              
              <div className="form-group">
                <label className="form-label">System Prompt (Yapay Zeka Talimatı)</label>
                <textarea 
                  className="form-input" 
                  rows={6} 
                  value={agentData.systemPrompt}
                  onChange={e => setAgentData({ ...agentData, systemPrompt: e.target.value })}
                  style={{ fontFamily: 'monospace', resize: 'vertical' }}
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
            </div>
          )}

          {/* ADIM 3: READY */}
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
              <h2 className="text-gradient" style={{ fontSize: '2.3rem' }}>Santral ve Asistanınız Hazır!</h2>
              <p className="text-muted" style={{ maxWidth: '450px', margin: '0 auto 32px auto' }}>
                SIP Trunk konfigürasyonu Asterisk santralinize yüklendi ve yapay zeka köprüsü aktifleştirildi.
              </p>
              
              <div style={{ 
                background: 'rgba(0,0,0,0.3)', border: '1px dashed var(--border)', 
                padding: '16px 28px', borderRadius: '12px', display: 'inline-block',
                marginBottom: '32px'
              }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 600, letterSpacing: '2px', color: 'var(--accent)' }}>
                  {trunkData.phoneNumber || '+90 (555) 123-4567'}
                </span>
              </div>
            </div>
          )}

          {/* Butonlar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
            {step === 2 && (
              <button className="btn btn-secondary" onClick={() => setStep(1)} disabled={loading}>
                Geri
              </button>
            )}
            {step === 1 && (
              <button className="btn btn-primary" onClick={handleStep1Submit}>
                Devam Et <ChevronRight size={18} />
              </button>
            )}
            {step === 2 && (
              <button className="btn btn-primary" onClick={handleStep2Submit} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                {loading ? 'Asterisk Santraline Yükleniyor...' : 'Tamamla ve Santrale Kaydet'}
              </button>
            )}
            {step === 3 && (
              <button className="btn btn-primary" onClick={() => window.location.href = '/dashboard'}>
                Dashboard'a Git
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

