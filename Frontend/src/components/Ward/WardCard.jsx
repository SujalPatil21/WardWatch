import React from 'react';
import { useNavigate } from 'react-router-dom';

function getStatus(occupied, total) {
  if (!total) return "safe";
  const ratio = occupied / total;

  if (ratio > 0.85) return "critical";
  if (ratio > 0.6) return "warning";
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

const WardCard = ({ ward }) => {
  const navigate = useNavigate();
  const status = getStatus(ward.occupiedBeds, ward.totalBeds);
  const statusColor = getStatusColor(status);

  const handleMouseEnter = (e) => {
    e.currentTarget.style.transform = 'scale(1.03)';
    e.currentTarget.style.boxShadow = `0 10px 30px ${statusColor}40`;
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.3)';
  };

  return (
    <div
      onClick={() => navigate(`/dashboard/ward/${ward.id}`)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 'bold', color: '#ffffff', textShadow: `0 0 10px ${statusColor}80` }}>
          {ward.name}
        </h2>
        <div style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: statusColor,
          boxShadow: `0 0 12px ${statusColor}`
        }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', fontSize: '1rem', fontWeight: '500' }}>
          <span>Bed Capacity</span>
          <span>{ward.occupiedBeds || 0} / {ward.totalBeds || 0}</span>
        </div>
        
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${ward.totalBeds ? Math.min(100, ((ward.occupiedBeds || 0) / ward.totalBeds) * 100) : 0}%`,
            backgroundColor: statusColor,
            boxShadow: `0 0 10px ${statusColor}`,
            transition: 'width 0.5s ease-in-out'
          }} />
        </div>
      </div>
    </div>
  );
};

export default WardCard;
