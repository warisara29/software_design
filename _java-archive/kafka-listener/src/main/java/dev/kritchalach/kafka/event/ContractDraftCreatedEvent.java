package dev.kritchalach.kafka.event;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain Event: ContractDraftCreated
 * ร่างสัญญาจะซื้อจะขายถูกสร้างเสร็จแล้ว พร้อมส่งให้ Property Verification
 * immutable — เมื่อ emit แล้วจะไม่สามารถแก้ไขหรือเรียกคืนได้
 */
public class ContractDraftCreatedEvent {

    private UUID contractId;
    private UUID bookingId;
    private UUID unitId;
    private UUID customerId;
    private String status;
    private String fileUrl;
    private UUID templateId;
    private Instant createdAt;
    private Instant draftedAt;

    public ContractDraftCreatedEvent() {}

    public ContractDraftCreatedEvent(UUID contractId, UUID bookingId, UUID unitId,
                                      UUID customerId, String status, String fileUrl,
                                      UUID templateId, Instant createdAt, Instant draftedAt) {
        this.contractId = contractId;
        this.bookingId = bookingId;
        this.unitId = unitId;
        this.customerId = customerId;
        this.status = status;
        this.fileUrl = fileUrl;
        this.templateId = templateId;
        this.createdAt = createdAt;
        this.draftedAt = draftedAt;
    }

    public UUID getContractId() { return contractId; }
    public void setContractId(UUID contractId) { this.contractId = contractId; }
    public UUID getBookingId() { return bookingId; }
    public void setBookingId(UUID bookingId) { this.bookingId = bookingId; }
    public UUID getUnitId() { return unitId; }
    public void setUnitId(UUID unitId) { this.unitId = unitId; }
    public UUID getCustomerId() { return customerId; }
    public void setCustomerId(UUID customerId) { this.customerId = customerId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
    public UUID getTemplateId() { return templateId; }
    public void setTemplateId(UUID templateId) { this.templateId = templateId; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getDraftedAt() { return draftedAt; }
    public void setDraftedAt(Instant draftedAt) { this.draftedAt = draftedAt; }
}
