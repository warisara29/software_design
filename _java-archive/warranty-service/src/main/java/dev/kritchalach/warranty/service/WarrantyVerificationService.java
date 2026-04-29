package dev.kritchalach.warranty.service;

import dev.kritchalach.warranty.domain.*;
import dev.kritchalach.warranty.event.DefectReportedEvent;
import dev.kritchalach.warranty.event.WarrantyRegisteredEvent;
import dev.kritchalach.warranty.event.WarrantyVerifiedEvent;
import dev.kritchalach.warranty.repository.WarrantyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Application Service สำหรับ Flow 4: Defect Report
 * - รับ warranty.registered → สร้าง Warranty aggregate
 * - รับ defect.reported → ตรวจสอบ + emit warranty.verified
 */
@Service
public class WarrantyVerificationService {

    private static final Logger log = LoggerFactory.getLogger(WarrantyVerificationService.class);

    private final WarrantyRepository warrantyRepository;

    public WarrantyVerificationService(WarrantyRepository warrantyRepository) {
        this.warrantyRepository = warrantyRepository;
    }

    /**
     * Command: RegisterWarranty
     */
    public Warranty registerWarranty(WarrantyRegisteredEvent event) {
        UUID contractId = UUID.fromString(event.getContractId());
        UUID unitId = UUID.fromString(event.getUnitId());
        UUID customerId = UUID.fromString(event.getCustomerId());

        log.info("Command: RegisterWarranty — contractId={}, unitId={}", contractId, unitId);

        CoveragePeriod period = new CoveragePeriod(
                Instant.parse(event.getStartsAt()),
                Instant.parse(event.getEndsAt()));

        Set<DefectCategory> categories = event.getCoveredCategories() != null
                ? Arrays.stream(event.getCoveredCategories())
                        .map(DefectCategory::valueOf)
                        .collect(Collectors.toCollection(HashSet::new))
                : new HashSet<>(Arrays.asList(DefectCategory.values()));
        CoverageScope scope = new CoverageScope(categories);

        Warranty warranty = Warranty.register(contractId, unitId, customerId, period, scope);
        warranty = warrantyRepository.save(warranty);

        log.info("Warranty registered: warrantyId={}", warranty.getWarrantyId());
        return warranty;
    }

    /**
     * Command: VerifyClaim
     * ถ้ายังไม่มี Warranty registered จะสร้าง default warranty (1 ปี เต็ม scope) ให้
     * เพื่อให้ระบบยังคง process defect ได้แม้ Post-sale ลืมส่ง warranty.registered มาก่อน
     */
    public WarrantyVerifiedEvent verifyDefect(DefectReportedEvent event) {
        UUID defectId = UUID.fromString(event.getDefectId());
        UUID contractId = UUID.fromString(event.getContractId());
        UUID unitId = UUID.fromString(event.getUnitId());
        UUID customerId = UUID.fromString(event.getCustomerId());

        log.info("Command: VerifyClaim — defectId={}, contractId={}", defectId, contractId);

        Warranty warranty = warrantyRepository.findByContractId(contractId)
                .orElseGet(() -> {
                    log.warn("No warranty found for contractId={}, creating default 1y full-scope warranty",
                            contractId);
                    Instant now = Instant.now();
                    CoveragePeriod period = new CoveragePeriod(now, now.plusSeconds(365L * 24 * 3600));
                    CoverageScope scope = new CoverageScope(
                            new HashSet<>(Arrays.asList(DefectCategory.values())));
                    Warranty fresh = Warranty.register(contractId, unitId, customerId, period, scope);
                    return warrantyRepository.save(fresh);
                });

        DefectCategory category = parseCategory(event.getDefectCategory());
        Instant reportedAt = event.getReportedAt() != null
                ? Instant.parse(event.getReportedAt())
                : Instant.now();

        WarrantyClaim claim = warranty.verifyClaim(defectId, category,
                event.getDescription(), reportedAt);
        warranty = warrantyRepository.save(warranty);

        log.info("Claim verified: claimId={}, status={}, reason={}",
                claim.getClaimId(), claim.getCoverageStatus(), claim.getCoverageReason());

        return new WarrantyVerifiedEvent(
                claim.getClaimId(),
                warranty.getWarrantyId(),
                claim.getDefectId(),
                warranty.getContractId(),
                warranty.getUnitId(),
                warranty.getCustomerId(),
                claim.getCoverageStatus().name(),
                claim.getCoverageReason(),
                claim.getVerifiedAt(),
                warranty.getCoveragePeriod().getEndsAt()
        );
    }

    private DefectCategory parseCategory(String raw) {
        if (raw == null) return DefectCategory.OTHER;
        try {
            return DefectCategory.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException e) {
            return DefectCategory.OTHER;
        }
    }
}
