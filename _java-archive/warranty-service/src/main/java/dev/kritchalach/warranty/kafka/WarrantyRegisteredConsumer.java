package dev.kritchalach.warranty.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.kritchalach.warranty.event.WarrantyRegisteredEvent;
import dev.kritchalach.warranty.service.WarrantyVerificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class WarrantyRegisteredConsumer {

    private static final Logger log = LoggerFactory.getLogger(WarrantyRegisteredConsumer.class);

    private final WarrantyVerificationService service;
    private final ObjectMapper objectMapper;

    public WarrantyRegisteredConsumer(WarrantyVerificationService service) {
        this.service = service;
        this.objectMapper = new ObjectMapper();
    }

    @KafkaListener(
            id = "warranty-registered-listener",
            topics = "warranty.coverage.registered-topic",
            groupId = "warranty-verification-service"
    )
    public void onWarrantyRegistered(String message) {
        log.info("Received warranty.coverage.registered-topic event: {}", message);

        try {
            WarrantyRegisteredEvent event = objectMapper.readValue(message, WarrantyRegisteredEvent.class);
            service.registerWarranty(event);
            log.info("Successfully registered warranty for contractId={}", event.getContractId());
        } catch (Exception e) {
            log.error("Failed to process warranty.coverage.registered-topic event: {}", e.getMessage(), e);
        }
    }
}
