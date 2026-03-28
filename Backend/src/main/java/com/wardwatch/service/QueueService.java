package com.wardwatch.service;

import com.wardwatch.dev2.model.Bed;
import com.wardwatch.dev2.service.BedService;
import com.wardwatch.model.Queue;
import com.wardwatch.model.QueueStatus;
import com.wardwatch.repository.QueueRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class QueueService {

    private static final Logger log = LoggerFactory.getLogger(QueueService.class);

    private final QueueRepository queueRepository;
    private final BedService bedService;
    private final WebSocketEventService webSocketEventService;

    public QueueService(QueueRepository queueRepository,
                        BedService bedService,
                        @Lazy WebSocketEventService webSocketEventService) {
        this.queueRepository = queueRepository;
        this.bedService = bedService;
        this.webSocketEventService = webSocketEventService;
    }

    public List<Queue> getAllActive() {
        return queueRepository.findByStatusNot(QueueStatus.COMPLETED);
    }

    public Queue addPatient(String name, String type) {
        if (name == null || name.isBlank() || type == null || type.isBlank()) {
            throw new RuntimeException("Invalid input");
        }

        Queue queue = new Queue();
        queue.setName(name);
        queue.setType(type);
        queue.setStatus(QueueStatus.WAITING);

        Queue saved = queueRepository.save(queue);
        webSocketEventService.sendSystemUpdate();
        return saved;
    }

    /**
     * Backward-compatible overload: no wardId → uses global bed pool (original behavior).
     */
    @Transactional
    public Queue completeAction(Long id, String action) {
        return completeAction(id, action, null);
    }

    /**
     * Primary method: wardId is optional.
     * If wardId is provided and action is "admit", a bed is sourced only from that ward.
     * If wardId is null and action is "admit", falls back to the original global-pool behavior.
     */
    @Transactional
    public Queue completeAction(Long id, String action, Long wardId) {
        Queue queue = queueRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Queue entry not found with id: " + id));

        if (queue.getStatus() == QueueStatus.COMPLETED) {
            throw new RuntimeException("Action already completed for this entry");
        }

        if ("admit".equalsIgnoreCase(action)) {
            if (queue.getStatus() != QueueStatus.WAITING) {
                throw new RuntimeException("Only WAITING entries can be admitted");
            }
            if (queue.getBedId() != null) {
                throw new RuntimeException("Bed already assigned to this queue entry");
            }

            Bed availableBed;

            if (wardId != null) {
                // Ward-specific bed assignment
                availableBed = bedService.findAvailableBedInWard(wardId)
                        .orElseThrow(() -> new RuntimeException("No available bed in ward: " + wardId));
            } else {
                // Global bed assignment (original behavior)
                List<Bed> beds = bedService.getAllBeds();
                if (beds == null || beds.isEmpty()) {
                    throw new RuntimeException("No beds available");
                }
                availableBed = beds.stream()
                        .filter(b -> "AVAILABLE".equalsIgnoreCase(b.getStatus()))
                        .findFirst()
                        .orElseThrow(() -> new RuntimeException("No beds available"));
            }

            Long bedId = availableBed.getId();

            try {
                bedService.assignBed(bedId, queue.getName(), "Auto");
            } catch (Exception e) {
                throw new RuntimeException("Failed to assign bed: " + e.getMessage());
            }

            queue.setBedId(bedId);
            queue.setStatus(QueueStatus.DISCHARGE_PENDING);
            queue.setAdmittedAt(LocalDateTime.now());
            log.info("ADMIT: queueId={} bedId={} wardId={}", queue.getId(), bedId, wardId);

        } else if ("discharge".equalsIgnoreCase(action)) {
            if (queue.getStatus() != QueueStatus.DISCHARGE_PENDING) {
                throw new RuntimeException("Only DISCHARGE_PENDING entries can be discharged");
            }

            if (queue.getBedId() == null) {
                log.warn("DISCHARGE FAILED: queueId={} bedId=null", queue.getId());
                throw new RuntimeException("No bed assigned to this queue entry");
            }

            try {
                bedService.freeBed(queue.getBedId());
            } catch (Exception e) {
                throw new RuntimeException("Failed to free bed: " + e.getMessage());
            }

            queue.setStatus(QueueStatus.COMPLETED);
            log.info("DISCHARGE: queueId={} bedId={}", queue.getId(), queue.getBedId());

        } else {
            throw new RuntimeException("Invalid action: " + action + ". Use 'admit' or 'discharge'.");
        }

        Queue saved = queueRepository.save(queue);
        log.info("QUEUE SAVE: queueId={} status={} bedId={}", saved.getId(), saved.getStatus(), saved.getBedId());
        webSocketEventService.sendSystemUpdate();
        return saved;
    }
}
