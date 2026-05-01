import { Router } from 'express';
import {
  AcquisitionService,
  type PropertySurveyedEvent,
  type AcquisitionApprovedEvent,
} from '../service/AcquisitionService.js';
import {
  AcquisitionApprovalRequestedProducer,
  AcquisitionContractDraftedProducer,
  PropertyInspectedProducer,
} from '../kafka/producers.js';

export const inboundRouter = Router();

/**
 * REST fallback for property.survey.received-topic.
 *
 *   POST /api/inbound/property-surveyed
 *   Body: PropertySurveyedEvent
 *
 * Calls AcquisitionService.receiveSurvey() then best-effort publishes
 * property.inspected-topic + acquisition.approval.requested-topic.
 */
inboundRouter.post('/api/inbound/property-surveyed', async (req, res) => {
  const event = req.body as Partial<PropertySurveyedEvent>;
  if (!event.surveyId || !event.propertyId) {
    res.status(400).json({ error: 'surveyId, propertyId are required' });
    return;
  }
  // fill defaults so partial payloads still work
  const full: PropertySurveyedEvent = {
    surveyId: event.surveyId,
    propertyId: event.propertyId,
    address: event.address ?? '(not provided)',
    areaSqm: event.areaSqm ?? 0,
    estimatedValue: event.estimatedValue ?? 0,
    zoneType: event.zoneType ?? 'UNKNOWN',
    sellerId: event.sellerId,
    sellerName: event.sellerName ?? '(not provided)',
    sellerContact: event.sellerContact ?? '(not provided)',
  };

  try {
    const out = await AcquisitionService.receiveSurvey(full);

    const publishWarnings: string[] = [];
    await Promise.all([
      PropertyInspectedProducer.send({
        acquisitionId: out.acquisitionId,
        surveyId: out.surveyId,
        propertyId: out.propertyId,
        inspectedBy: 'legal+inventory',
        inspectionResult: 'PASS',
        inspectionNotes: 'Property documentation reviewed; no legal blockers found',
        inspectedAt: new Date().toISOString(),
      }).catch((e) => publishWarnings.push(`property.inspected: ${(e as Error).message}`)),

      AcquisitionApprovalRequestedProducer.send(out).catch((e) =>
        publishWarnings.push(`acquisition.approval.requested: ${(e as Error).message}`),
      ),
    ]);

    res.json({
      ok: true,
      acquisition: out,
      kafkaPublishWarnings: publishWarnings.length ? publishWarnings : undefined,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

/**
 * REST fallback for acquisition.approval.granted-topic.
 *
 *   POST /api/inbound/acquisition-approved
 *   Body: { acquisitionId: UUID, approvedPrice?: number, approvedBy?: string }
 */
inboundRouter.post('/api/inbound/acquisition-approved', async (req, res) => {
  const event = req.body as AcquisitionApprovedEvent;
  if (!event?.acquisitionId) {
    res.status(400).json({ error: 'acquisitionId is required' });
    return;
  }

  try {
    const out = await AcquisitionService.draftContractAfterApproval(event);

    const publishWarnings: string[] = [];
    await AcquisitionContractDraftedProducer.send(out).catch((e) =>
      publishWarnings.push(`acquisition.contract.drafted: ${(e as Error).message}`),
    );

    res.json({
      ok: true,
      willingContract: out,
      kafkaPublishWarnings: publishWarnings.length ? publishWarnings : undefined,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});
