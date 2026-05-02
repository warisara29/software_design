import { config } from '../config.js';
import { consumer } from './client.js';
import {
  WarrantyVerificationService,
  type DefectReportedEvent,
  type WarrantyRegisteredEvent,
} from '../service/WarrantyVerificationService.js';
import { WarrantyVerifiedProducer } from './producers.js';

/**
 * DefectCaseClosed — published by Post-sale on topic
 *   `postsales.caseclosed.completed`  (primary, per Post-sale spec)
 *   `case.closed`                      (legacy — เก็บไว้ subscribe ด้วย)
 *
 * Subscribers: Marketing, Legal
 *
 * Primary schema (Post-sale spec):
 *   { defectId, defectNumber, unitId, status, closedBy, closedAt, resolutionNotes }
 *
 * Legacy schema:
 *   { caseId, defectId?, contractId?, closedBy, closedAt, resolution? }
 *
 * Both keys are optional in this union — handler checks fields it cares about.
 */
interface CaseClosedEvent {
  // Primary (Post-sale spec)
  defectId?: string;
  defectNumber?: string;
  unitId?: string;
  status?: string;          // e.g. RESOLVED | CLOSED
  resolutionNotes?: string;
  // Legacy
  caseId?: string;
  contractId?: string;
  resolution?: string;
  // Common
  closedBy: string;
  closedAt: string;
}

export async function startConsumers(): Promise<void> {
  try {
    await consumer.subscribe({ topic: config.topics.warrantyRegistered, fromBeginning: false });
    await consumer.subscribe({ topic: config.topics.defectReported, fromBeginning: false });
    await consumer.subscribe({ topic: config.topics.caseClosed, fromBeginning: false });
    await consumer.subscribe({ topic: config.topics.caseClosedLegacy, fromBeginning: false });
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
        } else if (
          topic === config.topics.caseClosed ||
          topic === config.topics.caseClosedLegacy
        ) {
          const event = JSON.parse(raw) as CaseClosedEvent;
          // Flow 4 event 5 — Legal archive case ในระบบ (read-only side effect)
          // Handle both primary (postsales.caseclosed.completed) + legacy (case.closed) schemas
          console.log(
            `[Flow 4] ${topic} received: ` +
              `caseId=${event.caseId ?? 'n/a'}, ` +
              `defectId=${event.defectId ?? 'n/a'}, ` +
              `defectNumber=${event.defectNumber ?? 'n/a'}, ` +
              `unitId=${event.unitId ?? 'n/a'}, ` +
              `contractId=${event.contractId ?? 'n/a'}, ` +
              `status=${event.status ?? 'n/a'}, ` +
              `by=${event.closedBy}, ` +
              `notes=${event.resolutionNotes ?? event.resolution ?? 'n/a'}`,
          );
        }
      } catch (err) {
        console.error(`[Consumer] failed to process ${topic}:`, err);
      }
    },
  });
}
