package com.appGate.delivery.repository;

import com.appGate.delivery.models.RiderFeedbackEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RiderFeedbackRepository extends JpaRepository<RiderFeedbackEntity, Long> {
    Page<RiderFeedbackEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);
    List<RiderFeedbackEntity> findByRiderIdOrderByCreatedAtDesc(Long riderId);
    List<RiderFeedbackEntity> findByFeedbackTypeOrderByCreatedAtDesc(String feedbackType);
}
