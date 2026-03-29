import { Client } from "@stomp/stompjs";

const client = new Client({
  brokerURL: "wss://wardwatch-production.up.railway.app/ws",
  reconnectDelay: 5000,
});

let listeners = [];

export const subscribeToData = (callback) => {
  listeners.push(callback);
  
  // Return an unsubscribe function
  return () => {
    listeners = listeners.filter(cb => cb !== callback);
  };
};

client.onConnect = () => {
  console.log("✅ CONNECTED");

  client.subscribe("/topic/updates", (message) => {
    try {
      const data = JSON.parse(message.body);
      console.log("📡 DATA RECEIVED:", data);

      // Notify all listeners
      listeners.forEach((cb) => cb(data));
    } catch (error) {
      console.error("Error parsing WebSocket payload:", error);
    }
  });
};

client.onWebSocketError = (error) => {
  console.error("❌ WS ERROR", error);
};

client.onStompError = (frame) => {
  console.error("❌ STOMP ERROR", frame.headers['message']);
};

export const connectWebSocket = () => {
  if (!client.active) {
    client.activate();
  }
};

export default client;
