import { config } from '../config.js';
import { consumer } from './client.js';
import {
  WarrantyVerificationService,
  type DefectReportedEvent,
  type WarrantyRegisteredEvent,
} from '../service/WarrantyVerificationService.js';
import { WarrantyVerifiedProducer } from './producers.js';

interface CaseClosedEvent {
  caseId: string;
  defectId?: string;
  contractId?: string;
  closedBy: string;
  closedAt: string;
  resolution?: string;
}

export async function startConsumers(): Promise<void> {
  try {
    await consumer.subscribe({ topic: config.topics.warrantyRegistered, fromBeginning: false });
    await consumer.subscribe({ topic: config.topics.defectReported, fromBeginning: false });
    await consumer.subscribe({ topic: config.topics.caseClosed, fromBeginning: false });
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
        if (topic === config.topics.warrantyRegistered) {
          const event = JSON.parse(raw) as WarrantyRegisteredEvent;
          await WarrantyVerificationService.registerWarranty(event);
        } else if (topic === config.topics.defectReported) {
          const event = JSON.parse(raw) as DefectReportedEvent;
          const out = await WarrantyVerificationService.verifyDefect(event);
          await WarrantyVerifiedProducer.send(out);
        } else if (topic === config.topics.caseClosed) {
          const event = JSON.parse(raw) as CaseClosedEvent;
          // Flow 4 event 5 — Legal archive case ในระบบ (read-only side effect)
          console.log(
            `[Flow 4] case.closed received: caseId=${event.caseId}, defectId=${event.defectId ?? 'n/a'}, by=${event.closedBy}`,
          );
        }
      } catch (err) {
        console.error(`[Consumer] failed to process ${topic}:`, err);
      }
    },
  });
}
