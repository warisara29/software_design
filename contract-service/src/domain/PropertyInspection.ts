import { v4 as uuidv4 } from 'uuid';
import { InspectionResult } from './InspectionResult.js';

/**
 * Aggregate Root: PropertyInspection
 *
 * Represents Legal's inspection of a property + lease title before
 * the purchase contract is drafted. Triggered after the willing-to-buy
 * contract is created (we know which contract/unit to inspect).
 *
 * Invariants enforced inside the aggregate:
 *  - inspectionId is set on construction; no setter
 *  - result is set once via complete(); cannot be changed afterwards
 *  - inspectedAt is locked at completion time
 */
export class PropertyInspection {
  inspectionId!: string;
  contractId!: string;
  unitId!: string;
  inspectedBy!: string;
  result?: InspectionResult;
  inspectedAt?: string;
  createdAt!: string;
  version: number = 0;

  /**
   * Factory: เริ่ม inspection ใหม่
   * Triggered by willing.contract.drafted event.
   */
  static start(input: {
    contractId: string;
    unitId: string;
    inspectedBy: string;
  }): PropertyInspection {
    const i = new PropertyInspection();
    i.inspectionId = uuidv4();
    i.contractId = input.contractId;
    i.unitId = input.unitId;
    i.inspectedBy = input.inspectedBy;
    i.createdAt = new Date().toISOString();
    return i;
  }

  /**
   * Command: CompleteInspection
   * บันทึกผลตรวจ — เกิดได้ครั้งเดียว (immutable หลัง complete)
   */
  complete(result: InspectionResult): void {
    if (this.result) {
      throw new Error(
        `Inspection ${this.inspectionId} already completed at ${this.inspectedAt}`,
      );
    }
    this.result = result;
    this.inspectedAt = new Date().toISOString();
  }
}
