import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen }) => {
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'collapsed'}`} style={{
      width: isOpen ? '260px' : '80px',
      height: '100vh',
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(12px)',
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      boxSizing: 'border-box',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 1000,
    }}>
      <div className="logo" style={{
        fontSize: isOpen ? '22px' : '14px',
        fontWeight: '800',
        color: '#fff',
        marginBottom: '40px',
        textAlign: 'center',
        letterSpacing: '-0.5px',
        background: 'linear-gradient(135deg, #3dbdaa 0%, #2563eb 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        transition: 'all 0.3s ease',
      }}>
        {isOpen ? 'WardWatch' : 'WW'}
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {isAdmin ? (
          <>
            <NavItem to="/admin" icon="📊" label="Dashboard" isOpen={isOpen} />
            <NavItem to="/admin/queue" icon="📋" label="Queue" isOpen={isOpen} />
          </>
        ) : (
          <>
            <NavItem to="/dashboard" icon="📊" label="Dashboard" isOpen={isOpen} />
            <NavItem to="/queue" icon="📋" label="Queue" isOpen={isOpen} />
          </>
        )}
      </nav>

      <div style={{ marginTop: 'auto', textAlign: 'center' }}>
        <div style={{
          padding: '12px',
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.05)',
          color: '#64748b',
          fontSize: '11px',
          fontWeight: '500'
        }}>
          {isOpen ? 'v1.4.0 Stable' : 'v1.4'}
        </div>
      </div>
    </div>
  );
};

const NavItem = ({ to, icon, label, isOpen }) => (
  <NavLink
    to={to}
    style={({ isActive }) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 14px',
      borderRadius: '12px',
      color: isActive ? '#fff' : '#94a3b8',
      background: isActive ? 'rgba(61, 189, 170, 0.1)' : 'transparent',
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: isActive ? '600' : '500',
      transition: 'all 0.2s ease',
      border: isActive ? '1px solid rgba(61, 189, 170, 0.2)' : '1px solid transparent',
    })}
    onMouseEnter={(e) => {
      if (!e.currentTarget.style.background.includes('rgba(61, 189, 170, 0.1)')) {
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
      }
    }}
    onMouseLeave={(e) => {
      if (!e.currentTarget.style.background.includes('rgba(61, 189, 170, 0.1)')) {
        e.currentTarget.style.background = 'transparent';
      }
    }}
  >
    <span style={{ fontSize: '18px' }}>{icon}</span>
    {isOpen && <span>{label}</span>}
  </NavLink>
);

export default Sidebar;
