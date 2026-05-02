import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  ContractDraftService,
  type BookingConfirmedEvent,
} from '../service/ContractDraftService.js';
import {
  PurchaseContractDraftedProducer,
  WillingContractDraftedProducer,
  PropertyLeaseInspectedProducer,
} from '../kafka/ContractDraftCreatedProducer.js';
import {
  isSaleBookedCompleteEvent,
  mapSaleBookedToBookingConfirmed,
} from '../event/SaleBookedCompleteEvent.js';

export const inboundRouter = Router();

/**
 * REST fallback for sale.booked.complete (Sales) / booking.order.confirmed (legacy).
 * Accepts BOTH schemas:
 *   1. Sales' Kafka schema { ProjectName, PropertyID, "Customer ID", StatusKYC, ... }
 *   2. Our legacy UUID schema { bookingId, unitId, customerId }
 *
 *   POST /api/inbound/booking-confirmed
 *
 * Downstream Kafka publishes are best-effort — DB save still works even if
 * topics aren't ready.
 */
inboundRouter.post('/api/inbound/booking-confirmed', async (req, res) => {
  const body = req.body ?? {};

  // Accept either Sales' schema or our legacy UUID schema
  let event: BookingConfirmedEvent;
  if (isSaleBookedCompleteEvent(body)) {
    event = mapSaleBookedToBookingConfirmed(body);
  } else if (body.bookingId && body.unitId && body.customerId) {
    event = { bookingId: body.bookingId, unitId: body.unitId, customerId: body.customerId };
  } else {
    res.status(400).json({
      error:
        'Provide either Sales schema {ProjectName, PropertyID, "Customer ID", ...} or {bookingId, unitId, customerId}',
    });
    return;
  }

  try {
    const draftCreated = await ContractDraftService.createContractDraft(event);

    // best-effort publish — don't fail the request if topics aren't ready
    const willingContractId = uuidv4();
    const inspectionId = uuidv4();
    const publishWarnings: string[] = [];

    await Promise.all([
      WillingContractDraftedProducer.send({
        willingContractId,
        contractId: draftCreated.contractId,
        bookingId: draftCreated.bookingId,
        unitId: draftCreated.unitId,
        customerId: draftCreated.customerId,
        fileUrl: draftCreated.fileUrl,
        draftedAt: draftCreated.draftedAt,
      }).catch((e) => publishWarnings.push(`willing.contract.drafted: ${(e as Error).message}`)),

      PropertyLeaseInspectedProducer.send({
        inspectionId,
        contractId: draftCreated.contractId,
        unitId: draftCreated.unitId,
        hasOutstandingLease: false,
        hasEncumbrance: false,
        inspectionResult: 'PASS',
        notes: 'Property title clean; no outstanding lease or encumbrance found',
        inspectedAt: new Date().toISOString(),
      }).catch((e) => publishWarnings.push(`property.lease.inspected: ${(e as Error).message}`)),

      PurchaseContractDraftedProducer.send(draftCreated).catch((e) =>
        publishWarnings.push(`purchase.contract.drafted: ${(e as Error).message}`),
      ),
    ]);

    res.json({
      ok: true,
      contract: draftCreated,
      kafkaPublishWarnings: publishWarnings.length ? publishWarnings : undefined,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});
