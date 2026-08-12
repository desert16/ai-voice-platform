import React, { useState, useEffect, useRef } from 'react';
import { PhoneCall, Clock, CheckCircle2, Users, TrendingUp, TrendingDown, Activity, Wifi } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

/* ── Wave Animation (canlı çağrı için) ── */
function WaveAnimation({ active = true, height = 32 }) {
  const bars = [4, 10, 18, 24, 28, 22, 14, 20, 26, 12, 8, 16, 24, 18, 10];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height }}>
      {bars.map((h, i) => (
        <div key={i} style={{
          width: 3, borderRadius: 2,
          background: active
            ? 'linear-gradient(to top, #6C63FF, #00D4FF)'
            : 'rgba(255,255,255,0.1)',
          height: active ? undefined : Math.max(h * 0.3, 4),
          animation: active ? `wavePulse 1.3s ease-in-out ${i * 0.08}s infinite` : 'none',
          transition: 'height 0.3s ease',
        }} />
      ))}
    </div>
  );
}

/* ── Animasyonlu Sayaç ── */
function AnimatedCount({ value, suffix = '' }) {
  const [display, setDisplay] = useState(0);
  const num = parseFloat(String(value).replace(/[^0-9.]/g, ''));
  useEffect(() => {
    let start = 0;
    const steps = 40;
    const inc = num / steps;
    const t = setInterval(() => {
      start += inc;
      if (start >= num) { setDisplay(num); clearInterval(t); }
      else setDisplay(Math.floor(start));
    }, 30);
    return () => clearInterval(t);
  }, [num]);
  return <>{typeof value === 'string' && value.includes(',')
    ? display.toLocaleString() : display}{suffix}</>;
}

/* ── Stat Kartı ── */
function StatCard({ title, value, suffix, icon: Icon, trend, trendUp, accent }) {
  return (
    <div className={`stat-card ${accent ? 'accent-cyan' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9,
          background: accent ? 'rgba(0,212,255,0.1)' : 'rgba(108,99,255,0.1)',
          border: `1px solid ${accent ? 'rgba(0,212,255,0.2)' : 'rgba(108,99,255,0.2)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={17} color={accent ? '#00D4FF' : '#6C63FF'} />
        </div>
        {trend && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4,
            fontSize: '0.75rem', fontWeight: 600,
            color: trendUp ? '#22C55E' : '#EF4444' }}>
            {trendUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {trend}
          </div>
        )}
      </div>
      <div style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 5 }}>
        <AnimatedCount value={value} suffix={suffix} />
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', fontWeight: 500 }}>{title}</div>
    </div>
  );
}

