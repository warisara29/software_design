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
          await AcquisitionApprovalRequestedProducer.send(out);
        } else if (topic === config.topics.acquisitionApproved) {
          const event = JSON.parse(raw) as AcquisitionApprovedEvent;
          const out = await AcquisitionService.draftContractAfterApproval(event);
          await AcquisitionContractDraftedProducer.send(out);
        }
      } catch (err) {
        console.error(`[Consumer] failed to process ${topic}:`, err);
      }
    },
  });
}
