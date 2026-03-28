package com.wardwatch.service;

import com.wardwatch.dev2.model.Bed;
import com.wardwatch.dev2.repository.BedRepository;
import com.wardwatch.model.Queue;
import com.wardwatch.model.QueueStatus;
import com.wardwatch.model.Ward;
import com.wardwatch.repository.QueueRepository;
import com.wardwatch.repository.WardRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AnalyticsService {

    private final BedRepository bedRepository;
    private final QueueRepository queueRepository;
    private final WardRepository wardRepository;

    private final long cleaningAlertMinutes;
    private final long dischargeAlertMinutes;
    private final long capacityWarningThreshold;

    public AnalyticsService(BedRepository bedRepository,
                            QueueRepository queueRepository,
                            WardRepository wardRepository,
                            @Value("${bed.cleaning.alert.minutes:20}") long cleaningAlertMinutes,
                            @Value("${queue.discharge.alert.minutes:120}") long dischargeAlertMinutes,
                            @Value("${capacity.warning.threshold:2}") long capacityWarningThreshold) {
        this.bedRepository = bedRepository;
        this.queueRepository = queueRepository;
        this.wardRepository = wardRepository;
        this.cleaningAlertMinutes = cleaningAlertMinutes;
        this.dischargeAlertMinutes = dischargeAlertMinutes;
        this.capacityWarningThreshold = capacityWarningThreshold;
    }

    // -------------------------------------------------------------------------
    // CAPACITY — global (original behavior, fully preserved)
    // -------------------------------------------------------------------------

    public Map<String, Object> getCapacity() {
        long total = bedRepository.count();
        long available = bedRepository.countByStatus("AVAILABLE");
        long occupied = bedRepository.countByStatus("OCCUPIED");
        long cleaning = bedRepository.countByStatus("CLEANING");
        long reserved = bedRepository.countByStatus("RESERVED");

        long incoming = queueRepository.countByStatus(QueueStatus.WAITING);
        long dischargePending = queueRepository.countByStatus(QueueStatus.DISCHARGE_PENDING);

        long futureAvailable = available + dischargePending - incoming;
        if (futureAvailable < 0) {
            futureAvailable = 0;
        }

        return Map.of(
                "totalBeds", total,
                "availableBeds", available,
                "occupiedBeds", occupied,
                "cleaningBeds", cleaning,
                "reservedBeds", reserved,
                "incomingQueue", incoming,
                "dischargePendingQueue", dischargePending,
                "futureAvailable", futureAvailable,
                "timestamp", System.currentTimeMillis()
        );
    }

    // -------------------------------------------------------------------------
    // CAPACITY — ward-scoped
    // -------------------------------------------------------------------------

    public Map<String, Object> getCapacityForWard(Long wardId) {
        long total = bedRepository.countByWardId(wardId);
        long available = bedRepository.countByStatusAndWardId("AVAILABLE", wardId);
        long occupied = bedRepository.countByStatusAndWardId("OCCUPIED", wardId);
        long cleaning = bedRepository.countByStatusAndWardId("CLEANING", wardId);
        long reserved = bedRepository.countByStatusAndWardId("RESERVED", wardId);

        // Queue counts are not ward-scoped in the Queue entity; approximate with global
        long incoming = queueRepository.countByStatus(QueueStatus.WAITING);
        long dischargePending = queueRepository.countByStatus(QueueStatus.DISCHARGE_PENDING);

        long futureAvailable = available + dischargePending - incoming;
        if (futureAvailable < 0) {
            futureAvailable = 0;
        }

        return Map.of(
                "wardId", wardId,
                "totalBeds", total,
                "availableBeds", available,
                "occupiedBeds", occupied,
                "cleaningBeds", cleaning,
                "reservedBeds", reserved,
                "incomingQueue", incoming,
                "dischargePendingQueue", dischargePending,
                "futureAvailable", futureAvailable,
                "timestamp", System.currentTimeMillis()
        );
    }

    // -------------------------------------------------------------------------
    // CAPACITY — per-ward map (all wards)
    // -------------------------------------------------------------------------

    public Map<String, Object> getCapacityPerWard() {
        List<Ward> wards = wardRepository.findAll();
        Map<String, Object> perWard = new HashMap<>();
        for (Ward ward : wards) {
            perWard.put(String.valueOf(ward.getId()), getCapacityForWard(ward.getId()));
        }
        return perWard;
    }

    // -------------------------------------------------------------------------
    // ALERTS (original behavior, fully preserved)
    // -------------------------------------------------------------------------

    public Map<String, Object> getAlerts() {
        List<Map<String, Object>> alerts = new ArrayList<>();

        long nowMs = System.currentTimeMillis();
        LocalDateTime now = LocalDateTime.now();

        List<Bed> cleaningBeds = bedRepository.findByStatus("CLEANING");
        List<Long> cleaningDelayedIds = new ArrayList<>();
        for (Bed bed : cleaningBeds) {
            Long lastUpdated = bed.getLastUpdated();
            if (lastUpdated != null) {
                long minutes = (nowMs - lastUpdated) / (60 * 1000L);
                if (minutes >= cleaningAlertMinutes) {
                    cleaningDelayedIds.add(bed.getId());
                }
            }
        }
        if (!cleaningDelayedIds.isEmpty()) {
            alerts.add(Map.of(
                    "type", "CLEANING_DELAY",
                    "severity", "WARNING",
                    "count", cleaningDelayedIds.size(),
                    "bedIds", cleaningDelayedIds
            ));
        }

        List<Queue> dischargePending = queueRepository.findByStatus(QueueStatus.DISCHARGE_PENDING);
        List<Long> dischargeDelayedIds = new ArrayList<>();
        for (Queue queue : dischargePending) {
            LocalDateTime admittedAt = queue.getAdmittedAt();
            if (admittedAt != null) {
                long minutes = Duration.between(admittedAt, now).toMinutes();
                if (minutes >= dischargeAlertMinutes) {
                    dischargeDelayedIds.add(queue.getId());
                }
            }
        }
        if (!dischargeDelayedIds.isEmpty()) {
            alerts.add(Map.of(
                    "type", "DISCHARGE_DELAY",
                    "severity", "WARNING",
                    "count", dischargeDelayedIds.size(),
                    "queueIds", dischargeDelayedIds
            ));
        }

        Long futureAvailableObj = (Long) getCapacity().get("futureAvailable");
        long futureAvailable = futureAvailableObj != null ? futureAvailableObj : 0;
        if (futureAvailable <= capacityWarningThreshold) {
            alerts.add(Map.of(
                    "type", "CAPACITY_WARNING",
                    "severity", "CRITICAL",
                    "futureAvailable", futureAvailable,
                    "threshold", capacityWarningThreshold
            ));
        }

        return Map.of(
                "count", alerts.size(),
                "alerts", alerts,
                "timestamp", System.currentTimeMillis()
        );
    }

    // -------------------------------------------------------------------------
    // SUMMARY (original behavior, fully preserved)
    // -------------------------------------------------------------------------

    public Map<String, Object> getSummary() {
        Map<String, Object> capacity = getCapacity();
        Map<String, Object> alerts = getAlerts();

        long waiting = queueRepository.countByStatus(QueueStatus.WAITING);
        long dischargePending = queueRepository.countByStatus(QueueStatus.DISCHARGE_PENDING);
        long completed = queueRepository.countByStatus(QueueStatus.COMPLETED);

        Map<String, Object> queue = Map.of(
                "waiting", waiting,
                "dischargePending", dischargePending,
                "completed", completed
        );

        return Map.of(
                "capacity", capacity,
                "alerts", alerts,
                "queue", queue,
                "timestamp", System.currentTimeMillis()
        );
    }
}
