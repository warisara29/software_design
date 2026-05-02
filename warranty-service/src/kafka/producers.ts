import { config } from '../config.js';
import { producer } from './client.js';
import type { WarrantyVerifiedEvent } from '../service/WarrantyVerificationService.js';

export const WarrantyVerifiedProducer = {
  async send(event: WarrantyVerifiedEvent): Promise<void> {
    const topic = config.topics.warrantyVerified;
    await producer.send({
      topic,
      messages: [{ key: event.claimId, value: JSON.stringify(event) }],
    });
    console.log(`[Producer] → ${topic}: ${JSON.stringify(event)}`);
  },
};
