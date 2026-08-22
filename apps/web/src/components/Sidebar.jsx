import React, { useState } from 'react';
import { NavLink, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard, Mic2, PhoneCall, Zap, Key,
  Settings, LogOut, ChevronLeft, ChevronRight, ChevronDown,
  Building2, Users, Calendar, Boxes, Table, Sparkles, PlusCircle,
  Clock, BarChart3, Sliders, Headphones, Shield, Lock, Activity
} from 'lucide-react';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  // Accordion açık/kapalı state'leri
  const [openSections, setOpenSections] = useState({
    pbx: true,
    callCenter: true,
    ai: true,
    crm: true,
    settings: false,
  });

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = () => { logout(); navigate('/login'); };
  const w = collapsed ? '68px' : '250px';

  // Slug desteği
  const slugPrefix = params.tenantSlug ? `/${params.tenantSlug}` : '';
  
  // Yetki & Modül Bayrakları (Varsayılan olarak Full Suite veya dinamik)
  const hasPbx = tenant?.hasPbx !== false;
  const hasCallCenter = tenant?.hasCallCenter === true || tenant?.serviceType === 'FULL_SUITE';
  const hasAiAgent = tenant?.hasAiAgent === true || tenant?.serviceType === 'AI_AGENT_ONLY' || tenant?.serviceType === 'FULL_SUITE';
  const hasCrm = tenant?.hasCrm === true || tenant?.serviceType === 'FULL_SUITE';

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, bottom: 0,
      width: w, zIndex: 100,
      background: 'rgba(8,8,24,0.95)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden',
    }}>

      {/* Brand Header */}
      <div style={{
        padding: '16px 14px', display: 'flex', alignItems: 'center',
        gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        minHeight: '60px',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: 'linear-gradient(135deg, #6C63FF, #00D4FF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 16px rgba(108,99,255,0.45)',
        }}>
          <Zap size={16} color="#fff" />
        </div>
        {!collapsed && (
          <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
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
          margin: '10px 12px 2px', padding: '8px 10px',
          background: 'rgba(108,99,255,0.08)',
          border: '1px solid rgba(108,99,255,0.18)',
          borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Building2 size={14} color="#00D4FF" style={{ flexShrink: 0 }} />
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {tenant.name || 'Firma Paneli'}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#8F90A6' }}>
              {tenant.slug || 'voicecore.ai'}
            </div>
          </div>
        </div>
      )}

      {/* Accordion Navigation */}
      <nav style={{ flex: 1, padding: '8px', overflowY: 'auto', overflowX: 'hidden' }}>
        
        {/* 1. GRUP: BULUT SANTRAL (PBX) */}
        {hasPbx && (
          <div style={{ marginBottom: 8 }}>
            {!collapsed && (
              <div
                onClick={() => toggleSection('pbx')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 8px', color: '#8F90A6', fontSize: '0.72rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <PhoneCall size={12} color="#00D4FF" />
                  <span>Bulut Santral</span>
                </div>
                <ChevronDown size={12} style={{ transform: openSections.pbx ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
              </div>
            )}

            {(openSections.pbx || collapsed) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <NavLink to={`${slugPrefix}/dashboard`} style={({ isActive }) => navLinkStyle(isActive, collapsed)}>
                  <LayoutDashboard size={16} />
                  {!collapsed && <span>Dashboard</span>}
                </NavLink>

                <NavLink to={`${slugPrefix}/setup`} style={({ isActive }) => navLinkStyle(isActive, collapsed)}>
                  <Zap size={16} />
                  {!collapsed && <span>Dahililer & Hatlar</span>}
                </NavLink>

                <NavLink to={`${slugPrefix}/pbx-routing`} style={({ isActive }) => navLinkStyle(isActive, collapsed)}>
                  <Sliders size={16} />
                  {!collapsed && <span>Gelen Arama & IVR</span>}
                </NavLink>

                <NavLink to={`${slugPrefix}/calls`} style={({ isActive }) => navLinkStyle(isActive, collapsed)}>
                  <PhoneCall size={16} />
                  {!collapsed && <span>Çağrı Kayıtları</span>}
                </NavLink>
              </div>
            )}
          </div>
        )}

        {/* 2. GRUP: ÇAĞRI MERKEZİ (CALL CENTER) */}
        {hasCallCenter ? (
          <div style={{ marginBottom: 8 }}>
            {!collapsed && (
              <div
                onClick={() => toggleSection('callCenter')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 8px', color: '#8F90A6', fontSize: '0.72rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Headphones size={12} color="#6C63FF" />
                  <span>Çağrı Merkezi</span>
                </div>
                <ChevronDown size={12} style={{ transform: openSections.callCenter ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
              </div>
            )}

            {(openSections.callCenter || collapsed) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <NavLink to={`${slugPrefix}/reports`} style={({ isActive }) => navLinkStyle(isActive, collapsed)}>
                  <BarChart3 size={16} />
                  {!collapsed && <span>CC & Çağrı Raporları</span>}
                </NavLink>
              </div>
            )}
          </div>
        ) : null}

        {/* 3. GRUP: AI SESLİ ASİSTAN */}
        {hasAiAgent ? (
          <div style={{ marginBottom: 8 }}>
            {!collapsed && (
              <div
                onClick={() => toggleSection('ai')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 8px', color: '#8F90A6', fontSize: '0.72rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={12} color="#10B981" />
                  <span>AI Sesli Asistan</span>
                </div>
                <ChevronDown size={12} style={{ transform: openSections.ai ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
              </div>
            )}

            {(openSections.ai || collapsed) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <NavLink to={`${slugPrefix}/agent`} style={({ isActive }) => navLinkStyle(isActive, collapsed)}>
                  <Mic2 size={16} />
                  {!collapsed && <span>AI Prompt Studio</span>}
                </NavLink>

                <NavLink to={`${slugPrefix}/records`} style={({ isActive }) => navLinkStyle(isActive, collapsed)}>
                  <Table size={16} />
                  {!collapsed && <span>Canlı Sektör Tablosu</span>}
                </NavLink>
              </div>
            )}
          </div>
        ) : null}

        {/* 4. GRUP: SEKTÖREL CRM */}
        {hasCrm ? (
          <div style={{ marginBottom: 8 }}>
            {!collapsed && (
              <div
                onClick={() => toggleSection('crm')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 8px', color: '#8F90A6', fontSize: '0.72rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={12} color="#F59E0B" />
                  <span>Sektörel CRM</span>
                </div>
                <ChevronDown size={12} style={{ transform: openSections.crm ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
              </div>
            )}

            {(openSections.crm || collapsed) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <NavLink to={`${slugPrefix}/crm`} style={({ isActive }) => navLinkStyle(isActive, collapsed)}>
                  <Users size={16} />
                  {!collapsed && <span>Müşteriler & Rehber</span>}
                </NavLink>

                <NavLink to={`${slugPrefix}/appointments`} style={({ isActive }) => navLinkStyle(isActive, collapsed)}>
                  <Calendar size={16} />
                  {!collapsed && <span>Randevular</span>}
                </NavLink>
              </div>
            )}
          </div>
        ) : null}

        {/* 5. GRUP: YÖNETİM & AYARLAR */}
        <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
          <NavLink to={`${slugPrefix}/modules`} style={({ isActive }) => navLinkStyle(isActive, collapsed)}>
            <Boxes size={16} />
            {!collapsed && <span>Modül Mağazası & Paket</span>}
          </NavLink>

          <NavLink to={`${slugPrefix}/integrations`} style={({ isActive }) => navLinkStyle(isActive, collapsed)}>
            <Key size={16} />
            {!collapsed && <span>Entegrasyonlar</span>}
          </NavLink>

          <NavLink to={`${slugPrefix}/settings`} style={({ isActive }) => navLinkStyle(isActive, collapsed)}>
            <Settings size={16} />
            {!collapsed && <span>Ayarlar</span>}
          </NavLink>
        </div>

      </nav>

      {/* User & Logout */}
      <div style={{ padding: '10px 8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {!collapsed && user && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 8px', marginBottom: 4,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #6C63FF, #00D4FF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700, color: '#fff',
            }}>
              {(user.name || user.email || 'U')[0].toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name || 'Yönetici'}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#5A5A7A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
            </div>
          </div>
        )}
        <button onClick={handleLogout} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          width: '100%', padding: collapsed ? '8px' : '7px 10px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          background: 'transparent', border: '1px solid transparent',
          borderRadius: 6, color: '#5A5A7A', cursor: 'pointer',
          fontSize: '0.8rem', fontWeight: 500, transition: 'all 0.18s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#EF4444'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5A5A7A'; }}
        >
          <LogOut size={15} />
          {!collapsed && 'Çıkış Yap'}
        </button>
      </div>
    </aside>
  );
}

function navLinkStyle(isActive, collapsed) {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: collapsed ? '9px' : '8px 12px',
    borderRadius: 8,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    justifyContent: collapsed ? 'center' : 'flex-start',
    background: isActive ? 'rgba(108,99,255,0.18)' : 'transparent',
    color: isActive ? '#fff' : '#A8A8C0',
    border: isActive ? '1px solid rgba(108,99,255,0.3)' : '1px solid transparent',
    fontSize: '0.82rem',
    fontWeight: isActive ? 600 : 500,
    transition: 'all 0.15s',
  };
}
