package dev.kritchalach.acquisition.event;

import java.math.BigDecimal;

/**
 * Inbound event: acquisition.approved (จาก CEO)
 */
public class AcquisitionApprovedEvent {

    private String acquisitionId;
    private BigDecimal approvedPrice;
    private String approvedBy;

    public AcquisitionApprovedEvent() {}

    public String getAcquisitionId() { return acquisitionId; }
    public void setAcquisitionId(String acquisitionId) { this.acquisitionId = acquisitionId; }
    public BigDecimal getApprovedPrice() { return approvedPrice; }
    public void setApprovedPrice(BigDecimal approvedPrice) { this.approvedPrice = approvedPrice; }
    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }
}
