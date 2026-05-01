import { Router } from 'express';
import {
  WarrantyVerificationService,
  type WarrantyRegisteredEvent,
  type DefectReportedEvent,
} from '../service/WarrantyVerificationService.js';
import { WarrantyVerifiedProducer } from '../kafka/producers.js';

export const inboundRouter = Router();

/**
 * REST fallback for warranty.coverage.registered-topic.
 *
 *   POST /api/inbound/warranty-registered
 *   Body: WarrantyRegisteredEvent
 *
 * No downstream Kafka publish (Legal only persists the warranty).
 */
inboundRouter.post('/api/inbound/warranty-registered', async (req, res) => {
  const event = req.body as Partial<WarrantyRegisteredEvent>;
  if (!event.contractId || !event.unitId || !event.customerId || !event.startsAt || !event.endsAt) {
    res.status(400).json({
      error: 'contractId, unitId, customerId, startsAt, endsAt are required',
    });
    return;
  }

  try {
    const w = await WarrantyVerificationService.registerWarranty(event as WarrantyRegisteredEvent);
    res.json({
      ok: true,
      warranty: {
        warrantyId: w.warrantyId,
        contractId: w.contractId,
        unitId: w.unitId,
        customerId: w.customerId,
        coverageStartsAt: w.coveragePeriod.startsAt,
        coverageEndsAt: w.coveragePeriod.endsAt,
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

/**
 * REST fallback for warranty.defect.reported-topic.
 *
 *   POST /api/inbound/defect-reported
 *   Body: DefectReportedEvent
 *
 * Persists claim + best-effort publishes warranty.coverage.verified-topic.
 */
inboundRouter.post('/api/inbound/defect-reported', async (req, res) => {
  const event = req.body as Partial<DefectReportedEvent>;
  if (!event.defectId || !event.contractId || !event.unitId || !event.customerId || !event.defectCategory) {
    res.status(400).json({
      error: 'defectId, contractId, unitId, customerId, defectCategory are required',
    });
    return;
  }

  try {
    const out = await WarrantyVerificationService.verifyDefect({
      defectId: event.defectId,
      contractId: event.contractId,
      unitId: event.unitId,
      customerId: event.customerId,
      defectCategory: event.defectCategory,
      description: event.description ?? '',
      reportedAt: event.reportedAt,
    });

    const publishWarnings: string[] = [];
    await WarrantyVerifiedProducer.send(out).catch((e) =>
      publishWarnings.push(`warranty.coverage.verified: ${(e as Error).message}`),
    );

    res.json({
      ok: true,
      verification: out,
      kafkaPublishWarnings: publishWarnings.length ? publishWarnings : undefined,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});
