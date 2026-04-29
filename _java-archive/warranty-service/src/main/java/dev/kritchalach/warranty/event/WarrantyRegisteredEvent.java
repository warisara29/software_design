package dev.kritchalach.warranty.event;

/**
 * Inbound: warranty.registered (จาก Post-sale หลังส่งมอบ unit)
 * ใช้สร้าง Warranty record ใน aggregate ของ Legal เพื่อเตรียมรองรับ defect report
 */
public class WarrantyRegisteredEvent {

    private String contractId;
    private String unitId;
    private String customerId;
    private String startsAt;     // ISO8601
    private String endsAt;       // ISO8601
    private String[] coveredCategories;

    public WarrantyRegisteredEvent() {}

    public String getContractId() { return contractId; }
    public void setContractId(String contractId) { this.contractId = contractId; }
    public String getUnitId() { return unitId; }
    public void setUnitId(String unitId) { this.unitId = unitId; }
    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }
    public String getStartsAt() { return startsAt; }
    public void setStartsAt(String startsAt) { this.startsAt = startsAt; }
    public String getEndsAt() { return endsAt; }
    public void setEndsAt(String endsAt) { this.endsAt = endsAt; }
    public String[] getCoveredCategories() { return coveredCategories; }
    public void setCoveredCategories(String[] coveredCategories) { this.coveredCategories = coveredCategories; }
}
