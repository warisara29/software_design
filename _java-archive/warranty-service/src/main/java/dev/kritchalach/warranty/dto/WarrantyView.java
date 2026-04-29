package dev.kritchalach.warranty.dto;

import dev.kritchalach.warranty.domain.Warranty;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

public record WarrantyView(
        UUID warrantyId,
        UUID contractId,
        UUID unitId,
        UUID customerId,
        Instant coverageStartsAt,
        Instant coverageEndsAt,
        Set<String> coveredCategories,
        Instant registeredAt,
        List<WarrantyClaimView> claims
) {
    public static WarrantyView from(Warranty w) {
        Set<String> categories = w.getCoverageScope().getCategories().stream()
                .map(Enum::name)
                .collect(Collectors.toSet());
        List<WarrantyClaimView> claims = w.getClaims().stream()
                .map(WarrantyClaimView::from)
                .toList();
        return new WarrantyView(
                w.getWarrantyId(),
                w.getContractId(),
                w.getUnitId(),
                w.getCustomerId(),
                w.getCoveragePeriod().getStartsAt(),
                w.getCoveragePeriod().getEndsAt(),
                categories,
                w.getRegisteredAt(),
                claims
        );
    }
}
