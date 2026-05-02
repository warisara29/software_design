import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { producer } from './client.js';
import type { WarrantyVerifiedEvent } from '../service/WarrantyVerificationService.js';

/**
 * Wrap payload in CloudEvents-like envelope to match Post-sale's contract:
 *   { eventId, eventType, timestamp, data, metadata }
 *
 * Post-sale expects this envelope shape on the events they subscribe to.
 */
function wrapEnvelope<T>(eventType: string, data: T): {
  eventId: string;
  eventType: string;
  timestamp: string;
  data: T;
  metadata: { source: string; version: string };
} {
  return {
    eventId: uuidv4(),
    eventType,
    timestamp: new Date().toISOString(),
    data,
    metadata: { source: 'legal-warranty-service', version: '1.0' },
  };
}

export const WarrantyVerifiedProducer = {
  async send(event: WarrantyVerifiedEvent): Promise<void> {
    const topic = config.topics.warrantyVerified;
    const envelope = wrapEnvelope(topic, event);
    await producer.send({
      topic,
      messages: [{ key: event.claimId, value: JSON.stringify(envelope) }],
    });
    console.log(`\n[Producer] → ${topic}\n${JSON.stringify(envelope, null, 2)}`);
  },
};
