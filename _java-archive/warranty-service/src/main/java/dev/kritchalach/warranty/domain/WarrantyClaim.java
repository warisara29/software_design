package dev.kritchalach.warranty.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Entity: WarrantyClaim
 * เคสการเคลม warranty ที่ลูกค้าแจ้ง defect เข้ามา 1 defect = 1 claim
 * อยู่ภายใน Warranty Aggregate access ต้องผ่าน Warranty Root เท่านั้น
 */
@Entity
@Table(name = "warranty_claims")
public class WarrantyClaim {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID claimId;

    @Column(nullable = false)
    private UUID defectId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DefectCategory defectCategory;

    private String description;

    @Column(nullable = false)
    private Instant reportedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CoverageStatus coverageStatus;

    private String coverageReason;

    private Instant verifiedAt;

    protected WarrantyClaim() {}

    public WarrantyClaim(UUID defectId, DefectCategory defectCategory,
                         String description, Instant reportedAt) {
        this.defectId = defectId;
        this.defectCategory = defectCategory;
        this.description = description;
        this.reportedAt = reportedAt;
        this.coverageStatus = CoverageStatus.PENDING;
    }

    void markCovered(String reason) {
        this.coverageStatus = CoverageStatus.COVERED;
        this.coverageReason = reason;
        this.verifiedAt = Instant.now();
    }

    void markRejected(String reason) {
        this.coverageStatus = CoverageStatus.REJECTED;
        this.coverageReason = reason;
        this.verifiedAt = Instant.now();
    }

    public UUID getClaimId() { return claimId; }
    public UUID getDefectId() { return defectId; }
    public DefectCategory getDefectCategory() { return defectCategory; }
    public String getDescription() { return description; }
    public Instant getReportedAt() { return reportedAt; }
    public CoverageStatus getCoverageStatus() { return coverageStatus; }
    public String getCoverageReason() { return coverageReason; }
    public Instant getVerifiedAt() { return verifiedAt; }
}
