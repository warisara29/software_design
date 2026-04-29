import { config } from '../config.js';
import { producer } from './client.js';
import type { ContractDraftCreatedEvent } from '../service/ContractDraftService.js';

const TOPIC = config.topics.contractDraftCreated;

export const ContractDraftCreatedProducer = {
  async send(event: ContractDraftCreatedEvent): Promise<void> {
    await producer.send({
      topic: TOPIC,
      messages: [{ key: event.contractId, value: JSON.stringify(event) }],
    });
    console.log(`[Producer] → ${TOPIC}: contractId=${event.contractId}`);
  },
};
