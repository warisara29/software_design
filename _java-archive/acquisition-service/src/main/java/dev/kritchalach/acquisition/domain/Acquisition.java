package dev.kritchalach.acquisition.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Aggregate Root: Acquisition
 * ครอบคลุม lifecycle การเข้าซื้อ property ของบริษัท ตั้งแต่รับ survey, ขอ CEO อนุมัติ,
 * จนถึงร่าง willing contract ทุก Command ต้องผ่าน Acquisition Root
 */
@Entity
@Table(name = "acquisitions")
public class Acquisition {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID acquisitionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AcquisitionStatus status;

    @Version
    private int version;

    @Column(nullable = false)
    private Instant createdAt;

    private Instant approvedAt;

    // Ref only — เก็บแค่ ID เพื่อ trace กลับไปยัง upstream domain
    @Column(nullable = false)
    private UUID surveyId;

    @Column(nullable = false)
    private UUID propertyId;

    @Embedded
    private PropertySurvey survey;

    @Embedded
    private SellerInfo seller;

    // Entity ภายใน Aggregate — สร้างได้หลังจาก CEO approve
    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "willing_contract_id")
    private WillingContract willingContract;

    protected Acquisition() {}

    /**
     * Factory: เริ่ม acquisition จาก property.surveyed event
     * Command: ReceiveSurvey
     */
    public static Acquisition fromSurvey(UUID surveyId, UUID propertyId,
                                          PropertySurvey survey, SellerInfo seller) {
        Acquisition acq = new Acquisition();
        acq.surveyId = surveyId;
        acq.propertyId = propertyId;
        acq.survey = survey;
        acq.seller = seller;
        acq.status = AcquisitionStatus.SURVEYED;
        acq.createdAt = Instant.now();
        return acq;
    }

    /**
     * Command: RequestApproval
     * Legal ขอ CEO อนุมัติให้เข้าซื้อ property
     */
    public void requestApproval() {
        if (status != AcquisitionStatus.SURVEYED) {
            throw new IllegalStateException(
                    "Cannot request approval — status must be SURVEYED but was " + status);
        }
        this.status = AcquisitionStatus.APPROVAL_REQUESTED;
    }

    /**
     * Command: ApproveAcquisition
     * รับการอนุมัติจาก CEO
     */
    public void approve() {
        if (status != AcquisitionStatus.APPROVAL_REQUESTED) {
            throw new IllegalStateException(
                    "Cannot approve — status must be APPROVAL_REQUESTED but was " + status);
        }
        this.status = AcquisitionStatus.APPROVED;
        this.approvedAt = Instant.now();
    }

    /**
     * Command: DraftWillingContract
     * Factory method สำหรับสร้าง WillingContract ภายใน aggregate
     * Business Rule: ต้องอนุมัติแล้วเท่านั้นจึงร่างสัญญาจะซื้อจะขายได้
     */
    public WillingContract draftWillingContract(UUID templateId, String fileUrl, BigDecimal agreedPrice) {
        if (status != AcquisitionStatus.APPROVED) {
            throw new IllegalStateException(
                    "Cannot draft willing contract — status must be APPROVED but was " + status);
        }
        this.willingContract = new WillingContract(templateId, fileUrl, agreedPrice);
        this.status = AcquisitionStatus.CONTRACT_DRAFTED;
        return this.willingContract;
    }

    public UUID getAcquisitionId() { return acquisitionId; }
    public AcquisitionStatus getStatus() { return status; }
    public int getVersion() { return version; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getApprovedAt() { return approvedAt; }
    public UUID getSurveyId() { return surveyId; }
    public UUID getPropertyId() { return propertyId; }
    public PropertySurvey getSurvey() { return survey; }
    public SellerInfo getSeller() { return seller; }
    public WillingContract getWillingContract() { return willingContract; }
}
