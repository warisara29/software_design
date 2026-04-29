package dev.kritchalach.acquisition.controller;

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

    /**
     * Step 1 — simulate property.surveyed event from Inventory
     */
    @PostMapping("/api/test/property-surveyed")
    public Map<String, String> simulatePropertySurveyed(@RequestBody(required = false) Map<String, String> body) {
        String surveyId = body != null && body.containsKey("surveyId")
                ? body.get("surveyId") : UUID.randomUUID().toString();
        String propertyId = body != null && body.containsKey("propertyId")
                ? body.get("propertyId") : UUID.randomUUID().toString();
        String sellerId = body != null && body.containsKey("sellerId")
                ? body.get("sellerId") : UUID.randomUUID().toString();

        String json = String.format(
                "{\"surveyId\":\"%s\",\"propertyId\":\"%s\",\"address\":\"123 Sukhumvit Rd\",\"areaSqm\":150.50,\"estimatedValue\":5500000,\"zoneType\":\"RESIDENTIAL\",\"sellerId\":\"%s\",\"sellerName\":\"Mr. Somchai\",\"sellerContact\":\"+66812345678\"}",
                surveyId, propertyId, sellerId);

        kafkaTemplate.send("property.survey.received-topic", surveyId, json);

        return Map.of(
                "message", "property.survey.received-topic event sent",
                "surveyId", surveyId,
                "propertyId", propertyId,
                "sellerId", sellerId
        );
    }

    /**
     * Step 2 — simulate acquisition.approved event from CEO
     */
    @PostMapping("/api/test/acquisition-approved")
    public Map<String, String> simulateAcquisitionApproved(@RequestBody Map<String, String> body) {
        String acquisitionId = body.get("acquisitionId");
        String approvedPrice = body.getOrDefault("approvedPrice", "5500000");
        String approvedBy = body.getOrDefault("approvedBy", "CEO-001");

        String json = String.format(
                "{\"acquisitionId\":\"%s\",\"approvedPrice\":%s,\"approvedBy\":\"%s\"}",
                acquisitionId, approvedPrice, approvedBy);

        kafkaTemplate.send("acquisition.approval.granted-topic", acquisitionId, json);

        return Map.of(
                "message", "acquisition.approval.granted-topic event sent",
                "acquisitionId", acquisitionId
        );
    }
}
