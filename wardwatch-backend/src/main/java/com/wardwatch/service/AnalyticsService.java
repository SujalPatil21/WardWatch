package com.wardwatch.service;

import com.wardwatch.dto.AlertDTO;

import com.wardwatch.dev2.model.Bed;
import com.wardwatch.dev2.repository.BedRepository;
import com.wardwatch.dev2.repository.BedRepository;
import com.wardwatch.model.QueueStatus;
import com.wardwatch.model.Ward;
import com.wardwatch.repository.QueueRepository;
import com.wardwatch.repository.WardRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
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
    private final long capacityWarningThreshold;

    public AnalyticsService(BedRepository bedRepository,
                            QueueRepository queueRepository,
                            WardRepository wardRepository,
                            @Value("${bed.cleaning.alert.minutes:20}") long cleaningAlertMinutes,
                            @Value("${capacity.warning.threshold:2}") long capacityWarningThreshold) {
        this.bedRepository = bedRepository;
        this.queueRepository = queueRepository;
        this.wardRepository = wardRepository;
        this.cleaningAlertMinutes = cleaningAlertMinutes;
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

        long currentOccupied = occupied;
        long forecast4hOccupied = currentOccupied;
        long forecast8hOccupied = Math.min(total, currentOccupied + 1);

        int currentCapacityPercent = 0;
        int forecast4hPercent = 0;
        int forecast8hPercent = 0;

        if (total > 0) {
            currentCapacityPercent = (int) Math.round((currentOccupied * 100.0) / total);
            forecast4hPercent = (int) Math.round((forecast4hOccupied * 100.0) / total);
            forecast8hPercent = (int) Math.round((forecast8hOccupied * 100.0) / total);
        }

        String currentStatus = "NORMAL";
        if (currentCapacityPercent > 90) currentStatus = "CRITICAL";
        else if (currentCapacityPercent > 80) currentStatus = "HIGH";

        String forecast4hStatus = "NORMAL";
        if (forecast4hPercent > 90) forecast4hStatus = "CRITICAL";
        else if (forecast4hPercent > 80) forecast4hStatus = "HIGH";

        String forecast8hStatus = "NORMAL";
        if (forecast8hPercent > 90) forecast8hStatus = "CRITICAL";
        else if (forecast8hPercent > 80) forecast8hStatus = "HIGH";

        String statusReason;
        if (currentStatus.equals("CRITICAL")) {
            statusReason = "Ward near full capacity (" + currentOccupied + "/" + total + " occupied)";
        } else if (currentStatus.equals("HIGH")) {
            statusReason = "Limited bed availability (" + currentOccupied + "/" + total + " occupied)";
        } else {
            statusReason = "Capacity within safe limits";
        }

        Map<String, Object> raw = new HashMap<>();
        raw.put("availableBeds", available);
        raw.put("dischargePending", dischargePending);
        raw.put("incomingQueue", incoming);

        Map<String, Object> result = new HashMap<>();
        result.put("totalBeds", total);
        result.put("availableBeds", available);
        result.put("occupiedBeds", occupied);
        result.put("cleaningBeds", cleaning);
        result.put("reservedBeds", reserved);
        result.put("incomingQueue", incoming);
        result.put("dischargePendingQueue", dischargePending);
        
        result.put("currentCapacityPercent", currentCapacityPercent);
        result.put("currentStatus", currentStatus);
        result.put("forecast4hPercent", forecast4hPercent);
        result.put("forecast4hStatus", forecast4hStatus);
        result.put("forecast8hPercent", forecast8hPercent);
        result.put("forecast8hStatus", forecast8hStatus);
        
        // Retaining old fields for backward compatibility
        result.put("status", currentStatus);
        result.put("statusReason", statusReason);
        result.put("raw", raw);
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

        long currentOccupied = occupied;
        long forecast4hOccupied = currentOccupied;
        long forecast8hOccupied = Math.min(total, currentOccupied + 1);

        int currentCapacityPercent = 0;
        int forecast4hPercent = 0;
        int forecast8hPercent = 0;

        if (total > 0) {
            currentCapacityPercent = (int) Math.round((currentOccupied * 100.0) / total);
            forecast4hPercent = (int) Math.round((forecast4hOccupied * 100.0) / total);
            forecast8hPercent = (int) Math.round((forecast8hOccupied * 100.0) / total);
        }

        String currentStatus = "NORMAL";
        if (currentCapacityPercent > 90) currentStatus = "CRITICAL";
        else if (currentCapacityPercent > 80) currentStatus = "HIGH";

        String forecast4hStatus = "NORMAL";
        if (forecast4hPercent > 90) forecast4hStatus = "CRITICAL";
        else if (forecast4hPercent > 80) forecast4hStatus = "HIGH";

        String forecast8hStatus = "NORMAL";
        if (forecast8hPercent > 90) forecast8hStatus = "CRITICAL";
        else if (forecast8hPercent > 80) forecast8hStatus = "HIGH";

        String statusReason;
        if (currentStatus.equals("CRITICAL")) {
            statusReason = "Ward near full capacity (" + currentOccupied + "/" + total + " occupied)";
        } else if (currentStatus.equals("HIGH")) {
            statusReason = "Limited bed availability (" + currentOccupied + "/" + total + " occupied)";
        } else {
            statusReason = "Capacity within safe limits";
        }

        Map<String, Object> raw = new HashMap<>();
        raw.put("availableBeds", available);
        raw.put("dischargePending", dischargePending);
        raw.put("incomingQueue", incoming);

        Map<String, Object> result = new HashMap<>();
        result.put("wardId", wardId);
        result.put("totalBeds", total);
        result.put("availableBeds", available);
        result.put("occupiedBeds", occupied);
        result.put("cleaningBeds", cleaning);
        result.put("reservedBeds", reserved);
        result.put("incomingQueue", incoming);
        result.put("dischargePendingQueue", dischargePending);
        
        result.put("currentCapacityPercent", currentCapacityPercent);
        result.put("currentStatus", currentStatus);
        result.put("forecast4hPercent", forecast4hPercent);
        result.put("forecast4hStatus", forecast4hStatus);
        result.put("forecast8hPercent", forecast8hPercent);
        result.put("forecast8hStatus", forecast8hStatus);
        
        // Retaining old fields for backward compatibility
        result.put("status", currentStatus);
        result.put("statusReason", statusReason);
        result.put("raw", raw);
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

    // -------------------------------------------------------------------------
    // ESCALATION FLAGS — computed dynamically, no DB storage
    // -------------------------------------------------------------------------

    /**
     * Returns actionable escalation alerts.
     * If wardId is null → global (all wards).
     * If wardId is provided → ward-scoped.
     */
    public List<AlertDTO> getEscalationFlags(Long wardId) {
        List<AlertDTO> alerts = new ArrayList<>();
        long nowMs = System.currentTimeMillis();
        LocalDateTime now = LocalDateTime.now();



        // ── B. CLEANING DELAY ─────────────────────────────────────────────────
        // Bed.status == CLEANING, lastUpdated != null, duration > cleaningAlertMinutes
        List<Bed> cleaningBeds = (wardId != null)
                ? bedRepository.findByStatusAndWardId("CLEANING", wardId)
                : bedRepository.findByStatus("CLEANING");
        for (Bed bed : cleaningBeds) {
            if (bed.getLastUpdated() == null) continue;
            long minutes = (nowMs - bed.getLastUpdated()) / (60_000L);
            if (minutes >= cleaningAlertMinutes) {
                String time = formatDuration(minutes);
                alerts.add(new AlertDTO("CLEANING_DELAY",
                        "Bed " + bed.getId() + " cleaning delayed (" + time + ")"));
            }
        }

        // ── C. CAPACITY ALERT ─────────────────────────────────────────────────
        // availableBeds / totalBeds < 0.1  (i.e. < 10% available)
        Map<String, Object> cap = (wardId != null)
                ? getCapacityForWard(wardId)
                : getCapacity();
        long total     = toLong(cap.get("totalBeds"));
        long available = toLong(cap.get("availableBeds"));
        if (total > 0 && (double) available / total < 0.1) {
            // Occupied % = (total - available) / total
            int pct = (int) Math.round((double)(total - available) / total * 100);
            String where;
            if (wardId != null) {
                where = wardRepository.findById(wardId)
                        .map(Ward::getName)
                        .orElse("Ward " + wardId);
            } else {
                where = "Hospital";
            }
            alerts.add(new AlertDTO("CAPACITY_ALERT",
                    where + " at " + pct + "% capacity — risk of overload"));
        }

        return alerts;
    }

    /** Converts minutes to "45m" or "2h 17m" style string. */
    private String formatDuration(long totalMinutes) {
        if (totalMinutes < 60) {
            return totalMinutes + "m";
        }
        long hours   = totalMinutes / 60;
        long minutes = totalMinutes % 60;
        return minutes == 0 ? hours + "h" : hours + "h " + minutes + "m";
    }

    /** Safe cast from Map value (Integer or Long) to long. */
    private long toLong(Object val) {
        if (val instanceof Long l)    return l;
        if (val instanceof Integer i) return i.longValue();
        return 0L;
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
