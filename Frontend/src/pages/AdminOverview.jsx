import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import WardGrid from '../components/Ward/WardGrid';
import LogoutButton from '../components/common/LogoutButton';
import { fetchWards, fetchAlerts, fetchWardCapacity, fetchQueue, fetchSummary, fetchBeds } from '../services/wardService';

/**
 * AdminOverview: Read-only hospital oversight with 3s polling.
 * REPLICATES layout from AdminDashboard (Staff) but disables interaction.
 */
export default function AdminOverview() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [data, setData] = useState({
    wards: [],
    alerts: { cleaningAlerts: [], capacityAlerts: [] },
    capacity: {},
    queue: [],
    summary: {},
    beds: []
  });
  const [loading, setLoading] = useState(true);

  // Polling Implementation (3 seconds)
  const fetchData = async () => {
    try {
      const [wards, alerts, capacity, queue, summary, beds] = await Promise.all([
        fetchWards().catch(() => []),
        fetchAlerts().catch(() => ({ cleaningAlerts: [], capacityAlerts: [] })),
        fetchWardCapacity().catch(() => ({})),
        fetchQueue().catch(() => []),
        fetchSummary().catch(() => ({})),
        fetchBeds().catch(() => [])
      ]);
      
      setData({ wards, alerts, capacity, queue, summary, beds });
      setLoading(false);
    } catch (error) {
      console.error('[AdminOverview] Polling error:', error);
    }
  };

  useEffect(() => {
    fetchData(); // Initial load
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval); // Polling Cleanup on unmount
  }, []);

  // Enriched Wards (Read-Only)
  const bedToWardMap = (data.beds || []).reduce((acc, bed) => {
    acc[bed.id] = bed.wardId;
    return acc;
  }, {});

  const enrichedWards = data.wards.map(ward => {
    const wardBeds = (data.beds || []).filter(b => b.wardId === ward.id);
    
    // Filter cleaning alerts for this ward
    const wardCleaning = (data.alerts?.cleaningAlerts || [])
      .filter(a => String(bedToWardMap[a.bedId]) === String(ward.id));

    // Filter capacity alerts for this ward
    const wardCapacity = (data.alerts?.capacityAlerts || [])
      .filter(a => String(a.wardId) === String(ward.id));

    return {
      ...ward,
      totalBeds: wardBeds.length,
      occupiedBeds: wardBeds.filter(b => b.status === 'OCCUPIED').length,
      alerts: [...wardCleaning, ...wardCapacity]
    };
  });

  // Derived Queue Metrics
  const queueActive = data.queue.length;
  const admissionPending = data.queue.filter(q => q.status === 'WAITING').length;
  const dischargePending = data.queue.filter(q => q.status === 'DISCHARGE_PENDING').length;

  return (
    <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
      <Sidebar isOpen={sidebarOpen} />
      
      <main className="main-content" style={{
        flex: 1,
        marginLeft: sidebarOpen ? '260px' : '80px',
        padding: '40px',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        minWidth: 0,
        position: 'relative',
        color: '#fff'
      }}>
        {/* Header Section */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '800', letterSpacing: '-1.5px' }}>
              Admin Insights
            </h1>
            <p style={{ color: '#94a3b8', marginTop: '6px', fontSize: '15px' }}>
              Comprehensive facility oversight • Monitoring {data.wards.length} wards
            </p>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
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
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: '600' }}>{sidebarOpen ? 'Collapse' : 'Expand'}</span>
              <span>{sidebarOpen ? '⇠' : '⇢'}</span>
            </button>
            <LogoutButton />
          </div>
        </header>

        {/* Global Stats Summary Row */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '24px', 
          marginBottom: '40px' 
        }}>
          <StatCard 
            title="Total Occupancy" 
            value={`${data.summary?.totalOccupancy || 0}%`} 
            icon="👥" 
            color="#3dbdaa" 
          />
          <StatCard 
            title="Active Alerts" 
            value={data.alerts.cleaningAlerts.length + data.alerts.capacityAlerts.length} 
            icon="🚨" 
            color="#ef4444" 
          />
          <StatCard 
            title="Queue Active" 
            value={queueActive} 
            icon="📋" 
            color="#2563eb" 
          />
          <StatCard 
            title="Ward Capacity" 
            value={`${enrichedWards.filter(w => (w.occupiedBeds/w.totalBeds) >= 0.85).length} Warning`} 
            icon="🏥" 
            color="#8b5cf6" 
          />
        </div>

        {/* Main Section: Ward Grid (Read-Only) */}
        <section style={{ marginBottom: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '4px', height: '20px', background: '#3dbdaa', borderRadius: '4px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Facility Map</h2>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '100px', color: '#64748b' }}>Initializing monitor...</div>
          ) : (
            <WardGrid wards={enrichedWards} readOnly={true} />
          )}
        </section>

        {/* Secondary Insights Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          {/* Patient Flow Visualization */}
          <section className="card-glass" style={{
            background: 'rgba(30, 41, 59, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '30px',
            borderRadius: '24px',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>Patient Flow</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <FlowItem label="Admission Pending" value={admissionPending} color="#3dbdaa" status="WAITING" />
              <FlowItem label="Discharge Pending" value={dischargePending} color="#ef4444" status="DISCHARGE_PENDING" />
            </div>
          </section>

          {/* Actionable Insights Section */}
          <section className="card-glass" style={{
            background: 'rgba(30, 41, 59, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '30px',
            borderRadius: '24px',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>Actionable Insights</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {enrichedWards.filter(w => (w.occupiedBeds / w.totalBeds) >= 0.9).map(w => (
                <InsightItem key={w.id} icon="⚠️" text={`Critical Capacity: ${w.name} is at ${Math.round((w.occupiedBeds/w.totalBeds)*100)}%`} color="#ef4444" />
              ))}
              {data.alerts.cleaningAlerts.length > 0 && (
                <InsightItem icon="🧹" text={`Cleaning Backlog: ${data.alerts.cleaningAlerts.length} beds pending`} color="#fbbf24" />
              )}
              {queueActive > 3 && (
                <InsightItem icon="📈" text={`High Inflow: ${queueActive} patients awaiting admission`} color="#3dbdaa" />
              )}
              {enrichedWards.filter(w => (w.occupiedBeds / w.totalBeds) >= 0.9).length === 0 && data.alerts.cleaningAlerts.length === 0 && queueActive <= 3 && (
                <div style={{ color: '#64748b', fontStyle: 'italic', fontSize: '14px' }}>All systems operational. No critical actions required.</div>
              )}
            </div>
          </section>
        </div>
      </main>

      <style>{`
        .StatCard-hover:hover { transform: translateY(-4px); border-color: rgba(255,255,255,0.2) !important; }
        .card-glass { transition: all 0.3s ease; }
      `}</style>
    </div>
  );
}

// Sub-components for cleaner structure
const StatCard = ({ title, value, icon, color }) => (
  <div className="StatCard-hover" style={{
    background: 'rgba(30, 41, 59, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '24px',
    borderRadius: '20px',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
      <div style={{ 
        width: '40px', 
        height: '40px', 
        borderRadius: '12px', 
        background: `${color}15`, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontSize: '20px'
      }}>
        {icon}
      </div>
      <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </span>
    </div>
    <div style={{ fontSize: '28px', fontWeight: '800', color: '#fff' }}>{value}</div>
  </div>
);

const FlowItem = ({ label, value, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
      <span style={{ fontSize: '15px', color: '#cbd5e1' }}>{label}</span>
    </div>
    <span style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>{value}</span>
  </div>
);

const InsightItem = ({ icon, text, color }) => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px', 
    padding: '12px 16px', 
    background: 'rgba(15, 23, 42, 0.3)', 
    borderRadius: '12px',
    borderLeft: `3px solid ${color}`
  }}>
    <span style={{ fontSize: '16px' }}>{icon}</span>
    <span style={{ fontSize: '14px', fontWeight: '500', color: '#e2e8f0' }}>{text}</span>
  </div>
);
