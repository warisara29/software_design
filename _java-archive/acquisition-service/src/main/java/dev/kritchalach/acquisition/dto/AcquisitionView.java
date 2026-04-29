package dev.kritchalach.acquisition.dto;

import dev.kritchalach.acquisition.domain.Acquisition;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AcquisitionView(
        UUID acquisitionId,
        String status,
        UUID surveyId,
        UUID propertyId,
        String address,
        BigDecimal areaSqm,
        BigDecimal estimatedValue,
        String zoneType,
        UUID sellerId,
        String sellerName,
        Instant createdAt,
        Instant approvedAt,
        WillingContractView willingContract
) {
    public static AcquisitionView from(Acquisition a) {
        var wc = a.getWillingContract() == null ? null
                : new WillingContractView(
                        a.getWillingContract().getWillingContractId(),
                        a.getWillingContract().getFileUrl(),
                        a.getWillingContract().getAgreedPrice(),
                        a.getWillingContract().getTemplateId(),
                        a.getWillingContract().getDraftedAt());
        var survey = a.getSurvey();
        var seller = a.getSeller();
        return new AcquisitionView(
                a.getAcquisitionId(),
                a.getStatus().name(),
                a.getSurveyId(),
                a.getPropertyId(),
                survey == null ? null : survey.getAddress(),
                survey == null ? null : survey.getAreaSqm(),
                survey == null ? null : survey.getEstimatedValue(),
                survey == null ? null : survey.getZoneType(),
                seller == null ? null : seller.getSellerId(),
                seller == null ? null : seller.getSellerName(),
                a.getCreatedAt(),
                a.getApprovedAt(),
                wc
        );
    }
}
