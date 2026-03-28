package com.wardwatch.controller;

import com.wardwatch.dev2.model.Bed;
import com.wardwatch.dev2.service.BedService;
import com.wardwatch.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

@RestController
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final BedService bedService;

    public AnalyticsController(AnalyticsService analyticsService, BedService bedService) {
        this.analyticsService = analyticsService;
        this.bedService = bedService;
    }

    @GetMapping("/capacity")
    public ResponseEntity<Map<String, Object>> getCapacity(
            @org.springframework.web.bind.annotation.RequestParam(required = false) Long wardId) {
        if (wardId != null) {
            return ResponseEntity.ok(analyticsService.getCapacityForWard(wardId));
        }
        return ResponseEntity.ok(analyticsService.getCapacity());
    }

    @GetMapping("/alerts")
    public ResponseEntity<Map<String, Object>> getAlerts() {

        Map<String, Object> response = new HashMap<>();

        // 🔹 Existing alerts from AnalyticsService
        Map<String, Object> analyticsAlerts = analyticsService.getAlerts();

        // 🔹 New cleaning delay alerts
        List<Bed> delayedBeds = bedService.getDelayedCleaningBeds();
        List<String> cleaningAlerts = new ArrayList<>();

        for (Bed bed : delayedBeds) {
            cleaningAlerts.add("Cleaning delay: Bed #" + bed.getId());
        }

        // 🔹 Combine both
        response.put("analyticsAlerts", analyticsAlerts);
        response.put("cleaningAlerts", cleaningAlerts);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        return ResponseEntity.ok(analyticsService.getSummary());
    }
}