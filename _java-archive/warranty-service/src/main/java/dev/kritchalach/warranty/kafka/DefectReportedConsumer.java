package dev.kritchalach.warranty.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.kritchalach.warranty.event.DefectReportedEvent;
import dev.kritchalach.warranty.event.WarrantyVerifiedEvent;
import dev.kritchalach.warranty.service.WarrantyVerificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class DefectReportedConsumer {

    private static final Logger log = LoggerFactory.getLogger(DefectReportedConsumer.class);

    private final WarrantyVerificationService service;
    private final WarrantyVerifiedProducer producer;
    private final ObjectMapper objectMapper;

    public DefectReportedConsumer(WarrantyVerificationService service,
                                   WarrantyVerifiedProducer producer) {
        this.service = service;
        this.producer = producer;
        this.objectMapper = new ObjectMapper();
    }

    @KafkaListener(
            id = "defect-reported-listener",
            topics = "warranty.defect.reported-topic",
            groupId = "warranty-verification-service"
    )
    public void onDefectReported(String message) {
        log.info("Received warranty.defect.reported-topic event: {}", message);

        try {
            DefectReportedEvent event = objectMapper.readValue(message, DefectReportedEvent.class);
            WarrantyVerifiedEvent out = service.verifyDefect(event);
            producer.send(out);
            log.info("Successfully processed warranty.defect.reported-topic → WarrantyVerified for defectId={}",
                    event.getDefectId());
        } catch (Exception e) {
            log.error("Failed to process warranty.defect.reported-topic event: {}", e.getMessage(), e);
        }
    }
}
