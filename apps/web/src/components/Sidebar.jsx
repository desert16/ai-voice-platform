import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard, Mic2, PhoneCall, Zap, Key,
  Settings, LogOut, ChevronLeft, ChevronRight,
  Building2, Users, Calendar, Boxes
} from 'lucide-react';

const NAV = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/setup',        icon: Zap,             label: 'Hızlı Kurulum' },
  { to: '/agent',        icon: Mic2,            label: 'AI Ajan' },
  { to: '/crm',          icon: Users,           label: 'CRM & Müşteriler' },
  { to: '/appointments', icon: Calendar,        label: 'Randevular' },
  { to: '/modules',      icon: Boxes,           label: 'Modüller' },
  { to: '/calls',        icon: PhoneCall,       label: 'Çağrılar' },
  { to: '/integrations', icon: Key,             label: 'Entegrasyonlar' },
  { to: '/api-keys',     icon: Key,             label: 'API Anahtarları' },
  { to: '/settings',     icon: Settings,        label: 'Ayarlar' },
];


export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const w = collapsed ? '64px' : '240px';

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
          <span style={{ fontSize: '0.75rem', color: '#A8A8C0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {tenant.name || 'Demo Firma'}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV.map(({ to, icon: Icon, label }) => (
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
