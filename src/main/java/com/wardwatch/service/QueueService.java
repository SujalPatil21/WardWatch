package com.wardwatch.backend.service;

import com.wardwatch.backend.dev2.model.Bed;
import com.wardwatch.backend.dev2.service.BedService;
import com.wardwatch.backend.model.Queue;
import com.wardwatch.backend.model.QueueStatus;
import com.wardwatch.backend.repository.QueueRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class QueueService {

    private static final Logger log = LoggerFactory.getLogger(QueueService.class);

    private final QueueRepository queueRepository;
    private final BedService bedService;

    public QueueService(QueueRepository queueRepository, BedService bedService) {
        this.queueRepository = queueRepository;
        this.bedService = bedService;
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

        return queueRepository.save(queue);
    }

    public Queue completeAction(Long id, String action) {
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

            List<Bed> beds = bedService.getAllBeds();

            if (beds == null || beds.isEmpty()) {
                throw new RuntimeException("No beds available");
            }

            Bed availableBed = beds.stream()
                    .filter(b -> "AVAILABLE".equalsIgnoreCase(b.getStatus()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("No beds available"));

            Long bedId = availableBed.getId();

            try {
                bedService.assignBed(bedId, queue.getName(), "Auto");
            } catch (Exception e) {
                throw new RuntimeException("Failed to assign bed: " + e.getMessage());
            }

            queue.setBedId(bedId);
            queue.setStatus(QueueStatus.DISCHARGE_PENDING);
            queue.setAdmittedAt(LocalDateTime.now());
            log.info("ADMIT: queueId={} bedId={}", queue.getId(), bedId);

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
        return saved;
    }
}
