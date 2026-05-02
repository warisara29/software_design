import { v5 as uuidv5 } from 'uuid';

/**
 * Sales' actual sale.booked.complete schema (verified 2026-05-02):
 *
 *   {
 *     "bookingId":     "BK-0002",
 *     "reservationId": "RS-0004",
 *     "contractId":    "CONTRACT-001",
 *     "propertyId":    "PROP-001",
 *     "customerId":    "CUST-001",
 *     "statusKyc":     "APPROVED" | "PENDING" | "REJECTED",
 *     "status":        "BOOKED" | "RESERVED" | "SOLD" | ...,
 *     "timestamp":     "<ISO8601>"
 *   }
 */
export interface SaleBookedCompleteEvent {
  bookingId: string;
  reservationId?: string;
  contractId?: string;
  propertyId: string;
  customerId: string;
  statusKyc?: string;   // APPROVED | PENDING | REJECTED
  status?: string;      // BOOKED | RESERVED | SOLD | ...
  timestamp?: string;
}

export interface BookingConfirmedEvent {
  bookingId: string;   // UUID
  unitId: string;      // UUID
  customerId: string;  // UUID
}

const RE_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

export function mapSaleBookedToBookingConfirmed(
  sales: SaleBookedCompleteEvent,
): BookingConfirmedEvent {
  return {
    bookingId: uuidv5(sales.bookingId, RE_NAMESPACE),
    unitId: uuidv5(sales.propertyId, RE_NAMESPACE),
    customerId: uuidv5(sales.customerId, RE_NAMESPACE),
  };
}

/** Detect Sales' actual schema — has bookingId + propertyId + customerId. */
export function isSaleBookedCompleteEvent(payload: unknown): payload is SaleBookedCompleteEvent {
  if (typeof payload !== 'object' || payload === null) return false;
  const p = payload as Record<string, unknown>;
  return (
    typeof p.bookingId === 'string' &&
    typeof p.propertyId === 'string' &&
    typeof p.customerId === 'string'
  );
}

/** KYC must be APPROVED (Sales' value) before Legal drafts willing contract. */
export function isKycApproved(sales: SaleBookedCompleteEvent): boolean {
  return (sales.statusKyc ?? '').toUpperCase() === 'APPROVED';
}

/** Booking must be SOLD before Legal drafts the final purchase contract. */
export function isReadyForPurchaseContract(sales: SaleBookedCompleteEvent): boolean {
  return (sales.status ?? '').toUpperCase() === 'SOLD';
}
