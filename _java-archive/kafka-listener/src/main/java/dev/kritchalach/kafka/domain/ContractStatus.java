package dev.kritchalach.kafka.domain;

/**
 * Value Object: ContractStatus
 * สถานะของสัญญา ไม่มี identity ของตัวเอง กำหนดครั้งเดียว
 */
public enum ContractStatus {
    DRAFT,
    PENDING_SIGN,
    SIGNED,
    CANCELLED
}
