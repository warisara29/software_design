import { config } from '../config.js';
import { propertyInspectionConsumer } from './client.js';
import { PropertyInspectionService } from '../service/PropertyInspectionService.js';
import { PropertyLeaseInspectedProducer } from './PropertyLeaseInspectedProducer.js';
import { prettyJson } from './log.js';

const TRIGGER_TOPIC = config.topics.willingContractDrafted;

/**
 * Property + Lease Inspection — bounded context (Task 2 microservice piece)
 *
 *   in:  willing.contract.drafted (subscribe)
 *   out: property.lease.inspected (publish)
 *
 * Listens for "willing-to-buy contract drafted" events; once we know
 * the contract+unit, Legal performs the inspection and publishes the
 * result for downstream subscribers (CEO, audit).
 *
 * The consumer lives in its own consumer-group so it processes the
 * willing.contract.drafted topic independently of any other handler
 * — exactly matching the "1 event = 1 microservice piece" guidance.
 */
export async function startPropertyLeaseInspectionConsumer(): Promise<void> {
  try {
    await propertyInspectionConsumer.subscribe({
      topic: TRIGGER_TOPIC,
      fromBeginning: false,
    });
  } catch (err) {
    console.warn(
      `[Kafka:PropertyInspection] subscribe failed — topic may not exist yet. Skipping.`,
      (err as Error).message,
    );
    return;
  }

  await propertyInspectionConsumer.run({
    eachMessage: async ({ topic, message }) => {
      const raw = message.value?.toString() ?? '';
      console.log(`\n[Consumer:PropertyInspection] ← ${topic}\n${prettyJson(raw)}`);
      try {
        if (topic !== TRIGGER_TOPIC) return;
        const parsed = JSON.parse(raw);
        if (typeof parsed?.contractId !== 'string' || typeof parsed?.unitId !== 'string') {
          console.warn(
            `[PropertyInspection] willing.contract.drafted missing contractId/unitId — skipped`,
          );
          return;
        }

        const out = await PropertyInspectionService.inspectProperty({
          contractId: parsed.contractId,
          unitId: parsed.unitId,
        });

        await PropertyLeaseInspectedProducer.send(out);
        console.log(
          `[Flow 2] ✅ DONE publish property.lease.inspected — inspectionId=${out.inspectionId}`,
        );
      } catch (err) {
        console.error(`[Consumer:PropertyInspection] failed:`, err);
      }
    },
  });
}
