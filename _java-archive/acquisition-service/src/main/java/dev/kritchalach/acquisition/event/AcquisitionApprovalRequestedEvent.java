package dev.kritchalach.acquisition.event;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Domain Event: AcquisitionApprovalRequested
 * Legal ขอ CEO อนุมัติให้เข้าซื้อ property
 */
public class AcquisitionApprovalRequestedEvent {

    private UUID acquisitionId;
    private UUID surveyId;
    private UUID propertyId;
    private String address;
    private BigDecimal estimatedValue;
    private String sellerName;
    private Instant requestedAt;

    public AcquisitionApprovalRequestedEvent() {}

    public AcquisitionApprovalRequestedEvent(UUID acquisitionId, UUID surveyId, UUID propertyId,
                                              String address, BigDecimal estimatedValue,
                                              String sellerName, Instant requestedAt) {
        this.acquisitionId = acquisitionId;
        this.surveyId = surveyId;
        this.propertyId = propertyId;
        this.address = address;
        this.estimatedValue = estimatedValue;
        this.sellerName = sellerName;
        this.requestedAt = requestedAt;
    }

    public UUID getAcquisitionId() { return acquisitionId; }
    public void setAcquisitionId(UUID acquisitionId) { this.acquisitionId = acquisitionId; }
    public UUID getSurveyId() { return surveyId; }
    public void setSurveyId(UUID surveyId) { this.surveyId = surveyId; }
    public UUID getPropertyId() { return propertyId; }
    public void setPropertyId(UUID propertyId) { this.propertyId = propertyId; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public BigDecimal getEstimatedValue() { return estimatedValue; }
    public void setEstimatedValue(BigDecimal estimatedValue) { this.estimatedValue = estimatedValue; }
    public String getSellerName() { return sellerName; }
    public void setSellerName(String sellerName) { this.sellerName = sellerName; }
    public Instant getRequestedAt() { return requestedAt; }
    public void setRequestedAt(Instant requestedAt) { this.requestedAt = requestedAt; }
}
