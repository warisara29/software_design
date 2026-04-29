package dev.kritchalach.acquisition.domain;

/**
 * Value Object: AcquisitionStatus
 * สถานะของการเข้าซื้อ property จาก seller โดยทีม Legal
 */
public enum AcquisitionStatus {
    SURVEYED,           // รับ survey data จาก Inventory แล้ว
    APPROVAL_REQUESTED, // ส่งขออนุมัติ CEO
    APPROVED,           // CEO อนุมัติให้ซื้อ
    CONTRACT_DRAFTED,   // ร่าง willing contract เสร็จ
    REJECTED            // CEO ไม่อนุมัติ / กระบวนการล้ม
}
