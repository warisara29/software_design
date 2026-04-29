package dev.kritchalach.kafka.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.kritchalach.kafka.event.BookingConfirmedEvent;
import dev.kritchalach.kafka.event.ContractDraftCreatedEvent;
import dev.kritchalach.kafka.service.ContractDraftService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Kafka Consumer สำหรับ booking.confirmed event จาก Sales & Booking domain
 * Flow: booking.confirmed → KYCVerificationPolicy → CreateContractDraft → ContractDraftCreated
 */
@Component
public class BookingConfirmedConsumer {

    private static final Logger log = LoggerFactory.getLogger(BookingConfirmedConsumer.class);

    private final ContractDraftService contractDraftService;
    private final ContractDraftCreatedProducer contractDraftCreatedProducer;
    private final ObjectMapper objectMapper;

    public BookingConfirmedConsumer(ContractDraftService contractDraftService,
                                    ContractDraftCreatedProducer contractDraftCreatedProducer) {
        this.contractDraftService = contractDraftService;
        this.contractDraftCreatedProducer = contractDraftCreatedProducer;
        this.objectMapper = new ObjectMapper();
    }

    @KafkaListener(
            id = "booking-confirmed-listener",
            topics = "booking.order.confirmed-topic",
            groupId = "contract-draft-service"
    )
    public void onBookingConfirmed(String message) {
        log.info("Received booking.order.confirmed-topic event: {}", message);

        try {
            BookingConfirmedEvent event = objectMapper.readValue(message, BookingConfirmedEvent.class);

            // Policy → Command → Domain Event
            ContractDraftCreatedEvent draftCreatedEvent = contractDraftService.createContractDraft(event);

            // Produce ContractDraftCreated event
            contractDraftCreatedProducer.send(draftCreatedEvent);

            log.info("Successfully processed booking.confirmed → ContractDraftCreated for bookingId={}",
                    event.getBookingId());

        } catch (Exception e) {
            log.error("Failed to process booking.confirmed event: {}", e.getMessage(), e);
        }
    }
}
