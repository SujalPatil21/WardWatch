import React, { useState, useEffect } from 'react';
import { fetchWards, fetchWardCapacity } from '../services/wardService';
import WardGrid from '../components/Ward/WardGrid';
import LogoutButton from '../components/common/LogoutButton';

const WardDashboard = () => {
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const wardsData = await fetchWards();
        
        const wardsWithCapacity = await Promise.all(
          wardsData.map(async (ward) => {
            try {
              const capacity = await fetchWardCapacity(ward.id);
              return {
                ...ward,
                totalBeds: capacity.totalBeds || 0,
                occupiedBeds: capacity.occupiedBeds || 0
              };
            } catch (err) {
              return { ...ward, totalBeds: 0, occupiedBeds: 0 };
            }
          })
        );

        if (isMounted) {
          setWards(wardsWithCapacity);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to load wards. Please ensure the backend is running.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #09090b 0%, #1e1b4b 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '60px 24px',
      boxSizing: 'border-box',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      position: 'relative'
    }}>
      <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
        <LogoutButton />
      </div>
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '40px'
      }}>
        <h1 style={{
          color: '#f8fafc',
          fontSize: '3rem',
          fontWeight: '800',
          margin: 0,
          textShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
          letterSpacing: '-1px'
        }}>
          Select Ward
        </h1>

        {loading ? (
          <div style={{
            color: '#38bdf8',
            fontSize: '1.25rem',
            fontWeight: '500',
            textShadow: '0 0 10px rgba(56, 189, 248, 0.5)',
            marginTop: '40px'
          }}>
            Loading...
          </div>
        ) : error ? (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#fca5a5',
            padding: '20px 32px',
            borderRadius: '12px',
            fontSize: '1.1rem',
            backdropFilter: 'blur(8px)'
          }}>
            {error}
          </div>
        ) : wards.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: '1.1rem', marginTop: '40px' }}>
            No wards available.
          </div>
        ) : (
          <WardGrid wards={wards} />
        )}
      </div>
    </div>
  );
};

export default WardDashboard;
