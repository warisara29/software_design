package dev.kritchalach.warranty.repository;

import dev.kritchalach.warranty.domain.Warranty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WarrantyRepository extends JpaRepository<Warranty, UUID> {
    Optional<Warranty> findByContractId(UUID contractId);
    Optional<Warranty> findByUnitId(UUID unitId);
}
