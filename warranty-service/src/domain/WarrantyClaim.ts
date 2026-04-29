import { v4 as uuidv4 } from 'uuid';
import { CoverageStatus } from './CoverageStatus.js';
import type { DefectCategory } from './DefectCategory.js';

/**
 * Entity: WarrantyClaim
 * 1 defect = 1 claim ภายใต้ Warranty Aggregate
 */
export class WarrantyClaim {
  claimId: string;
  defectId: string;
  defectCategory: DefectCategory;
  description: string;
  reportedAt: string;
  coverageStatus: CoverageStatus;
  coverageReason?: string;
  verifiedAt?: string;

  constructor(
    claimId: string,
    defectId: string,
    defectCategory: DefectCategory,
    description: string,
    reportedAt: string,
    coverageStatus: CoverageStatus,
    coverageReason?: string,
    verifiedAt?: string,
  ) {
    this.claimId = claimId;
    this.defectId = defectId;
    this.defectCategory = defectCategory;
    this.description = description;
    this.reportedAt = reportedAt;
    this.coverageStatus = coverageStatus;
    this.coverageReason = coverageReason;
    this.verifiedAt = verifiedAt;
  }

  static create(
    defectId: string,
    defectCategory: DefectCategory,
    description: string,
    reportedAt: string,
  ): WarrantyClaim {
    return new WarrantyClaim(uuidv4(), defectId, defectCategory, description, reportedAt, CoverageStatus.PENDING);
  }

  markCovered(reason: string): void {
    this.coverageStatus = CoverageStatus.COVERED;
    this.coverageReason = reason;
    this.verifiedAt = new Date().toISOString();
  }

  markRejected(reason: string): void {
    this.coverageStatus = CoverageStatus.REJECTED;
    this.coverageReason = reason;
    this.verifiedAt = new Date().toISOString();
  }
}
