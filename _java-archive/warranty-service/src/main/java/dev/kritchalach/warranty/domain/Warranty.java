package dev.kritchalach.warranty.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Aggregate Root: Warranty
 * เก็บ warranty ของ unit ที่ขายแล้ว ครอบคลุม lifecycle ของ WarrantyClaim ทั้งหมด
 * ทุก Command ต้องผ่าน Warranty Root
 *
 * Invariant:
 *   - WarrantyClaim จะ COVERED ได้ก็ต่อเมื่อ reportedAt อยู่ใน CoveragePeriod
 *     และ defectCategory อยู่ใน CoverageScope
 *   - 1 defectId มี active claim ได้แค่ 1 รายการ
 */
@Entity
@Table(name = "warranties")
public class Warranty {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID warrantyId;

    @Version
    private int version;

    @Column(nullable = false)
    private UUID contractId;

    @Column(nullable = false)
    private UUID unitId;

    @Column(nullable = false)
    private UUID customerId;

    @Embedded
    private CoveragePeriod coveragePeriod;

    @Embedded
    private CoverageScope coverageScope;

    @Column(nullable = false)
    private Instant registeredAt;

    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @JoinColumn(name = "warranty_id")
    private List<WarrantyClaim> claims = new ArrayList<>();

    protected Warranty() {}

    public static Warranty register(UUID contractId, UUID unitId, UUID customerId,
                                     CoveragePeriod period, CoverageScope scope) {
        Warranty w = new Warranty();
        w.contractId = contractId;
        w.unitId = unitId;
        w.customerId = customerId;
        w.coveragePeriod = period;
        w.coverageScope = scope;
        w.registeredAt = Instant.now();
        return w;
    }

    /**
     * Command: VerifyClaim
     * รับ defect report สร้าง claim และตรวจสอบ coverage ในการดำเนินการเดียวกัน
     * ปกป้อง invariant ทั้งหมดผ่าน Aggregate Root
     */
    public WarrantyClaim verifyClaim(UUID defectId, DefectCategory defectCategory,
                                      String description, Instant reportedAt) {
        boolean alreadyHasActiveClaim = claims.stream()
                .anyMatch(c -> c.getDefectId().equals(defectId)
                        && c.getCoverageStatus() != CoverageStatus.REJECTED);
        if (alreadyHasActiveClaim) {
            throw new IllegalStateException(
                    "Active claim already exists for defectId=" + defectId);
        }

        WarrantyClaim claim = new WarrantyClaim(defectId, defectCategory, description, reportedAt);

        if (!coveragePeriod.covers(reportedAt)) {
            claim.markRejected("Reported outside coverage period (expires at "
                    + coveragePeriod.getEndsAt() + ")");
        } else if (!coverageScope.includes(defectCategory)) {
            claim.markRejected("Defect category " + defectCategory
                    + " is not in coverage scope");
        } else {
            claim.markCovered("Within coverage period and scope");
        }

        claims.add(claim);
        return claim;
    }

    public UUID getWarrantyId() { return warrantyId; }
    public int getVersion() { return version; }
    public UUID getContractId() { return contractId; }
    public UUID getUnitId() { return unitId; }
    public UUID getCustomerId() { return customerId; }
    public CoveragePeriod getCoveragePeriod() { return coveragePeriod; }
    public CoverageScope getCoverageScope() { return coverageScope; }
    public Instant getRegisteredAt() { return registeredAt; }
    public List<WarrantyClaim> getClaims() { return List.copyOf(claims); }
}
