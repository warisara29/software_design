package dev.kritchalach.acquisition.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.kritchalach.acquisition.event.AcquisitionApprovalRequestedEvent;
import dev.kritchalach.acquisition.event.PropertySurveyedEvent;
import dev.kritchalach.acquisition.service.AcquisitionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Kafka Consumer สำหรับ property.surveyed event จาก Inventory
 * Flow 1: property.surveyed → ReceiveSurvey + RequestApproval → acquisition.approval.requested
 */
@Component
public class PropertySurveyedConsumer {

    private static final Logger log = LoggerFactory.getLogger(PropertySurveyedConsumer.class);

    private final AcquisitionService acquisitionService;
    private final AcquisitionApprovalRequestedProducer producer;
    private final ObjectMapper objectMapper;

    public PropertySurveyedConsumer(AcquisitionService acquisitionService,
                                     AcquisitionApprovalRequestedProducer producer) {
        this.acquisitionService = acquisitionService;
        this.producer = producer;
        this.objectMapper = new ObjectMapper();
    }

    @KafkaListener(
            id = "property-surveyed-listener",
            topics = "property.survey.received-topic",
            groupId = "property-acquisition-service"
    )
    public void onPropertySurveyed(String message) {
        log.info("Received property.survey.received-topic event: {}", message);

        try {
            PropertySurveyedEvent event = objectMapper.readValue(message, PropertySurveyedEvent.class);
            AcquisitionApprovalRequestedEvent out = acquisitionService.receiveSurvey(event);
            producer.send(out);
            log.info("Successfully processed property.survey.received-topic → AcquisitionApprovalRequested for surveyId={}",
                    event.getSurveyId());
        } catch (Exception e) {
            log.error("Failed to process property.survey.received-topic event: {}", e.getMessage(), e);
        }
    }
}
