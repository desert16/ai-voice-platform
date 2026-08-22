import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  Table, Sparkles, Phone, User, Clock, CheckCircle2, 
  AlertTriangle, Filter, Search, Eye, X, RefreshCw, MessageSquare
} from 'lucide-react';

const API_BASE = 'http://192.168.203.138:3000/api';

const STATUS_CONFIG = {
  NEW: { bg: 'rgba(59,130,246,0.15)', text: '#3B82F6', label: 'Yeni Talep' },
  CONTACTED: { bg: 'rgba(234,179,8,0.15)', text: '#EAB308', label: 'Arandı / Ulaşıldı' },
  PROCESSING: { bg: 'rgba(168,85,247,0.15)', text: '#A855F7', label: 'İşlemde' },
  COMPLETED: { bg: 'rgba(16,185,129,0.15)', text: '#10B981', label: 'Tamamlandı' },
  CANCELLED: { bg: 'rgba(239,68,68,0.15)', text: '#EF4444', label: 'İptal' },
};

export default function SectorRecords() {
  const { tenant } = useAuth();
  const tenantId = tenant?.id || 'demo-tenant';

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE}/tenants/${tenantId}/sector-records?limit=100`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url).then(r => r.json());
      if (res.success && Array.isArray(res.data)) {
        setRecords(res.data);
      }
    } catch (err) {
      console.error('Kayıtlar çekilemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [tenantId, statusFilter]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/sector-records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setRecords(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
        if (selectedRecord?.id === id) {
          setSelectedRecord(prev => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 20px', color: '#fff' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Sparkles size={20} color="#00D4FF" />
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #fff, #A8A8C0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Canlı Sektörel Çağrı Tablosu
            </h1>
          </div>
          <p style={{ margin: 0, color: '#8F90A6', fontSize: '0.9rem' }}>
            Yapay zeka sesli asistanının görüşme sırasında arayan kişiden topladığı yapılandırılmış talepler ve veriler.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: '0.85rem', outline: 'none'
            }}
          >
            <option value="" style={{ background: '#121226' }}>Tüm Durumlar</option>
            <option value="NEW" style={{ background: '#121226' }}>Yeni Talepler</option>
            <option value="CONTACTED" style={{ background: '#121226' }}>Arandı / Ulaşıldı</option>
            <option value="PROCESSING" style={{ background: '#121226' }}>İşlemde</option>
            <option value="COMPLETED" style={{ background: '#121226' }}>Tamamlandı</option>
            <option value="CANCELLED" style={{ background: '#121226' }}>İptal</option>
          </select>

          <button
            onClick={fetchRecords}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              padding: '8px 14px', borderRadius: 8, color: '#fff', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: 600
            }}
          >
            <RefreshCw size={14} /> Yenile
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div style={{
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12, overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#A8A8C0' }}>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Tarih & Saat</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Arayan Kişi & No</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Konu / Talep Özeti</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>AI Tarafından Çıkarılan Veriler</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Durum</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'right' }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#8F90A6' }}>Kayıtlar yükleniyor...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 60, textAlign: 'center', color: '#8F90A6' }}>
                    <Table size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <div>Henüz AI tarafından kaydedilmiş bir talep bulunmuyor.</div>
                    <span style={{ fontSize: '0.75rem', color: '#5A5A7A' }}>Gelen çağrılarda asistan bilgileri aldıkça bu tablo otomatik dolacaktır.</span>
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const st = STATUS_CONFIG[r.status] || STATUS_CONFIG.NEW;
                  const dateStr = new Date(r.createdAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
                  const extracted = typeof r.extractedData === 'object' ? r.extractedData : {};

                  return (
                    <tr 
                      key={r.id}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 16px', color: '#8F90A6', whiteSpace: 'nowrap' }}>
                        {dateStr}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#fff', marginBottom: 2 }}>
                          {r.callerName || r.customer?.name || 'İsimsiz Arayan'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#8F90A6', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Phone size={11} /> {r.callerNumber || '-'}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px', maxWidth: 280 }}>
                        <div style={{ fontWeight: 600, color: '#E0E0E0', marginBottom: 2 }}>{r.title}</div>
                        {r.notes && <div style={{ fontSize: '0.75rem', color: '#8F90A6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.notes}</div>}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 320 }}>
                          {Object.entries(extracted).slice(0, 3).map(([k, v]) => (
                            <span key={k} style={{ background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.25)', color: '#A8A8C0', padding: '2px 6px', borderRadius: 4, fontSize: '0.7rem' }}>
                              <strong style={{ color: '#6C63FF' }}>{k}:</strong> {String(v)}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <select
                          value={r.status}
                          onChange={(e) => handleStatusChange(r.id, e.target.value)}
                          style={{
                            background: st.bg, color: st.text,
                            border: `1px solid ${st.text}40`,
                            borderRadius: 20, padding: '4px 8px',
                            fontSize: '0.75rem', fontWeight: 700, outline: 'none', cursor: 'pointer'
                          }}
                        >
                          <option value="NEW" style={{ background: '#121226', color: '#3B82F6' }}>Yeni Talep</option>
                          <option value="CONTACTED" style={{ background: '#121226', color: '#EAB308' }}>Arandı</option>
                          <option value="PROCESSING" style={{ background: '#121226', color: '#A855F7' }}>İşlemde</option>
                          <option value="COMPLETED" style={{ background: '#121226', color: '#10B981' }}>Tamamlandı</option>
                          <option value="CANCELLED" style={{ background: '#121226', color: '#EF4444' }}>İptal</option>
                        </select>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedRecord(r)}
                          style={{
                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 6, padding: '5px 10px', color: '#fff', cursor: 'pointer',
                            fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4
                          }}
                        >
                          <Eye size={12} /> Detay
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#121226', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: 24, width: '100%', maxWidth: 540 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Talep & Çağrı Detayı</h3>
              <button onClick={() => setSelectedRecord(null)} style={{ background: 'none', border: 'none', color: '#8F90A6', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: '0.85rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 12 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff', marginBottom: 6 }}>{selectedRecord.title}</div>
                <div style={{ color: '#8F90A6' }}>Arayan: <strong style={{ color: '#fff' }}>{selectedRecord.callerName || 'Belirtilmedi'}</strong> ({selectedRecord.callerNumber || 'Numara yok'})</div>
                <div style={{ color: '#8F90A6', marginTop: 4 }}>Tarih: {new Date(selectedRecord.createdAt).toLocaleString('tr-TR')}</div>
              </div>

              {selectedRecord.notes && (
                <div>
                  <div style={{ fontWeight: 600, color: '#A8A8C0', marginBottom: 4 }}>Görüşme Notları / Talep:</div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 10, color: '#E0E0E0', lineHeight: 1.4 }}>
                    {selectedRecord.notes}
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontWeight: 600, color: '#A8A8C0', marginBottom: 6 }}>Sektörel Yapılandırılmış JSON Verisi:</div>
                <pre style={{ background: 'rgba(0,0,0,0.4)', padding: 12, borderRadius: 8, color: '#00D4FF', fontSize: '0.75rem', overflowX: 'auto', margin: 0 }}>
                  {JSON.stringify(selectedRecord.extractedData, null, 2)}
                </pre>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button
                  onClick={() => setSelectedRecord(null)}
                  style={{ background: '#6C63FF', border: 'none', borderRadius: 8, padding: '8px 16px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
