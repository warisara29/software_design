/**
 * Domain Event: WillingContractDrafted
 * Flow 2 event 6 — Legal ร่างสัญญาจะซื้อจะขาย (willing-to-buy)
 * เกิดทันทีหลัง booking confirmed; ก่อน purchase contract จริง
 */
export interface WillingContractDraftedEvent {
  willingContractId: string;
  contractId: string;
  bookingId: string;
  unitId: string;
  customerId: string;
  fileUrl: string;
  draftedAt: string;
  // Booking metadata captured from Sales (passed through to subscribers)
  projectName?: string;
  location?: string;
  areaUnit?: string;
  roomType?: string;
  roomNumber?: string;
  totalPrice?: number;
  statusKyc?: string;
  paymentSecondStatus?: string;
  secondPayment?: number;
  contractKind?: 'WILLING' | 'PURCHASE';
}
