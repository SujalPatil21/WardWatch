package com.wardwatch.controller;

import com.wardwatch.model.Queue;
import com.wardwatch.service.QueueService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/queue")
public class QueueController {

    private final QueueService queueService;

    public QueueController(QueueService queueService) {
        this.queueService = queueService;
    }

    @GetMapping
    public ResponseEntity<List<Queue>> getAll() {
        return ResponseEntity.ok(queueService.getAllActive());
    }

    @PostMapping
    public ResponseEntity<Queue> addPatient(@RequestBody Queue queue) {
        Queue saved = queueService.addPatient(queue.getName(), queue.getType());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<?> completeAction(@PathVariable Long id,
                                            @RequestParam String action,
                                            @RequestParam(required = false) Long wardId) {
        try {
            Queue updated = queueService.completeAction(id, action, wardId);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
