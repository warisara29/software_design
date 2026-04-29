package dev.kritchalach.warranty.event;

/**
 * Inbound: defect.reported (จาก Post-sale)
 */
public class DefectReportedEvent {

    private String defectId;
    private String contractId;
    private String unitId;
    private String customerId;
    private String defectCategory;
    private String description;
    private String reportedAt; // ISO8601

    public DefectReportedEvent() {}

    public String getDefectId() { return defectId; }
    public void setDefectId(String defectId) { this.defectId = defectId; }
    public String getContractId() { return contractId; }
    public void setContractId(String contractId) { this.contractId = contractId; }
    public String getUnitId() { return unitId; }
    public void setUnitId(String unitId) { this.unitId = unitId; }
    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }
    public String getDefectCategory() { return defectCategory; }
    public void setDefectCategory(String defectCategory) { this.defectCategory = defectCategory; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getReportedAt() { return reportedAt; }
    public void setReportedAt(String reportedAt) { this.reportedAt = reportedAt; }
}
