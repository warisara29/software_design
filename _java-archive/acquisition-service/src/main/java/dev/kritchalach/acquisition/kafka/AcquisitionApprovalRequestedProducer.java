package dev.kritchalach.acquisition.kafka;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import dev.kritchalach.acquisition.event.AcquisitionApprovalRequestedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class AcquisitionApprovalRequestedProducer {

    private static final Logger log = LoggerFactory.getLogger(AcquisitionApprovalRequestedProducer.class);
    private static final String TOPIC = "acquisition.approval.requested-topic";

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public AcquisitionApprovalRequestedProducer(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    public void send(AcquisitionApprovalRequestedEvent event) {
        try {
            String payload = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(TOPIC, event.getAcquisitionId().toString(), payload);
            log.info("Produced AcquisitionApprovalRequested to [{}]: acquisitionId={}",
                    TOPIC, event.getAcquisitionId());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize AcquisitionApprovalRequestedEvent", e);
            throw new RuntimeException(e);
        }
    }
}
