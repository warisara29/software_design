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
 * REST fallback for ceo.property.survey.completed.
 *
 *   POST /api/inbound/property-surveyed
 *   Body: PropertySurveyedEvent
 *
 * Calls AcquisitionService.receiveSurvey() then best-effort publishes
 * property.inspected + acquisition.approval.requested.
 */
inboundRouter.post('/api/inbound/property-surveyed', async (req, res) => {
  const event = req.body as Partial<PropertySurveyedEvent>;
  if (!event.propertyId) {
    res.status(400).json({ error: 'propertyId is required' });
    return;
  }
  // Pass through the rich event as-is — receiveSurvey handles missing fields
  const full: PropertySurveyedEvent = event as PropertySurveyedEvent;

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
 * REST fallback for acquisition.approval.granted.
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
