package dev.kritchalach.acquisition.repository;

import dev.kritchalach.acquisition.domain.Acquisition;
import dev.kritchalach.acquisition.domain.AcquisitionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AcquisitionRepository extends JpaRepository<Acquisition, UUID> {
    Optional<Acquisition> findBySurveyId(UUID surveyId);
    List<Acquisition> findByStatus(AcquisitionStatus status);
}
