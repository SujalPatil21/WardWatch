package com.wardwatch.dev2.controller;

import com.wardwatch.dev2.model.Bed;
import com.wardwatch.dev2.service.BedService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/beds")
public class BedController {
    private final BedService bedService;

    public BedController(BedService bedService) {
        this.bedService = bedService;
    }

    @GetMapping
    public ResponseEntity<List<Bed>> getAllBeds() {
        return ResponseEntity.ok(bedService.getAllBeds());
    }

    @PostMapping("/{id}")
    public ResponseEntity<Bed> updateBedStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            String action = payload.get("action");
            if ("ASSIGN".equals(action)) {
                return ResponseEntity.ok(bedService.assignBed(id, payload.get("patientName"), payload.get("doctor")));
            } else if ("FREE".equals(action)) {
                return ResponseEntity.ok(bedService.freeBed(id));
            } else if ("UPDATE_STATUS".equals(action)) {
                return ResponseEntity.ok(bedService.updateBedStatus(id, payload.get("status")));
            }
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
