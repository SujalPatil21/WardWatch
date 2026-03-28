import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  fetchWards, 
  fetchBeds, 
  fetchAlerts, 
  completeCleaning 
} from '../services/wardService';
import { transformAlert, sortAlerts } from '../utils/alertUtils';

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

const wardDoctors = {
  ICU: "Dr. Mehta",
  "GENERAL A": "Dr. Sharma",
  "GENERAL B": "Dr. Khan",
  EMERGENCY: "Dr. Rao",
  PEDIATRIC: "Dr. Patel",
  MATERNITY: "Dr. Iyer"
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
  const [wardAlerts, setWardAlerts] = useState([]);
  const [flippedBeds, setFlippedBeds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // Parallel fetch for speed and synchronization
      const [wardsRes, bedsRes, alertsRes] = await Promise.allSettled([
        fetchWards(),
        fetchBeds(),
        fetchAlerts()
      ]);

      const wardsList = wardsRes.status === 'fulfilled' ? (wardsRes.value || []) : [];
      const bedsList = bedsRes.status === 'fulfilled' ? (bedsRes.value || []) : [];
      const alerts = alertsRes.status === 'fulfilled' ? (alertsRes.value || { cleaningAlerts: [], capacityAlerts: [] }) : { cleaningAlerts: [], capacityAlerts: [] };

      const foundWard = wardsList.find(w => String(w.id) === String(id));
      const wardBeds = bedsList.filter(b => String(b.wardId) === String(id));
      
      // Map bedId -> wardId for cleaning alerts
      const bedToWardMap = bedsList.reduce((acc, bed) => {
        acc[bed.id] = bed.wardId;
        return acc;
      }, {});

      // Filter and transform alerts for THIS ward
      const wardCleaning = (alerts.cleaningAlerts || [])
        .filter(a => String(bedToWardMap[a.bedId]) === String(id)); // Keep original type: CLEANING_DELAY

      const wardCapacity = (alerts.capacityAlerts || [])
        .filter(a => String(a.wardId) === String(id)); // Keep original types: CAPACITY_CRITICAL, CAPACITY_WARNING

      setWard(foundWard || null);
      setBeds(wardBeds);
      setWardAlerts(sortAlerts([...wardCleaning, ...wardCapacity]).slice(0, 3));
      
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

  const toggleFlip = (bedId) => {
    setFlippedBeds(prev => {
      const next = new Set(prev);
      if (next.has(bedId)) next.delete(bedId);
      else next.add(bedId);
      return next;
    });
  };

  const handleCompleteCleaning = async (e, bedId) => {
    e.stopPropagation();
    try {
      await completeCleaning(bedId);
      await loadData();
    } catch (err) {
      console.error('Failed to complete cleaning:', err);
    }
  };

  const occupiedCount = beds.filter(b => b.status === 'OCCUPIED').length;
  const totalCount = beds.length;
  const ratio = totalCount > 0 ? occupiedCount / totalCount : 0;
  
  const statusColor = ratio >= 0.95 ? '#ef4444' : ratio >= 0.85 ? '#eab308' : '#22c55e';
  const currentDoctor = ward ? (wardDoctors[ward.name] || 'Dr. Unassigned') : 'Loading...';

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
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.99); }
          100% { opacity: 1; transform: scale(1); }
        }
        .bed-card-container {
          perspective: 1000px;
          height: 200px;
          cursor: pointer;
        }
        .bed-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          text-align: left;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
        }
        .bed-card-container.flipped .bed-card-inner {
          transform: rotateY(180deg);
        }
        .bed-card-front, .bed-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          border-radius: 20px;
          padding: 24px 20px;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }
        .bed-card-back {
          transform: rotateY(180deg);
          justify-content: space-between;
        }
      `}</style>

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
        >
          ← Back to Overview
        </button>

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
      </nav>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', padding: '16px', borderRadius: '12px', marginBottom: '30px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
        <section>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '36px', fontWeight: '800', margin: 0, letterSpacing: '-1.5px' }}>
              {ward?.name || 'Loading Ward...'}
            </h1>
            <p style={{ color: '#64748b', fontSize: '16px', marginTop: '8px' }}>
              Ward Detail & Capacity Monitoring
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
            {beds.map(bed => {
              const cfg = STATUS_CONFIG[bed.status] || FALLBACK_STATUS;
              const isCleaning = bed.status === 'CLEANING';
              const isFlipped = flippedBeds.has(bed.id);

              return (
                <div 
                  key={bed.id} 
                  className={`bed-card-container ${isFlipped ? 'flipped' : ''}`}
                  onClick={() => toggleFlip(bed.id)}
                >
                  <div className="bed-card-inner">
                    <div className="bed-card-front" style={{
                      background: cfg.bg,
                      border: `1px solid ${cfg.border}`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>Bed #{bed.id}</span>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cfg.color, boxShadow: cfg.glow }} />
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                        {cfg.label}
                      </div>
                      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center', opacity: 0.4 }}>
                        <span style={{ fontSize: '24px' }}>🖱️</span>
                      </div>
                    </div>

                    <div className="bed-card-back" style={{
                      background: 'rgba(30, 41, 59, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                    }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', marginBottom: '8px' }}>DETAILED INFO</div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
                          {bed.patientName || 'Vacant'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#3dbdaa', fontWeight: '600' }}>
                          {currentDoctor}
                        </div>
                      </div>
                      <div>
                        {isCleaning && (
                          <button 
                            onClick={(e) => handleCompleteCleaning(e, bed.id)}
                            style={{
                              width: '100%',
                              background: '#3dbdaa',
                              color: '#fff',
                              border: 'none',
                              padding: '8px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              marginBottom: '10px'
                            }}
                          >
                            Mark Available
                          </button>
                        )}
                        <div style={{ fontSize: '10px', color: '#475569' }}>
                          Last Update: {bed.lastUpdated ? new Date(bed.lastUpdated).toLocaleTimeString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '24px',
            padding: '24px',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '20px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ward Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <StatRow label="Total Capacity" value={totalCount} />
              <StatRow label="Occupied" value={occupiedCount} color="#ef4444" />
              <StatRow label="Available" value={totalCount - occupiedCount} color="#22c55e" />
              <div style={{ marginTop: '10px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${totalCount ? (occupiedCount / totalCount) * 100 : 0}%`, 
                  background: statusColor,
                  borderRadius: '3px',
                  transition: 'width 0.5s ease-out'
                }} />
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            padding: '24px',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '20px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}> Critical Alerts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {wardAlerts.length === 0 ? (
                <div style={{ color: '#475569', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No critical alerts</div>
              ) : (
                wardAlerts.map((alert, idx) => {
                  const isCleaning = alert.type === 'CLEANING_DELAY';
                  const msg = transformAlert(alert);
                  
                  return (
                    <div key={idx} style={{
                      background: isCleaning ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.08)',
                      borderLeft: `4px solid ${isCleaning ? '#eab308' : '#ef4444'}`,
                      padding: '12px 16px',
                      borderRadius: '4px 12px 12px 4px',
                      fontSize: '13px',
                      color: isCleaning ? '#fbbf24' : '#fca5a5',
                      animation: isCleaning ? 'pulse 2s infinite ease-in-out' : 'none'
                    }}>
                      <strong style={{ display: 'block', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase' }}>
                        {isCleaning ? '🧹 Maintenance' : '📈 Capacity'}
                      </strong>
                      {msg}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

const StatRow = ({ label, value, color = '#fff' }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{label}</span>
    <span style={{ fontSize: '16px', fontWeight: '700', color }}>{value}</span>
  </div>
);
