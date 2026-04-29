package dev.kritchalach.warranty.event;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain Event: WarrantyVerified
 * Legal ตรวจสอบ warranty สำหรับ defect ที่ลูกค้าแจ้งเสร็จ ส่งกลับ Post-sale เพื่อนัดซ่อม
 */
public class WarrantyVerifiedEvent {

    private UUID claimId;
    private UUID warrantyId;
    private UUID defectId;
    private UUID contractId;
    private UUID unitId;
    private UUID customerId;
    private String coverageStatus;
    private String coverageReason;
    private Instant verifiedAt;
    private Instant expiresAt;

    public WarrantyVerifiedEvent() {}

    public WarrantyVerifiedEvent(UUID claimId, UUID warrantyId, UUID defectId, UUID contractId,
                                 UUID unitId, UUID customerId, String coverageStatus,
                                 String coverageReason, Instant verifiedAt, Instant expiresAt) {
        this.claimId = claimId;
        this.warrantyId = warrantyId;
        this.defectId = defectId;
        this.contractId = contractId;
        this.unitId = unitId;
        this.customerId = customerId;
        this.coverageStatus = coverageStatus;
        this.coverageReason = coverageReason;
        this.verifiedAt = verifiedAt;
        this.expiresAt = expiresAt;
    }

    public UUID getClaimId() { return claimId; }
    public void setClaimId(UUID claimId) { this.claimId = claimId; }
    public UUID getWarrantyId() { return warrantyId; }
    public void setWarrantyId(UUID warrantyId) { this.warrantyId = warrantyId; }
    public UUID getDefectId() { return defectId; }
    public void setDefectId(UUID defectId) { this.defectId = defectId; }
    public UUID getContractId() { return contractId; }
    public void setContractId(UUID contractId) { this.contractId = contractId; }
    public UUID getUnitId() { return unitId; }
    public void setUnitId(UUID unitId) { this.unitId = unitId; }
    public UUID getCustomerId() { return customerId; }
    public void setCustomerId(UUID customerId) { this.customerId = customerId; }
    public String getCoverageStatus() { return coverageStatus; }
    public void setCoverageStatus(String coverageStatus) { this.coverageStatus = coverageStatus; }
    public String getCoverageReason() { return coverageReason; }
    public void setCoverageReason(String coverageReason) { this.coverageReason = coverageReason; }
    public Instant getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(Instant verifiedAt) { this.verifiedAt = verifiedAt; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
}
