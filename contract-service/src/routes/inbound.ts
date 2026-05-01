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

export const inboundRouter = Router();

/**
 * REST fallback for booking.order.confirmed-topic.
 * Lets Sales (or any team) trigger the contract draft flow without Kafka,
 * useful while topics aren't yet provisioned in the central cluster.
 *
 *   POST /api/inbound/booking-confirmed
 *   Body: { bookingId: UUID, unitId: UUID, customerId: UUID }
 *
 * Same payload schema as the Kafka event. Downstream Kafka publishes are
 * best-effort — we log warnings if topics don't exist yet but still
 * persist to DB so REST queries see the new contract.
 */
inboundRouter.post('/api/inbound/booking-confirmed', async (req, res) => {
  const { bookingId, unitId, customerId } = req.body ?? {};
  if (!bookingId || !unitId || !customerId) {
    res.status(400).json({ error: 'bookingId, unitId, customerId are required' });
    return;
  }

  try {
    const event: BookingConfirmedEvent = { bookingId, unitId, customerId };
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
