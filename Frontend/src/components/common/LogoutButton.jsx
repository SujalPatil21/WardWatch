import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LogoutButton = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        color: '#fca5a5',
        padding: '8px 18px',
        borderRadius: '10px',
        fontSize: '13px',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backdropFilter: 'blur(8px)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <span style={{ fontSize: '15px' }}>🚪</span>
      Logout
    </button>
  );
};

export default LogoutButton;
