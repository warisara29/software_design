package dev.kritchalach.kafka.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Entity: ContractDraft
 * เก็บข้อมูลของร่างสัญญาจะซื้อจะขาย สร้างขึ้นเมื่อ KYC ผ่านและ booking confirmed
 * อยู่ภายใน Contract Aggregate — ไม่ถูก access โดยตรงจากภายนอก ต้องผ่าน Contract Root
 */
@Entity
@Table(name = "contract_drafts")
public class ContractDraft {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID draftId;

    private String fileUrl;

    private UUID templateId;

    @Column(nullable = false)
    private Instant draftedAt;

    protected ContractDraft() {}

    public ContractDraft(UUID templateId, String fileUrl) {
        this.templateId = templateId;
        this.fileUrl = fileUrl;
        this.draftedAt = Instant.now();
    }

    public UUID getDraftId() { return draftId; }
    public String getFileUrl() { return fileUrl; }
    public UUID getTemplateId() { return templateId; }
    public Instant getDraftedAt() { return draftedAt; }
}
