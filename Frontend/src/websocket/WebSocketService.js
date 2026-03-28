import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.subscription = null;
  }

  connect(onMessageReceived) {
    if (this.stompClient && this.stompClient.active) {
      console.log("WebSocket already connected.");
      return;
    }

    // Connect to the Spring Boot endpoint
    const socket = new SockJS('http://localhost:8080/ws');
    
    this.stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: (str) => {
        // console.log(str);
      },
      onConnect: () => {
        console.log("WebSocket Connected");
        
        // Subscribe to the updates path
        this.subscription = this.stompClient.subscribe('/topic/updates', (message) => {
          if (message.body) {
            console.log("Received update: ", message.body);
            try {
              const payload = JSON.parse(message.body);
              onMessageReceived(payload);
            } catch (error) {
              console.error("Error parsing WebSocket payload:", error);
            }
          }
        });
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      },
      onWebSocketError: (event) => {
        console.error("WebSocket connection error:", event);
      }
    });

    this.stompClient.activate();
  }

  disconnect() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    if (this.stompClient) {
      this.stompClient.deactivate();
      console.log("WebSocket Disconnected");
    }
  }
}

// Export as a singleton
const webSocketService = new WebSocketService();
export default webSocketService;
