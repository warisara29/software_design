package dev.kritchalach.kafka.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Aggregate Root: Contract
 * ควบคุม lifecycle ทั้งหมด ทุก Command ต้องผ่าน Contract เสมอ
 * ครอบคลุม ContractDraft, PurchaseAgreement และ ContractSigning ทั้งหมด
 */
@Entity
@Table(name = "contracts")
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID contractId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContractStatus status;

    @Version
    private int version;

    private UUID templateId;

    @Column(nullable = false)
    private Instant createdAt;

    // Ref only — เก็บแค่ ID เพื่อ trace กลับ ไม่เก็บข้อมูลซ้ำ
    @Column(nullable = false)
    private UUID bookingId;

    @Column(nullable = false)
    private UUID customerId;

    @Column(nullable = false)
    private UUID unitId;

    // Entity ภายใน Aggregate
    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "draft_id")
    private ContractDraft contractDraft;

    @Embedded
    private ContractParties parties;

    @Embedded
    private ContractTerms terms;

    protected Contract() {}

    /**
     * Command: CreateContractDraft
     * สร้าง Contract aggregate พร้อม ContractDraft entity
     * Business Rule: ต้องมี KYC status = APPROVED ก่อน (ตรวจที่ Policy layer)
     */
    public static Contract createContractDraft(UUID bookingId, UUID customerId, UUID unitId,
                                                UUID templateId, ContractParties parties, String fileUrl) {
        Contract contract = new Contract();
        contract.bookingId = bookingId;
        contract.customerId = customerId;
        contract.unitId = unitId;
        contract.templateId = templateId;
        contract.status = ContractStatus.DRAFT;
        contract.createdAt = Instant.now();
        contract.parties = parties;
        contract.contractDraft = new ContractDraft(templateId, fileUrl);
        return contract;
    }

    public UUID getContractId() { return contractId; }
    public ContractStatus getStatus() { return status; }
    public int getVersion() { return version; }
    public UUID getTemplateId() { return templateId; }
    public Instant getCreatedAt() { return createdAt; }
    public UUID getBookingId() { return bookingId; }
    public UUID getCustomerId() { return customerId; }
    public UUID getUnitId() { return unitId; }
    public ContractDraft getContractDraft() { return contractDraft; }
    public ContractParties getParties() { return parties; }
    public ContractTerms getTerms() { return terms; }
}
