package com.wardwatch.controller;

import com.wardwatch.dto.AlertDTO;
import com.wardwatch.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/capacity")
    public ResponseEntity<Map<String, Object>> getCapacity(@RequestParam(required = false) Long wardId) {
        if (wardId != null) {
            return ResponseEntity.ok(analyticsService.getCapacityForWard(wardId));
        }
        return ResponseEntity.ok(analyticsService.getCapacity());
    }

    /**
     * GET /alerts             → global escalation flags (all wards)
     * GET /alerts?wardId=1    → ward-specific escalation flags
     *
     * Response: List<AlertDTO> — [ { "type": "...", "message": "..." }, ... ]
     */
    @GetMapping("/alerts")
    public ResponseEntity<List<AlertDTO>> getAlerts(@RequestParam(required = false) Long wardId) {
        return ResponseEntity.ok(analyticsService.getEscalationFlags(wardId));
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        return ResponseEntity.ok(analyticsService.getSummary());
    }
}
