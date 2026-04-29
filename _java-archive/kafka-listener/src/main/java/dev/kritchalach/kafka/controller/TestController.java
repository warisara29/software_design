package dev.kritchalach.kafka.controller;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
public class TestController {

    private final KafkaTemplate<String, String> kafkaTemplate;

    public TestController(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    @PostMapping("/api/test/booking-confirmed")
    public Map<String, String> simulateBookingConfirmed(@RequestBody(required = false) Map<String, String> body) {
        String bookingId = (body != null && body.containsKey("bookingId"))
                ? body.get("bookingId") : UUID.randomUUID().toString();
        String unitId = (body != null && body.containsKey("unitId"))
                ? body.get("unitId") : UUID.randomUUID().toString();
        String customerId = (body != null && body.containsKey("customerId"))
                ? body.get("customerId") : UUID.randomUUID().toString();

        String json = String.format(
                "{\"bookingId\":\"%s\",\"unitId\":\"%s\",\"customerId\":\"%s\"}",
                bookingId, unitId, customerId);

        kafkaTemplate.send("booking.order.confirmed-topic", bookingId, json);

        return Map.of(
                "message", "booking.order.confirmed-topic event sent",
                "bookingId", bookingId,
                "unitId", unitId,
                "customerId", customerId
        );
    }
}
