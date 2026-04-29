package dev.kritchalach.warranty.dto;

import dev.kritchalach.warranty.domain.WarrantyClaim;

import java.time.Instant;
import java.util.UUID;

public record WarrantyClaimView(
        UUID claimId,
        UUID defectId,
        String defectCategory,
        String description,
        Instant reportedAt,
        String coverageStatus,
        String coverageReason,
        Instant verifiedAt
) {
    public static WarrantyClaimView from(WarrantyClaim c) {
        return new WarrantyClaimView(
                c.getClaimId(),
                c.getDefectId(),
                c.getDefectCategory().name(),
                c.getDescription(),
                c.getReportedAt(),
                c.getCoverageStatus().name(),
                c.getCoverageReason(),
                c.getVerifiedAt()
        );
    }
}
