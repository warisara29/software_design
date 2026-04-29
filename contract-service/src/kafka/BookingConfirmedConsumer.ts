import { config } from '../config.js';
import { consumer } from './client.js';
import { ContractDraftService, type BookingConfirmedEvent } from '../service/ContractDraftService.js';
import { ContractDraftCreatedProducer } from './ContractDraftCreatedProducer.js';

const TOPIC = config.topics.bookingConfirmed;

/**
 * Flow: booking.order.confirmed → CreateContractDraft → contract.draft.created
 */
export async function startBookingConfirmedConsumer(): Promise<void> {
  await consumer.subscribe({ topic: TOPIC, fromBeginning: false });
  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const raw = message.value?.toString() ?? '';
      console.log(`[Consumer] ← ${topic}: ${raw}`);
      try {
        const event = JSON.parse(raw) as BookingConfirmedEvent;
        const draftCreated = await ContractDraftService.createContractDraft(event);
        await ContractDraftCreatedProducer.send(draftCreated);
        console.log(`[Flow] booking.order.confirmed → ContractDraftCreated for bookingId=${event.bookingId}`);
      } catch (err) {
        console.error(`[Consumer] failed to process ${topic}:`, err);
      }
    },
  });
}
