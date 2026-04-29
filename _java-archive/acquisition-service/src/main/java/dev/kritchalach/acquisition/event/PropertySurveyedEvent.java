package dev.kritchalach.acquisition.event;

import java.math.BigDecimal;

/**
 * Inbound event: property.surveyed (จาก Inventory)
 */
public class PropertySurveyedEvent {

    private String surveyId;
    private String propertyId;
    private String address;
    private BigDecimal areaSqm;
    private BigDecimal estimatedValue;
    private String zoneType;
    private String sellerId;
    private String sellerName;
    private String sellerContact;

    public PropertySurveyedEvent() {}

    public String getSurveyId() { return surveyId; }
    public void setSurveyId(String surveyId) { this.surveyId = surveyId; }
    public String getPropertyId() { return propertyId; }
    public void setPropertyId(String propertyId) { this.propertyId = propertyId; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public BigDecimal getAreaSqm() { return areaSqm; }
    public void setAreaSqm(BigDecimal areaSqm) { this.areaSqm = areaSqm; }
    public BigDecimal getEstimatedValue() { return estimatedValue; }
    public void setEstimatedValue(BigDecimal estimatedValue) { this.estimatedValue = estimatedValue; }
    public String getZoneType() { return zoneType; }
    public void setZoneType(String zoneType) { this.zoneType = zoneType; }
    public String getSellerId() { return sellerId; }
    public void setSellerId(String sellerId) { this.sellerId = sellerId; }
    public String getSellerName() { return sellerName; }
    public void setSellerName(String sellerName) { this.sellerName = sellerName; }
    public String getSellerContact() { return sellerContact; }
    public void setSellerContact(String sellerContact) { this.sellerContact = sellerContact; }
}
