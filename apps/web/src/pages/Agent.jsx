import React, { useState, useEffect, useRef } from 'react';
import { Save, Play, History, Sparkles, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

export default function Agent() {
  const { tenant } = useAuth();
  const [agentId, setAgentId] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [agentName, setAgentName] = useState('VoiceCore Assistant');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
  const [statusMessage, setStatusMessage] = useState('');
  
  // Chat simulator state
  const [messages, setMessages] = useState([
    { role: 'agent', content: 'Merhaba! Ben VoiceCore AI asistanınızım. Size nasıl yardımcı olabilirim?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const tenantId = tenant?.id || tenant?.slug || 'voicecore-demo';

  // 1. Ajan bilgilerini yükle
  useEffect(() => {
    async function loadAgent() {
      try {
        setLoading(true);
        const res = await api.get(`/tenants/${tenantId}/agents`);
        const agents = res.data?.data || res.data || [];
        if (agents.length > 0) {
          const current = agents.find(a => a.isDefault) || agents[0];
          setAgentId(current.id);
          setPrompt(current.systemPrompt || 'Sen VoiceCore AI sesli asistanısın. Kısa, doğal ve profesyonel Türkçe konuş.');
          setAgentName(current.name || 'VoiceCore Assistant');
        } else {
          setPrompt('Sen VoiceCore AI sesli asistanısın. Kısa, doğal ve profesyonel Türkçe konuş.');
        }
      } catch (err) {
        console.error('Agent yüklenemedi:', err);
        setPrompt('Sen VoiceCore AI sesli asistanısın. Kısa, doğal ve profesyonel Türkçe konuş.');
      } finally {
        setLoading(false);
      }
    }

    if (tenantId) {
      loadAgent();
    }
  }, [tenantId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // 2. Prompt'u Kaydet ve Aktifleştir
  const handleSaveAndActivate = async () => {
    if (!prompt.trim()) return;
    try {
      setSaving(true);
      setSaveStatus(null);

      if (agentId) {
        // Mevcut ajanı güncelle
        await api.put(`/tenants/${tenantId}/agents/${agentId}`, {
          systemPrompt: prompt,
          status: 'ACTIVE'
        });
      }

      setSaveStatus('success');
      setStatusMessage('Prompt başarıyla kaydedildi ve santral ile senkronize edildi!');
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err) {
      console.error('Kaydetme hatası:', err);
      setSaveStatus('error');
      setStatusMessage('Kaydedilirken bir hata oluştu: ' + (err.response?.data?.error || err.message));
      setTimeout(() => setSaveStatus(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  // 3. Simülasyon Sohbeti Gönder
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isTyping) return;

    const userText = chatInput;
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      let botReply = 'Talebinizi aldım, size bu konuda yardımcı olmaktan memnuniyet duyarım.';
      const lower = userText.toLowerCase();
      if (lower.includes('merhaba') || lower.includes('selam')) {
        botReply = 'Merhaba! Hoş geldiniz. Size nasıl yardımcı olabilirim?';
      } else if (lower.includes('randevu') || lower.includes('görüşme')) {
        botReply = 'Hangi gün ve saat için randevu oluşturmak istersiniz?';
      } else if (lower.includes('fiyat') || lower.includes('ücret')) {
        botReply = 'Hizmet paketlerimiz ve güncel fiyatlandırma detaylarımız hakkında bilgi aktarabilirim.';
      }
      setMessages(prev => [...prev, { role: 'agent', content: botReply }]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="header-actions">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            AI Prompt Studio
            <span className="badge badge-info" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
              {agentName}
            </span>
          </h1>
          <p className="text-muted">Ajanınızın sesli yanıtlama davranışını ve sistem kurallarını belirleyin</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {saveStatus === 'success' && (
            <span style={{ color: '#22C55E', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', fontWeight: 600 }}>
              <CheckCircle2 size={16} /> {statusMessage}
            </span>
          )}
          {saveStatus === 'error' && (
            <span style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', fontWeight: 600 }}>
              <AlertCircle size={16} /> {statusMessage}
            </span>
          )}
          <button 
            className="btn btn-primary" 
            onClick={handleSaveAndActivate}
            disabled={saving || loading}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Kaydediliyor...' : 'Save & Activate'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', flex: 1, minHeight: '520px' }}>
        {/* Sol Panel: System Prompt */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>System Prompt (Yapay Zeka Talimatı)</h3>
            <span className="badge badge-info"><Sparkles size={12} style={{ display: 'inline', marginRight: '4px' }}/> Canlı Santral Aktif</span>
          </div>
          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : (
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
              placeholder="Yapay zekanızın nasıl konuşacağını buraya yazın..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          )}
        </div>

        {/* Sağ Panel: Test Chat */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Test Chat (Simülatör)</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>8kHz Telefon Modu</span>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                background: m.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '12px',
                borderBottomRightRadius: m.role === 'user' ? '4px' : '12px',
                borderBottomLeftRadius: m.role === 'agent' ? '4px' : '12px',
                maxWidth: '82%',
                border: m.role === 'agent' ? '1px solid var(--border)' : 'none',
                lineHeight: 1.5,
                fontSize: '0.95rem'
              }}>
                {m.content}
              </div>
            ))}
            {isTyping && (
              <div style={{ alignSelf: 'flex-start', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="status-dot active"></span> <span className="text-muted" style={{ fontSize: '0.85rem' }}>Asistan yanıtlıyor...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
            <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Asistanla test etmek için mesaj yazın..." 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px' }} disabled={isTyping}>
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

