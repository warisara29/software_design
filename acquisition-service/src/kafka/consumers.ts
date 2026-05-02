import { config } from '../config.js';
import { consumer } from './client.js';
import {
  AcquisitionService,
  type AcquisitionApprovedEvent,
  type PropertySurveyedEvent,
} from '../service/AcquisitionService.js';
import {
  AcquisitionApprovalRequestedProducer,
  AcquisitionContractDraftedProducer,
  PropertyInspectedProducer,
} from './producers.js';

export async function startConsumers(): Promise<void> {
  try {
    await consumer.subscribe({ topic: config.topics.propertySurveyed, fromBeginning: false });
    await consumer.subscribe({ topic: config.topics.acquisitionApproved, fromBeginning: false });
  } catch (err) {
    console.warn(
      `[Kafka] Consumer subscription failed — topics may not exist yet. Service keeps running, REST API works. Create topics + redeploy for Kafka flow.`,
      (err as Error).message,
    );
    return;
  }

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const raw = message.value?.toString() ?? '';
      console.log(`[Consumer] ← ${topic}: ${raw}`);
      try {
        if (topic === config.topics.propertySurveyed) {
          const event = JSON.parse(raw) as PropertySurveyedEvent;
          const out = await AcquisitionService.receiveSurvey(event);

          // Flow 1 event 2 — Legal+Inventory ตรวจสอบ property แล้ว → CEO รับรู้
          console.log(
            `[Flow 1] ✅ consume ${config.topics.propertySurveyed} → next: publish ${config.topics.propertyInspected} + ${config.topics.acquisitionApprovalRequested} — acquisitionId=${out.acquisitionId}`,
          );

          await PropertyInspectedProducer.send({
            acquisitionId: out.acquisitionId,
            surveyId: out.surveyId,
            propertyId: out.propertyId,
            inspectedBy: 'legal+inventory',
            inspectionResult: 'PASS',
            inspectionNotes: 'Property documentation reviewed; no legal blockers found',
            inspectedAt: new Date().toISOString(),
          });
          console.log(
            `[Flow 1] ✅ DONE publish ${config.topics.propertyInspected} (CEO subscribes) — acquisitionId=${out.acquisitionId}`,
          );

          await AcquisitionApprovalRequestedProducer.send(out);
          console.log(
            `[Flow 1] ✅ DONE publish ${config.topics.acquisitionApprovalRequested} (CEO subscribes) — acquisitionId=${out.acquisitionId}`,
          );
        } else if (topic === config.topics.acquisitionApproved) {
          const event = JSON.parse(raw) as AcquisitionApprovedEvent;
          console.log(
            `[Flow 1] ✅ consume ${config.topics.acquisitionApproved} — acquisitionId=${event.acquisitionId}`,
          );

          const out = await AcquisitionService.draftContractAfterApproval(event);
          await AcquisitionContractDraftedProducer.send(out);
          console.log(
            `[Flow 1] ✅ DONE publish ${config.topics.acquisitionContractDrafted} (Inventory subscribes) — acquisitionId=${out.acquisitionId}, willingContractId=${out.willingContractId}`,
          );
        }
      } catch (err) {
        console.error(`[Consumer] failed to process ${topic}:`, err);
      }
    },
  });
}
