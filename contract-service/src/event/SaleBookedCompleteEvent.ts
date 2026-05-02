import { v5 as uuidv5 } from 'uuid';

/**
 * Sales' actual sale.booked.complete schema — accepts BOTH naming conventions:
 *
 *   PascalCase / spaces (full booking detail):
 *     {
 *       "ProjectName":         "The Riverside Condo",
 *       "Reservation ID":      "RSV-0123",
 *       "ContractID":          "CT-0123",
 *       "PropertyID":          "PROP-001",
 *       "Location":            "123 Sukhumvit Rd, Bangkok",
 *       "Customer ID":         "CUST-001",
 *       "Area unit/layout":    "1-bedroom 35sqm",
 *       "room type":           "Standard",
 *       "Price per unit":      5500000,
 *       "room number":         "12-01",
 *       "StatusKYC":           "PASSED",
 *       "PaymentSecondStatus": "PENDING"
 *     }
 *
 *   camelCase (compact):
 *     {
 *       "bookingId": "BK-0015",
 *       "reservationId": "RS-0004",
 *       "contractId": "CONTRACT-001",
 *       "propertyId": "PROP-001",
 *       "customerId": "CUST-001",
 *       "statusKyc": "APPROVED",
 *       "status": "BOOKED",
 *       "timestamp": "<ISO8601>"
 *     }
 */
export interface SaleBookedCompleteEvent {
  // IDs (multiple naming styles)
  bookingId?: string;
  reservationId?: string;
  contractId?: string;
  propertyId?: string;
  customerId?: string;
  // Booking detail (PascalCase variant)
  projectName?: string;
  location?: string;
  areaUnit?: string;
  roomType?: string;
  pricePerUnit?: number;
  roomNumber?: string;
  // Status fields
  statusKyc?: string;
  status?: string;
  paymentSecondStatus?: string;
  timestamp?: string;
}

export interface BookingConfirmedEvent {
  bookingId: string;   // UUID
  unitId: string;      // UUID
  customerId: string;  // UUID
  // Optional booking metadata captured from Sales
  projectName?: string;
  location?: string;
  areaUnit?: string;
  roomType?: string;
  roomNumber?: string;
  pricePerUnit?: number;
  statusKyc?: string;
  paymentSecondStatus?: string;
}

const RE_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

function pickString(p: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = p[k];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return undefined;
}

function pickNumber(p: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = p[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.length > 0 && Number.isFinite(Number(v))) return Number(v);
  }
  return undefined;
}

/** Normalize Sales' raw event into our SaleBookedCompleteEvent. */
export function normalizeSalesEvent(payload: unknown): SaleBookedCompleteEvent {
  const p = (typeof payload === 'object' && payload !== null ? payload : {}) as Record<string, unknown>;
  return {
    bookingId: pickString(p, 'bookingId', 'BookingID', 'Booking ID'),
    reservationId: pickString(p, 'reservationId', 'Reservation ID', 'ReservationID'),
    contractId: pickString(p, 'contractId', 'ContractID', 'Contract ID'),
    propertyId: pickString(p, 'propertyId', 'PropertyID', 'Property ID'),
    customerId: pickString(p, 'customerId', 'Customer ID', 'CustomerID'),
    projectName: pickString(p, 'projectName', 'ProjectName', 'Project Name'),
    location: pickString(p, 'location', 'Location'),
    areaUnit: pickString(p, 'areaUnit', 'Area unit/layout', 'AreaUnit'),
    roomType: pickString(p, 'roomType', 'room type', 'RoomType'),
    pricePerUnit: pickNumber(p, 'pricePerUnit', 'Price per unit', 'PricePerUnit'),
    roomNumber: pickString(p, 'roomNumber', 'room number', 'RoomNumber'),
    statusKyc: pickString(p, 'statusKyc', 'StatusKYC', 'KYC'),
    status: pickString(p, 'status', 'Status'),
    paymentSecondStatus: pickString(p, 'paymentSecondStatus', 'PaymentSecondStatus'),
    timestamp: pickString(p, 'timestamp', 'Timestamp'),
  };
}

export function mapSaleBookedToBookingConfirmed(
  sales: SaleBookedCompleteEvent,
): BookingConfirmedEvent {
  const propertyId = sales.propertyId ?? '';
  const customerId = sales.customerId ?? '';
  const bookingId = sales.bookingId ?? sales.reservationId ?? sales.contractId ?? '';
  return {
    bookingId: uuidv5(bookingId, RE_NAMESPACE),
    unitId: uuidv5(propertyId, RE_NAMESPACE),
    customerId: uuidv5(customerId, RE_NAMESPACE),
    projectName: sales.projectName,
    location: sales.location,
    areaUnit: sales.areaUnit,
    roomType: sales.roomType,
    roomNumber: sales.roomNumber,
    pricePerUnit: sales.pricePerUnit,
    statusKyc: sales.statusKyc,
    paymentSecondStatus: sales.paymentSecondStatus,
  };
}

/** Detect Sales' event (any of the supported naming variants). */
export function isSaleBookedCompleteEvent(payload: unknown): boolean {
  const n = normalizeSalesEvent(payload);
  // Need at minimum: an ID for property + customer
  return Boolean(n.propertyId && n.customerId);
}

/** KYC must be APPROVED (Sales' value) before Legal drafts willing contract. */
export function isKycApproved(sales: SaleBookedCompleteEvent): boolean {
  const v = (sales.statusKyc ?? '').toUpperCase();
  return v === 'APPROVED' || v === 'PASSED';
}

/** Booking must be SOLD before Legal drafts the final purchase contract. */
export function isReadyForPurchaseContract(sales: SaleBookedCompleteEvent): boolean {
  return (sales.status ?? '').toUpperCase() === 'SOLD';
}
