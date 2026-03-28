package com.wardwatch.service;

import com.wardwatch.dev2.model.Bed;
import com.wardwatch.dev2.repository.BedRepository;
import com.wardwatch.model.Queue;
import com.wardwatch.model.Ward;
import com.wardwatch.repository.QueueRepository;
import com.wardwatch.repository.WardRepository;
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
    private final WardRepository wardRepository;
    private final AnalyticsService analyticsService;

    public WebSocketEventService(SimpMessagingTemplate messagingTemplate,
                                 BedRepository bedRepository,
                                 QueueRepository queueRepository,
                                 WardRepository wardRepository,
                                 AnalyticsService analyticsService) {
        this.messagingTemplate = messagingTemplate;
        this.bedRepository = bedRepository;
        this.queueRepository = queueRepository;
        this.wardRepository = wardRepository;
        this.analyticsService = analyticsService;
    }

    public void sendSystemUpdate() {
        List<Bed> beds = bedRepository.findAll()
                .stream()
                .sorted((b1, b2) -> b1.getId().compareTo(b2.getId()))
                .toList();

        List<Queue> queue = queueRepository.findAll();
        List<Ward> wards = wardRepository.findAll();

        Map<String, Object> alerts = analyticsService.getAlerts();

        // Capacity: overall + perWard
        Map<String, Object> overall = analyticsService.getCapacity();
        Map<String, Object> perWard = analyticsService.getCapacityPerWard();

        Map<String, Object> capacity = new HashMap<>();
        capacity.put("overall", overall);
        capacity.put("perWard", perWard);

        Map<String, Object> data = new HashMap<>();
        data.put("wards", wards);
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
