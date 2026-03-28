package com.wardwatch.repository;

import com.wardwatch.model.Queue;
import com.wardwatch.model.QueueStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QueueRepository extends JpaRepository<Queue, Long> {
    List<Queue> findByStatusNot(QueueStatus status);
    long countByStatus(QueueStatus status);
    List<Queue> findByStatus(QueueStatus status);
}
