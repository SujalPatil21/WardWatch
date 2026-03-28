import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CorridorScene = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Basic placeholder for the corridor flow.
    // It will automatically navigate to /dashboard after the theoretical animation plays.
    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

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
