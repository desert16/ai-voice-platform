import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  Boxes, CheckCircle2, XCircle, Sparkles, RefreshCw, 
  Layers, Shield, PhoneCall, Calendar, Home, Wrench, 
  ShoppingBag, Truck, MessageSquare, ShieldAlert, Bot
} from 'lucide-react';

const API_BASE = 'http://192.168.203.138:3000/api';

const MODULE_ICONS = {
  ai_voice: PhoneCall,
  crm: Layers,
  call_center: PhoneCall,
  appointment: Calendar,
  property: Home,
  patient: Layers,
  reservation: Calendar,
  order: ShoppingBag,
  service: Wrench,
  shipping: Truck,
  inventory: Boxes,
  whatsapp: MessageSquare,
  sms: MessageSquare,
  ai_chat: Bot,
  fraud_shield: ShieldAlert,
};

export default function Modules() {
  const { tenant } = useAuth();
  const [modules, setModules] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [applyingSector, setApplyingSector] = useState(false);
  const [selectedSectorId, setSelectedSectorId] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const tenantId = tenant?.id || 'demo-tenant';

  const fetchModules = async () => {
    try {
      setLoading(true);
      const [modRes, secRes] = await Promise.all([
        fetch(`${API_BASE}/tenants/${tenantId}/modules`).then(r => r.json()),
        fetch(`${API_BASE}/admin/sectors`).then(r => r.json()).catch(() => ({ data: [] })),
      ]);

      if (modRes.success && Array.isArray(modRes.data)) {
        setModules(modRes.data);
      }
      if (secRes.success && Array.isArray(secRes.data)) {
        setSectors(secRes.data);
        if (tenant?.sectorId) {
          setSelectedSectorId(tenant.sectorId);
        } else if (secRes.data.length > 0) {
          setSelectedSectorId(secRes.data[0].id);
        }
      }
    } catch (err) {
      console.error('Modüller çekilemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, [tenantId]);

  const toggleModule = async (moduleId, currentEnabled) => {
    try {
      setSavingId(moduleId);
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/modules/${moduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      const data = await res.json();
      if (data.success) {
        setModules(prev => prev.map(m => m.id === moduleId ? { ...m, enabled: !currentEnabled } : m));
        setStatusMsg(`Modül durumu güncellendi.`);
        setTimeout(() => setStatusMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingId(null);
    }
  };

  const applySectorTemplate = async () => {
    if (!selectedSectorId) return;
    try {
      setApplyingSector(true);
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/modules/apply-sector`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectorId: selectedSectorId }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(`Sektör şablonu başarıyla uygulandı! (${data.data.modules.join(', ')})`);
        await fetchModules();
        setTimeout(() => setStatusMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setApplyingSector(false);
    }
  };

  const coreModules = modules.filter(m => m.category === 'core');
  const sectorModules = modules.filter(m => m.category === 'sector');
  const integrationModules = modules.filter(m => m.category === 'integration');

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px', color: '#fff' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #fff, #A8A8C0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Modül ve Özellik Yönetimi
          </h1>
          <p style={{ margin: 0, color: '#8F90A6', fontSize: '0.9rem' }}>
            İhtiyacınız olan özellikleri aktif edin. Yapay zeka yalnızca aktif modüllere ait araçları kullanır.
          </p>
        </div>

        <button 
          onClick={fetchModules}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            padding: '8px 14px', borderRadius: 8, color: '#fff', cursor: 'pointer',
            fontSize: '0.85rem', fontWeight: 600
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Yenile
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

      {/* Sektör Şablonu Uygula Bar */}
      <div style={{
        background: 'rgba(108,99,255,0.07)', border: '1px solid rgba(108,99,255,0.22)',
        borderRadius: 12, padding: '18px 20px', marginBottom: 32,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #6C63FF, #00D4FF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Otomatik Sektör Şablonu</div>
            <div style={{ fontSize: '0.8rem', color: '#8F90A6' }}>Sektörünüzü seçtiğinizde o sektöre özel modüller otomatik olarak açılır.</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select 
            value={selectedSectorId}
            onChange={(e) => setSelectedSectorId(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: '0.85rem',
              outline: 'none', minWidth: 180
            }}
          >
            {sectors.map(s => (
              <option key={s.id} value={s.id} style={{ background: '#121226', color: '#fff' }}>
                {s.icon} {s.name}
              </option>
            ))}
          </select>

          <button
            onClick={applySectorTemplate}
            disabled={applyingSector || !selectedSectorId}
            style={{
              background: 'linear-gradient(135deg, #6C63FF, #00D4FF)',
              border: 'none', borderRadius: 8, padding: '8px 16px',
              color: '#fff', fontSize: '0.85rem', fontWeight: 600,
              cursor: applyingSector ? 'not-allowed' : 'pointer',
              opacity: applyingSector ? 0.7 : 1
            }}
          >
            {applyingSector ? 'Uygulanıyor...' : 'Şablonu Uygula'}
          </button>
        </div>
      </div>

      {/* MODÜL KATEGORİLERİ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* 1. Çekirdek Modüller */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Shield size={18} color="#6C63FF" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Temel Çekirdek Modüller</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {coreModules.map(mod => (
              <ModuleCard key={mod.id} mod={mod} onToggle={toggleModule} savingId={savingId} />
            ))}
          </div>
        </section>

        {/* 2. Sektörel Modüller */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Boxes size={18} color="#00D4FF" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Sektörel İş Mantığı Modülleri</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {sectorModules.map(mod => (
              <ModuleCard key={mod.id} mod={mod} onToggle={toggleModule} savingId={savingId} />
            ))}
          </div>
        </section>

        {/* 3. Entegrasyonlar */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <MessageSquare size={18} color="#10B981" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Entegrasyon ve İletişim</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {integrationModules.map(mod => (
              <ModuleCard key={mod.id} mod={mod} onToggle={toggleModule} savingId={savingId} />
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

function ModuleCard({ mod, onToggle, savingId }) {
  const Icon = MODULE_ICONS[mod.code] || Boxes;
  const isSaving = savingId === mod.id;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: mod.enabled ? '1px solid rgba(108,99,255,0.35)' : '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12, padding: '16px 18px',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      position: 'relative', overflow: 'hidden',
      transition: 'all 0.2s',
      boxShadow: mod.enabled ? '0 0 20px rgba(108,99,255,0.08)' : 'none'
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: mod.enabled ? 'rgba(108,99,255,0.18)' : 'rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: mod.enabled ? '#6C63FF' : '#8F90A6'
            }}>
              <Icon size={18} />
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{mod.name}</span>
          </div>

          <button
            onClick={() => onToggle(mod.id, mod.enabled)}
            disabled={isSaving}
            style={{
              background: mod.enabled ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
              border: mod.enabled ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20, padding: '4px 10px',
              color: mod.enabled ? '#10B981' : '#8F90A6',
              fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4
            }}
          >
            {mod.enabled ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            {isSaving ? '...' : mod.enabled ? 'Aktif' : 'Pasif'}
          </button>
        </div>

        <p style={{ margin: 0, fontSize: '0.8rem', color: '#8F90A6', lineHeight: 1.4 }}>
          {mod.description || 'Modül açıklaması bulunmuyor.'}
        </p>
      </div>

      <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', color: '#5A5A7A', fontFamily: 'monospace' }}>
          code: {mod.code}
        </span>
        {mod.isCore && (
          <span style={{ fontSize: '0.65rem', background: 'rgba(108,99,255,0.12)', color: '#6C63FF', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
            Çekirdek
          </span>
        )}
      </div>
    </div>
  );
}
