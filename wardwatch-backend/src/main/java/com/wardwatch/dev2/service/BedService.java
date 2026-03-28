package com.wardwatch.dev2.service;

import com.wardwatch.dev2.model.Bed;
import com.wardwatch.dev2.repository.BedRepository;
import com.wardwatch.service.WebSocketEventService;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class BedService {

    private final BedRepository bedRepository;
    private final long cleaningDurationMs;
    private final WebSocketEventService webSocketEventService;

    public BedService(BedRepository bedRepository,
                      @Value("${bed.cleaning.duration.minutes:5}") long cleaningDurationMinutes,
                      @Lazy WebSocketEventService webSocketEventService) {
        this.bedRepository = bedRepository;
        this.cleaningDurationMs = cleaningDurationMinutes * 60 * 1000L;
        this.webSocketEventService = webSocketEventService;
    }

    @PostConstruct
    public void init() {
        if (bedRepository.count() == 0) {
            for (int i = 1; i <= 30; i++) {
                Bed bed = new Bed();
                bed.setStatus("AVAILABLE");
                bed.setLastUpdated(System.currentTimeMillis());
                bedRepository.save(bed);
            }
        }
    }

    public List<Bed> getAllBeds() {
        return bedRepository.findAll()
                .stream()
                .sorted((b1, b2) -> b1.getId().compareTo(b2.getId()))
                .toList();
    }

    public Bed updateBedStatus(Long id, String status) {
        Bed bed = bedRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bed not found"));

        bed.setStatus(status);
        bed.setLastUpdated(System.currentTimeMillis());

        Bed saved = bedRepository.save(bed);
        webSocketEventService.sendSystemUpdate();
        return saved;
    }

    public Bed assignBed(Long id, String patientName, String doctor) {
        Bed bed = bedRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bed not found"));

        bed.setStatus("OCCUPIED");
        bed.setPatientName(patientName);
        bed.setDoctor(doctor);
        bed.setLastUpdated(System.currentTimeMillis());

        return bedRepository.save(bed);
    }

    public Bed freeBed(Long id) {
        Bed bed = bedRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bed not found"));

        bed.setStatus("CLEANING");
        bed.setPatientName(null);
        bed.setDoctor(null);
        bed.setLastUpdated(System.currentTimeMillis());

        return bedRepository.save(bed);
    }

    /**
     * Find first available bed in a specific ward.
     */
    public Optional<Bed> findAvailableBedInWard(Long wardId) {
        return bedRepository.findByStatusAndWardId("AVAILABLE", wardId)
                .stream()
                .findFirst();
    }

    /**
     * 🔴 ALERT LOGIC — Cleaning taking more than 5 minutes
     */
    public List<Bed> getDelayedCleaningBeds() {
        long now = System.currentTimeMillis();

        return bedRepository.findByStatus("CLEANING")
                .stream()
                .filter(bed -> {
                    Long lastUpdated = bed.getLastUpdated();
                    return lastUpdated != null && (now - lastUpdated >= 3 * 60 * 1000);
                })
                .toList();
    }

    @Scheduled(fixedDelayString = "${bed.cleaning.check.interval.ms:60000}")
    public void autoReleaseCleaningBeds() {
        long now = System.currentTimeMillis();
        List<Bed> cleaningBeds = bedRepository.findByStatus("CLEANING");

        if (cleaningBeds.isEmpty()) {
            return;
        }

        boolean anyReleased = false;

        for (Bed bed : cleaningBeds) {
            Long lastUpdated = bed.getLastUpdated();
            if (lastUpdated == null) continue;

            if (now - lastUpdated >= cleaningDurationMs) {
                bed.setStatus("AVAILABLE");
                bed.setLastUpdated(now);
                bedRepository.save(bed);
                anyReleased = true;
            }
        }

        if (anyReleased) {
            webSocketEventService.sendSystemUpdate();
        }
    }
}