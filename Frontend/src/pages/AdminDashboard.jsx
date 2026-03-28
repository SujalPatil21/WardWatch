import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { username, logout } = useAuth();

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.badge}>ADMIN</div>
        <h1 style={styles.title}>Admin Control</h1>
        <p style={styles.sub}>Logged in as <span style={styles.accent}>{username}</span></p>
        <p style={styles.hint}>Full hospital management interface loads here.</p>
        <button style={styles.btn} onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0a0f1d',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    background: 'rgba(20, 25, 45, 0.85)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '24px',
    padding: '48px',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    backdropFilter: 'blur(20px)',
    maxWidth: '400px',
    width: '90%',
  },
  badge: {
    display: 'inline-block',
    background: 'rgba(150,80,255,0.15)',
    border: '1px solid rgba(150,80,255,0.4)',
    color: '#a47fff',
    borderRadius: '8px',
    padding: '4px 14px',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.2em',
    marginBottom: '20px',
  },
  title: {
    color: '#ffffff',
    fontSize: '28px',
    fontWeight: '700',
    margin: '0 0 8px',
  },
  sub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '14px',
    margin: '0 0 8px',
  },
  accent: {
    color: '#a47fff',
    fontWeight: '600',
  },
  hint: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: '12px',
    margin: '0 0 32px',
  },
  btn: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'rgba(255,255,255,0.6)',
    borderRadius: '10px',
    padding: '10px 28px',
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '0.1em',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
};
