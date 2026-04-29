package dev.kritchalach.warranty.controller;

import dev.kritchalach.warranty.dto.WarrantyClaimView;
import dev.kritchalach.warranty.dto.WarrantyView;
import dev.kritchalach.warranty.repository.WarrantyRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/warranties")
public class WarrantyQueryController {

    private final WarrantyRepository warrantyRepository;

    public WarrantyQueryController(WarrantyRepository warrantyRepository) {
        this.warrantyRepository = warrantyRepository;
    }

    /**
     * GET /api/warranties/{contractId}
     * ดึง warranty ของ contract นั้น (1 contract = 1 warranty)
     */
    @GetMapping("/{contractId}")
    @Transactional(readOnly = true)
    public ResponseEntity<WarrantyView> getByContractId(@PathVariable("contractId") UUID contractId) {
        return warrantyRepository.findByContractId(contractId)
                .map(WarrantyView::from)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/warranties/{warrantyId}/claims
     * list claims ทั้งหมดที่อยู่ภายใต้ warranty นี้
     */
    @GetMapping("/{warrantyId}/claims")
    @Transactional(readOnly = true)
    public ResponseEntity<List<WarrantyClaimView>> listClaims(@PathVariable("warrantyId") UUID warrantyId) {
        return warrantyRepository.findById(warrantyId)
                .map(w -> w.getClaims().stream()
                        .map(WarrantyClaimView::from)
                        .toList())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
