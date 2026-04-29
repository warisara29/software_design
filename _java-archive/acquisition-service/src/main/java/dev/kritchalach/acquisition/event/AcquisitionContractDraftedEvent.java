package dev.kritchalach.acquisition.event;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Domain Event: AcquisitionContractDrafted (willing contract)
 * ร่างสัญญาจะซื้อจะขายเสร็จ ส่งให้ Inventory ดำเนินการ register property + settle price ต่อ
 */
public class AcquisitionContractDraftedEvent {

    private UUID acquisitionId;
    private UUID willingContractId;
    private UUID propertyId;
    private String fileUrl;
    private BigDecimal agreedPrice;
    private UUID templateId;
    private Instant draftedAt;

    public AcquisitionContractDraftedEvent() {}

    public AcquisitionContractDraftedEvent(UUID acquisitionId, UUID willingContractId, UUID propertyId,
                                            String fileUrl, BigDecimal agreedPrice,
                                            UUID templateId, Instant draftedAt) {
        this.acquisitionId = acquisitionId;
        this.willingContractId = willingContractId;
        this.propertyId = propertyId;
        this.fileUrl = fileUrl;
        this.agreedPrice = agreedPrice;
        this.templateId = templateId;
        this.draftedAt = draftedAt;
    }

    public UUID getAcquisitionId() { return acquisitionId; }
    public void setAcquisitionId(UUID acquisitionId) { this.acquisitionId = acquisitionId; }
    public UUID getWillingContractId() { return willingContractId; }
    public void setWillingContractId(UUID willingContractId) { this.willingContractId = willingContractId; }
    public UUID getPropertyId() { return propertyId; }
    public void setPropertyId(UUID propertyId) { this.propertyId = propertyId; }
    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
    public BigDecimal getAgreedPrice() { return agreedPrice; }
    public void setAgreedPrice(BigDecimal agreedPrice) { this.agreedPrice = agreedPrice; }
    public UUID getTemplateId() { return templateId; }
    public void setTemplateId(UUID templateId) { this.templateId = templateId; }
    public Instant getDraftedAt() { return draftedAt; }
    public void setDraftedAt(Instant draftedAt) { this.draftedAt = draftedAt; }
}
