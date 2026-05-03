/**
 * Value Object: InspectionResult
 * ผลการตรวจ property + lease — immutable
 *
 * Invariants:
 *  - PASS  → no encumbrance, no outstanding lease
 *  - FAIL  → must carry a reason
 */
export type InspectionStatus = 'PASS' | 'FAIL';

export class InspectionResult {
  constructor(
    public readonly status: InspectionStatus,
    public readonly hasOutstandingLease: boolean,
    public readonly hasEncumbrance: boolean,
    public readonly notes: string,
  ) {
    if (status === 'FAIL' && (!notes || notes.trim().length === 0)) {
      throw new Error('FAIL inspection requires a notes/reason string');
    }
    if (status === 'PASS' && (hasOutstandingLease || hasEncumbrance)) {
      throw new Error('PASS inspection cannot have outstanding lease or encumbrance');
    }
  }

  static pass(notes = 'Property title clean; no outstanding lease or encumbrance found'): InspectionResult {
    return new InspectionResult('PASS', false, false, notes);
  }

  static fail(notes: string, hasOutstandingLease = false, hasEncumbrance = false): InspectionResult {
    return new InspectionResult('FAIL', hasOutstandingLease, hasEncumbrance, notes);
  }
}
