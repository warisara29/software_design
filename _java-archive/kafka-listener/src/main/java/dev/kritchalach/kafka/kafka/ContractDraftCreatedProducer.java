package dev.kritchalach.kafka.kafka;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import dev.kritchalach.kafka.event.ContractDraftCreatedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

/**
 * Kafka Producer สำหรับ Domain Event: ContractDraftCreated
 * ส่ง event ไปยัง topic contract.draft.created เพื่อให้ Property Verification subdomain รับไป
 */
@Component
public class ContractDraftCreatedProducer {

    private static final Logger log = LoggerFactory.getLogger(ContractDraftCreatedProducer.class);
    private static final String TOPIC = "contract.draft.created-topic";

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public ContractDraftCreatedProducer(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    public void send(ContractDraftCreatedEvent event) {
        try {
            String payload = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(TOPIC, event.getContractId().toString(), payload);
            log.info("Produced ContractDraftCreated event to topic [{}]: contractId={}",
                    TOPIC, event.getContractId());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize ContractDraftCreatedEvent", e);
            throw new RuntimeException("Failed to serialize ContractDraftCreatedEvent", e);
        }
    }
}
