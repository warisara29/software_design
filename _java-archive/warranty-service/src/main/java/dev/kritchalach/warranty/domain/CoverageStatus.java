package dev.kritchalach.warranty.domain;

/**
 * Value Object: CoverageStatus
 * ผลการตรวจสอบความคุ้มครอง warranty
 */
public enum CoverageStatus {
    PENDING,    // เพิ่งสร้าง claim ยังไม่ได้ตรวจ
    COVERED,    // อยู่ใน scope + ยังไม่หมดอายุ → คุ้มครอง
    REJECTED    // หมดอายุ หรือ defect type ไม่อยู่ใน scope
}
