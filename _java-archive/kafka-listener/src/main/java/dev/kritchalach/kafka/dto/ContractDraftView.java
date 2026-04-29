package dev.kritchalach.kafka.dto;

import java.time.Instant;
import java.util.UUID;

public record ContractDraftView(
        UUID draftId,
        String fileUrl,
        UUID templateId,
        Instant draftedAt
) {}
