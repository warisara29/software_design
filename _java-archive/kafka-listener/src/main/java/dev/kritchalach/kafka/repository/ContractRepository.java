package dev.kritchalach.kafka.repository;

import dev.kritchalach.kafka.domain.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ContractRepository extends JpaRepository<Contract, UUID> {
    java.util.List<Contract> findByCustomerId(UUID customerId);
}
