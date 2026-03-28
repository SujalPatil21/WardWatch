import React, { createContext, useContext, useEffect, useState } from 'react';
import webSocketService from '../websocket/WebSocketService';

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
    console.log("[LiveDataContext] Connecting to WebSocket...");
    
    // Connect WebSocket and replace state entirely on message
    webSocketService.connect((payload) => {
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
      // Disconnect on unmount
      console.log("[LiveDataContext] Disconnecting WebSocket...");
      webSocketService.disconnect();
    };
  }, []);

  return (
    <LiveDataContext.Provider value={data}>
      {children}
    </LiveDataContext.Provider>
  );
};
