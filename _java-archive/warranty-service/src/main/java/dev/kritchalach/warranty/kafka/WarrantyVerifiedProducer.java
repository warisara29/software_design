package dev.kritchalach.warranty.kafka;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import dev.kritchalach.warranty.event.WarrantyVerifiedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class WarrantyVerifiedProducer {

    private static final Logger log = LoggerFactory.getLogger(WarrantyVerifiedProducer.class);
    private static final String TOPIC = "warranty.coverage.verified-topic";

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public WarrantyVerifiedProducer(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    public void send(WarrantyVerifiedEvent event) {
        try {
            String payload = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(TOPIC, event.getClaimId().toString(), payload);
            log.info("Produced WarrantyVerified to [{}]: claimId={}, status={}",
                    TOPIC, event.getClaimId(), event.getCoverageStatus());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize WarrantyVerifiedEvent", e);
            throw new RuntimeException(e);
        }
    }
}
