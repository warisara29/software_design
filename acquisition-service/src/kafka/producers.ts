import { config } from '../config.js';
import { producer } from './client.js';
import type {
  AcquisitionApprovalRequestedEvent,
  AcquisitionContractDraftedEvent,
} from '../service/AcquisitionService.js';

export const AcquisitionApprovalRequestedProducer = {
  async send(event: AcquisitionApprovalRequestedEvent): Promise<void> {
    const topic = config.topics.acquisitionApprovalRequested;
    await producer.send({
      topic,
      messages: [{ key: event.acquisitionId, value: JSON.stringify(event) }],
    });
    console.log(`[Producer] → ${topic}: acquisitionId=${event.acquisitionId}`);
  },
};

export const AcquisitionContractDraftedProducer = {
  async send(event: AcquisitionContractDraftedEvent): Promise<void> {
    const topic = config.topics.acquisitionContractDrafted;
    await producer.send({
      topic,
      messages: [{ key: event.acquisitionId, value: JSON.stringify(event) }],
    });
    console.log(
      `[Producer] → ${topic}: acquisitionId=${event.acquisitionId}, willingContractId=${event.willingContractId}`,
    );
  },
};
