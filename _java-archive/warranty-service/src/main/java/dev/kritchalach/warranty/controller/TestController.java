package dev.kritchalach.warranty.controller;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
public class TestController {

    private final KafkaTemplate<String, String> kafkaTemplate;

    public TestController(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    /**
     * Step 1 (optional) — register warranty before defect reports come in
     */
    @PostMapping("/api/test/warranty-registered")
    public Map<String, String> simulateWarrantyRegistered(@RequestBody(required = false) Map<String, String> body) {
        String contractId = body != null && body.containsKey("contractId")
                ? body.get("contractId") : UUID.randomUUID().toString();
        String unitId = body != null && body.containsKey("unitId")
                ? body.get("unitId") : UUID.randomUUID().toString();
        String customerId = body != null && body.containsKey("customerId")
                ? body.get("customerId") : UUID.randomUUID().toString();

        Instant now = Instant.now();
        Instant endsAt = now.plusSeconds(365L * 24 * 3600);

        String json = String.format(
                "{\"contractId\":\"%s\",\"unitId\":\"%s\",\"customerId\":\"%s\",\"startsAt\":\"%s\",\"endsAt\":\"%s\",\"coveredCategories\":[\"STRUCTURAL\",\"ELECTRICAL\",\"PLUMBING\",\"FINISHING\"]}",
                contractId, unitId, customerId, now, endsAt);

        kafkaTemplate.send("warranty.coverage.registered-topic", contractId, json);

        return Map.of(
                "message", "warranty.coverage.registered-topic event sent",
                "contractId", contractId,
                "unitId", unitId,
                "customerId", customerId
        );
    }

    /**
     * Step 2 — simulate defect.reported event from Post-sale
     */
    @PostMapping("/api/test/defect-reported")
    public Map<String, String> simulateDefectReported(@RequestBody(required = false) Map<String, String> body) {
        String defectId = body != null && body.containsKey("defectId")
                ? body.get("defectId") : UUID.randomUUID().toString();
        String contractId = body != null && body.containsKey("contractId")
                ? body.get("contractId") : UUID.randomUUID().toString();
        String unitId = body != null && body.containsKey("unitId")
                ? body.get("unitId") : UUID.randomUUID().toString();
        String customerId = body != null && body.containsKey("customerId")
                ? body.get("customerId") : UUID.randomUUID().toString();
        String defectCategory = body != null && body.containsKey("defectCategory")
                ? body.get("defectCategory") : "ELECTRICAL";
        String description = body != null && body.containsKey("description")
                ? body.get("description") : "Power outlet not working in living room";

        String json = String.format(
                "{\"defectId\":\"%s\",\"contractId\":\"%s\",\"unitId\":\"%s\",\"customerId\":\"%s\",\"defectCategory\":\"%s\",\"description\":\"%s\",\"reportedAt\":\"%s\"}",
                defectId, contractId, unitId, customerId, defectCategory, description, Instant.now());

        kafkaTemplate.send("warranty.defect.reported-topic", defectId, json);

        return Map.of(
                "message", "warranty.defect.reported-topic event sent",
                "defectId", defectId,
                "contractId", contractId,
                "defectCategory", defectCategory
        );
    }
}
