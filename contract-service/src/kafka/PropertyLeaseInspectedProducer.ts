import { config } from '../config.js';
import { producer } from './client.js';
import type { PropertyLeaseInspectedEvent } from '../event/PropertyLeaseInspectedEvent.js';

/**
 * Producer for property.lease.inspected — owned by the Property Inspection
 * bounded context (separate file from contract-draft producers per Task 2).
 *
 * Subscribers: CEO (uses inspection result for go/no-go decision)
 */
export const PropertyLeaseInspectedProducer = {
  async send(event: PropertyLeaseInspectedEvent): Promise<void> {
    const topic = config.topics.propertyLeaseInspected;
    await producer.send({
      topic,
      messages: [{ key: event.contractId, value: JSON.stringify(event) }],
    });
    console.log(`\n[Producer] → ${topic}\n${JSON.stringify(event, null, 2)}`);
  },
};
