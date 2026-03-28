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
                            @Value("${bed.cleaning.alert.minutes:5}") long cleaningAlertMinutes,
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

        // Weighted confidence model
        double effectiveDischarge = dischargePending * 0.8;
        double effectiveIncoming  = incoming * 0.9;
        long normalizedFuture = Math.max(0, (long) Math.floor(available + effectiveDischarge - effectiveIncoming));
        Map<String, Object> raw = new HashMap<>();
        raw.put("availableBeds", available);
        raw.put("dischargePending", dischargePending);
        raw.put("incomingQueue", incoming);

        Map<String, Object> weighted = new HashMap<>();
        weighted.put("effectiveDischarge", effectiveDischarge);
        weighted.put("effectiveIncoming", effectiveIncoming);

        Map<String, Object> result = new HashMap<>();
        result.put("totalBeds", total);
        result.put("availableBeds", available);
        result.put("occupiedBeds", occupied);
        result.put("cleaningBeds", cleaning);
        result.put("reservedBeds", reserved);
        result.put("incomingQueue", incoming);
        result.put("dischargePendingQueue", dischargePending);
        result.put("futureAvailable", normalizedFuture);
        result.put("raw", raw);
        result.put("weighted", weighted);
        result.put("timestamp", System.currentTimeMillis());
        return result;
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

        // Weighted confidence model
        double effectiveDischarge = dischargePending * 0.8;
        double effectiveIncoming  = incoming * 0.9;
        long normalizedFuture = Math.max(0, (long) Math.floor(available + effectiveDischarge - effectiveIncoming));

        Map<String, Object> raw = new HashMap<>();
        raw.put("availableBeds", available);
        raw.put("dischargePending", dischargePending);
        raw.put("incomingQueue", incoming);

        Map<String, Object> weighted = new HashMap<>();
        weighted.put("effectiveDischarge", effectiveDischarge);
        weighted.put("effectiveIncoming", effectiveIncoming);

        Map<String, Object> result = new HashMap<>();
        result.put("wardId", wardId);
        result.put("totalBeds", total);
        result.put("availableBeds", available);
        result.put("occupiedBeds", occupied);
        result.put("cleaningBeds", cleaning);
        result.put("reservedBeds", reserved);
        result.put("incomingQueue", incoming);
        result.put("dischargePendingQueue", dischargePending);
        result.put("futureAvailable", normalizedFuture);
        result.put("raw", raw);
        result.put("weighted", weighted);
        result.put("timestamp", System.currentTimeMillis());
        return result;
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
        List<Map<String, Object>> cleaningAlerts = new ArrayList<>();
        List<Map<String, Object>> capacityAlerts = new ArrayList<>();

        long nowMs = System.currentTimeMillis();

        // 🟢 1. CLEANING ALERTS (>= 5 minutes by default if configured, or 20 min from prop)
        List<Bed> cleaningBeds = bedRepository.findByStatus("CLEANING");
        for (Bed bed : cleaningBeds) {
            Long lastUpdated = bed.getLastUpdated();
            if (lastUpdated != null) {
                long minutes = (nowMs - lastUpdated) / (60 * 1000L);
                if (minutes >= cleaningAlertMinutes) {
                    cleaningAlerts.add(Map.of(
                            "bedId", bed.getId(),
                            "type", "CLEANING_DELAY",
                            "severity", "WARNING",
                            "minutes", minutes
                    ));
                }
            }
        }

        // 🟢 2. CAPACITY ALERTS PER WARD (>= 85% Warning, >= 95% Critical)
        List<Ward> wards = wardRepository.findAll();
        for (Ward ward : wards) {
            long total = bedRepository.countByWardId(ward.getId());
            if (total == 0) continue;
            
            long occupied = bedRepository.countByStatusAndWardId("OCCUPIED", ward.getId());
            double ratio = (double) occupied / total;

            if (ratio >= 0.95) {
                capacityAlerts.add(Map.of(
                        "wardId", ward.getId(),
                        "wardName", ward.getName(),
                        "type", "CAPACITY_CRITICAL",
                        "severity", "CRITICAL",
                        "ratio", ratio
                ));
            } else if (ratio >= 0.85) {
                capacityAlerts.add(Map.of(
                        "wardId", ward.getId(),
                        "wardName", ward.getName(),
                        "type", "CAPACITY_WARNING",
                        "severity", "WARNING",
                        "ratio", ratio
                ));
            }
        }

        return Map.of(
                "cleaningAlerts", cleaningAlerts,
                "capacityAlerts", capacityAlerts,
                "timestamp", nowMs
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
