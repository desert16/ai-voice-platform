import React, { useState } from 'react';
import { NavLink, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard, Mic2, PhoneCall, Zap, Key,
  Settings, LogOut, ChevronLeft, ChevronRight,
  Building2, Users, Calendar, Boxes, Table, Sparkles, PlusCircle,
  Clock, BarChart3, Sliders
} from 'lucide-react';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const handleLogout = () => { logout(); navigate('/login'); };
  const w = collapsed ? '64px' : '240px';

  // Slug desteği
  const slugPrefix = params.tenantSlug ? `/${params.tenantSlug}` : '';
  const serviceType = tenant?.serviceType || 'FULL_SUITE';

  // Servis Tipine Göre Menü Filtreleme
  let navItems = [];

  if (serviceType === 'PBX_ONLY') {
    // ☎️ SADECE SANTRAL MÜŞTERİSİ
    navItems = [
      { to: `${slugPrefix}/dashboard`,    icon: LayoutDashboard, label: 'Dashboard' },
      { to: `${slugPrefix}/setup`,        icon: Zap,             label: 'Santral & Dahililer' },
      { to: `${slugPrefix}/pbx-routing`,  icon: Sliders,         label: 'Gelen Arama & IVR' },
      { to: `${slugPrefix}/reports`,      icon: BarChart3,       label: 'Çağrı Raporları' },
      { to: `${slugPrefix}/calls`,        icon: PhoneCall,       label: 'Çağrı Kayıtları' },
      { to: `${slugPrefix}/integrations`, icon: Key,             label: 'Entegrasyonlar' },
      { to: `${slugPrefix}/settings`,     icon: Settings,        label: 'Ayarlar' },
    ];
  } else if (serviceType === 'AI_AGENT_ONLY') {
    // 🤖 SADECE AI SESLİ AJAN
    navItems = [
      { to: `${slugPrefix}/dashboard`,    icon: LayoutDashboard, label: 'Dashboard' },
      { to: `${slugPrefix}/agent`,        icon: Mic2,            label: 'AI Ajan Studio' },
      { to: `${slugPrefix}/records`,      icon: Table,           label: 'Canlı Çağrı Tablosu' },
      { to: `${slugPrefix}/crm`,          icon: Users,           label: 'Müşteriler & Notlar' },
      { to: `${slugPrefix}/reports`,      icon: BarChart3,       label: 'AI & Çağrı Raporu' },
      { to: `${slugPrefix}/calls`,        icon: PhoneCall,       label: 'Canlı Ses & Transkript' },
      { to: `${slugPrefix}/integrations`, icon: Key,             label: 'Santral Bağlantısı' },
      { to: `${slugPrefix}/settings`,     icon: Settings,        label: 'Ayarlar' },
    ];
  } else {
    // ⭐ TAM PAKET (FULL SUITE)
    navItems = [
      { to: `${slugPrefix}/dashboard`,    icon: LayoutDashboard, label: 'Dashboard' },
      { to: `${slugPrefix}/setup`,        icon: Zap,             label: 'Santral Hatları' },
      { to: `${slugPrefix}/agent`,        icon: Mic2,            label: 'AI Ajan Studio' },
      { to: `${slugPrefix}/pbx-routing`,  icon: Sliders,         label: 'Gelen Arama & IVR' },
      { to: `${slugPrefix}/records`,      icon: Table,           label: 'Canlı Sektör Tablosu' },
      { to: `${slugPrefix}/reports`,      icon: BarChart3,       label: 'Çağrı Raporları' },
      { to: `${slugPrefix}/crm`,          icon: Users,           label: 'CRM & Müşteriler' },
      { to: `${slugPrefix}/appointments`, icon: Calendar,        label: 'Randevular' },
      { to: `${slugPrefix}/modules`,      icon: Boxes,           label: 'Modül Yönetimi' },
      { to: `${slugPrefix}/calls`,        icon: PhoneCall,       label: 'Çağrı Geçmişi' },
      { to: `${slugPrefix}/integrations`, icon: Key,             label: 'Entegrasyonlar' },
      { to: `${slugPrefix}/api-keys`,     icon: Key,             label: 'API Anahtarları' },
      { to: `${slugPrefix}/settings`,     icon: Settings,        label: 'Ayarlar' },
    ];
  }


  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, bottom: 0,
      width: w, zIndex: 100,
      background: 'rgba(8,8,24,0.92)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden',
    }}>

      {/* Logo */}
      <div style={{
        padding: '20px 16px', display: 'flex', alignItems: 'center',
        gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        minHeight: '64px',
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
          background: 'linear-gradient(135deg, #6C63FF, #00D4FF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 18px rgba(108,99,255,0.45)',
        }}>
          <Mic2 size={18} color="#fff" />
        </div>
        {!collapsed && (
          <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
            Voice<span style={{ color: '#6C63FF' }}>Core</span>
          </span>
        )}
        <button onClick={() => setCollapsed(c => !c)} style={{
          marginLeft: 'auto', background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6,
          color: '#A8A8C0', cursor: 'pointer', padding: '4px',
          display: 'flex', alignItems: 'center', flexShrink: 0,
          transition: 'all 0.2s',
        }}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Tenant badge */}
      {!collapsed && tenant && (
        <div style={{
          margin: '12px 12px 4px', padding: '8px 10px',
          background: 'rgba(108,99,255,0.08)',
          border: '1px solid rgba(108,99,255,0.18)',
          borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Building2 size={13} color="#6C63FF" style={{ flexShrink: 0 }} />
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {tenant.name || 'Firma'}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#00D4FF' }}>
              {serviceType === 'PBX_ONLY' ? '☎️ Bulut Santral' : serviceType === 'AI_AGENT_ONLY' ? '🤖 AI Sesli Ajan' : '⭐ Tam Paket'}
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10,
            padding: collapsed ? '10px' : '9px 12px',
            borderRadius: 8, marginBottom: 2,
            textDecoration: 'none', whiteSpace: 'nowrap',
            justifyContent: collapsed ? 'center' : 'flex-start',
            background: isActive ? 'rgba(108,99,255,0.15)' : 'transparent',
            color: isActive ? '#fff' : '#A8A8C0',
            border: isActive ? '1px solid rgba(108,99,255,0.28)' : '1px solid transparent',
            transition: 'all 0.18s',
            position: 'relative',
          })}>
            <Icon size={17} style={{ flexShrink: 0 }} />
            {!collapsed && <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{label}</span>}
          </NavLink>
        ))}

        {/* Sadece Santral Müşterisine AI Ekleme Kartı */}
        {!collapsed && serviceType === 'PBX_ONLY' && (
          <div style={{
            margin: '16px 4px 8px', padding: '12px',
            background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(0,212,255,0.1))',
            border: '1px solid rgba(108,99,255,0.3)', borderRadius: 10,
            textAlign: 'center'
          }}>
            <Sparkles size={16} color="#00D4FF" style={{ marginBottom: 4 }} />
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', marginBottom: 2 }}>Yapay Zeka Asistanı</div>
            <div style={{ fontSize: '0.65rem', color: '#A8A8C0', marginBottom: 8 }}>Gelen çağrıları otomatik karşılasın.</div>
            <button
              onClick={() => navigate(`${slugPrefix}/integrations`)}
              style={{
                width: '100%', background: 'linear-gradient(135deg, #6C63FF, #00D4FF)',
                border: 'none', borderRadius: 6, padding: '5px', color: '#fff',
                fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              + AI Asistan Ekle
            </button>
          </div>
        )}
      </nav>


      {/* User + Logout */}
      <div style={{ padding: '10px 8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {!collapsed && user && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '8px 10px', marginBottom: 4,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #6C63FF, #00D4FF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 700, color: '#fff',
            }}>
              {(user.name || user.email || 'U')[0].toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name || 'Admin'}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#5A5A7A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
            </div>
          </div>
        )}
        <button onClick={handleLogout} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          width: '100%', padding: collapsed ? '9px' : '8px 12px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          background: 'transparent', border: '1px solid transparent',
          borderRadius: 8, color: '#5A5A7A', cursor: 'pointer',
          fontSize: '0.875rem', fontWeight: 500,
          transition: 'all 0.18s',
          fontFamily: 'inherit',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.18)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5A5A7A'; e.currentTarget.style.borderColor = 'transparent'; }}
        >
          <LogOut size={16} />
          {!collapsed && 'Çıkış'}
        </button>
      </div>
    </aside>
  );
}
