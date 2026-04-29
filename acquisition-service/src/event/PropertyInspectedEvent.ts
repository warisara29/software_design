/**
 * Domain Event: PropertyInspected
 * Flow 1 event 2 — Legal+Inventory ตรวจสอบ property เสร็จแล้ว
 * CEO subscribe เพื่อพิจารณาอนุมัติเข้าซื้อในขั้นถัดไป
 */
export interface PropertyInspectedEvent {
  acquisitionId: string;
  surveyId: string;
  propertyId: string;
  inspectedBy: string;
  inspectionResult: 'PASS' | 'FAIL';
  inspectionNotes: string;
  inspectedAt: string;
}
