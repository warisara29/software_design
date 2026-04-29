package dev.kritchalach.acquisition.domain;

import jakarta.persistence.Embeddable;
import java.math.BigDecimal;

/**
 * Value Object: PropertySurvey
 * ข้อมูล survey ของ property ที่ Inventory ส่งมา immutable
 */
@Embeddable
public class PropertySurvey {

    private String address;
    private BigDecimal areaSqm;
    private BigDecimal estimatedValue;
    private String zoneType;

    protected PropertySurvey() {}

    public PropertySurvey(String address, BigDecimal areaSqm,
                          BigDecimal estimatedValue, String zoneType) {
        this.address = address;
        this.areaSqm = areaSqm;
        this.estimatedValue = estimatedValue;
        this.zoneType = zoneType;
    }

    public String getAddress() { return address; }
    public BigDecimal getAreaSqm() { return areaSqm; }
    public BigDecimal getEstimatedValue() { return estimatedValue; }
    public String getZoneType() { return zoneType; }
}
