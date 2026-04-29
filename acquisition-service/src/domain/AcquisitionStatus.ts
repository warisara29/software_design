/**
 * Value Object: AcquisitionStatus
 * State machine ของการเข้าซื้อ property
 */
export const AcquisitionStatus = {
  SURVEYED: 'SURVEYED',
  APPROVAL_REQUESTED: 'APPROVAL_REQUESTED',
  APPROVED: 'APPROVED',
  CONTRACT_DRAFTED: 'CONTRACT_DRAFTED',
  REJECTED: 'REJECTED',
} as const;

export type AcquisitionStatus = (typeof AcquisitionStatus)[keyof typeof AcquisitionStatus];
