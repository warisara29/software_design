package dev.kritchalach.kafka.controller;

import dev.kritchalach.kafka.dto.ContractView;
import dev.kritchalach.kafka.repository.ContractRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * REST query API สำหรับ Contract aggregate
 * อ่าน state ตรงจาก repository ภายใน @Transactional เพื่อแก้ปัญหา lazy loading
 */
@RestController
@RequestMapping("/api/contracts")
public class ContractQueryController {

    private final ContractRepository contractRepository;

    public ContractQueryController(ContractRepository contractRepository) {
        this.contractRepository = contractRepository;
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<ContractView> getById(@PathVariable("id") UUID id) {
        return contractRepository.findById(id)
                .map(ContractView::from)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<ContractView> list(@RequestParam(value = "customerId", required = false) UUID customerId) {
        var contracts = (customerId != null)
                ? contractRepository.findByCustomerId(customerId)
                : contractRepository.findAll();
        return contracts.stream().map(ContractView::from).toList();
    }
}
