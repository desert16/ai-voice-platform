import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  Calendar, Plus, Clock, User, CheckCircle2, XCircle, 
  MapPin, AlertCircle, ChevronRight, X
} from 'lucide-react';

const API_BASE = 'http://192.168.203.138:3000/api';

const STATUS_COLORS = {
  PENDING: { bg: 'rgba(234,179,8,0.12)', text: '#EAB308', label: 'Bekliyor' },
  CONFIRMED: { bg: 'rgba(16,185,129,0.12)', text: '#10B981', label: 'Onaylandı' },
  COMPLETED: { bg: 'rgba(108,99,255,0.12)', text: '#6C63FF', label: 'Tamamlandı' },
  CANCELLED: { bg: 'rgba(239,68,68,0.12)', text: '#EF4444', label: 'İptal' },
  NO_SHOW: { bg: 'rgba(107,114,128,0.12)', text: '#9CA3AF', label: 'Gelmedi' },
};

export default function Appointments() {
  const { tenant } = useAuth();
  const tenantId = tenant?.id || 'demo-tenant';

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAppt, setNewAppt] = useState({
    title: '', scheduledAt: '', durationMinutes: 30, staffName: '', location: '', notes: ''
  });

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/appointments`).then(r => r.json());
      if (res.success && Array.isArray(res.data)) {
        setAppointments(res.data);
      }
    } catch (err) {
      console.error('Randevular çekilemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [tenantId]);

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    if (!newAppt.title || !newAppt.scheduledAt) return;
    try {
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAppt)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNewAppt({ title: '', scheduledAt: '', durationMinutes: 30, staffName: '', location: '', notes: '' });
        fetchAppointments();
      }
    } catch (err) {
      console.error('Randevu oluşturulamadı:', err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px', color: '#fff' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #fff, #A8A8C0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Randevu Takvimi
          </h1>
          <p style={{ margin: 0, color: '#8F90A6', fontSize: '0.9rem' }}>
            Yapay zeka asistanı ve çalışanlar tarafından oluşturulan randevular.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'linear-gradient(135deg, #6C63FF, #00D4FF)',
            border: 'none', borderRadius: 8, padding: '8px 16px',
            color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer'
          }}
        >
          <Plus size={16} /> Yeni Randevu
        </button>
      </div>

      {/* Appointment Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#8F90A6' }}>Randevular yükleniyor...</div>
        ) : appointments.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#8F90A6', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
            <Calendar size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
            <div>Henüz planlanmış randevu bulunmuyor.</div>
          </div>
        ) : (
          appointments.map(appt => {
            const st = STATUS_COLORS[appt.status] || STATUS_COLORS.PENDING;
            const dateStr = new Date(appt.scheduledAt).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });

            return (
              <div
                key={appt.id}
                style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12, padding: '16px 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6C63FF'
                  }}>
                    <Clock size={20} />
                  </div>

                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{appt.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.8rem', color: '#8F90A6' }}>
                      <span>📅 {dateStr} ({appt.durationMinutes} dk)</span>
                      {appt.customer?.name && <span>👤 {appt.customer.name}</span>}
                      {appt.staffName && <span>🩺 {appt.staffName}</span>}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    background: st.bg, color: st.text,
                    padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700
                  }}>
                    {st.label}
                  </span>

                  {appt.status === 'PENDING' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => updateStatus(appt.id, 'CONFIRMED')}
                        style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6, color: '#10B981', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Onayla
                      </button>
                      <button
                        onClick={() => updateStatus(appt.id, 'CANCELLED')}
                        style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, color: '#EF4444', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        İptal
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#121226', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: 24, width: '100%', maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Yeni Randevu Ekle</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#8F90A6', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateAppointment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#8F90A6', marginBottom: 4 }}>Randevu Başlığı *</label>
                <input
                  type="text" required placeholder="Diş Muayenesi / Emlak Gösterimi"
                  value={newAppt.title}
                  onChange={(e) => setNewAppt({ ...newAppt, title: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#8F90A6', marginBottom: 4 }}>Tarih ve Saat *</label>
                  <input
                    type="datetime-local" required
                    value={newAppt.scheduledAt}
                    onChange={(e) => setNewAppt({ ...newAppt, scheduledAt: e.target.value })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#8F90A6', marginBottom: 4 }}>Süre (Dakika)</label>
                  <input
                    type="number"
                    value={newAppt.durationMinutes}
                    onChange={(e) => setNewAppt({ ...newAppt, durationMinutes: parseInt(e.target.value) || 30 })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#8F90A6', marginBottom: 4 }}>Yetkili / Görevli / Doktor</label>
                <input
                  type="text" placeholder="Dr. Ahmet Yılmaz / Danışman"
                  value={newAppt.staffName}
                  onChange={(e) => setNewAppt({ ...newAppt, staffName: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 8, padding: '8px 14px', color: '#A8A8C0', cursor: 'pointer' }}>İptal</button>
                <button type="submit" style={{ background: 'linear-gradient(135deg, #6C63FF, #00D4FF)', border: 'none', borderRadius: 8, padding: '8px 16px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Oluştur</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
