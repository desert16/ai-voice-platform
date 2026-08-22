import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  BarChart3, PhoneCall, Users, CheckCircle2, XCircle, 
  Clock, Hash, Download, RefreshCw, Calendar, ArrowUpRight
} from 'lucide-react';

const API_BASE = 'http://192.168.203.138:3000/api';

export default function Reports() {
  const { tenant } = useAuth();
  const tenantId = tenant?.id || 'demo-tenant';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/pbx/reports`).then(r => r.json());
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Raporlar alınamadı:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [tenantId]);

  const summary = data?.summary || {
    totalCalls: 0,
    completedCalls: 0,
    missedCalls: 0,
    avgDurationSec: 0,
    successRate: 0
  };

  const ivrStats = data?.ivrStats || {};
  const extensionStats = data?.extensionStats || {};
  const hourlyDistribution = data?.hourlyDistribution || Array(24).fill(0);

  const maxHourly = Math.max(...hourlyDistribution, 1);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 20px', color: '#fff' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #fff, #A8A8C0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Çağrı & Tuşlama Raporları
          </h1>
          <p style={{ margin: 0, color: '#8F90A6', fontSize: '0.9rem' }}>
            Dahili bazlı çağrı sayıları, IVR tuşlama dağılımı ve saatlik çağrı yoğunluk analizleri.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={fetchReports}
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
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8F90A6', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>
            <span>Toplam Çağrı</span>
            <PhoneCall size={16} color="#6C63FF" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{summary.totalCalls}</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8F90A6', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>
            <span>Cevaplanan</span>
            <CheckCircle2 size={16} color="#10B981" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10B981' }}>{summary.completedCalls}</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8F90A6', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>
            <span>Kaçırılan Çağrı</span>
            <XCircle size={16} color="#EF4444" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#EF4444' }}>{summary.missedCalls}</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8F90A6', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>
            <span>Ortalama Görüşme</span>
            <Clock size={16} color="#00D4FF" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#00D4FF' }}>{summary.avgDurationSec} sn</div>
        </div>
      </div>

      {/* Grid: IVR Tuşlama & Dahili Performansı */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        
        {/* IVR Tuşlama Dağılımı */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Hash size={18} color="#00D4FF" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Tuşlamalara Göre Çağrı Dağılımı</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(ivrStats).length === 0 ? (
              <div style={{ color: '#8F90A6', fontSize: '0.85rem', padding: 20, textAlign: 'center' }}>Henüz tuşlama verisi yok.</div>
            ) : (
              Object.entries(ivrStats).map(([key, count]) => {
                const percent = summary.totalCalls > 0 ? Math.round((count / summary.totalCalls) * 100) : 0;
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                      <span>Tuş: <strong>{key}</strong></span>
                      <span style={{ color: '#00D4FF', fontWeight: 700 }}>{count} Çağrı (%{percent})</span>
                    </div>
                    <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${percent}%`, background: 'linear-gradient(90deg, #6C63FF, #00D4FF)', borderRadius: 4 }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Dahili / Kullanıcı Bazlı Çağrılar */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Users size={18} color="#6C63FF" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Dahili / Temsilci Performansı</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(extensionStats).length === 0 ? (
              <div style={{ color: '#8F90A6', fontSize: '0.85rem', padding: 20, textAlign: 'center' }}>Henüz dahili çağrı verisi yok.</div>
            ) : (
              Object.entries(extensionStats).map(([ext, stats]) => (
                <div key={ext} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Dahili {ext}</div>
                    <div style={{ fontSize: '0.75rem', color: '#8F90A6' }}>Toplam {stats.durationSec} saniye görüşme</div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: '0.8rem' }}>
                    <span style={{ color: '#10B981' }}>{stats.completed} Cevaplandı</span>
                    <span style={{ color: '#EF4444' }}>{stats.missed} Kaçırıldı</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Saatlik Çağrı Yoğunluk Çizelgesi */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <Clock size={18} color="#10B981" />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Günün Saatlerine Göre Çağrı Yoğunluğu</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120, paddingBottom: 24, position: 'relative' }}>
          {hourlyDistribution.map((count, hour) => {
            const hPercent = Math.round((count / maxHourly) * 100);
            return (
              <div key={hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div
                  title={`${hour}:00 - ${count} Çağrı`}
                  style={{
                    width: '100%',
                    height: `${Math.max(hPercent, 6)}%`,
                    background: count > 0 ? 'linear-gradient(180deg, #00D4FF, #6C63FF)' : 'rgba(255,255,255,0.04)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.2s'
                  }}
                />
                <span style={{ position: 'absolute', bottom: 0, fontSize: '0.65rem', color: '#5A5A7A' }}>
                  {hour % 3 === 0 ? `${hour}h` : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
