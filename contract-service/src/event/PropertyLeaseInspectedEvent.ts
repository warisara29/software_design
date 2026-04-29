/**
 * Domain Event: PropertyLeaseInspected
 * Flow 2 event 8 — Legal ตรวจ property + lease + encumbrances ก่อนทำสัญญาขายจริง
 */
export interface PropertyLeaseInspectedEvent {
  inspectionId: string;
  contractId: string;
  unitId: string;
  hasOutstandingLease: boolean;
  hasEncumbrance: boolean;
  inspectionResult: 'PASS' | 'FAIL';
  notes: string;
  inspectedAt: string;
}
