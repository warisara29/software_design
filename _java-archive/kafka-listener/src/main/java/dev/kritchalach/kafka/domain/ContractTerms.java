package dev.kritchalach.kafka.domain;

import jakarta.persistence.Embeddable;
import java.math.BigDecimal;

/**
 * Value Object: ContractTerms
 * เงื่อนไขสัญญา immutable — ไม่ควรแก้ไขหลังลงนาม ต้องสร้างใหม่เสมอ
 */
@Embeddable
public class ContractTerms {

    private BigDecimal totalPrice;
    private BigDecimal depositAmount;
    private String penaltyConditions;

    protected ContractTerms() {}

    public ContractTerms(BigDecimal totalPrice, BigDecimal depositAmount, String penaltyConditions) {
        this.totalPrice = totalPrice;
        this.depositAmount = depositAmount;
        this.penaltyConditions = penaltyConditions;
    }

    public BigDecimal getTotalPrice() { return totalPrice; }
    public BigDecimal getDepositAmount() { return depositAmount; }
    public String getPenaltyConditions() { return penaltyConditions; }
}
