import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  Users, UserPlus, Search, Phone, Mail, MapPin, 
  Tag, Clock, FileText, ChevronRight, X, Check, Activity, PhoneCall, Calendar
} from 'lucide-react';

const API_BASE = 'http://192.168.203.138:3000/api';

export default function CRM() {
  const { tenant } = useAuth();
  const tenantId = tenant?.id || 'demo-tenant';

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '', phone: '', email: '', type: 'INDIVIDUAL', address: '', tags: ''
  });
  
  // Note form state
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const fetchCustomers = async (q = '') => {
    try {
      setLoading(true);
      const url = `${API_BASE}/tenants/${tenantId}/crm/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`;
      const res = await fetch(url).then(r => r.json());
      if (res.success && Array.isArray(res.data)) {
        setCustomers(res.data);
      }
    } catch (err) {
      console.error('Müşteriler çekilemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetails = async (id) => {
    try {
      setDetailsLoading(true);
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/crm/customers/${id}`).then(r => r.json());
      if (res.success) {
        setSelectedCustomer(res.data);
      }
    } catch (err) {
      console.error('Müşteri detayı alınamadı:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [tenantId]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCustomers(searchQuery);
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name) return;
    try {
      const payload = {
        ...newCustomer,
        tags: newCustomer.tags ? newCustomer.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/crm/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNewCustomer({ name: '', phone: '', email: '', type: 'INDIVIDUAL', address: '', tags: '' });
        fetchCustomers();
      }
    } catch (err) {
      console.error('Müşteri eklenemedi:', err);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote || !selectedCustomer) return;
    try {
      setSavingNote(true);
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/crm/customers/${selectedCustomer.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newNote })
      });
      const data = await res.json();
      if (data.success) {
        setNewNote('');
        fetchCustomerDetails(selectedCustomer.id);
      }
    } catch (err) {
      console.error('Not eklenemedi:', err);
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 20px', color: '#fff' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #fff, #A8A8C0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            CRM & Müşteri Yönetimi
          </h1>
          <p style={{ margin: 0, color: '#8F90A6', fontSize: '0.9rem' }}>
            Sesli asistanın oluşturduğu ve konuştuğu müşteriler, notlar ve çağrı geçmişi.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            <Search size={15} color="#8F90A6" style={{ position: 'absolute', left: 12 }} />
            <input 
              type="text"
              placeholder="İsim, telefon, e-posta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '8px 12px 8px 34px', color: '#fff', fontSize: '0.85rem',
                outline: 'none', width: 220
              }}
            />
          </form>

          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(135deg, #6C63FF, #00D4FF)',
              border: 'none', borderRadius: 8, padding: '8px 14px',
              color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer'
            }}
          >
            <UserPlus size={15} /> Yeni Müşteri
          </button>
        </div>
      </div>

      {/* Main Grid: List & Detail View */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedCustomer ? '1fr 1.2fr' : '1fr', gap: 20 }}>
        
        {/* Customer List */}
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12, overflow: 'hidden'
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 700, fontSize: '0.9rem', color: '#A8A8C0' }}>
            Müşteri Listesi ({customers.length})
          </div>

          <div style={{ maxHeight: 'calc(100vh - 240px)', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 30, textAlign: 'center', color: '#8F90A6' }}>Yükleniyor...</div>
            ) : customers.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#8F90A6' }}>
                <Users size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <div>Henüz kayıtlı müşteri yok.</div>
              </div>
            ) : (
              customers.map(c => {
                const isSelected = selectedCustomer?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => fetchCustomerDetails(c.id)}
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: isSelected ? 'rgba(108,99,255,0.12)' : 'transparent',
                      borderLeft: isSelected ? '3px solid #6C63FF' : '3px solid transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{c.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.8rem', color: '#8F90A6' }}>
                        {c.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12} /> {c.phone}</span>}
                        {c.email && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={12} /> {c.email}</span>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {c._count?.calls > 0 && (
                        <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4, color: '#A8A8C0' }}>
                          {c._count.calls} çağrı
                        </span>
                      )}
                      <ChevronRight size={16} color="#5A5A7A" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Customer Details */}
        {selectedCustomer && (
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(108,99,255,0.3)',
            borderRadius: 12, padding: '20px', position: 'relative',
            maxHeight: 'calc(100vh - 240px)', overflowY: 'auto'
          }}>
            <button
              onClick={() => setSelectedCustomer(null)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#8F90A6', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>

            {/* Profile Info */}
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 6px' }}>{selectedCustomer.name}</h2>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.85rem', color: '#A8A8C0' }}>
                {selectedCustomer.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={14} color="#6C63FF" /> {selectedCustomer.phone}</span>}
                {selectedCustomer.email && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={14} color="#00D4FF" /> {selectedCustomer.email}</span>}
                {selectedCustomer.address && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} color="#10B981" /> {selectedCustomer.address}</span>}
              </div>
            </div>

            {/* Tags */}
            {selectedCustomer.tags?.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                {selectedCustomer.tags.map((t, idx) => (
                  <span key={idx} style={{ background: 'rgba(108,99,255,0.15)', color: '#6C63FF', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 12, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 600 }}>
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* Add Note Form */}
            <form onSubmit={handleAddNote} style={{ marginBottom: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 8, color: '#A8A8C0' }}>Not Ekle</div>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Görüşme veya müşteri hakkında not yazın..."
                rows={2}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6, padding: '8px', color: '#fff', fontSize: '0.85rem', outline: 'none',
                  resize: 'vertical', boxSizing: 'border-box'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  type="submit"
                  disabled={savingNote || !newNote.trim()}
                  style={{
                    background: '#6C63FF', border: 'none', borderRadius: 6,
                    padding: '6px 12px', color: '#fff', fontSize: '0.8rem', fontWeight: 600,
                    cursor: savingNote ? 'not-allowed' : 'pointer'
                  }}
                >
                  {savingNote ? 'Kaydediliyor...' : 'Notu Kaydet'}
                </button>
              </div>
            </form>

            {/* Activity & Notes Stream */}
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity size={16} color="#00D4FF" /> Aktivite ve Not Geçmişi
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedCustomer.notes?.map(n => (
                  <div key={n.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#8F90A6', marginBottom: 4 }}>
                      <span>Not</span>
                      <span>{new Date(n.createdAt).toLocaleString('tr-TR')}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#E0E0E0', lineHeight: 1.4 }}>{n.text}</div>
                  </div>
                ))}

                {selectedCustomer.activities?.map(a => (
                  <div key={a.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#8F90A6', marginBottom: 4 }}>
                      <span style={{ textTransform: 'capitalize' }}>{a.type}</span>
                      <span>{new Date(a.createdAt).toLocaleString('tr-TR')}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#A8A8C0' }}>{a.description}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#121226', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: 24, width: '100%', maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Yeni Müşteri Ekle</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#8F90A6', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#8F90A6', marginBottom: 4 }}>Müşteri / Firma Adı *</label>
                <input
                  type="text" required
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#8F90A6', marginBottom: 4 }}>Telefon</label>
                  <input
                    type="text"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#8F90A6', marginBottom: 4 }}>E-posta</label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#8F90A6', marginBottom: 4 }}>Etiketler (virgülle ayırın)</label>
                <input
                  type="text" placeholder="vip, potansiyel, ankara"
                  value={newCustomer.tags}
                  onChange={(e) => setNewCustomer({ ...newCustomer, tags: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 8, padding: '8px 14px', color: '#A8A8C0', cursor: 'pointer' }}>İptal</button>
                <button type="submit" style={{ background: 'linear-gradient(135deg, #6C63FF, #00D4FF)', border: 'none', borderRadius: 8, padding: '8px 16px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
