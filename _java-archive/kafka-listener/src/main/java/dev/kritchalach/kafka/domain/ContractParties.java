package dev.kritchalach.kafka.domain;

import jakarta.persistence.Embeddable;
import java.util.UUID;

/**
 * Value Object: ContractParties
 * คู่สัญญาคงที่ตลอดอายุสัญญา ไม่มี identity
 */
@Embeddable
public class ContractParties {

    private UUID buyerId;
    private UUID sellerId;

    protected ContractParties() {}

    public ContractParties(UUID buyerId, UUID sellerId) {
        this.buyerId = buyerId;
        this.sellerId = sellerId;
    }

    public UUID getBuyerId() { return buyerId; }
    public UUID getSellerId() { return sellerId; }
}
