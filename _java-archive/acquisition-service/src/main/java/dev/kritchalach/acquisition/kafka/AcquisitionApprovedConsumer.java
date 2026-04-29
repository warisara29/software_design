package dev.kritchalach.acquisition.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.kritchalach.acquisition.event.AcquisitionApprovedEvent;
import dev.kritchalach.acquisition.event.AcquisitionContractDraftedEvent;
import dev.kritchalach.acquisition.service.AcquisitionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Kafka Consumer สำหรับ acquisition.approved event จาก CEO
 * Flow 1: acquisition.approved → DraftWillingContract → acquisition.contract.drafted
 */
@Component
public class AcquisitionApprovedConsumer {

    private static final Logger log = LoggerFactory.getLogger(AcquisitionApprovedConsumer.class);

    private final AcquisitionService acquisitionService;
    private final AcquisitionContractDraftedProducer producer;
    private final ObjectMapper objectMapper;

    public AcquisitionApprovedConsumer(AcquisitionService acquisitionService,
                                        AcquisitionContractDraftedProducer producer) {
        this.acquisitionService = acquisitionService;
        this.producer = producer;
        this.objectMapper = new ObjectMapper();
    }

    @KafkaListener(
            id = "acquisition-approved-listener",
            topics = "acquisition.approval.granted-topic",
            groupId = "property-acquisition-service"
    )
    public void onAcquisitionApproved(String message) {
        log.info("Received acquisition.approval.granted-topic event: {}", message);

        try {
            AcquisitionApprovedEvent event = objectMapper.readValue(message, AcquisitionApprovedEvent.class);
            AcquisitionContractDraftedEvent out = acquisitionService.draftContractAfterApproval(event);
            producer.send(out);
            log.info("Successfully processed acquisition.approval.granted-topic → AcquisitionContractDrafted for acquisitionId={}",
                    event.getAcquisitionId());
        } catch (Exception e) {
            log.error("Failed to process acquisition.approval.granted-topic event: {}", e.getMessage(), e);
        }
    }
}
