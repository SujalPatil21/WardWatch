import { Client } from "@stomp/stompjs";

const client = new Client({
  brokerURL: "wss://wardwatch-production.up.railway.app/ws",
  reconnectDelay: 5000,

  onConnect: () => {
    console.log("✅ CONNECTED");

    client.subscribe("/topic/updates", (message) => {
      console.log("📡 DATA RECEIVED:", message.body);
    });
  },

  onWebSocketError: (error) => {
    console.error("❌ WS ERROR", error);
  }
});

export const connectWebSocket = () => {
  client.activate();
};

export default client;
