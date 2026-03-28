import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CorridorScene = () => {
  const navigate = useNavigate();

  // Removed forced timer-based navigation to comply with clean routing requirements.
  // Navigation now only occurs via user action or direct auth-state changes.
  const handleProceed = () => {
    navigate('/dashboard');
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#0a0f1d',
      color: 'white',
      fontFamily: 'Inter, sans-serif'
    }}>
      <h2 style={{ letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '20px' }}>Access Authorized</h2>
      <button 
        onClick={handleProceed}
        style={{
          background: 'rgba(61,189,170,0.1)',
          border: '1px solid #3dbdaa',
          color: '#3dbdaa',
          padding: '12px 24px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          transition: 'all 0.3s ease',
          marginBottom: '20px'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = '#3dbdaa';
          e.target.style.color = '#0a0f1d';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(61,189,170,0.1)';
          e.target.style.color = '#3dbdaa';
        }}
      >
        Proceed to Dashboard
      </button>
      <div style={{
        width: '50px',
        height: '50px',
        border: '3px solid rgba(61,189,170,0.2)',
        borderTopColor: '#3dbdaa',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <style>{`
        @keyframes spin { 
          to { transform: rotate(360deg); } 
        }
      `}</style>
    </div>
  );
};

export default CorridorScene;
