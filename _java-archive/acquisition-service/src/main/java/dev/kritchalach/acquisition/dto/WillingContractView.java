package dev.kritchalach.acquisition.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record WillingContractView(
        UUID willingContractId,
        String fileUrl,
        BigDecimal agreedPrice,
        UUID templateId,
        Instant draftedAt
) {}
