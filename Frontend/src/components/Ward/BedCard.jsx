import React from 'react';
import { BedDouble } from 'lucide-react';

/**
 * BedCard: A professional, realistic representation of a hospital bed unit.
 * Features:
 * - Flip interaction for details
 * - Status-based animations (Breathing, Shimmer, Pulse)
 * - Glassmorphism UI
 */
const BedCard = ({ 
  bed, 
  statusConfig, 
  isFlipped, 
  onFlip, 
  onCompleteCleaning, 
  doctorName,
  isCritical 
}) => {
  const cfg = statusConfig || {
    bg: 'rgba(100,100,100,0.1)',
    border: 'rgba(255,255,255,0.1)',
    color: '#94a3b8',
    glow: 'none',
    label: 'Unknown',
  };

  const isCleaning = bed.status === 'CLEANING';
  const isOccupied = bed.status === 'OCCUPIED';

  // Determine animation class
  let animationClass = '';
  if (isCritical) animationClass = 'animate-critical-pulse';
  else if (isCleaning) animationClass = 'animate-cleaning-shimmer';
  else if (isOccupied) animationClass = 'animate-occupied-breathe';

  return (
    <div 
      className={`bed-card-container ${isFlipped ? 'flipped' : ''}`}
      onClick={() => onFlip(bed.id)}
      style={{
        perspective: '1000px',
        height: '220px',
        cursor: 'pointer'
      }}
    >
      <div className="bed-card-inner" style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        transformStyle: 'preserve-3d',
        transform: isFlipped ? 'rotateY(180deg)' : 'none'
      }}>
        {/* FRONT SIDE */}
        <div className="bed-card-front" style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          borderRadius: '24px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          background: `linear-gradient(135deg, ${cfg.bg}, rgba(15, 23, 42, 0.6))`,
          backdropFilter: 'blur(16px)',
          border: `1px solid ${isCritical ? 'rgba(239, 68, 68, 0.5)' : cfg.border}`,
          boxShadow: isCritical ? '0 0 20px rgba(239, 68, 68, 0.3)' : '0 8px 32px rgba(0,0,0,0.3)',
          transition: 'all 0.4s ease',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Bed #{bed.id}
            </span>
            <div style={{
              padding: '4px 10px',
              borderRadius: '20px',
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              fontSize: '10px',
              fontWeight: '800',
              color: cfg.color,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {cfg.label}
            </div>
          </div>

          {/* Center Icon */}
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            position: 'relative'
          }}>
            <BedDouble 
              size={44} 
              color={cfg.color} 
              className={animationClass}
              style={{ 
                transition: 'all 0.5s ease',
                filter: `drop-shadow(0 0 12px ${cfg.color}40)` 
              }} 
            />
            {isCritical && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.1)',
                zIndex: -1,
                animation: 'pulse-ring 2s infinite'
              }} />
            )}
          </div>

          {/* Bottom Info */}
          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            {isOccupied ? (
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>
                {bed.patientName || 'Assigning...'}
              </div>
            ) : (
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>
                {isCleaning ? 'Unit Sterilization' : 'Ready for admission'}
              </div>
            )}
          </div>
        </div>

        {/* BACK SIDE */}
        <div className="bed-card-back" style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          borderRadius: '24px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          transform: 'rotateY(180deg)',
          boxSizing: 'border-box'
        }}>
          <div>
            <div style={{ fontSize: '10px', color: '#475569', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
              Detailed Metadata
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Patient</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#fff' }}>{bed.patientName || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Doctor</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#3dbdaa' }}>{doctorName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Status</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: cfg.color }}>{cfg.label}</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 'auto' }}>
            {isCleaning && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onCompleteCleaning(e, bed.id);
                }}
                style={{
                  width: '100%',
                  background: 'rgba(61, 189, 170, 0.2)',
                  border: '1px solid rgba(61, 189, 170, 0.4)',
                  color: '#3dbdaa',
                  padding: '10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  transition: 'all 0.2s ease',
                  marginBottom: '12px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(61, 189, 170, 0.3)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(61, 189, 170, 0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Sterilization Complete
              </button>
            )}
            <div style={{ fontSize: '10px', color: '#475569', textAlign: 'center' }}>
              Last Sync: {bed.lastUpdated ? new Date(bed.lastUpdated).toLocaleTimeString() : 'Real-time'}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .bed-card-container:hover .bed-card-front {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.4);
        }
        
        @keyframes occupied-breathe {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.2)); opacity: 1; }
          50% { filter: drop-shadow(0 0 12px rgba(239, 68, 68, 0.4)); opacity: 0.9; }
        }
        
        @keyframes cleaning-shimmer {
          0% { filter: contrast(1) brightness(1); }
          50% { filter: contrast(1.1) brightness(1.2); transform: skewX(-2deg); }
          100% { filter: contrast(1) brightness(1); }
        }
        
        @keyframes critical-pulse {
          0% { transform: scale(1); filter: drop-shadow(0 0 2px #ef4444); }
          50% { transform: scale(1.05); filter: drop-shadow(0 0 15px #ef4444); }
          100% { transform: scale(1); filter: drop-shadow(0 0 2px #ef4444); }
        }

        @keyframes pulse-ring {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }

        .animate-occupied-breathe { animation: occupied-breathe 4s infinite ease-in-out; }
        .animate-cleaning-shimmer { animation: cleaning-shimmer 2s infinite linear; }
        .animate-critical-pulse { animation: critical-pulse 1.5s infinite cubic-bezier(0.4, 0, 0.6, 1); }
      `}</style>
    </div>
  );
};

export default BedCard;
