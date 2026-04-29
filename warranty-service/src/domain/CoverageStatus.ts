/**
 * Value Object: CoverageStatus
 */
export const CoverageStatus = {
  PENDING: 'PENDING',
  COVERED: 'COVERED',
  REJECTED: 'REJECTED',
} as const;

export type CoverageStatus = (typeof CoverageStatus)[keyof typeof CoverageStatus];
