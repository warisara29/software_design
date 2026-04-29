/**
 * Value Object: ContractStatus
 * สถานะของสัญญา ไม่มี identity ของตัวเอง กำหนดครั้งเดียว
 */
export const ContractStatus = {
  DRAFT: 'DRAFT',
  PENDING_SIGN: 'PENDING_SIGN',
  SIGNED: 'SIGNED',
  CANCELLED: 'CANCELLED',
} as const;

export type ContractStatus = (typeof ContractStatus)[keyof typeof ContractStatus];
