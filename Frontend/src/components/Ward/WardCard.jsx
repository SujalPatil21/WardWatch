import React from 'react';
import { useNavigate } from 'react-router-dom';
import { transformAlert, sortAlerts } from '../../utils/alertUtils';

function getStatus(occupied, total) {
  if (!total) return "safe";
  const ratio = occupied / total;

  if (ratio >= 0.95) return "critical"; // RED
  if (ratio >= 0.85) return "warning";  // YELLOW
  return "safe";
}

const getStatusColor = (status) => {
  switch (status) {
    case 'critical': return '#ef4444'; // red
    case 'warning': return '#eab308'; // yellow
    case 'safe':
    default: return '#22c55e'; // green
  }
};

const WardCard = ({ ward, readOnly = false }) => {
  const navigate = useNavigate();
  const status = getStatus(ward.occupiedBeds, ward.totalBeds);
  const statusColor = getStatusColor(status);

  const handleClick = () => {
    if (readOnly) return;
    navigate(`/ward/${ward.id}`);
  };

  const handleMouseEnter = (e) => {
    e.currentTarget.style.transform = 'scale(1.02)';
    e.currentTarget.style.boxShadow = `0 10px 40px ${statusColor}30`;
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.3)';
  };

  // Process alerts according to rules
  const allAlerts = sortAlerts(ward.alerts || []);
  const displayedAlerts = allAlerts.slice(0, 3);

  console.log(`WardCard [${ward.name}] Alerts:`, displayedAlerts);

  return (
    <div
      className="ward-card"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(12px)',
        borderRadius: '24px',
        padding: '24px',
        border: `1px solid ${statusColor}30`,
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: readOnly ? 'default' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        position: 'relative',
        zIndex: 10
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px' }}>
          {ward.name}
        </h2>
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: statusColor,
          boxShadow: `0 0 15px ${statusColor}`
        }} />
      </div>

      {/* Capacity Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <span>Occupation</span>
          <span style={{ color: statusColor }}>{ward.occupiedBeds || 0} / {ward.totalBeds || 0}</span>
        </div>
        
        <div style={{
          width: '100%',
          height: '6px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${ward.totalBeds ? Math.min(100, ((ward.occupiedBeds || 0) / ward.totalBeds) * 100) : 0}%`,
            backgroundColor: statusColor,
            boxShadow: `0 0 10px ${statusColor}`,
            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
          }} />
        </div>
      </div>

      {/* Alerts Section */}
      <div style={{ 
        marginTop: 'auto', 
        paddingTop: '20px', 
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          ⚠ Critical Alerts
        </div>
        
        {displayedAlerts.length > 0 ? (
          displayedAlerts.map((alert, idx) => {
            const isCleaning = alert.type === 'CLEANING_DELAY';
            const message = transformAlert(alert);
            if (!message) return null;

            return (
              <div 
                key={idx} 
                style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: isCleaning ? '#fbbf24' : '#fca5a5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  animation: isCleaning ? 'pulse 2s infinite ease-in-out' : 'none'
                }}
              >
                <span style={{ fontSize: '14px' }}>{isCleaning ? '🧹' : '🚨'}</span>
                {message}
              </div>
            );
          })
        ) : (
          <div style={{ fontSize: '13px', color: '#475569', fontStyle: 'italic' }}>No critical alerts</div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.98); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default WardCard;
