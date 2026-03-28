import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  fetchWards, 
  fetchBeds, 
  fetchWardCapacity, 
  fetchAlerts, 
  completeCleaning 
} from '../services/wardService';

const STATUS_CONFIG = {
  AVAILABLE: {
    bg: 'rgba(34, 197, 94, 0.12)',
    border: 'rgba(34, 197, 94, 0.4)',
    color: '#22c55e',
    glow: '0 0 14px rgba(34, 197, 94, 0.25)',
    label: 'Available',
  },
  OCCUPIED: {
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.4)',
    color: '#ef4444',
    glow: '0 0 14px rgba(239, 68, 68, 0.25)',
    label: 'Occupied',
  },
  CLEANING: {
    bg: 'rgba(234, 179, 8, 0.12)',
    border: 'rgba(234, 179, 8, 0.4)',
    color: '#eab308',
    glow: '0 0 14px rgba(234, 179, 8, 0.25)',
    label: 'Cleaning',
  },
  RESERVED: {
    bg: 'rgba(99, 102, 241, 0.12)',
    border: 'rgba(99, 102, 241, 0.4)',
    color: '#6366f1',
    glow: '0 0 14px rgba(99, 102, 241, 0.25)',
    label: 'Reserved',
  },
};

const FALLBACK_STATUS = {
  bg: 'rgba(100,100,100,0.1)',
  border: 'rgba(255,255,255,0.1)',
  color: '#94a3b8',
  glow: 'none',
  label: 'Unknown',
};

export default function WardDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ward, setWard] = useState(null);
  const [beds, setBeds] = useState([]);
  const [capacity, setCapacity] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [wardsRes, bedsRes, capacityRes, alertsRes] = await Promise.all([
        fetchWards(),
        fetchBeds(),
        fetchWardCapacity(id),
        fetchAlerts()
      ]);

      const foundWard = wardsRes.find(w => String(w.id) === String(id));
      const wardBeds = bedsRes.filter(b => String(b.wardId) === String(id));
      
      setWard(foundWard || null);
      setBeds(wardBeds);
      setCapacity(capacityRes);
      setAlerts(alertsRes.alerts || []);
      setError(null);
    } catch (err) {
      console.error('[WardDetail] Sync failed:', err);
      setError('Failed to sync ward data with server.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCompleteCleaning = async (bedId) => {
    try {
      await completeCleaning(bedId);
      await loadData(); // Refresh immediately
    } catch (err) {
      console.error('Failed to complete cleaning:', err);
    }
  };

  const counts = beds.reduce((acc, b) => {
    const key = (b.status || 'UNKNOWN').toUpperCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  if (loading && !ward) {
    return <div style={{ padding: '100px', textAlign: 'center', color: '#3dbdaa', fontSize: '18px' }}>Syncing Ward State...</div>;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      padding: '40px 60px',
      color: '#fff',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Navigation Header */}
      <nav style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#94a3b8',
            padding: '10px 20px',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
        >
          ← Back to Overview
        </button>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={loadData}
            style={{
              background: 'rgba(61,189,170,0.1)',
              border: '1px solid rgba(61,189,170,0.2)',
              color: '#3dbdaa',
              padding: '10px 20px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </nav>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', padding: '16px', borderRadius: '12px', marginBottom: '30px' }}>
          {error}
        </div>
      )}

      {/* Main Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
        
        {/* Left Column: Bed Grid */}
        <section>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '36px', fontWeight: '800', margin: 0, letterSpacing: '-1.5px' }}>
              {ward?.name || 'Loading Ward...'}
            </h1>
            <p style={{ color: '#64748b', fontSize: '16px', marginTop: '8px' }}>
              Ward Detail & Capacity Monitoring
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
            {beds.map(bed => {
              const cfg = STATUS_CONFIG[bed.status] || FALLBACK_STATUS;
              const isCleaning = bed.status === 'CLEANING';

              return (
                <div key={bed.id} style={{
                  background: cfg.bg,
                  border: `1px solid ${cfg.border}`,
                  borderRadius: '20px',
                  padding: '24px 20px',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.25s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>Bed #{bed.id}</span>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cfg.color, boxShadow: cfg.glow }} />
                  </div>

                  <div style={{ fontSize: '11px', fontWeight: '700', color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                    {cfg.label}
                  </div>

                  {bed.patientName ? (
                    <div style={{ marginTop: 'auto' }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#e2e8f0' }}>{bed.patientName}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Dr. {bed.doctor || 'Unassigned'}</div>
                    </div>
                  ) : isCleaning ? (
                    <button 
                      onClick={() => handleCompleteCleaning(bed.id)}
                      style={{
                        width: '100%',
                        background: '#eab308',
                        color: '#000',
                        border: 'none',
                        padding: '10px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        marginTop: '10px'
                      }}
                    >
                      Complete Cleaning
                    </button>
                  ) : (
                    <div style={{ color: '#475569', fontSize: '12px', fontStyle: 'italic', marginTop: '20px' }}>Ready for admission</div>
                  )}

                  {isCleaning && (
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      height: '3px',
                      width: '100%',
                      background: 'rgba(234, 179, 8, 0.3)',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: '40%',
                        background: '#eab308',
                        animation: 'loading 2s infinite ease-in-out'
                      }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column: Analytics & Alerts */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Capacity Summary */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '24px',
            padding: '24px',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ward Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <StatRow label="Total Capacity" value={capacity?.totalBeds || 0} />
              <StatRow label="Occupied" value={capacity?.occupiedBeds || 0} color="#ef4444" />
              <StatRow label="Available" value={capacity?.availableBeds || 0} color="#22c55e" />
              
              <div style={{ marginTop: '10px', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${(capacity?.occupiedBeds / capacity?.totalBeds) * 100}%`, 
                  background: '#3dbdaa',
                  borderRadius: '4px',
                  transition: 'width 0.5s ease-out'
                }} />
              </div>
            </div>
          </div>

          {/* Alerts Panel */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '24px',
            padding: '24px',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ward Alerts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {alerts.length === 0 ? (
                <div style={{ color: '#475569', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No active alerts for this ward.</div>
              ) : (
                alerts.map((alert, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(239, 68, 68, 0.05)',
                    borderLeft: '3px solid #ef4444',
                    padding: '12px 16px',
                    borderRadius: '4px 8px 8px 4px',
                    fontSize: '13px',
                    color: '#fca5a5'
                  }}>
                    {alert.message}
                  </div>
                ))
              )}
            </div>
          </div>

        </aside>

      </div>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
      `}</style>
    </div>
  );
}

const StatRow = ({ label, value, color = '#fff' }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>{label}</span>
    <span style={{ fontSize: '18px', fontWeight: '700', color }}>{value}</span>
  </div>
);
