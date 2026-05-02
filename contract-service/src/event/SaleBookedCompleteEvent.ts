import { v5 as uuidv5 } from 'uuid';

/**
 * Inbound event from Sales team — published when booking is confirmed.
 * Sales' schema uses string codes (CUST-001, PROP-001) instead of UUIDs.
 *
 * Topic: sale.booked.complete (owned by Sales & Booking team)
 */
export interface SaleBookedCompleteEvent {
  ProjectName: string;
  'Reservation ID': string;
  ContractID: string;
  PropertyID: string;        // e.g. "PROP-001"
  Location: string;
  'Customer ID': string;     // e.g. "CUST-001"
  'Area unit/layout': string;
  'room type': string;
  'Price per unit': number;
  'room number': string;
  StatusKYC: 'PASSED' | 'PENDING' | 'REJECTED';
  PaymentSecondStatus: 'PENDING' | 'CONFIRMED' | 'FAILED';
}

/**
 * Internal event Legal already knows how to handle.
 * Maps Sales' string codes to deterministic UUIDs (via uuidv5) so they
 * fit Legal's existing UUID-based DB schema without changing migrations.
 */
export interface BookingConfirmedEvent {
  bookingId: string;   // UUID
  unitId: string;      // UUID
  customerId: string;  // UUID
}

// Stable namespace for Real-Estate IDs — same input always maps to same UUID
const RE_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

export function mapSaleBookedToBookingConfirmed(
  sales: SaleBookedCompleteEvent,
): BookingConfirmedEvent {
  return {
    bookingId: uuidv5(sales.ContractID || sales['Reservation ID'], RE_NAMESPACE),
    unitId: uuidv5(sales.PropertyID, RE_NAMESPACE),
    customerId: uuidv5(sales['Customer ID'], RE_NAMESPACE),
  };
}

/**
 * Type guard — accepts either Sales' Kafka schema or our older REST inbound
 * schema (BookingConfirmedEvent with UUIDs directly).
 */
export function isSaleBookedCompleteEvent(payload: unknown): payload is SaleBookedCompleteEvent {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'PropertyID' in payload &&
    'Customer ID' in payload
  );
}
