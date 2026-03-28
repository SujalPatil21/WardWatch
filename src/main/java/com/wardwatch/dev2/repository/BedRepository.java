package com.wardwatch.backend.dev2.repository;

import com.wardwatch.backend.dev2.model.Bed;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BedRepository extends JpaRepository<Bed, Long> {
    long countByStatus(String status);
    java.util.List<Bed> findByStatus(String status);
}
