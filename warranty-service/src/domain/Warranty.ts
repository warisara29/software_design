import { v4 as uuidv4 } from 'uuid';
import { CoveragePeriod } from './CoveragePeriod.js';
import { CoverageScope } from './CoverageScope.js';
import { CoverageStatus } from './CoverageStatus.js';
import type { DefectCategory } from './DefectCategory.js';
import { WarrantyClaim } from './WarrantyClaim.js';

/**
 * Aggregate Root: Warranty
 * ครอบคลุม lifecycle ของ WarrantyClaim ทั้งหมด ทุก Command ต้องผ่าน Warranty Root
 *
 * Invariant:
 *   - WarrantyClaim COVERED ได้ก็ต่อเมื่อ reportedAt อยู่ใน CoveragePeriod
 *     และ defectCategory อยู่ใน CoverageScope
 *   - 1 defectId มี active claim ได้แค่ 1 รายการ
 */
export class Warranty {
  warrantyId!: string;
  version: number = 0;
  contractId!: string;
  unitId!: string;
  customerId!: string;
  coveragePeriod!: CoveragePeriod;
  coverageScope!: CoverageScope;
  registeredAt!: string;
  claims: WarrantyClaim[] = [];

  static register(input: {
    contractId: string;
    unitId: string;
    customerId: string;
    period: CoveragePeriod;
    scope: CoverageScope;
  }): Warranty {
    const w = new Warranty();
    w.warrantyId = uuidv4();
    w.contractId = input.contractId;
    w.unitId = input.unitId;
    w.customerId = input.customerId;
    w.coveragePeriod = input.period;
    w.coverageScope = input.scope;
    w.registeredAt = new Date().toISOString();
    return w;
  }

  /**
   * Command: VerifyClaim
   * รับ defect report สร้าง claim และตรวจ coverage ในการดำเนินการเดียวกัน
   */
  verifyClaim(input: {
    defectId: string;
    defectCategory: DefectCategory;
    description: string;
    reportedAt: string;
  }): WarrantyClaim {
    // Idempotent — if same defectId already has an active (non-rejected) claim, return it.
    // Kafka may redeliver events; same command + same input must produce same outcome.
    const existing = this.claims.find(
      (c) => c.defectId === input.defectId && c.coverageStatus !== CoverageStatus.REJECTED,
    );
    if (existing) return existing;

    const claim = WarrantyClaim.create(input.defectId, input.defectCategory, input.description, input.reportedAt);

    if (!this.coveragePeriod.covers(input.reportedAt)) {
      claim.markRejected(`Reported outside coverage period (expires at ${this.coveragePeriod.endsAt})`);
    } else if (!this.coverageScope.includes(input.defectCategory)) {
      claim.markRejected(`Defect category ${input.defectCategory} is not in coverage scope`);
    } else {
      claim.markCovered('Within coverage period and scope');
    }

    this.claims.push(claim);
    return claim;
  }
}