/* ── Ana Dashboard ── */
export default function Dashboard() {
  const { user } = useAuth();
  const [activeCalls, setActiveCalls] = useState(3);
  const [calls, setCalls] = useState([
    { id: 'VC-1031', number: '+90 (532) 441 12 01', type: 'Gelen', dur: '3:14', status: 'Aktif',     time: 'Şimdi'   },
    { id: 'VC-1030', number: '+90 (505) 882 44 17', type: 'Giden', dur: '1:02', status: 'Aktif',     time: '45s önce' },
    { id: 'VC-1029', number: '+90 (216) 330 99 55', type: 'Gelen', dur: '5:30', status: 'Tamamlandı', time: '3dk önce' },
    { id: 'VC-1028', number: '+90 (850) 211 00 33', type: 'Gelen', dur: '0:45', status: 'Başarısız',  time: '8dk önce' },
    { id: 'VC-1027', number: '+90 (541) 773 20 88', type: 'Giden', dur: '2:18', status: 'Tamamlandı', time: '15dk önce' },
  ]);

  const statusBadge = (s) => {
    const map = {
      'Aktif':      'badge-info',
      'Tamamlandı': 'badge-success',
      'Başarısız':  'badge-danger',
    };
    return map[s] || 'badge-info';
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar';

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{greeting}, {user?.name?.split(' ')[0] || 'Admin'} 👋</h1>
          <p className="page-subtitle">Sisteminizin bugünkü durumu aşağıda.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="status-dot online" />
          <span style={{ fontSize: '0.82rem', color: '#00D4FF', fontWeight: 500 }}>Sistem Aktif</span>
        </div>
      </div>

      {/* Stat Kartları */}
      <div className="grid-stats" style={{ marginBottom: 24 }}>
        <StatCard title="Bugünkü Çağrılar" value="1,284"  icon={PhoneCall}     trend="+12%" trendUp />
        <StatCard title="Aktif Dakikalar"   value="3,492"  icon={Clock}         trend="+8%"  trendUp />
        <StatCard title="Başarı Oranı"      value={98.2}   icon={CheckCircle2}  suffix="%" trend="+1.2%" trendUp />
        <StatCard title="Aktif Ajanlar"     value={activeCalls} icon={Users}    accent />
      </div>

      {/* 2 Sütun */}
      <div className="grid-2" style={{ alignItems: 'start' }}>

        {/* Canlı Çağrı Aktivitesi */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '18px 22px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <WaveAnimation active={activeCalls > 0} height={22} />
              <span className="section-title">Canlı Çağrı Aktivitesi</span>
            </div>
            <span className="badge badge-info">{activeCalls} Aktif</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Numara</th>
                  <th>Tür</th>
                  <th>Süre</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {calls.map(c => (
                  <tr key={c.id}>
                    <td className="font-mono" style={{ color: 'var(--accent)', fontSize: '0.8rem' }}>{c.id}</td>
                    <td style={{ fontWeight: 500 }}>{c.number}</td>
                    <td>
                      <span className={`badge ${c.type === 'Gelen' ? 'badge-purple' : 'badge-warning'}`}>{c.type}</span>
                    </td>
                    <td className="font-mono" style={{ color: 'var(--text-2)' }}>{c.dur}</td>
                    <td><span className={`badge ${statusBadge(c.status)}`}>{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Sağlık Monitörü */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span className="section-title">AI Ajan Sağlığı</span>
              <Activity size={16} color="var(--text-3)" />
            </div>

            {/* Gemini Status */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 10,
              background: 'rgba(34,197,94,0.06)',
              border: '1px solid rgba(34,197,94,0.15)', marginBottom: 12,
            }}>
              <span className="status-dot online" />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Gemini API</div>
                <div style={{ fontSize: '0.73rem', color: '#22C55E' }}>Operasyonel · ~180ms</div>
              </div>
              <span className="badge badge-success" style={{ marginLeft: 'auto' }}>Sağlıklı</span>
            </div>

            {/* Bridge Status */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 10,
              background: 'rgba(34,197,94,0.06)',
              border: '1px solid rgba(34,197,94,0.15)', marginBottom: 12,
            }}>
              <span className="status-dot online" />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>AudioSocket Bridge</div>
                <div style={{ fontSize: '0.73rem', color: '#22C55E' }}>Port 9092 · 3 Bağlantı</div>
              </div>
              <span className="badge badge-success" style={{ marginLeft: 'auto' }}>Aktif</span>
            </div>

            {/* Asterisk Status */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 10,
              background: 'rgba(34,197,94,0.06)',
              border: '1px solid rgba(34,197,94,0.15)',
            }}>
              <span className="status-dot online" />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Asterisk 22</div>
                <div style={{ fontSize: '0.73rem', color: '#22C55E' }}>PJSIP Aktif · 2 Trunk</div>
              </div>
              <span className="badge badge-success" style={{ marginLeft: 'auto' }}>Bağlı</span>
            </div>
          </div>

          {/* Hızlı İstatistikler */}
          <div className="glass-card">
            <span className="section-title" style={{ display: 'block', marginBottom: 16 }}>Bu Ay</span>
            {[
              { label: 'Toplam Çağrı',    val: '28,431', color: '#6C63FF' },
              { label: 'Toplam Süre',     val: '1,204 saat', color: '#00D4FF' },
              { label: 'Müşteri Memnuniyeti', val: '%94.7', color: '#22C55E' },
              { label: 'API Kullanımı',   val: '2.1M istek', color: '#F59E0B' },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                <span style={{ fontSize: '0.83rem', color: 'var(--text-2)' }}>{item.label}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: item.color }}>{item.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
