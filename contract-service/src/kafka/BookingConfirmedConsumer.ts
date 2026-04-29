import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { consumer } from './client.js';
import { ContractDraftService, type BookingConfirmedEvent } from '../service/ContractDraftService.js';
import {
  PurchaseContractDraftedProducer,
  WillingContractDraftedProducer,
  PropertyLeaseInspectedProducer,
} from './ContractDraftCreatedProducer.js';

const TOPIC = config.topics.bookingConfirmed;

/**
 * Flow: booking.order.confirmed → CreateContractDraft → contract.draft.created
 */
export async function startBookingConfirmedConsumer(): Promise<void> {
  try {
    await consumer.subscribe({ topic: TOPIC, fromBeginning: false });
    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        const raw = message.value?.toString() ?? '';
        console.log(`[Consumer] ← ${topic}: ${raw}`);
        try {
          const event = JSON.parse(raw) as BookingConfirmedEvent;
          const draftCreated = await ContractDraftService.createContractDraft(event);

          // Flow 2 event 6 — willing-to-buy contract drafted
          await WillingContractDraftedProducer.send({
            willingContractId: uuidv4(),
            contractId: draftCreated.contractId,
            bookingId: draftCreated.bookingId,
            unitId: draftCreated.unitId,
            customerId: draftCreated.customerId,
            fileUrl: draftCreated.fileUrl,
            draftedAt: draftCreated.draftedAt,
          });

          // Flow 2 event 8 — property + lease inspected
          await PropertyLeaseInspectedProducer.send({
            inspectionId: uuidv4(),
            contractId: draftCreated.contractId,
            unitId: draftCreated.unitId,
            hasOutstandingLease: false,
            hasEncumbrance: false,
            inspectionResult: 'PASS',
            notes: 'Property title clean; no outstanding lease or encumbrance found',
            inspectedAt: new Date().toISOString(),
          });

          // Flow 2 event 9 — purchase contract drafted (สัญญาซื้อขายจริง)
          await PurchaseContractDraftedProducer.send(draftCreated);

          console.log(`[Flow 2] booking.order.confirmed → willing → lease.inspected → purchase.contract for bookingId=${event.bookingId}`);
        } catch (err) {
          console.error(`[Consumer] failed to process ${topic}:`, err);
        }
      },
    });
  } catch (err) {
    console.warn(
      `[Kafka] Consumer subscription failed for "${TOPIC}" — topic may not exist yet. Service will keep running, REST API still works. Create the topic + redeploy to enable Kafka flow.`,
      (err as Error).message,
    );
  }
}
