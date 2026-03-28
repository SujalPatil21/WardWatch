package com.wardwatch.config;

import com.wardwatch.service.WebSocketEventService;
import org.springframework.context.annotation.Lazy;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

@Component
public class WebSocketEventListener {

    private final WebSocketEventService webSocketEventService;

    public WebSocketEventListener(@Lazy WebSocketEventService webSocketEventService) {
        this.webSocketEventService = webSocketEventService;
    }

    @EventListener
    public void handleSubscribeEvent(SessionSubscribeEvent event) {
        webSocketEventService.sendSystemUpdate();
    }
}
