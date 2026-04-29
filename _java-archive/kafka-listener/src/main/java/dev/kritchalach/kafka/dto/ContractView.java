package dev.kritchalach.kafka.dto;

import dev.kritchalach.kafka.domain.Contract;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO สำหรับ REST GET /api/contracts/*
 * แปลงจาก Aggregate ภายใน @Transactional เพื่อหลีกเลี่ยง LazyInitialization ตอน serialize
 */
public record ContractView(
        UUID contractId,
        String status,
        UUID bookingId,
        UUID unitId,
        UUID customerId,
        UUID buyerId,
        UUID sellerId,
        UUID templateId,
        Instant createdAt,
        ContractDraftView draft
) {
    public static ContractView from(Contract c) {
        var draft = c.getContractDraft() == null ? null
                : new ContractDraftView(
                        c.getContractDraft().getDraftId(),
                        c.getContractDraft().getFileUrl(),
                        c.getContractDraft().getTemplateId(),
                        c.getContractDraft().getDraftedAt());
        return new ContractView(
                c.getContractId(),
                c.getStatus().name(),
                c.getBookingId(),
                c.getUnitId(),
                c.getCustomerId(),
                c.getParties() == null ? null : c.getParties().getBuyerId(),
                c.getParties() == null ? null : c.getParties().getSellerId(),
                c.getTemplateId(),
                c.getCreatedAt(),
                draft
        );
    }
}
