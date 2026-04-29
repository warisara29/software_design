package dev.kritchalach.acquisition.service;

import dev.kritchalach.acquisition.domain.Acquisition;
import dev.kritchalach.acquisition.domain.PropertySurvey;
import dev.kritchalach.acquisition.domain.SellerInfo;
import dev.kritchalach.acquisition.domain.WillingContract;
import dev.kritchalach.acquisition.event.AcquisitionApprovalRequestedEvent;
import dev.kritchalach.acquisition.event.AcquisitionContractDraftedEvent;
import dev.kritchalach.acquisition.event.AcquisitionApprovedEvent;
import dev.kritchalach.acquisition.event.PropertySurveyedEvent;
import dev.kritchalach.acquisition.repository.AcquisitionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Application Service สำหรับ Flow 1: Acquire Property
 * 1. รับ property.surveyed → สร้าง Acquisition + ขอ CEO approval
 * 2. รับ acquisition.approved → ร่าง WillingContract + emit acquisition.contract.drafted
 */
@Service
public class AcquisitionService {

    private static final Logger log = LoggerFactory.getLogger(AcquisitionService.class);

    private final AcquisitionRepository acquisitionRepository;

    public AcquisitionService(AcquisitionRepository acquisitionRepository) {
        this.acquisitionRepository = acquisitionRepository;
    }

    /**
     * Command: ReceiveSurvey + RequestApproval
     */
    public AcquisitionApprovalRequestedEvent receiveSurvey(PropertySurveyedEvent event) {
        UUID surveyId = UUID.fromString(event.getSurveyId());
        UUID propertyId = UUID.fromString(event.getPropertyId());

        log.info("Command: ReceiveSurvey — surveyId={}, propertyId={}", surveyId, propertyId);

        UUID sellerId = event.getSellerId() != null
                ? UUID.fromString(event.getSellerId())
                : UUID.randomUUID();

        PropertySurvey survey = new PropertySurvey(
                event.getAddress(), event.getAreaSqm(),
                event.getEstimatedValue(), event.getZoneType());

        SellerInfo seller = new SellerInfo(
                sellerId, event.getSellerName(), event.getSellerContact());

        Acquisition acquisition = Acquisition.fromSurvey(surveyId, propertyId, survey, seller);
        acquisition.requestApproval();
        acquisition = acquisitionRepository.save(acquisition);

        log.info("AcquisitionApprovalRequested: acquisitionId={}, status={}",
                acquisition.getAcquisitionId(), acquisition.getStatus());

        return new AcquisitionApprovalRequestedEvent(
                acquisition.getAcquisitionId(),
                acquisition.getSurveyId(),
                acquisition.getPropertyId(),
                survey.getAddress(),
                survey.getEstimatedValue(),
                seller.getSellerName(),
                acquisition.getCreatedAt()
        );
    }

    /**
     * Command: ApproveAcquisition + DraftWillingContract
     */
    public AcquisitionContractDraftedEvent draftContractAfterApproval(AcquisitionApprovedEvent event) {
        UUID acquisitionId = UUID.fromString(event.getAcquisitionId());

        log.info("Command: ApproveAcquisition + DraftWillingContract — acquisitionId={}", acquisitionId);

        Acquisition acquisition = acquisitionRepository.findById(acquisitionId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Acquisition not found: " + acquisitionId));

        acquisition.approve();

        UUID templateId = UUID.randomUUID();
        String fileUrl = "https://storage.realestate.com/willing-contracts/draft-"
                + UUID.randomUUID() + ".pdf";
        BigDecimal agreedPrice = event.getApprovedPrice() != null
                ? event.getApprovedPrice()
                : acquisition.getSurvey().getEstimatedValue();

        WillingContract willingContract = acquisition.draftWillingContract(
                templateId, fileUrl, agreedPrice);

        acquisition = acquisitionRepository.save(acquisition);

        log.info("AcquisitionContractDrafted: acquisitionId={}, willingContractId={}",
                acquisition.getAcquisitionId(), willingContract.getWillingContractId());

        return new AcquisitionContractDraftedEvent(
                acquisition.getAcquisitionId(),
                willingContract.getWillingContractId(),
                acquisition.getPropertyId(),
                willingContract.getFileUrl(),
                willingContract.getAgreedPrice(),
                willingContract.getTemplateId(),
                willingContract.getDraftedAt()
        );
    }
}
