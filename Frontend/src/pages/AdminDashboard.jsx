import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import WardGrid from '../components/Ward/WardGrid';
import { fetchWards, fetchBeds, fetchAlerts } from '../services/wardService';

/**
 * AdminDashboard: Primary hospital overview.
 */
export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      // Parallel fetch for speed and synchronization
      const [wardsData, bedsData, alertsData] = await Promise.allSettled([
        fetchWards(),
        fetchBeds(),
        fetchAlerts()
      ]);

      const wardsList = wardsData.status === 'fulfilled' ? (wardsData.value || []) : [];
      const bedsList = bedsData.status === 'fulfilled' ? (bedsData.value || []) : [];
      const alerts = alertsData.status === 'fulfilled' ? (alertsData.value || { cleaningAlerts: [], capacityAlerts: [] }) : { cleaningAlerts: [], capacityAlerts: [] };

      console.log("ALERTS API RESPONSE:", alerts);

      // Map bedId -> wardId for cleaning alerts
      const bedToWardMap = bedsList.reduce((acc, bed) => {
        acc[bed.id] = bed.wardId;
        return acc;
      }, {});

      // Calculate capacity and map alerts per ward
      const enrichedWards = wardsList.map(ward => {
        const wardBeds = bedsList.filter(b => b.wardId === ward.id);
        
        // Filter cleaning alerts for this ward
        const wardCleaning = (alerts.cleaningAlerts || [])
          .filter(a => {
            const mappedWardId = bedToWardMap[a.bedId];
            return String(mappedWardId) === String(ward.id);
          }); // Keep original type: CLEANING_DELAY

        // Filter capacity alerts for this ward
        const wardCapacity = (alerts.capacityAlerts || [])
          .filter(a => String(a.wardId) === String(ward.id)); // Keep original types: CAPACITY_CRITICAL, CAPACITY_WARNING

        const mappedAlertsForWard = [...wardCleaning, ...wardCapacity];
        if (mappedAlertsForWard.length > 0) {
          console.log(`Mapped Alerts for Ward ${ward.name}:`, mappedAlertsForWard);
        }

        return {
          ...ward,
          totalBeds: wardBeds.length,
          occupiedBeds: wardBeds.filter(b => b.status === 'OCCUPIED').length,
          alerts: mappedAlertsForWard
        };
      });

      setWards(enrichedWards);
    } catch (err) {
      console.error('[AdminDashboard] Critical failure loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      }}>
        {/* Header Section */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px'
        }}>
          <div>
            <h1 style={{ 
              margin: 0, 
              fontSize: '32px', 
              fontWeight: '800', 
              color: '#fff',
              letterSpacing: '-1px'
            }}>
              Hospital Overview
            </h1>
            <p style={{ color: '#94a3b8', marginTop: '6px', fontSize: '15px' }}>
              Real-time monitor for {wards.length} wards across the facility
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
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            <span style={{ fontSize: '14px', fontWeight: '600' }}>{sidebarOpen ? 'Collapse' : 'Expand'}</span>
            <span>{sidebarOpen ? '⇠' : '⇢'}</span>
          </button>
        </header>

        {/* Content Section */}
        {loading ? (
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '120px',
            gap: '16px'
          }}>
            <div className="spinner" style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(61,189,170,0.1)',
              borderTopColor: '#3dbdaa',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <div style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>Synchronizing hospital state...</div>
          </div>
        ) : (
          <div className="fade-in" style={{ animation: 'fadeIn 0.5s ease-out forwards' }}>
            <WardGrid wards={wards} />
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .dashboard-container { overflow-x: hidden; }
        .main-content { min-width: 0; }
      `}</style>
    </div>
  );
}
