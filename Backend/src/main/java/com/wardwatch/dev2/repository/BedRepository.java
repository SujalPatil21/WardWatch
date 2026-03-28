package com.wardwatch.dev2.repository;

import com.wardwatch.dev2.model.Bed;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BedRepository extends JpaRepository<Bed, Long> {
    long countByStatus(String status);
    List<Bed> findByStatus(String status);

    // Ward-scoped queries
    long countByStatusAndWardId(String status, Long wardId);
    List<Bed> findByStatusAndWardId(String status, Long wardId);
    List<Bed> findByWardId(Long wardId);
    long countByWardId(Long wardId);
}
