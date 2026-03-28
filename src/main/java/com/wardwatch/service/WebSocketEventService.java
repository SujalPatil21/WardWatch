package com.wardwatch.service;

import com.wardwatch.dev2.model.Bed;
import com.wardwatch.dev2.repository.BedRepository;
import com.wardwatch.model.Queue;
import com.wardwatch.repository.QueueRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class WebSocketEventService {

    private final SimpMessagingTemplate messagingTemplate;
    private final BedRepository bedRepository;
    private final QueueRepository queueRepository;
    private final AnalyticsService analyticsService;

    public WebSocketEventService(SimpMessagingTemplate messagingTemplate,
                                 BedRepository bedRepository,
                                 QueueRepository queueRepository,
                                 AnalyticsService analyticsService) {
        this.messagingTemplate = messagingTemplate;
        this.bedRepository = bedRepository;
        this.queueRepository = queueRepository;
        this.analyticsService = analyticsService;
    }

    public void sendSystemUpdate() {
        List<Bed> beds = bedRepository.findAll()
                .stream()
                .sorted((b1, b2) -> b1.getId().compareTo(b2.getId()))
                .toList();

        List<Queue> queue = queueRepository.findAll();

        Map<String, Object> alerts = analyticsService.getAlerts();
        Map<String, Object> capacity = analyticsService.getCapacity();

        Map<String, Object> data = new HashMap<>();
        data.put("beds", beds);
        data.put("queue", queue);
        data.put("alerts", alerts);
        data.put("capacity", capacity);

        Map<String, Object> event = new HashMap<>();
        event.put("type", "SYSTEM_UPDATE");
        event.put("data", data);

        messagingTemplate.convertAndSend("/topic/updates", event);
    }
}
