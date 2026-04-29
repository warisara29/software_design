package dev.kritchalach.acquisition.kafka;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import dev.kritchalach.acquisition.event.AcquisitionContractDraftedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class AcquisitionContractDraftedProducer {

    private static final Logger log = LoggerFactory.getLogger(AcquisitionContractDraftedProducer.class);
    private static final String TOPIC = "acquisition.contract.drafted-topic";

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public AcquisitionContractDraftedProducer(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    public void send(AcquisitionContractDraftedEvent event) {
        try {
            String payload = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(TOPIC, event.getAcquisitionId().toString(), payload);
            log.info("Produced AcquisitionContractDrafted to [{}]: acquisitionId={}, willingContractId={}",
                    TOPIC, event.getAcquisitionId(), event.getWillingContractId());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize AcquisitionContractDraftedEvent", e);
            throw new RuntimeException(e);
        }
    }
}
