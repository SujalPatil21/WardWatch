import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import { fetchQueue, fetchWards, addPatientToQueue, completeQueueAction } from '../services/wardService';

const STATUS_CONFIG = {
  WAITING: {
    label: 'Waiting for Admission',
    color: '#3dbdaa',
    bg: 'rgba(61,189,170,0.1)',
    icon: '⏳'
  },
  DISCHARGE_PENDING: {
    label: 'Pending Discharge',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.1)',
    icon: '🏥'
  }
};

export default function QueueDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [queue, setQueue] = useState([]);
  const [wards, setWards] = useState([]);
  const [name, setName] = useState('');
  const [selectedWardType, setSelectedWardType] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [queueData, wardsData] = await Promise.all([
        fetchQueue(),
        fetchWards()
      ]);
      setQueue(queueData || []);
      setWards(wardsData || []);
      
      // Default ward type selection to the first available if not set
      if (!selectedWardType && wardsData.length > 0) {
        setSelectedWardType(wardsData[0].name);
      }
      setError(null);
    } catch (err) {
      console.error('[QueueDashboard] Failed to sync data:', err);
      setError('Could not connect to the queue system.');
    } finally {
      setLoading(false);
    }
  }, [selectedWardType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddPatient = async (e) => {
    e.preventDefault();
    if (!name || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await addPatientToQueue(name, selectedWardType);
      setName('');
      await loadData();
    } catch (err) {
      console.error('Failed to add patient:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAction = async (id, action, wardId = null) => {
    try {
      setLoading(true);
      await completeQueueAction(id, action, wardId);
      await loadData();
    } catch (err) {
      console.error(`Failed to ${action}:`, err);
      setError(`Failed to perform ${action} action.`);
      setLoading(false);
    }
  };

  const waitingPatients = queue.filter(q => q.status === 'WAITING');
  const dischargePatients = queue.filter(q => q.status === 'DISCHARGE_PENDING');

  return (
    <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
      <Sidebar isOpen={sidebarOpen} />
      
      <main className="main-content" style={{
        flex: 1,
        marginLeft: sidebarOpen ? '260px' : '80px',
        padding: '40px',
        transition: 'margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        minWidth: 0,
        position: 'relative',
        color: '#fff'
      }}>
        <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '800', letterSpacing: '-1.5px' }}>
              Queue Management
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '15px', marginTop: '6px' }}>
              Centralized control for admissions and discharges.
            </p>
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff',
              padding: '10px 18px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '18px',
              transition: 'all 0.2s ease',
            }}
          >
            {sidebarOpen ? '⇠' : '⇢'}
          </button>
        </header>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            padding: '16px 24px',
            borderRadius: '12px',
            marginBottom: '30px'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'start' }}>
          
          {/* Add Patient Card */}
          <section className="card-glass" style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '30px',
            borderRadius: '24px',
            backdropFilter: 'blur(10px)'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '24px' }}>➕</span> Add New Patient
            </h2>
            <form onSubmit={handleAddPatient} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Patient Name
                </label>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '15px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Ward Type Request
                </label>
                <select 
                  value={selectedWardType}
                  onChange={(e) => setSelectedWardType(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '15px',
                    appearance: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {/* Dynamic ward options */}
                  {Array.from(new Set(wards.map(w => w.name))).map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting || loading}
                style={{
                  background: 'linear-gradient(135deg, #3dbdaa 0%, #2563eb 100%)',
                  border: 'none',
                  color: '#fff',
                  padding: '16px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '15px',
                  cursor: (isSubmitting || loading) ? 'not-allowed' : 'pointer',
                  opacity: (isSubmitting || loading) ? 0.6 : 1,
                  boxShadow: '0 4px 20px rgba(61, 189, 170, 0.25)',
                  transition: 'all 0.2s ease',
                  marginTop: '10px'
                }}
              >
                {isSubmitting ? 'Adding...' : 'Add to Queue'}
              </button>
            </form>
          </section>

          {/* Queue Lists Container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Waiting List */}
            <QueueSection 
              title="Awaiting Admission" 
              icon="⏳" 
              items={waitingPatients} 
              wards={wards}
              onAction={handleAction}
              type="WAITING"
            />

            {/* Discharge List */}
            <QueueSection 
              title="Pending Discharge" 
              icon="🏥" 
              items={dischargePatients} 
              onAction={handleAction}
              type="DISCHARGE_PENDING"
            />

          </div>
        </div>
      </main>

      <style>{`
        .card-glass { transform: translateZ(0); }
        select { background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 14px center; background-size: 16px; }
      `}</style>
    </div>
  );
}

const QueueSection = ({ title, icon, items, wards, onAction, type }) => (
  <section style={{
    background: 'rgba(30, 41, 59, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '24px',
    padding: '30px',
    backdropFilter: 'blur(10px)'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '700', display: 'flex', gap: '10px', alignItems: 'center', margin: 0 }}>
        <span>{icon}</span> {title}
      </h2>
      <span style={{ 
        background: STATUS_CONFIG[type].bg, 
        color: STATUS_CONFIG[type].color, 
        padding: '6px 14px', 
        borderRadius: '20px', 
        fontSize: '12px', 
        fontWeight: '700' 
      }}>
        {items.length} Patient{items.length !== 1 ? 's' : ''}
      </span>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {items.length === 0 ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#475569', 
          border: '2px dashed rgba(255,255,255,0.03)', 
          borderRadius: '16px' 
        }}>
          No patients in this list.
        </div>
      ) : (
        items.map(item => (
          <div key={item.id} style={{
            background: 'rgba(15, 23, 42, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'all 0.2s ease'
          }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#e2e8f0' }}>{item.name}</div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Req: {item.type}
                </span>
                {item.bedId && (
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>
                    📍 Bed #{item.bedId}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {type === 'WAITING' ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select 
                    id={`ward-select-${item.id}`}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {wards.map(ward => (
                      <option key={ward.id} value={ward.id}>{ward.name}</option>
                    ))}
                  </select>
                  <button 
                    onClick={() => {
                      const sel = document.getElementById(`ward-select-${item.id}`);
                      onAction(item.id, 'admit', sel.value);
                    }}
                    style={{
                      background: '#10b981',
                      border: 'none',
                      color: '#fff',
                      padding: '8px 20px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                  >
                    Admit
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => onAction(item.id, 'discharge')}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5',
                    padding: '8px 20px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239,68,68,0.25)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
                    e.currentTarget.style.color = '#fca5a5';
                  }}
                >
                  Discharge
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  </section>
);
