import React from 'react';

export default function StatsCard({ title, value, icon: Icon, trend, trendUp }) {
  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="text-muted" style={{ fontSize: '0.9rem', fontWeight: 500 }}>{title}</span>
        <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(108, 99, 255, 0.1)', color: 'var(--accent)' }}>
          <Icon size={20} />
        </div>
      </div>
      <div>
        <h3 style={{ fontSize: '2rem', margin: '0 0 8px 0' }}>{value}</h3>
        {trend && (
          <span style={{ 
            fontSize: '0.85rem', 
            color: trendUp ? '#34C759' : '#FF3B30',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {trendUp ? '↑' : '↓'} {trend} since last month
          </span>
        )}
      </div>
    </div>
  );
}
