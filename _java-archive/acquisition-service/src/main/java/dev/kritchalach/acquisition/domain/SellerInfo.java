package dev.kritchalach.acquisition.domain;

import jakarta.persistence.Embeddable;
import java.util.UUID;

/**
 * Value Object: SellerInfo
 * ข้อมูลผู้ขาย (เจ้าของเดิม) ของ property ที่จะซื้อ
 */
@Embeddable
public class SellerInfo {

    private UUID sellerId;
    private String sellerName;
    private String contactInfo;

    protected SellerInfo() {}

    public SellerInfo(UUID sellerId, String sellerName, String contactInfo) {
        this.sellerId = sellerId;
        this.sellerName = sellerName;
        this.contactInfo = contactInfo;
    }

    public UUID getSellerId() { return sellerId; }
    public String getSellerName() { return sellerName; }
    public String getContactInfo() { return contactInfo; }
}
