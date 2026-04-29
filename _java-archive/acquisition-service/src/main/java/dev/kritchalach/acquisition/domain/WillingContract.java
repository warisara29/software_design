package dev.kritchalach.acquisition.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Entity: WillingContract
 * ร่างสัญญาจะซื้อจะขาย (willing contract) ที่ Legal ทำขึ้นเพื่อซื้อ property จาก seller
 * อยู่ภายใน Acquisition Aggregate — access ต้องผ่าน Acquisition Root เท่านั้น
 */
@Entity
@Table(name = "willing_contracts")
public class WillingContract {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID willingContractId;

    private String fileUrl;

    private BigDecimal agreedPrice;

    private UUID templateId;

    @Column(nullable = false)
    private Instant draftedAt;

    protected WillingContract() {}

    public WillingContract(UUID templateId, String fileUrl, BigDecimal agreedPrice) {
        this.templateId = templateId;
        this.fileUrl = fileUrl;
        this.agreedPrice = agreedPrice;
        this.draftedAt = Instant.now();
    }

    public UUID getWillingContractId() { return willingContractId; }
    public String getFileUrl() { return fileUrl; }
    public BigDecimal getAgreedPrice() { return agreedPrice; }
    public UUID getTemplateId() { return templateId; }
    public Instant getDraftedAt() { return draftedAt; }
}
