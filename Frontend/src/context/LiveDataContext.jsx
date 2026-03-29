import React, { createContext, useContext, useEffect, useState } from 'react';
import { connectWebSocket, subscribeToData } from '../websocket/WebSocketService';

const LiveDataContext = createContext();

export const useLiveData = () => {
  return useContext(LiveDataContext);
};

export const LiveDataProvider = ({ children }) => {
  // Store ward data, beds, queue, and alerts in global state
  const [data, setData] = useState({
    wards: [],
    beds: [],
    queue: [],
    capacity: {},
    alerts: { 
      cleaningAlerts: [], 
      capacityAlerts: [] 
    }
  });

  useEffect(() => {
    console.log("[LiveDataContext] Initializing WebSocket connection...");
    
    // Connect WebSocket
    connectWebSocket();

    // Subscribe to data flow
    const unsubscribe = subscribeToData((payload) => {
      console.log("🔥 Updating UI with data:", payload);
      
      const actualData = payload.data || payload;
      
      setData((prevData) => {
        // Merge over previous data to ensure all keys persist,
        // but fully replace fields that were sent in the payload.
        return {
          ...prevData,
          ...actualData
        };
      });
    });

    return () => {
      // Unsubscribe from our listener to prevent memory leaks or duplicate updates
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <LiveDataContext.Provider value={data}>
      {children}
    </LiveDataContext.Provider>
  );
};
