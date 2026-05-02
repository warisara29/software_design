import { config } from '../config.js';
import { producer } from './client.js';
import type {
  AcquisitionApprovalRequestedEvent,
  AcquisitionContractDraftedEvent,
} from '../service/AcquisitionService.js';
import type { PropertyInspectedEvent } from '../event/PropertyInspectedEvent.js';

function logProducerSend(topic: string, event: unknown): void {
  console.log(`\n[Producer] → ${topic}\n${JSON.stringify(event, null, 2)}`);
}

export const AcquisitionApprovalRequestedProducer = {
  async send(event: AcquisitionApprovalRequestedEvent): Promise<void> {
    const topic = config.topics.acquisitionApprovalRequested;
    await producer.send({
      topic,
      messages: [{ key: event.acquisitionId, value: JSON.stringify(event) }],
    });
    logProducerSend(topic, event);
  },
};

export const AcquisitionContractDraftedProducer = {
  async send(event: AcquisitionContractDraftedEvent): Promise<void> {
    const topic = config.topics.acquisitionContractDrafted;
    await producer.send({
      topic,
      messages: [{ key: event.acquisitionId, value: JSON.stringify(event) }],
    });
    logProducerSend(topic, event);
  },
};

export const PropertyInspectedProducer = {
  async send(event: PropertyInspectedEvent): Promise<void> {
    const topic = config.topics.propertyInspected;
    await producer.send({
      topic,
      messages: [{ key: event.acquisitionId, value: JSON.stringify(event) }],
    });
    logProducerSend(topic, event);
  },
};
