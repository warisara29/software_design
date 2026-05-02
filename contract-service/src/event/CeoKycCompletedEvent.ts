/**
 * Inbound event from CEO team — published when KYC is completed for a customer.
 *
 * Topic (guessed — confirm with CEO team): ceo.kyc.completed
 *
 * Schema is intentionally permissive — accept whatever field-naming
 * convention CEO uses. We extract only what we need:
 *   - some way to identify the contract / customer
 *   - status (APPROVED/REJECTED) so we know whether to proceed
 */
export interface CeoKycCompletedEvent {
  // ID fields — accept multiple naming conventions
  contractId?: string;
  customerId?: string;
  // Status field — CEO might use any of these names/values
  kycStatus?: string;     // "APPROVED" | "REJECTED" | "PASSED" | ...
  status?: string;        // fallback name
  result?: string;        // fallback name
  verifiedAt?: string;
}

/** Detect a CEO KYC completion event — needs at least an ID + a status. */
export function isCeoKycCompletedEvent(payload: unknown): payload is CeoKycCompletedEvent {
  if (typeof payload !== 'object' || payload === null) return false;
  const p = payload as Record<string, unknown>;
  const hasId =
    typeof p.contractId === 'string' ||
    typeof p.customerId === 'string';
  const hasStatus =
    typeof p.kycStatus === 'string' ||
    typeof p.status === 'string' ||
    typeof p.result === 'string';
  return hasId && hasStatus;
}

/** Has KYC actually approved? Accepts multiple wording conventions. */
export function isKycApproved(event: CeoKycCompletedEvent): boolean {
  const v = (event.kycStatus ?? event.status ?? event.result ?? '').toUpperCase();
  return v === 'APPROVED' || v === 'PASSED' || v === 'OK';
}
